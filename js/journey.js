/**
 * SunBird Lanka Tours — "Island Quest" Interactive Journey Controller
 * Drives game-inspired boarding pass, animated island route map, day levels,
 * quest completion with Web Audio XP chimes, passport stamps, and live telemetry.
 */

(function () {
  'use strict';

  // --- Sound Effects using Web Audio API (zero external assets needed) ---
  let audioCtx = null;
  function getAudioCtx() {
    if (!audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) audioCtx = new AudioContext();
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    return audioCtx;
  }

  function playChime(type) {
    try {
      const ctx = getAudioCtx();
      if (!ctx) return;
      const now = ctx.currentTime;

      if (type === 'unlock' || type === 'board') {
        // Joyful 3-tone arpeggio (C5 -> E5 -> G5 -> C6)
        [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, now + i * 0.08);
          gain.gain.setValueAtTime(0.001, now + i * 0.08);
          gain.gain.exponentialRampToValueAtTime(0.22, now + i * 0.08 + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.35);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + i * 0.08);
          osc.stop(now + i * 0.08 + 0.4);
        });
      } else if (type === 'quest') {
        // High sparkling bell chime
        [880, 1318.51].forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + i * 0.06);
          gain.gain.setValueAtTime(0.18, now + i * 0.06);
          gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.06 + 0.4);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + i * 0.06);
          osc.stop(now + i * 0.06 + 0.45);
        });
      } else if (type === 'stamp') {
        // Deep stamp thud + click
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(120, now);
        osc.frequency.exponentialRampToValueAtTime(45, now + 0.15);
        gain.gain.setValueAtTime(0.35, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.2);
      }
    } catch (e) {
      // Audio autoplay policy or unavailable
    }
  }

  // --- Confetti FX ---
  function fireConfetti(x, y) {
    const canvas = document.getElementById('confetti-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const colors = ['#ff8a3d', '#2baae2', '#1f9d6b', '#f5b83d', '#f0642a', '#ffffff'];
    const particles = [];
    for (let i = 0; i < 36; i++) {
      const angle = (Math.PI * 2 * i) / 36 + (Math.random() - 0.5);
      const speed = 4 + Math.random() * 8;
      particles.push({
        x: x || window.innerWidth / 2,
        y: y || window.innerHeight / 2,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 3,
        size: 5 + Math.random() * 6,
        color: colors[Math.floor(Math.random() * colors.length)],
        rot: Math.random() * 360,
        vr: (Math.random() - 0.5) * 12,
        life: 1,
        decay: 0.02 + Math.random() * 0.02
      });
    }

    let animId;
    function render() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let alive = false;
      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.22; // gravity
        p.rot += p.vr;
        p.life -= p.decay;
        if (p.life > 0) {
          alive = true;
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate((p.rot * Math.PI) / 180);
          ctx.globalAlpha = Math.max(0, p.life);
          ctx.fillStyle = p.color;
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
          ctx.restore();
        }
      });
      if (alive) {
        animId = requestAnimationFrame(render);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        cancelAnimationFrame(animId);
      }
    }
    render();
  }

  // --- Toast Notification ---
  function showToast(msg) {
    const t = document.getElementById('journey-toast');
    if (!t) return;
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(t._timer);
    t._timer = setTimeout(() => t.classList.remove('show'), 2600);
  }

  // --- Island SVG Path (Simplified 757-point Natural Earth contour) ---
  const SRI_LANKA_PATH = "M356.3 432.5L358.2 440.4L357.6 449.7L350.5 474.1L349.4 482.7L345.9 491.5L341.5 498.3L342.5 502.1L340.8 506.5L326.4 529.3L321.6 534.1L312.7 540.4L305.8 543.3L277.3 565.6L271.6 568.7L253.1 575.3L252.8 572.9L250.5 572.4L248.8 577.2L239.0 581.8L206.8 589.4L202.9 590.9L200.6 594.1L196.4 593.3L192.4 594.9L180.6 603.6L177.8 606.7L168.9 606.7L158.9 612.0L151.0 608.8L139.6 609.4L136.3 604.7L131.4 606.4L126.3 605.7L123.2 603.6L120.5 604.7L118.4 602.5L106.1 598.8L100.5 595.1L99.4 596.2L82.6 579.4L82.4 577.4L73.0 559.3L70.0 544.8L67.1 539.7L64.7 529.9L62.6 527.8L62.8 526.9L64.7 526.7L63.4 518.0L47.1 476.3L44.8 463.5L44.8 452.5L46.9 444.8L39.5 418.9L40.5 415.1L40.5 417.4L44.8 427.8L46.9 425.7L46.9 420.9L45.7 417.2L43.0 416.3L41.4 414.3L42.6 410.9L34.1 354.1L35.2 353.3L36.3 354.1L37.7 345.4L35.7 340.9L35.2 332.5L31.3 313.3L25.4 295.3L21.5 278.0L21.5 273.0L22.6 274.1L23.1 271.2L21.5 259.4L26.4 254.7L29.6 246.4L34.1 239.3L28.9 249.9L30.8 252.5L34.1 253.1L31.1 260.4L29.1 261.4L28.9 267.8L26.3 276.0L26.6 280.6L30.0 284.7L26.9 291.0L31.8 294.6L39.0 295.1L42.6 292.6L40.3 286.9L36.4 281.9L41.6 272.1L39.5 266.7L39.5 260.4L38.1 257.9L41.6 250.4L44.8 225.7L47.5 222.2L48.7 210.4L55.3 204.6L59.2 194.4L60.5 179.4L56.8 169.9L57.4 157.2L55.1 148.9L60.0 147.3L68.9 139.4L75.5 135.4L84.3 109.8L85.9 103.5L86.3 93.3L78.3 88.4L76.2 79.3L81.5 75.7L89.8 73.4L93.1 68.9L98.4 66.7L92.9 59.5L78.5 50.7L76.2 47.9L81.2 48.0L95.1 55.2L104.0 57.4L109.9 62.0L110.8 63.7L109.0 64.6L109.9 66.7L109.0 67.8L112.2 69.9L133.6 62.6L145.6 65.2L155.2 69.5L162.5 70.9L152.1 63.8L145.3 61.5L140.5 58.3L136.3 58.3L134.0 59.9L132.0 58.4L124.7 58.0L113.8 48.6L96.7 39.8L94.8 39.8L95.1 43.6L98.8 47.4L96.7 49.7L85.8 41.8L82.6 40.4L88.9 46.7L85.2 46.0L74.1 40.4L68.3 35.8L61.8 33.0L61.7 34.1L60.0 33.0L58.4 27.7L54.2 21.4L57.6 19.8L63.6 14.3L66.3 13.1L86.9 13.7L88.1 20.1L94.4 21.6L95.8 23.4L100.6 22.6L102.3 23.6L120.1 42.8L136.3 51.0L136.3 49.9L130.7 47.1L117.2 36.1L106.2 23.5L89.4 16.8L89.1 14.4L92.3 13.1L106.0 12.6L108.1 14.1L111.0 21.2L131.1 44.6L140.0 50.2L182.4 84.2L190.8 94.2L188.9 95.1L185.2 92.1L181.2 92.0L190.0 101.0L193.1 102.7L191.2 99.0L191.5 97.7L194.7 97.9L203.6 117.2L197.2 115.5L196.3 117.7L202.2 120.0L202.6 123.5L205.8 121.5L208.9 129.9L211.8 134.3L215.3 136.7L214.6 138.9L213.2 139.4L211.1 136.2L202.6 133.1L209.9 140.6L209.9 143.6L211.7 144.8L208.6 148.1L211.1 150.0L213.7 149.8L218.4 142.5L224.0 149.2L228.9 157.6L236.0 162.2L239.3 170.2L244.8 173.7L248.8 185.7L249.7 183.7L252.0 184.7L251.6 186.1L257.3 193.1L257.3 195.8L253.1 199.3L256.3 198.3L259.6 205.5L260.1 209.2L256.2 209.8L257.0 207.4L256.0 205.4L254.3 205.1L253.1 207.7L255.2 212.8L254.1 215.2L248.8 211.6L246.1 210.9L243.6 212.0L241.6 214.7L242.3 216.1L244.7 215.7L247.9 213.1L254.4 220.5L264.9 221.3L267.3 219.8L265.7 216.2L273.0 214.0L277.9 219.0L281.5 237.2L279.6 235.8L277.5 231.8L275.7 230.9L276.5 237.4L277.3 239.3L283.0 240.9L290.6 273.4L287.8 277.2L283.7 263.6L282.6 263.6L282.6 272.1L288.6 278.7L291.2 278.5L292.1 275.2L293.0 275.2L295.5 283.0L301.5 293.2L303.7 291.0L304.7 295.2L307.8 293.2L308.6 295.1L307.8 299.4L313.2 305.7L311.1 306.7L310.2 310.0L312.0 315.3L315.1 318.9L319.5 318.3L322.1 324.1L330.9 334.3L331.2 337.3L327.8 338.3L320.5 330.8L317.9 329.9L315.9 330.1L314.3 331.7L313.2 335.1L316.8 336.2L319.5 334.0L322.9 335.6L323.7 338.3L331.0 346.7L330.0 348.5L331.0 351.0L332.0 349.9L331.4 347.8L336.8 351.0L340.4 359.4L339.4 363.6L340.4 366.2L338.1 369.0L341.5 374.1L339.8 375.3L340.1 376.5L343.6 375.1L344.7 383.6L345.8 383.6L347.9 376.2L347.5 373.9L348.6 373.8L353.2 383.3L357.0 396.4L356.3 432.5Z";

  // Destination canonical slug normalizer
  function normSlug(name) {
    if (!name) return 'colombo';
    const s = String(name).toLowerCase();
    if (s.includes('airport') || s.includes('cmb') || s.includes('bia')) return 'airport';
    if (s.includes('sigiriya')) return 'sigiriya';
    if (s.includes('dambulla')) return 'dambulla';
    if (s.includes('kandy')) return 'kandy';
    if (s.includes('nuwara') || s.includes('eliya')) return 'nuwara-eliya';
    if (s.includes('ella')) return 'ella';
    if (s.includes('yala')) return 'yala';
    if (s.includes('udawalawe')) return 'udawalawe';
    if (s.includes('mirissa')) return 'mirissa';
    if (s.includes('galle')) return 'galle';
    if (s.includes('bentota')) return 'bentota';
    if (s.includes('unawatuna')) return 'unawatuna';
    if (s.includes('weligama')) return 'weligama';
    if (s.includes('hikkaduwa')) return 'hikkaduwa';
    if (s.includes('tangalle')) return 'tangalle';
    if (s.includes('anuradhapura')) return 'anuradhapura';
    if (s.includes('polonnaruwa')) return 'polonnaruwa';
    if (s.includes('trincomalee')) return 'trincomalee';
    if (s.includes('pigeon')) return 'pigeon-island';
    if (s.includes('passikudah') || s.includes('pasikudah')) return 'passikudah';
    if (s.includes('arugam')) return 'arugam-bay';
    if (s.includes('jaffna')) return 'jaffna';
    if (s.includes('horton')) return 'horton-plains';
    if (s.includes('adams') || s.includes('pada')) return 'adams-peak';
    if (s.includes('sinharaja')) return 'sinharaja';
    if (s.includes('kitulgala')) return 'kitulgala';
    if (s.includes('minneriya')) return 'minneriya';
    if (s.includes('wilpattu')) return 'wilpattu';
    if (s.includes('negombo')) return 'negombo';
    if (s.includes('colombo')) return 'colombo';
    return 'colombo';
  }

  // Destination icon map for game vibes
  const DEST_ICONS = {
    'airport': '✈️',
    'colombo': '🏙️',
    'negombo': '⛵',
    'sigiriya': '🦁',
    'dambulla': '🪨',
    'kandy': '👑',
    'nuwara-eliya': '🍃',
    'ella': '🚂',
    'yala': '🐆',
    'udawalawe': '🐘',
    'mirissa': '🐋',
    'galle': '🏰',
    'bentota': '🏖️',
    'unawatuna': '🤿',
    'weligama': '🎣',
    'hikkaduwa': '🐢',
    'tangalle': '🌴',
    'anuradhapura': '🛕',
    'polonnaruwa': '🗿',
    'trincomalee': '🔱',
    'pigeon-island': '🐠',
    'passikudah': '🌊',
    'arugam-bay': '🏄',
    'jaffna': '🛕',
    'horton-plains': '⛰️',
    'adams-peak': '🌅',
    'sinharaja': '🦜',
    'kitulgala': '🛶',
    'minneriya': '🦣',
    'wilpattu': '🐾'
  };

  // Default Ceylon Luxury Discovery Itinerary Data (when standalone or fallback)
  const DEFAULT_JOURNEY_DATA = {
    title: "CEYLON LUXURY DISCOVERY & HERITAGE EXPEDITION",
    days: 7,
    nights: 6,
    touristsCount: 2,
    periodTitle: "Period: 26th Aug to 01st Sep 2026 (06 Nights / 07 Days) • 2 Adults",
    vehicleName: "Private Luxury A/C Chauffeur Vehicle",
    rows: [
      {
        dayNum: 1,
        dateStr: "26th Aug 2026",
        destination: "Airport (CMB) ➔ Sigiriya",
        destSlug: "sigiriya",
        startSlug: "airport",
        distanceKm: 150,
        travelTimeHours: "3.5",
        attractions: [
          "Airport VIP Meet & Greet: Fresh garlands & chilled coconut water upon touchdown.",
          "Dambulla Golden Cave Temple (UNESCO): 150+ Buddha statues in 5 sacred mountain caverns.",
          "Check in to your Cultural Triangle sanctuary amidst tropical forest."
        ],
        overnight: {
          name: "Kassapa Lions Rock",
          room: "Deluxe Chalet • Rock View",
          stars: 4,
          mealPlan: "Half Board (Dinner & Breakfast)"
        }
      },
      {
        dayNum: 2,
        dateStr: "27th Aug 2026",
        destination: "Sigiriya ➔ Kandy",
        destSlug: "kandy",
        startSlug: "sigiriya",
        distanceKm: 90,
        travelTimeHours: "2.5",
        attractions: [
          "Sigiriya Lion Rock Fortress: Early sunrise climb of the 5th-century sky palace.",
          "Hiriwadunna Rural Village Experience: Bullock cart, lake catamaran & clay-pot feast.",
          "Ayurvedic Spice & Herbal Sanctuary: Fresh cinnamon, cardamom & vanilla tasting.",
          "Royal Temple of the Sacred Tooth Relic (UNESCO) & Kandyan Cultural Dances."
        ],
        overnight: {
          name: "Mount Randholee Resort",
          room: "Deluxe Mountain View Room",
          stars: 4,
          mealPlan: "Half Board (Dinner & Breakfast)"
        }
      },
      {
        dayNum: 3,
        dateStr: "28th Aug 2026",
        destination: "Kandy ➔ Nuwara Eliya",
        destSlug: "nuwara-eliya",
        startSlug: "kandy",
        distanceKm: 90,
        travelTimeHours: "3.0",
        attractions: [
          "Gem Museum & Royal Lapidary: Ceylon Blue Sapphires and artisan cutting.",
          "Mist-Covered Tea Estate & Historic Factory: Hand plucking & private tea tasting flight.",
          "Little England Nuwara Eliya: Colonial post office, Victoria Park & Lake Gregory."
        ],
        overnight: {
          name: "Araliya Green City",
          room: "Superior Luxury Room",
          stars: 5,
          mealPlan: "Half Board (Dinner & Breakfast)"
        }
      },
      {
        dayNum: 4,
        dateStr: "29th Aug 2026",
        destination: "Nuwara Eliya ➔ Ella",
        destSlug: "ella",
        startSlug: "nuwara-eliya",
        distanceKm: 55,
        travelTimeHours: "2.0",
        attractions: [
          "World-Famous Highland Train Odyssey: Winding along emerald cliffs and eucalyptus ridges.",
          "Iconic Demodara Nine Arch Viaduct: 1921 stone railway bridge towering in cloud forest.",
          "Ravana Falls & Ella Mountain Gap: Thundering 25-meter cascade steeped in ancient lore."
        ],
        overnight: {
          name: "Misty Hills Ella Resort",
          room: "Deluxe Mountain Balcony Room",
          stars: 4,
          mealPlan: "Half Board (Dinner & Breakfast)"
        }
      },
      {
        dayNum: 5,
        dateStr: "30th Aug 2026",
        destination: "Ella ➔ Yala Safari",
        destSlug: "yala",
        startSlug: "ella",
        distanceKm: 120,
        travelTimeHours: "3.0",
        attractions: [
          "Scenic Descent from Cloud Tea Hills to the Sunlit Southern Plains.",
          "Yala National Park Golden-Hour Safari: 4x4 open jeep track for wild leopards & elephants.",
          "Sunset Bonfire by the Indian Ocean coastline."
        ],
        overnight: {
          name: "Jetwing Yala",
          room: "Deluxe Ocean Chalet",
          stars: 5,
          mealPlan: "Half Board (Dinner & Breakfast)"
        }
      },
      {
        dayNum: 6,
        dateStr: "31st Aug 2026",
        destination: "Yala ➔ Mirissa ➔ Galle",
        destSlug: "galle",
        startSlug: "yala",
        distanceKm: 160,
        travelTimeHours: "3.5",
        attractions: [
          "Coconut Tree Hill & Mirissa Bay: Iconic palm headland jutting into turquoise water.",
          "Traditional Weligama Stilt Fishermen on the southern reef.",
          "UNESCO World Heritage Galle Dutch Fort: 17th-century ramparts, ocean bastions & white lighthouse."
        ],
        overnight: {
          name: "Fort Bazaar / Radisson Galle",
          room: "Heritage Luxury Chamber",
          stars: 5,
          mealPlan: "Half Board (Dinner & Breakfast)"
        }
      },
      {
        dayNum: 7,
        dateStr: "01st Sep 2026",
        destination: "Galle ➔ Bentota ➔ Airport (CMB)",
        destSlug: "airport",
        startSlug: "galle",
        distanceKm: 140,
        travelTimeHours: "2.5",
        attractions: [
          "Madu River Mangrove Safari: Secret cinnamon island & birdwatching.",
          "Sea Turtle Conservation Hatchery: Green & Hawksbill turtle rescue tanks.",
          "Expressway Transfer to Colombo International Airport (CMB) with VIP assistance."
        ],
        overnight: {
          name: "VIP Airport Departure",
          room: "Scheduled International Flight",
          stars: 5,
          mealPlan: "Departure Assistance"
        }
      }
    ]
  };

  // Journey App State
  const state = {
    data: DEFAULT_JOURNEY_DATA,
    xp: 0,
    questsDone: new Set(),
    stampsGot: new Set(),
    activeDay: 1,
    isBoarded: false
  };

  // --- Initialize Journey ---
  async function initJourney() {
    // 1. Check URL parameters for Firebase Itinerary ID or localStorage payload
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');

    if (id && window.SunBirdFirebase) {
      try {
        const record = await window.SunBirdFirebase.getRecord(id);
        if (record && record.data && record.data.rows && record.data.rows.length > 0) {
          state.data = {
            title: record.title || 'CEYLON LUXURY EXPEDITION',
            days: record.data.days || record.data.rows.length,
            nights: record.data.nights || Math.max(0, record.data.rows.length - 1),
            touristsCount: record.adults || 2,
            periodTitle: `${record.from || 'Upcoming'} ➔ ${record.to || ''} (${record.data.days || 7} Days / ${record.data.nights || 6} Nights)`,
            vehicleName: (record.adults > 4) ? 'Luxury Toyota HiAce Van' : 'Luxury Chauffeur Sedan',
            rows: record.data.rows
          };
        }
      } catch (err) {
        console.warn('Firebase record fetch note:', err);
      }
    } else {
      // Check localStorage live itinerary
      try {
        const raw = localStorage.getItem('sunbird_live_itinerary');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && parsed.rows && parsed.rows.length > 0) {
            state.data = parsed;
          }
        }
      } catch (e) {}
    }

    // Ensure rows have clean slug and start/dest mapping
    enrichRows(state.data);

    // Render all components
    renderBoardingPass();
    renderHero();
    renderStats();
    renderIslandMap();
    renderStopStrip();
    renderLevels();
    renderPassport();
    renderKit();
    renderFinale();

    // Setup interactive handlers (slide to board, scroll triggers, etc.)
    setupSlideToBoard();
    setupScrollSpy();
    setupBottomNav();

    // Hide loader
    const loader = document.getElementById('journey-loader');
    if (loader) {
      setTimeout(() => loader.classList.add('hide'), 300);
    }
  }

  // Enrich rows with destination metadata
  function enrichRows(data) {
    if (!data || !data.rows) return;
    let prevSlug = 'airport';
    data.rows.forEach((r, i) => {
      // Find final stop in destination label
      const parts = String(r.destination || '').replace(/<[^>]*>/g, '').split(/[-➔&•]/).map(s => s.trim()).filter(Boolean);
      const lastPart = parts.length > 1 ? parts[parts.length - 1] : parts[0] || 'kandy';
      r.destSlug = normSlug(lastPart);
      r.startSlug = (i === 0) ? 'airport' : prevSlug;
      prevSlug = r.destSlug;

      // Clean attractions
      if (!r.attractions || r.attractions.length === 0) {
        r.attractions = [`Scenic transfer to ${lastPart} & resort exploration.`];
      }
    });
  }

  // --- 1. Boarding Pass ---
  function renderBoardingPass() {
    const d = state.data;
    const firstRow = d.rows[0] || {};
    const lastRow = d.rows[d.rows.length - 1] || {};

    const elTitle = document.getElementById('tk-title');
    if (elTitle) elTitle.textContent = d.title;

    const elParty = document.getElementById('tk-party');
    if (elParty) elParty.textContent = `${d.touristsCount || 2} Adventurers`;

    const elDays = document.getElementById('tk-days');
    if (elDays) elDays.textContent = `${d.days || 7} Days / ${d.nights || 6} Nights`;

    const elDates = document.getElementById('tk-dates');
    if (elDates) elDates.textContent = firstRow.dateStr ? firstRow.dateStr.replace(/<[^>]*>/g, ' ') : 'Tour Period';

    const elVeh = document.getElementById('tk-veh');
    if (elVeh) elVeh.textContent = d.vehicleName || 'Private Luxury Chauffeur';
  }

  // --- Slide-To-Board (Game-like unlock) ---
  function setupSlideToBoard() {
    const track = document.getElementById('slide-board');
    const knob = document.getElementById('slide-knob');
    const fill = document.getElementById('slide-fill');
    const intro = document.getElementById('intro-screen');
    const ticket = document.getElementById('boarding-ticket');
    const hud = document.getElementById('journey-hud');
    const bnav = document.getElementById('journey-bnav');
    const skipBtn = document.getElementById('intro-skip-btn');

    if (!track || !knob) return;

    let isDragging = false;
    let startX = 0;
    let maxDrag = 0;

    function getX(e) {
      return (e.touches && e.touches[0]) ? e.touches[0].clientX : e.clientX;
    }

    function onStart(e) {
      isDragging = true;
      startX = getX(e);
      maxDrag = track.clientWidth - knob.clientWidth - 8;
      track.style.transition = 'none';
      if (fill) fill.style.transition = 'none';
      getAudioCtx(); // unlock audio context on first touch
    }

    function onMove(e) {
      if (!isDragging) return;
      const currentX = getX(e);
      const delta = Math.max(0, Math.min(currentX - startX, maxDrag));
      knob.style.transform = `translateX(${delta}px)`;
      if (fill) fill.style.width = `${delta + 46}px`;

      // Check unlock threshold (82%)
      if (delta >= maxDrag * 0.82) {
        isDragging = false;
        triggerBoarding();
      }
    }

    function onEnd() {
      if (!isDragging) return;
      isDragging = false;
      // Snap back if not reached threshold
      knob.style.transition = 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)';
      knob.style.transform = 'translateX(0)';
      if (fill) {
        fill.style.transition = 'width 0.3s ease';
        fill.style.width = '54px';
      }
    }

    knob.addEventListener('mousedown', onStart);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onEnd);

    knob.addEventListener('touchstart', onStart, { passive: true });
    window.addEventListener('touchmove', onMove, { passive: true });
    window.addEventListener('touchend', onEnd);

    if (skipBtn) {
      skipBtn.addEventListener('click', triggerBoarding);
    }

    function triggerBoarding() {
      if (state.isBoarded) return;
      state.isBoarded = true;
      playChime('unlock');
      fireConfetti(window.innerWidth / 2, window.innerHeight * 0.6);

      // Tear ticket
      if (ticket) ticket.classList.add('torn');

      setTimeout(() => {
        if (intro) intro.classList.add('gone');
        if (hud) hud.classList.add('show');
        if (bnav) bnav.classList.add('show');
        document.body.classList.remove('locked');
        showToast('✈️ Welcome aboard! Expedition initialized.');
        // Trigger initial road vehicle animations
        checkLevelInView();
      }, 700);
    }
  }

  // --- 2. Hero Banner & Stats ---
  function renderHero() {
    const d = state.data;
    const heroTitle = document.getElementById('hero-main-title');
    if (heroTitle) heroTitle.textContent = d.title;

    const heroPeriod = document.getElementById('hero-period-label');
    if (heroPeriod) heroPeriod.innerHTML = d.periodTitle || `${d.days || 7} Days / ${d.nights || 6} Nights Expedition`;

    const hudTitle = document.getElementById('hud-trip-title');
    if (hudTitle) hudTitle.textContent = d.title;
  }

  function renderStats() {
    const d = state.data;
    const totalKm = d.rows.reduce((acc, r) => acc + (parseFloat(r.distanceKm) || 0), 0);
    const totalAttracts = d.rows.reduce((acc, r) => acc + (r.attractions ? r.attractions.length : 0), 0);

    const elDays = document.getElementById('stat-days-val');
    if (elDays) elDays.textContent = d.days || 7;

    const elKm = document.getElementById('stat-km-val');
    if (elKm) elKm.textContent = `${Math.round(totalKm)}km`;

    const elStops = document.getElementById('stat-stops-val');
    if (elStops) elStops.textContent = d.rows.length;

    const elQuests = document.getElementById('stat-quests-val');
    if (elQuests) elQuests.textContent = totalAttracts;
  }

  // --- 3. Interactive SVG Island Map ---
  function renderIslandMap() {
    const svg = document.getElementById('island-map-svg');
    if (!svg) return;

    const d = state.data;
    const destsMap = window.JOURNEY_DESTINATIONS || {};

    // Collect destination route points
    const routePoints = [];
    d.rows.forEach(r => {
      const target = destsMap[r.destSlug] || { x: 180, y: 350, name: r.destination };
      routePoints.push({
        dayNum: r.dayNum,
        slug: r.destSlug,
        name: target.name || r.destination,
        x: target.x,
        y: target.y,
        photo: target.thumb || `assets/journey/thumbs/${r.destSlug}.jpg`
      });
    });

    // Also include airport starting point if Day 1 starts from Airport
    const firstStop = destsMap['airport'] || { x: 50.2, y: 418.8, name: 'Airport (BIA)' };
    const allStops = [
      { dayNum: 0, slug: 'airport', name: 'Airport (BIA)', x: firstStop.x, y: firstStop.y, photo: 'assets/journey/thumbs/airport.jpg', isStart: true },
      ...routePoints
    ];

    // Build SVG Path string connecting route points with gentle curves
    let pathD = '';
    for (let i = 0; i < allStops.length; i++) {
      const p = allStops[i];
      if (i === 0) {
        pathD += `M ${p.x} ${p.y}`;
      } else {
        const prev = allStops[i - 1];
        // Curvature control point
        const mx = (prev.x + p.x) / 2 + (i % 2 === 0 ? 14 : -14);
        const my = (prev.y + p.y) / 2;
        pathD += ` Q ${mx} ${my} ${p.x} ${p.y}`;
      }
    }

    // Build SVG inner elements
    svg.innerHTML = `
      <defs>
        <!-- Tropical Island Terrain Gradient -->
        <linearGradient id="landGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#73da9e"/>
          <stop offset="40%" stop-color="#46bf80"/>
          <stop offset="70%" stop-color="#2ca66a"/>
          <stop offset="100%" stop-color="#198250"/>
        </linearGradient>

        <!-- Drop Shadow for Island Landmass -->
        <filter id="landShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="10" stdDeviation="10" flood-color="#0a2a3e" flood-opacity="0.32"/>
        </filter>

        <!-- Circular clip path for photo badge pins -->
        ${allStops.map((s, idx) => `
          <clipPath id="clip-pin-${idx}">
            <circle cx="${s.x}" cy="${s.y}" r="15"/>
          </clipPath>
        `).join('')}
      </defs>

      <!-- Ocean ambient waves -->
      <g class="ocean-decor">
        <path class="wave" d="M 40 120 Q 60 114 80 120 Q 100 126 120 120" />
        <path class="wave" d="M 270 200 Q 290 194 310 200 Q 330 206 350 200" />
        <path class="wave" d="M 30 520 Q 50 514 70 520 Q 90 526 110 520" />
        <path class="wave" d="M 240 590 Q 260 584 280 590 Q 300 596 320 590" />
        <text x="28" y="585" class="ocean-label">INDIAN OCEAN</text>
        <text x="240" y="80" class="ocean-label" style="font-size:16px;">BAY OF BENGAL</text>
      </g>

      <!-- Sri Lanka Main Landmass -->
      <path class="island-shape" d="${SRI_LANKA_PATH}" />
      <path class="island-inner" d="${SRI_LANKA_PATH}" />

      <!-- Route Path Layers -->
      <path class="route-shadow" d="${pathD}" />
      <path class="route-base" d="${pathD}" />
      <path class="route-dash" id="route-path-dash" d="${pathD}" />

      <!-- Animated Route Vehicle -->
      <g id="map-vehicle" class="map-veh" transform="translate(${allStops[0].x}, ${allStops[0].y})">
        <circle r="13" fill="#ff8a3d" stroke="#ffffff" stroke-width="2.5" filter="drop-shadow(0 4px 6px rgba(0,0,0,0.3))"/>
        <text font-size="13" text-anchor="middle" dominant-baseline="central" y="1">🚗</text>
      </g>

      <!-- Destination Numbered Pins -->
      ${allStops.map((s, idx) => {
        const isStart = s.isStart;
        const numLabel = isStart ? '★' : String(s.dayNum);
        return `
          <g class="pin pin-pop" id="map-pin-${idx}" data-day="${s.dayNum}" transform="translate(0, 0)" onclick="window.scrollToDay(${s.dayNum || 1})">
            <circle class="pin-halo" cx="${s.x}" cy="${s.y}" r="22"/>
            <circle class="pin-dot" cx="${s.x}" cy="${s.y}" r="15" fill="#ffffff" stroke="#0f2a3d" stroke-width="2.5"/>
            <image href="${s.photo}" x="${s.x - 15}" y="${s.y - 15}" width="30" height="30" clip-path="url(#clip-pin-${idx})" preserveAspectRatio="xMidYMid slice" onerror="this.style.display='none'"/>
            <circle cx="${s.x + 12}" cy="${s.y - 10}" r="8" fill="#f0642a" stroke="#ffffff" stroke-width="1.8"/>
            <text x="${s.x + 12}" y="${s.y - 9}" fill="#ffffff" font-size="8.5" font-weight="900">${numLabel}</text>
            <text class="pin-label" x="${s.x}" y="${s.y + 24}">${s.name.split(' ')[0]}</text>
          </g>
        `;
      }).join('')}
    `;

    // Store route path element for animated drive simulation
    window._routePathEl = document.getElementById('route-path-dash');
    window._allStops = allStops;
  }

  // --- Stop Strip Under Map ---
  function renderStopStrip() {
    const strip = document.getElementById('stops-strip');
    if (!strip) return;
    const d = state.data;

    strip.innerHTML = d.rows.map(r => {
      const thumb = `assets/journey/thumbs/${r.destSlug}.jpg`;
      const cleanName = r.destination.split(/[-➔]/).pop().trim();
      return `
        <button type="button" class="stop-chip" id="chip-day-${r.dayNum}" onclick="window.scrollToDay(${r.dayNum})">
          <img src="${thumb}" alt="${cleanName}" onerror="this.src='assets/journey/thumbs/colombo.jpg'"/>
          <div style="text-align:left;">
            <div class="sc-day">Day ${String(r.dayNum).padStart(2, '0')}</div>
            <div class="sc-name">${cleanName}</div>
          </div>
        </button>
      `;
    }).join('');
  }

  // --- 4. Day "Level" Cards ---
  function renderLevels() {
    const container = document.getElementById('journey-levels');
    if (!container) return;
    const d = state.data;

    container.innerHTML = d.rows.map((r, idx) => {
      const heroPhoto = `assets/journey/${r.destSlug}.jpg`;
      const cleanDest = r.destination.replace(/<[^>]*>/g, '').replace(/-/g, ' ➔ ');
      const startCity = (idx === 0) ? 'Bandaranaike Airport' : d.rows[idx - 1].destSlug;
      const endCity = r.destSlug;

      const isLast = (idx === d.rows.length - 1);
      const dist = r.distanceKm ? `${r.distanceKm} km` : 'Scenic';
      const time = r.travelTimeHours ? `~${r.travelTimeHours} hrs` : 'Direct';
      const stars = (r.overnight && r.overnight.stars) ? '★'.repeat(r.overnight.stars) : '★★★★★';

      return `
        <article class="level reveal" id="day-level-${r.dayNum}" data-day="${r.dayNum}">
          <div class="level-card">
            <!-- Hero photo with badge & date -->
            <div class="lv-photo">
              <img src="${heroPhoto}" alt="${r.destination}" loading="lazy" onerror="this.src='assets/journey/sigiriya.jpg'"/>
              <div class="lv-top">
                <div class="lv-badge">
                  <small>LEVEL</small>
                  <b>${String(r.dayNum).padStart(2, '0')}</b>
                </div>
                <div class="lv-date">📅 ${r.dateStr ? r.dateStr.replace(/<[^>]*>/g, ' ') : `Day ${r.dayNum}`}</div>
              </div>
              <div class="lv-head">
                <div class="lv-kicker">Day ${r.dayNum} Expedition</div>
                <h3 class="lv-name">${cleanDest.split('➔').pop().trim()}</h3>
                <div class="lv-route">
                  <span>📍 ${cleanDest}</span>
                </div>
              </div>
            </div>

            <!-- Animated Mini Road Strip (Vehicle drives on scroll!) -->
            <div class="road" id="road-day-${r.dayNum}">
              <div class="road-asphalt"></div>
              <span class="road-tree" style="left: 18%;">🌴</span>
              <span class="road-tree" style="left: 55%;">🌳</span>
              <span class="road-end a">START: ${startCity.toUpperCase()}</span>
              <span class="road-end b">GOAL: ${endCity.toUpperCase()}</span>
              <div class="road-flag">🏁</div>
              <div class="road-veh">
                <div class="road-dust"></div>
                <svg viewBox="0 0 46 26">
                  <!-- Cute Safari Van / Sedan Vector -->
                  <rect x="4" y="8" width="34" height="14" rx="4" fill="#ff8a3d"/>
                  <rect x="9" y="10" width="8" height="6" rx="1.5" fill="#ffffff" opacity="0.85"/>
                  <rect x="20" y="10" width="8" height="6" rx="1.5" fill="#ffffff" opacity="0.85"/>
                  <circle cx="12" cy="22" r="4" fill="#0f2a3d" class="wheel"/>
                  <circle cx="12" cy="22" r="1.5" fill="#ffffff"/>
                  <circle cx="30" cy="22" r="4" fill="#0f2a3d" class="wheel"/>
                  <circle cx="30" cy="22" r="1.5" fill="#ffffff"/>
                </svg>
              </div>
            </div>

            <!-- Card Body & Telemetry -->
            <div class="lv-body">
              <div class="chips">
                <span class="chip km">🚗 ${dist}</span>
                <span class="chip hr">⏱ ${time} scenic drive</span>
                <span class="chip nt">🌙 ${r.overnight ? r.overnight.name : 'Luxury Stay'}</span>
              </div>

              <!-- Quests (Attractions as game checklist) -->
              <div class="sub-h">
                <h4><span>⚔️</span> Day Quests &amp; Sightseeing</h4>
                <span class="count">${r.attractions.length} Activities</span>
              </div>

              <div class="quests-wrap">
                ${r.attractions.map((a, qIdx) => {
                  const questId = `q_${r.dayNum}_${qIdx}`;
                  const icon = DEST_ICONS[r.destSlug] || '✨';
                  const cleanText = a.replace(/<[^>]*>/g, '');
                  const [title, ...descParts] = cleanText.split(':');
                  const desc = descParts.join(':').trim() || 'Custom Ceylon sightseeing and leisure exploration.';

                  return `
                    <div class="quest" id="${questId}" onclick="window.toggleQuest('${questId}', ${r.dayNum})">
                      <div class="quest-ico">${icon}</div>
                      <div>
                        <div class="quest-title">${title.trim()}</div>
                        <div class="quest-desc">${desc}</div>
                      </div>
                      <div class="quest-check" title="Mark Done">✔</div>
                    </div>
                  `;
                }).join('')}
              </div>

              <!-- Overnight Sanctuary -->
              <div class="sub-h" style="margin-top: 18px;">
                <h4><span>🏨</span> Overnight Sanctuary</h4>
              </div>

              <div class="rest">
                <div class="rest-ico">🛏️</div>
                <div>
                  <div class="rest-kicker">Confirmed Lodging</div>
                  <div class="rest-name">${r.overnight ? r.overnight.name : 'Boutique Luxury Sanctuary'}</div>
                  <div class="rest-room">${r.overnight && r.overnight.room ? r.overnight.room : 'Deluxe Room • Premium View'}</div>
                  <div class="rest-meta">
                    <span class="stars">${stars}</span>
                    <span>🍽️ ${r.overnight && r.overnight.mealPlan ? r.overnight.mealPlan : 'Half Board Included'}</span>
                  </div>
                </div>
              </div>

              <!-- Level Completion Progress Bar -->
              <div class="lv-complete" id="comp-day-${r.dayNum}">
                <span>Day Progress:</span>
                <div class="bar"><i id="bar-day-${r.dayNum}"></i></div>
                <span id="label-day-${r.dayNum}">0/${r.attractions.length} Quests</span>
              </div>
            </div>
          </div>

          <!-- Trail Connector Signpost to next day -->
          ${!isLast ? `
            <div class="signpost">
              <div class="sign">
                <small>NEXT DESTINATION</small>
                ${d.rows[idx + 1].destSlug.toUpperCase()} ➔
              </div>
              <span class="hand">Keep exploring! 🌴</span>
            </div>
          ` : ''}
        </article>
      `;
    }).join('');
  }

  // --- Toggle Quest (Game Mechanic) ---
  window.toggleQuest = function (questId, dayNum) {
    const el = document.getElementById(questId);
    if (!el) return;

    const isDone = el.classList.toggle('done');
    if (isDone) {
      state.questsDone.add(questId);
      state.xp += 50;
      playChime('quest');

      // Floating XP popup
      const popup = document.createElement('div');
      popup.className = 'xp-float';
      popup.textContent = '+50 XP ⭐';
      el.appendChild(popup);
      setTimeout(() => popup.remove(), 950);

      // Check if day is finished to stamp passport
      checkDayCompletion(dayNum);
    } else {
      state.questsDone.delete(questId);
      state.xp = Math.max(0, state.xp - 50);
    }

    updateXpDisplay();
    updateDayProgressBar(dayNum);
  };

  function updateXpDisplay() {
    const xpVal = document.getElementById('hud-xp-val');
    const xpBadge = document.getElementById('hud-xp-badge');
    if (xpVal) xpVal.textContent = `${state.xp} XP`;
    if (xpBadge) {
      xpBadge.classList.remove('bump');
      void xpBadge.offsetWidth;
      xpBadge.classList.add('bump');
    }
  }

  function updateDayProgressBar(dayNum) {
    const row = state.data.rows.find(r => r.dayNum === dayNum);
    if (!row) return;

    let total = row.attractions.length;
    let done = 0;
    for (let i = 0; i < total; i++) {
      if (state.questsDone.has(`q_${dayNum}_${i}`)) done++;
    }

    const bar = document.getElementById(`bar-day-${dayNum}`);
    const label = document.getElementById(`label-day-${dayNum}`);
    const compBox = document.getElementById(`comp-day-${dayNum}`);

    const pct = Math.round((done / total) * 100);
    if (bar) bar.style.width = `${pct}%`;
    if (label) label.textContent = `${done}/${total} Quests`;

    if (compBox) {
      compBox.classList.toggle('full', done === total);
      if (done === total) {
        label.textContent = '🎉 Level Complete! +100 XP';
      }
    }
  }

  function checkDayCompletion(dayNum) {
    const row = state.data.rows.find(r => r.dayNum === dayNum);
    if (!row) return;
    const total = row.attractions.length;
    let done = 0;
    for (let i = 0; i < total; i++) {
      if (state.questsDone.has(`q_${dayNum}_${i}`)) done++;
    }

    if (done === total) {
      state.xp += 100;
      playChime('unlock');
      fireConfetti();
      showToast(`🏆 Day ${dayNum} Conquered! Passport Stamp Unlocked.`);
      unlockStamp(row.destSlug);
    }
  }

  // --- 5. Collector's Digital Passport ---
  function renderPassport() {
    const grid = document.getElementById('passport-stamps-grid');
    if (!grid) return;
    const d = state.data;

    // Distinct destinations visited
    const uniqueSlugs = Array.from(new Set(d.rows.map(r => r.destSlug)));

    grid.innerHTML = uniqueSlugs.map((slug, idx) => {
      const dest = (window.JOURNEY_DESTINATIONS && window.JOURNEY_DESTINATIONS[slug]) || { name: slug };
      const icon = DEST_ICONS[slug] || '🌴';
      const rot = (idx % 2 === 0 ? -1 : 1) * (5 + (idx * 3) % 15);
      const isSquare = idx % 3 === 1;

      return `
        <div class="stamp ${isSquare ? 'square' : ''}" id="stamp-${slug}" style="--r: ${rot}deg;" title="${dest.name}">
          <div class="st-ico">${icon}</div>
          <div class="st-name">${dest.name.split(' ')[0]}</div>
          <div class="st-day">SRI LANKA</div>
        </div>
      `;
    }).join('');
  }

  function unlockStamp(slug) {
    const st = document.getElementById(`stamp-${slug}`);
    if (st && !st.classList.contains('got')) {
      st.classList.add('got', 'just');
      state.stampsGot.add(slug);
      playChime('stamp');
      setTimeout(() => st.classList.remove('just'), 700);

      const stampCounter = document.getElementById('passport-count-label');
      if (stampCounter) {
        stampCounter.textContent = `${state.stampsGot.size} Stamps Collected`;
      }
    }
  }

  // --- 6. Travel Kit & Vehicle Showcase ---
  function renderKit() {
    const d = state.data;
    const guests = d.touristsCount || 2;
    const vehName = d.vehicleName || (guests > 4 ? 'Toyota HiAce Luxury KDH Van' : 'Toyota Prius Hybrid Sedan');

    const elVehName = document.getElementById('kit-veh-name');
    if (elVehName) elVehName.textContent = vehName;

    const elVehDesc = document.getElementById('kit-veh-desc');
    if (elVehDesc) {
      elVehDesc.textContent = `Dedicated private A/C vehicle with English-speaking tourist chauffeur guide, all highway expressway tolls, parking and fuel included.`;
    }
  }

  // --- 7. Finale CTA with WhatsApp Links ---
  function renderFinale() {
    const d = state.data;
    const waDesktop = document.getElementById('cta-whatsapp');
    const callBtn = document.getElementById('cta-call');

    const msg = encodeURIComponent(
      `Hello SunBird Lanka Tours, I'm reviewing our custom "${d.title}" expedition itinerary (${d.days} Days / ${d.touristsCount} Guests). Could you please confirm reservation and chauffeur details?`
    );
    const waUrl = `https://wa.me/94766800130?text=${msg}`;

    if (waDesktop) waDesktop.href = waUrl;
    if (callBtn) callBtn.href = 'tel:+94766800130';

    // Also connect PDF download button
    const pdfBtn = document.getElementById('cta-pdf');
    if (pdfBtn) {
      pdfBtn.href = 'SunBird_Lanka_Tours_Itinerary_Modern.pdf';
    }
  }

  // --- 8. ScrollSpy, Progress HUD & Animations ---
  function setupScrollSpy() {
    const hudFill = document.getElementById('hud-track-fill');
    const hudCar = document.getElementById('hud-car');

    window.addEventListener('scroll', () => {
      // 1. Overall trip progress
      const scrollY = window.scrollY;
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      const progress = Math.max(0, Math.min(scrollY / (maxScroll || 1), 1));

      if (hudFill) hudFill.style.width = `${progress * 100}%`;
      if (hudCar) hudCar.style.left = `${progress * 100}%`;

      // 2. Reveal in-view level cards and animate road vehicles
      checkLevelInView();
    }, { passive: true });
  }

  function checkLevelInView() {
    const levels = document.querySelectorAll('.level');
    const triggerH = window.innerHeight * 0.85;

    levels.forEach(lvl => {
      const rect = lvl.getBoundingClientRect();
      if (rect.top < triggerH) {
        if (!lvl.classList.contains('in')) {
          lvl.classList.add('in');
          const day = parseInt(lvl.dataset.day);
          // Highlight map pin and stop chip
          highlightActiveDay(day);
          // Auto unlock stamp when reaching level
          const row = state.data.rows.find(r => r.dayNum === day);
          if (row) unlockStamp(row.destSlug);
        }
      }
    });
  }

  function highlightActiveDay(day) {
    state.activeDay = day;

    // Highlight map pin
    document.querySelectorAll('.pin').forEach(p => {
      const isMatch = (parseInt(p.dataset.day) === day);
      p.classList.toggle('active', isMatch);
      p.classList.toggle('reached', parseInt(p.dataset.day) <= day);
    });

    // Highlight stop chip
    document.querySelectorAll('.stop-chip').forEach(c => {
      c.classList.toggle('active', c.id === `chip-day-${day}`);
    });

    // Move SVG vehicle on island map to this stop
    if (window._allStops) {
      const stop = window._allStops.find(s => s.dayNum === day);
      const mapVeh = document.getElementById('map-vehicle');
      if (stop && mapVeh) {
        mapVeh.setAttribute('transform', `translate(${stop.x}, ${stop.y})`);
      }
    }
  }

  // --- Smooth scroll helper ---
  window.scrollToDay = function (dayNum) {
    const target = document.getElementById(`day-level-${dayNum}`);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      highlightActiveDay(dayNum);
    }
  };

  // --- Drive Route Animation simulation ---
  window.driveWholeRoute = function () {
    const path = window._routePathEl;
    const veh = document.getElementById('map-vehicle');
    if (!path || !veh) return;

    showToast('🚗 Touring through Sri Lanka...');
    playChime('unlock');

    const totalLen = path.getTotalLength();
    let startTime = null;
    const duration = 4000; // 4 seconds

    function step(timestamp) {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const pt = path.getPointAtLength(progress * totalLen);

      veh.setAttribute('transform', `translate(${pt.x}, ${pt.y})`);

      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        fireConfetti(window.innerWidth / 2, window.innerHeight * 0.4);
        showToast('🏁 Route expedition completed!');
      }
    }
    requestAnimationFrame(step);
  };

  // --- 9. Bottom Navigation ---
  function setupBottomNav() {
    const links = document.querySelectorAll('.bnav a');
    links.forEach(a => {
      a.addEventListener('click', (e) => {
        const href = a.getAttribute('href');
        if (href && href.startsWith('#')) {
          e.preventDefault();
          const target = document.querySelector(href);
          if (target) {
            target.scrollIntoView({ behavior: 'smooth' });
          }
          links.forEach(l => l.classList.remove('active'));
          a.classList.add('active');
        }
      });
    });
  }

  // Export controller
  window.SunBirdJourney = {
    init: initJourney,
    state: state,
    driveWholeRoute: window.driveWholeRoute,
    scrollToDay: window.scrollToDay
  };

  // Auto initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initJourney);
  } else {
    initJourney();
  }

})();
