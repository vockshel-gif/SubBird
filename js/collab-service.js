/**
 * SunBird Lanka Tours — Real-time Team Collaboration (Firebase Realtime Database)
 *
 * Keeps every open copy of the app (any computer) in sync on a shared team workspace.
 * Like a Canva share link, the workspace lives under a long random team key that is
 * only known to people who received the invite link (…/SubBird/?team=<key>):
 *   workspace/{team}/itineraries/{id}/fields/{field}  JSON string of each top-level field
 *   workspace/{team}/itineraries/{id}/meta            { updatedAt, updatedBy, updatedByName, title }
 *   workspace/{team}/deleted/{id}                     tombstone { at, by } so deletions stick
 *   workspace/{team}/presence/{clientId}              { name, color, itinId, at } (removed on disconnect)
 *
 * Required Realtime Database rules (Firebase console > Realtime Database > Rules):
 *   "workspace": { "$team": { ".read": "$team.length >= 24", ".write": "$team.length >= 24" } }
 *
 * Fields are stored as JSON strings so arrays, empty objects and hotel-name keys
 * round-trip exactly (Firebase would otherwise rewrite them). Only the fields that
 * changed are sent, so two people editing different parts of the same itinerary
 * (e.g. hotels vs attractions) don't overwrite each other.
 */
(function (window) {
  'use strict';

  const WORKSPACE_BASE = 'workspace';
  const TEAM_KEY = 'sunbird_team_key';
  const NAME_KEY = 'sunbird_collab_name';
  const CLIENT_KEY = 'sunbird_collab_client_id';
  let ROOT = WORKSPACE_BASE;     // becomes workspace/{team} in start()
  let teamKey = '';
  const SKIP_FIELDS = { updatedAt: true };
  const COLORS = ['#f97316', '#22c55e', '#3b82f6', '#a855f7', '#ec4899', '#14b8a6', '#eab308', '#ef4444'];
  const SYNC_DELAY_MS = 250;

  let db = null;
  let handlers = null;
  let me = null;
  let started = false;
  let ready = false;            // initial merge finished
  let currentStatus = 'idle';
  let syncTimer = null;
  let presenceRef = null;
  let myLocation = '';

  const lastSynced = {};        // id -> { field: json } as last known on the server
  const pending = {};           // id -> { field: json|null } local writes not yet acknowledged

  // ---------------------------------------------------------------- identity
  function randomId() {
    if (window.crypto && window.crypto.randomUUID) return window.crypto.randomUUID();
    return 'c-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10);
  }

  function getClientId() {
    // One id per browser tab, so two windows show up as two collaborators.
    try {
      let id = window.sessionStorage.getItem(CLIENT_KEY);
      if (!id) { id = randomId(); window.sessionStorage.setItem(CLIENT_KEY, id); }
      return id;
    } catch (e) {
      return randomId();
    }
  }

  function getName() {
    try {
      let name = window.localStorage.getItem(NAME_KEY);
      if (!name) {
        name = 'Guest ' + Math.floor(1000 + Math.random() * 9000);
        window.localStorage.setItem(NAME_KEY, name);
      }
      return name;
    } catch (e) {
      return 'Guest';
    }
  }

  function isValidTeamKey(key) {
    return typeof key === 'string' && /^[A-Za-z0-9_-]{24,64}$/.test(key);
  }

  function newTeamKey() {
    const bytes = new Uint8Array(18);
    (window.crypto || window.msCrypto).getRandomValues(bytes);
    return Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join(''); // 36 hex chars
  }

  /**
   * Team key comes from an invite link (?team=...) the first time, then is remembered.
   * A brand-new browser without an invite starts its own private team workspace.
   */
  function resolveTeamKey() {
    let fromUrl = '';
    try {
      const url = new URL(window.location.href);
      fromUrl = url.searchParams.get('team') || '';
      if (fromUrl) {
        url.searchParams.delete('team');
        window.history.replaceState(null, '', url.pathname + url.search + url.hash);
      }
    } catch (e) {}

    let stored = '';
    try { stored = window.localStorage.getItem(TEAM_KEY) || ''; } catch (e) {}

    let key = isValidTeamKey(fromUrl) ? fromUrl : (isValidTeamKey(stored) ? stored : newTeamKey());
    try { window.localStorage.setItem(TEAM_KEY, key); } catch (e) {}
    return { key: key, joinedFromInvite: isValidTeamKey(fromUrl) && fromUrl !== stored };
  }

  function getInviteLink() {
    if (!teamKey) return '';
    const url = new URL(window.location.href);
    url.searchParams.set('team', teamKey);
    url.hash = '';
    return url.toString();
  }

  function colorFor(id) {
    let h = 0;
    for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
    return COLORS[h % COLORS.length];
  }

  // ---------------------------------------------------------------- helpers
  function toFields(itin) {
    const fields = {};
    Object.keys(itin).forEach((k) => {
      if (SKIP_FIELDS[k] || itin[k] === undefined || typeof itin[k] === 'function') return;
      fields[k] = JSON.stringify(itin[k]);
    });
    return fields;
  }

  function parseField(json) {
    try { return JSON.parse(json); } catch (e) { return undefined; }
  }

  function fromRecord(id, rec) {
    const itin = {};
    const fields = (rec && rec.fields) || {};
    Object.keys(fields).forEach((k) => {
      const v = parseField(fields[k]);
      if (v !== undefined) itin[k] = v;
    });
    itin.id = id;
    const meta = (rec && rec.meta) || {};
    if (meta.updatedAt) itin.updatedAt = new Date(meta.updatedAt).toISOString();
    return itin;
  }

  function toMs(iso) {
    const t = Date.parse(iso || '');
    return isNaN(t) ? 0 : t;
  }

  function itinPath(id) {
    return `${ROOT}/itineraries/${id}`;
  }

  function debug() {
    if (window.SUNBIRD_COLLAB_DEBUG) {
      try { console.log.apply(console, ['[collab]'].concat(Array.from(arguments))); } catch (e) {}
    }
  }

  function setStatus(status, detail) {
    currentStatus = status;
    if (handlers && handlers.onStatus) {
      try { handlers.onStatus(status, detail); } catch (e) { console.error(e); }
    }
  }

  // ---------------------------------------------------------------- start / merge
  async function start(opts) {
    if (started) return;
    started = true;
    handlers = opts || {};

    if (!window.SunBirdFirebase || !window.SunBirdFirebase.init() || !window.firebase || !firebase.database) {
      setStatus('unavailable');
      return;
    }
    db = firebase.database();
    const team = resolveTeamKey();
    teamKey = team.key;
    ROOT = `${WORKSPACE_BASE}/${teamKey}`;
    if (team.joinedFromInvite && handlers.onJoinedTeam) {
      try { handlers.onJoinedTeam(); } catch (e) { console.error(e); }
    }
    const id = getClientId();
    me = { id: id, name: getName(), color: colorFor(id) };
    setStatus('connecting');

    db.ref('.info/connected').on('value', (snap) => {
      const isOn = !!snap.val();
      if (isOn) setupPresence();
      if (ready) setStatus(isOn ? 'live' : 'offline');
    });

    let remote, tombstones;
    try {
      const [itinSnap, delSnap] = await Promise.all([
        db.ref(`${ROOT}/itineraries`).once('value'),
        db.ref(`${ROOT}/deleted`).once('value')
      ]);
      remote = itinSnap.val() || {};
      tombstones = delSnap.val() || {};
    } catch (err) {
      console.error('SunBird collaboration: cannot read the shared workspace', err);
      setStatus(String(err && err.code || err).toLowerCase().includes('permission') ? 'denied' : 'error', err);
      return;
    }

    // Merge: newer copy wins; items deleted elsewhere stay deleted.
    const local = (handlers.getItineraries ? handlers.getItineraries() : []) || [];
    const localById = new Map(local.filter(Boolean).map((it) => [it.id, it]));
    const merged = new Map();
    const remoteOnly = [];

    Object.keys(remote).forEach((rid) => {
      const rec = remote[rid] || {};
      lastSynced[rid] = Object.assign({}, rec.fields || {});
      const remoteTime = (rec.meta && rec.meta.updatedAt) || 0;
      const loc = localById.get(rid);
      if (loc && toMs(loc.updatedAt) > remoteTime) {
        merged.set(rid, loc);                 // local is newer: it will be pushed by flush()
      } else {
        const itin = fromRecord(rid, rec);
        merged.set(rid, itin);
        if (!loc) remoteOnly.push(itin);
      }
    });

    local.forEach((loc) => {
      if (!loc || !loc.id || merged.has(loc.id)) return;
      const tomb = tombstones[loc.id];
      if (tomb && (tomb.at || 0) >= toMs(loc.updatedAt)) return; // deleted by a teammate
      merged.set(loc.id, loc);                // new on this computer: flush() uploads it
    });

    remoteOnly.sort((a, b) => toMs(b.updatedAt) - toMs(a.updatedAt));
    const ordered = remoteOnly.slice();
    local.forEach((loc) => {
      if (loc && merged.has(loc.id)) ordered.push(merged.get(loc.id));
    });

    if (handlers.onInitialMerge) {
      try { handlers.onInitialMerge(ordered); } catch (e) { console.error(e); }
    }

    ready = true;
    flush();
    attachListeners();
    setStatus('live');
  }

  function attachListeners() {
    const ref = db.ref(`${ROOT}/itineraries`);
    ref.on('child_added', handleRemoteSnapshot);
    ref.on('child_changed', handleRemoteSnapshot);
    ref.on('child_removed', handleRemoteRemoved);

    db.ref(`${ROOT}/presence`).on('value', (snap) => {
      const all = snap.val() || {};
      const others = Object.keys(all)
        .filter((cid) => cid !== me.id && all[cid])
        .map((cid) => Object.assign({ id: cid }, all[cid]));
      if (handlers.onPresence) {
        try { handlers.onPresence(others, me); } catch (e) { console.error(e); }
      }
    });
  }

  // ---------------------------------------------------------------- incoming changes
  function handleRemoteSnapshot(snap) {
    const id = snap.key;
    const rec = snap.val() || {};
    const remoteFields = rec.fields || {};
    const known = lastSynced[id];
    const mine = pending[id] || {};
    const changed = {};
    let anyChange = false;

    Object.keys(remoteFields).forEach((k) => {
      if (Object.prototype.hasOwnProperty.call(mine, k)) return; // our newer write is in flight
      if (!known || known[k] !== remoteFields[k]) {
        changed[k] = remoteFields[k];
        anyChange = true;
      }
    });
    if (known) {
      Object.keys(known).forEach((k) => {
        if (!Object.prototype.hasOwnProperty.call(remoteFields, k) && !Object.prototype.hasOwnProperty.call(mine, k)) {
          changed[k] = null;
          anyChange = true;
        }
      });
    }
    debug('remote', id, 'by', (rec.meta || {}).updatedByName, 'changed:', anyChange ? changed : '-', 'pending:', Object.keys(mine));
    if (!anyChange) return;

    const base = Object.assign({}, known || {});
    Object.keys(changed).forEach((k) => {
      if (changed[k] === null) delete base[k]; else base[k] = changed[k];
    });
    lastSynced[id] = base;

    // Build the updated itinerary on top of the local copy
    const local = (handlers.getItineraries ? handlers.getItineraries() : []).find((it) => it && it.id === id);
    const updated = local ? JSON.parse(JSON.stringify(local)) : { id: id };
    Object.keys(changed).forEach((k) => {
      if (changed[k] === null) delete updated[k];
      else {
        const v = parseField(changed[k]);
        if (v !== undefined) updated[k] = v;
      }
    });
    const meta = rec.meta || {};
    if (meta.updatedAt) updated.updatedAt = new Date(meta.updatedAt).toISOString();
    updated.id = id;

    if (handlers.onRemoteUpsert) {
      try { handlers.onRemoteUpsert(updated, meta, Object.keys(changed), !local); } catch (e) { console.error(e); }
    }
  }

  function handleRemoteRemoved(snap) {
    const id = snap.key;
    const wasKnown = !!lastSynced[id];
    delete lastSynced[id];
    delete pending[id];
    if (!wasKnown) return; // our own delete echo (already gone locally)
    db.ref(`${ROOT}/deleted/${id}`).once('value').then((s) => {
      const tomb = s.val() || {};
      if (handlers.onRemoteRemove) handlers.onRemoteRemove(id, { byName: tomb.by || '' });
    }).catch(() => {
      if (handlers.onRemoteRemove) handlers.onRemoteRemove(id, {});
    });
  }

  // ---------------------------------------------------------------- outgoing changes
  let lastScheduleStack = '';
  function scheduleSync() {
    if (!ready) return;
    if (window.SUNBIRD_COLLAB_DEBUG) lastScheduleStack = new Error('s').stack.split('\n').slice(2, 9).map(s => s.trim()).join(' <- ');
    clearTimeout(syncTimer);
    syncTimer = setTimeout(flush, SYNC_DELAY_MS);
  }

  function flush() {
    if (!ready || !db) return;
    const itins = (handlers.getItineraries ? handlers.getItineraries() : []) || [];
    const updates = {};
    const written = {};       // id -> { field: json|null }
    const seen = new Set();
    const ts = firebase.database.ServerValue.TIMESTAMP;

    itins.forEach((it) => {
      if (!it || !it.id) return;
      seen.add(it.id);
      const fields = toFields(it);
      const prev = lastSynced[it.id] || {};
      const changes = {};
      let any = false;
      Object.keys(fields).forEach((k) => {
        if (prev[k] !== fields[k]) { changes[k] = fields[k]; any = true; }
      });
      Object.keys(prev).forEach((k) => {
        if (!Object.prototype.hasOwnProperty.call(fields, k)) { changes[k] = null; any = true; }
      });
      if (!any) return;

      Object.keys(changes).forEach((k) => {
        updates[`${itinPath(it.id)}/fields/${k}`] = changes[k];
      });
      updates[`${itinPath(it.id)}/meta`] = {
        updatedAt: ts,
        updatedBy: me.id,
        updatedByName: me.name,
        title: it.title || ''
      };
      if (!lastSynced[it.id]) updates[`${ROOT}/deleted/${it.id}`] = null; // re-created or new
      lastSynced[it.id] = fields;
      pending[it.id] = Object.assign({}, pending[it.id] || {}, changes);
      written[it.id] = changes;
    });

    Object.keys(lastSynced).forEach((id) => {
      if (seen.has(id)) return;
      updates[itinPath(id)] = null;
      updates[`${ROOT}/deleted/${id}`] = { at: ts, by: me.name };
      delete lastSynced[id];
      delete pending[id];
    });

    if (Object.keys(updates).length === 0) return;
    debug('push', JSON.stringify(written).slice(0, 300), 'FROM', lastScheduleStack);

    db.ref().update(updates).then(() => {
      debug('ack', Object.keys(written));
      Object.keys(written).forEach((id) => {
        const p = pending[id];
        if (!p) return;
        Object.keys(written[id]).forEach((k) => {
          if (p[k] === written[id][k]) delete p[k];
        });
        if (Object.keys(p).length === 0) delete pending[id];
      });
      if (currentStatus === 'error') setStatus('live');
    }).catch((err) => {
      console.error('SunBird collaboration: could not save to the shared workspace', err);
      setStatus(String(err && err.code || err).toLowerCase().includes('permission') ? 'denied' : 'error', err);
    });
  }

  // ---------------------------------------------------------------- presence
  function setupPresence() {
    if (!db || !me) return;
    presenceRef = db.ref(`${ROOT}/presence/${me.id}`);
    presenceRef.onDisconnect().remove();
    writePresence();
  }

  function writePresence() {
    if (!presenceRef) return;
    presenceRef.set({
      name: me.name,
      color: me.color,
      itinId: myLocation || '',
      at: firebase.database.ServerValue.TIMESTAMP
    }).catch(() => {});
  }

  function setLocation(itinId) {
    myLocation = itinId || '';
    writePresence();
  }

  function rename(newName) {
    const clean = String(newName || '').trim().slice(0, 40);
    if (!clean || !me) return;
    me.name = clean;
    try { window.localStorage.setItem(NAME_KEY, clean); } catch (e) {}
    writePresence();
  }

  window.SunBirdCollab = {
    start: start,
    scheduleSync: scheduleSync,
    flushNow: flush,
    setLocation: setLocation,
    rename: rename,
    getMe: function () { return me ? Object.assign({}, me) : null; },
    getStatus: function () { return currentStatus; },
    getInviteLink: getInviteLink
  };
})(window);
