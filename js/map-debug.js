/**
 * SunBird 3D Tactical Map - Outline & Glow Interactive Debugger
 * Provides real-time sliders and color controls for tuning:
 * 1. 3D Island Extrude Depth / Height (0.2 to 5.0)
 * 2. Top Edge (color, core width, core opacity, glow intensity, ribbon spread)
 * 3. Bottom Edge (color, core width, core opacity, glow intensity, ribbon spread, ground bloom)
 * 4. Side Cliff Wall (color, emissive intensity)
 * 5. One-click Copy Data button to export the config directly to clipboard for the agent
 */

(function () {
  'use strict';

  const DEFAULTS = {
    extrudeDepth: 1.7,
    topEdge: {
      color: '#fbdc08',
      coreWidth: 5.3,
      coreOpacity: 0.85,
      glowIntensity: 3.0,
      ribbonSpread: 0.06
    },
    bottomEdge: {
      color: '#29a9e2',
      coreWidth: 3.8,
      coreOpacity: 1.0,
      glowIntensity: 1.5,
      ribbonSpread: 0.15,
      groundBloom: 1.0
    },
    sideWall: {
      color: '#0b192e',
      emissiveIntensity: 0.15
    },
    floorReflection: {
      reflectivity: 0.15,
      fresnelPower: 5.0
    }
  };

  // Deep clone current config
  let currentConfig = JSON.parse(JSON.stringify(DEFAULTS));

  function hexToRgb(hex) {
    const clean = hex.replace('#', '');
    const num = parseInt(clean, 16);
    if (isNaN(num) || clean.length < 6) return { r: 41, g: 169, b: 226 };
    return {
      r: (num >> 16) & 255,
      g: (num >> 8) & 255,
      b: num & 255
    };
  }

  /**
   * Re-renders the vertical 32x256 linear gradient ribbon texture
   */
  function updateRibbonGradient(ribbonMesh, hexColor, isTop) {
    if (!ribbonMesh || !ribbonMesh.userData || !ribbonMesh.userData.rctx) return;
    const ctx = ribbonMesh.userData.rctx;
    const tex = ribbonMesh.userData.ribbonTex;
    const rgb = hexToRgb(hexColor);

    ctx.clearRect(0, 0, 32, 256);
    const grad = ctx.createLinearGradient(0, 0, 0, 256);

    if (isTop) {
      // Top rim gradient (Sunbird solar yellow luminous glow)
      const coreR = Math.min(255, rgb.r + 4);
      const coreG = Math.min(255, rgb.g + 35);
      const coreB = Math.min(255, rgb.b + 172);
      grad.addColorStop(0.0, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0)`);
      grad.addColorStop(0.25, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.75)`);
      grad.addColorStop(0.45, `rgba(${coreR}, ${coreG}, ${coreB}, 0.95)`);
      grad.addColorStop(0.50, `rgba(255, 255, 180, 1.0)`);
      grad.addColorStop(0.55, `rgba(${coreR}, ${coreG}, ${coreB}, 0.95)`);
      grad.addColorStop(0.75, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.75)`);
      grad.addColorStop(1.0, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0)`);
    } else {
      // Bottom rim gradient (Sunbird cerulean / azure glow)
      const coreR = Math.min(255, rgb.r + 102);
      const coreG = Math.min(255, rgb.g + 55);
      const coreB = Math.min(255, rgb.b + 29);
      grad.addColorStop(0.0, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0)`);
      grad.addColorStop(0.25, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.85)`);
      grad.addColorStop(0.45, `rgba(${coreR}, ${coreG}, ${coreB}, 0.95)`);
      grad.addColorStop(0.50, `rgba(${coreR}, ${coreG}, ${coreB}, 1.0)`);
      grad.addColorStop(0.55, `rgba(${coreR}, ${coreG}, ${coreB}, 0.95)`);
      grad.addColorStop(0.75, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.85)`);
      grad.addColorStop(1.0, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0)`);
    }

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 32, 256);
    tex.needsUpdate = true;
  }

  /**
   * Updates vertical height / spread of the ribbon mesh
   */
  function updateRibbonSpread(ribbonMesh, yBase, spread, isTop) {
    if (!ribbonMesh || !ribbonMesh.geometry) return;
    const pos = ribbonMesh.geometry.attributes.position;
    const count = ribbonMesh.userData.pts ? ribbonMesh.userData.pts.length : (pos.count / 2);
    const yBottom = isTop ? (yBase - spread) : yBase;
    const yTop = isTop ? yBase : (yBase + spread);

    for (let i = 0; i < count; i++) {
      pos.setY(i * 2, yBottom);
      pos.setY(i * 2 + 1, yTop);
    }
    pos.needsUpdate = true;
  }

  /**
   * Applies the current debug configuration to all active 3D Three.js objects
   */
  function applyDebugConfig(cfg) {
    const ms = window.mapState;
    if (!ms) return;

    // 1. 3D Island Extrude Depth / Height Scaling
    if (typeof cfg.extrudeDepth === 'number') {
      const depth = cfg.extrudeDepth;
      const baseDepth = 2.20;
      const deltaY = depth - baseDepth;

      // Scale island mesh vertically
      if (ms.islandMesh) {
        ms.islandMesh.scale.z = depth / baseDepth;
      }

      // Elevate top edge rim & ribbon
      if (ms.topCoreLine) {
        ms.topCoreLine.position.y = deltaY;
      }
      if (ms.topRibbon) {
        ms.topRibbon.position.y = deltaY;
      }

      // Elevate transit routes
      if (ms.routesGroup) {
        ms.routesGroup.position.y = deltaY;
      }

      // Elevate location markers & HTML billboard badges
      if (ms.markersGroup) {
        ms.markersGroup.position.y = deltaY;
      }
      if (ms.markerBillboards) {
        ms.markerBillboards.forEach((item) => {
          if (item.baseWorldPos) {
            item.worldPos.y = item.baseWorldPos.y + deltaY;
          }
        });
      }
    }

    // 2. Top Edge
    if (ms.topCoreMat) {
      ms.topCoreMat.color.set(cfg.topEdge.color);
      ms.topCoreMat.linewidth = cfg.topEdge.coreWidth;
      ms.topCoreMat.opacity = cfg.topEdge.coreOpacity;
      ms.topCoreMat.needsUpdate = true;
    }
    if (ms.topRibbon) {
      ms.topRibbon.material.opacity = cfg.topEdge.glowIntensity;
      ms.topRibbon.material.needsUpdate = true;
      updateRibbonGradient(ms.topRibbon, cfg.topEdge.color, true);
      updateRibbonSpread(ms.topRibbon, 2.22, cfg.topEdge.ribbonSpread, true);
    }

    // 3. Bottom Edge
    if (ms.botCoreMat) {
      ms.botCoreMat.color.set(cfg.bottomEdge.color);
      ms.botCoreMat.linewidth = cfg.bottomEdge.coreWidth;
      ms.botCoreMat.opacity = cfg.bottomEdge.coreOpacity;
      ms.botCoreMat.needsUpdate = true;
    }
    if (ms.botRibbon) {
      ms.botRibbon.material.opacity = cfg.bottomEdge.glowIntensity;
      ms.botRibbon.material.needsUpdate = true;
      updateRibbonGradient(ms.botRibbon, cfg.bottomEdge.color, false);
      updateRibbonSpread(ms.botRibbon, 0.01, cfg.bottomEdge.ribbonSpread, false);
    }

    // 4. Ground Bloom Aura & Underglow Light
    if (ms.groundAuraMesh) {
      ms.groundAuraMesh.material.color.set(cfg.bottomEdge.color);
      ms.groundAuraMesh.material.opacity = cfg.bottomEdge.groundBloom;
      ms.groundAuraMesh.material.needsUpdate = true;
    }
    if (ms.underglowLight) {
      ms.underglowLight.color.set(cfg.bottomEdge.color);
      ms.underglowLight.intensity = 4.5 * cfg.bottomEdge.groundBloom;
    }

    // 5. Side Cliff Wall
    if (ms.sideMaterial) {
      ms.sideMaterial.color.set(cfg.sideWall.color);
      ms.sideMaterial.emissive.set(cfg.sideWall.color);
      ms.sideMaterial.emissiveIntensity = cfg.sideWall.emissiveIntensity;
      ms.sideMaterial.needsUpdate = true;
    }

    // 6. Floor Water Reflection
    if (cfg.floorReflection && ms.reflectorMaterial && ms.reflectorMaterial.uniforms) {
      if (typeof cfg.floorReflection.reflectivity === 'number') {
        ms.reflectorMaterial.uniforms['reflectivity'].value = cfg.floorReflection.reflectivity;
      }
      if (typeof cfg.floorReflection.fresnelPower === 'number') {
        ms.reflectorMaterial.uniforms['fresnelPower'].value = cfg.floorReflection.fresnelPower;
      }
    }
  }

  /**
   * Initializes the debug UI bindings and DOM synchronization
   */
  function initDebugUI() {
    const panel = document.getElementById('map-debug-panel');
    const toggleBtn = document.getElementById('map-btn-debug-toggle');
    const closeBtn = document.getElementById('map-debug-close-btn');
    const copyBtn = document.getElementById('map-debug-copy-btn');
    const resetBtn = document.getElementById('map-debug-reset-btn');
    const outputBox = document.getElementById('map-debug-output');

    if (!panel) return;

    // Apply baseline config immediately (checking current mood if set)
    if (window.mapState && window.mapState.currentMood === 'light') {
      currentConfig.topEdge.color = '#d97706';
      currentConfig.topEdge.coreOpacity = 0.95;
      currentConfig.bottomEdge.color = '#0284c7';
      currentConfig.sideWall.color = '#c4d4e4';
      currentConfig.sideWall.emissiveIntensity = 0.08;
    } else if (window.mapState && window.mapState.currentMood === 'emerald') {
      currentConfig.topEdge.color = '#ffffff';
      currentConfig.topEdge.coreOpacity = 0.55;
      currentConfig.topEdge.glowIntensity = 3.0;
      currentConfig.topEdge.ribbonSpread = 0.06;
      currentConfig.bottomEdge.color = '#0e7a00';
      currentConfig.bottomEdge.coreOpacity = 1.0;
      currentConfig.bottomEdge.glowIntensity = 1.5;
      currentConfig.bottomEdge.ribbonSpread = 0.15;
      currentConfig.bottomEdge.groundBloom = 1.0;
      currentConfig.sideWall.color = '#143914';
      currentConfig.sideWall.emissiveIntensity = 0.10;
    }
    applyDebugConfig(currentConfig);

    // Toggle Panel
    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => {
        const isHidden = panel.classList.toggle('hidden');
        toggleBtn.classList.toggle('active', !isHidden);
      });
    }

    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        panel.classList.add('hidden');
        if (toggleBtn) toggleBtn.classList.remove('active');
      });
    }

    // Preset Selector Buttons
    document.querySelectorAll('.debug-preset-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const preset = btn.getAttribute('data-preset');
        if (window.mapState && window.mapState.setMood) {
          window.mapState.setMood(preset);
        }
      });
    });

    // Bindings Map: { sliderId, valId, get, set }
    const bindings = [
      // 3D Island Extrude Depth
      {
        sliderId: 'debug-extrude-depth',
        valId: 'debug-extrude-depth-val',
        get: () => currentConfig.extrudeDepth,
        set: (v) => { currentConfig.extrudeDepth = parseFloat(v); }
      },

      // Top Edge
      {
        sliderId: 'debug-top-width',
        valId: 'debug-top-width-val',
        get: () => currentConfig.topEdge.coreWidth,
        set: (v) => { currentConfig.topEdge.coreWidth = parseFloat(v); }
      },
      {
        sliderId: 'debug-top-opacity',
        valId: 'debug-top-opacity-val',
        get: () => currentConfig.topEdge.coreOpacity,
        set: (v) => { currentConfig.topEdge.coreOpacity = parseFloat(v); }
      },
      {
        sliderId: 'debug-top-glow',
        valId: 'debug-top-glow-val',
        get: () => currentConfig.topEdge.glowIntensity,
        set: (v) => { currentConfig.topEdge.glowIntensity = parseFloat(v); }
      },
      {
        sliderId: 'debug-top-spread',
        valId: 'debug-top-spread-val',
        get: () => currentConfig.topEdge.ribbonSpread,
        set: (v) => { currentConfig.topEdge.ribbonSpread = parseFloat(v); }
      },

      // Bottom Edge
      {
        sliderId: 'debug-bot-width',
        valId: 'debug-bot-width-val',
        get: () => currentConfig.bottomEdge.coreWidth,
        set: (v) => { currentConfig.bottomEdge.coreWidth = parseFloat(v); }
      },
      {
        sliderId: 'debug-bot-opacity',
        valId: 'debug-bot-opacity-val',
        get: () => currentConfig.bottomEdge.coreOpacity,
        set: (v) => { currentConfig.bottomEdge.coreOpacity = parseFloat(v); }
      },
      {
        sliderId: 'debug-bot-glow',
        valId: 'debug-bot-glow-val',
        get: () => currentConfig.bottomEdge.glowIntensity,
        set: (v) => { currentConfig.bottomEdge.glowIntensity = parseFloat(v); }
      },
      {
        sliderId: 'debug-bot-spread',
        valId: 'debug-bot-spread-val',
        get: () => currentConfig.bottomEdge.ribbonSpread,
        set: (v) => { currentConfig.bottomEdge.ribbonSpread = parseFloat(v); }
      },
      {
        sliderId: 'debug-ground-bloom',
        valId: 'debug-ground-bloom-val',
        get: () => currentConfig.bottomEdge.groundBloom,
        set: (v) => { currentConfig.bottomEdge.groundBloom = parseFloat(v); }
      },

      // Side Wall
      {
        sliderId: 'debug-side-emissive',
        valId: 'debug-side-emissive-val',
        get: () => currentConfig.sideWall.emissiveIntensity,
        set: (v) => { currentConfig.sideWall.emissiveIntensity = parseFloat(v); }
      },

      // Floor Water Reflection
      {
        sliderId: 'debug-floor-refl',
        valId: 'debug-floor-refl-val',
        get: () => (currentConfig.floorReflection ? currentConfig.floorReflection.reflectivity : 0.60),
        set: (v) => {
          if (!currentConfig.floorReflection) currentConfig.floorReflection = {};
          currentConfig.floorReflection.reflectivity = parseFloat(v);
        }
      },
      {
        sliderId: 'debug-floor-fresnel',
        valId: 'debug-floor-fresnel-val',
        get: () => (currentConfig.floorReflection ? currentConfig.floorReflection.fresnelPower : 3.0),
        set: (v) => {
          if (!currentConfig.floorReflection) currentConfig.floorReflection = {};
          currentConfig.floorReflection.fresnelPower = parseFloat(v);
        }
      }
    ];

    function updateOutputBox() {
      if (outputBox) {
        outputBox.value = JSON.stringify(currentConfig, null, 2);
      }
    }

    // Attach Sliders
    bindings.forEach(b => {
      const slider = document.getElementById(b.sliderId);
      const valLabel = document.getElementById(b.valId);
      if (slider) {
        slider.value = b.get();
        if (valLabel) valLabel.textContent = b.get();
        slider.addEventListener('input', (e) => {
          b.set(e.target.value);
          if (valLabel) valLabel.textContent = e.target.value;
          applyDebugConfig(currentConfig);
          updateOutputBox();
        });
      }
    });

    // Color Pickers & Hex Inputs
    function bindColorControl(pickerId, hexId, getter, setter) {
      const picker = document.getElementById(pickerId);
      const hexInput = document.getElementById(hexId);
      if (!picker || !hexInput) return;

      picker.value = getter();
      hexInput.value = getter();

      picker.addEventListener('input', (e) => {
        const val = e.target.value;
        hexInput.value = val;
        setter(val);
        applyDebugConfig(currentConfig);
        updateOutputBox();
      });

      hexInput.addEventListener('input', (e) => {
        let val = e.target.value.trim();
        if (!val.startsWith('#')) val = '#' + val;
        if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
          picker.value = val;
          setter(val);
          applyDebugConfig(currentConfig);
          updateOutputBox();
        }
      });
    }

    bindColorControl(
      'debug-top-color',
      'debug-top-hex',
      () => currentConfig.topEdge.color,
      (c) => { currentConfig.topEdge.color = c; }
    );

    bindColorControl(
      'debug-bot-color',
      'debug-bot-hex',
      () => currentConfig.bottomEdge.color,
      (c) => { currentConfig.bottomEdge.color = c; }
    );

    bindColorControl(
      'debug-side-color',
      'debug-side-hex',
      () => currentConfig.sideWall.color,
      (c) => { currentConfig.sideWall.color = c; }
    );

    // Initial Output Box Content
    updateOutputBox();

    // Copy Button Handler
    if (copyBtn) {
      copyBtn.addEventListener('click', async () => {
        const textToCopy = JSON.stringify(currentConfig, null, 2);
        let copied = false;

        if (navigator.clipboard && navigator.clipboard.writeText) {
          try {
            await navigator.clipboard.writeText(textToCopy);
            copied = true;
          } catch (e) {
            console.warn('navigator.clipboard failed, falling back:', e);
          }
        }

        if (!copied && outputBox) {
          outputBox.select();
          document.execCommand('copy');
          copied = true;
        }

        // Visual Feedback
        const originalText = copyBtn.innerHTML;
        copyBtn.innerHTML = '<span>✓ Copied to Clipboard!</span>';
        copyBtn.style.background = '#22c55e';
        copyBtn.style.color = '#ffffff';

        if (window.showToast) {
          window.showToast('✓ Outline & Glow configuration copied to clipboard! Paste in chat.');
        }

        setTimeout(() => {
          copyBtn.innerHTML = originalText;
          copyBtn.style.background = '';
          copyBtn.style.color = '';
        }, 2500);
      });
    }

    // Reset Defaults Handler
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        currentConfig = JSON.parse(JSON.stringify(DEFAULTS));

        // Update all controls
        bindings.forEach(b => {
          const slider = document.getElementById(b.sliderId);
          const valLabel = document.getElementById(b.valId);
          if (slider) slider.value = b.get();
          if (valLabel) valLabel.textContent = b.get();
        });

        const topPicker = document.getElementById('debug-top-color');
        const topHex = document.getElementById('debug-top-hex');
        if (topPicker) topPicker.value = DEFAULTS.topEdge.color;
        if (topHex) topHex.value = DEFAULTS.topEdge.color;

        const botPicker = document.getElementById('debug-bot-color');
        const botHex = document.getElementById('debug-bot-hex');
        if (botPicker) botPicker.value = DEFAULTS.bottomEdge.color;
        if (botHex) botHex.value = DEFAULTS.bottomEdge.color;

        const sidePicker = document.getElementById('debug-side-color');
        const sideHex = document.getElementById('debug-side-hex');
        if (sidePicker) sidePicker.value = DEFAULTS.sideWall.color;
        if (sideHex) sideHex.value = DEFAULTS.sideWall.color;

        applyDebugConfig(currentConfig);
        updateOutputBox();

        if (window.showToast) {
          window.showToast('Reset outline & glow settings to defaults.');
        }
      });
    }

    // Expose API for programmatic access or testing
    window.mapDebug = {
      getConfig: () => JSON.parse(JSON.stringify(currentConfig)),
      setConfig: (newCfg) => {
        Object.assign(currentConfig, newCfg);
        applyDebugConfig(currentConfig);
        updateOutputBox();
      },
      applyConfig: applyDebugConfig,
      reset: () => resetBtn && resetBtn.click()
    };

    /**
     * Synchronizes debug panel controls with active theme mood
     */
    window.syncMapDebugMood = function (moodName) {
      if (moodName === 'light') {
        currentConfig.topEdge.color = '#d97706';
        currentConfig.topEdge.coreOpacity = 0.95;
        currentConfig.bottomEdge.color = '#0284c7';
        currentConfig.sideWall.color = '#c4d4e4';
        currentConfig.sideWall.emissiveIntensity = 0.08;
      } else if (moodName === 'emerald') {
        currentConfig.extrudeDepth = 1.7;
        currentConfig.topEdge.color = '#ffffff';
        currentConfig.topEdge.coreWidth = 5.3;
        currentConfig.topEdge.coreOpacity = 0.55;
        currentConfig.topEdge.glowIntensity = 3.0;
        currentConfig.topEdge.ribbonSpread = 0.06;
        currentConfig.bottomEdge.color = '#0e7a00';
        currentConfig.bottomEdge.coreWidth = 3.8;
        currentConfig.bottomEdge.coreOpacity = 1.0;
        currentConfig.bottomEdge.glowIntensity = 1.5;
        currentConfig.bottomEdge.ribbonSpread = 0.15;
        currentConfig.bottomEdge.groundBloom = 1.0;
        currentConfig.sideWall.color = '#143914';
        currentConfig.sideWall.emissiveIntensity = 0.10;
        currentConfig.floorReflection = {
          reflectivity: 0.15,
          fresnelPower: 5.0
        };
      } else {
        currentConfig.topEdge.color = '#fbdc08';
        currentConfig.topEdge.coreOpacity = 0.85;
        currentConfig.bottomEdge.color = '#29a9e2';
        currentConfig.sideWall.color = '#0b192e';
        currentConfig.sideWall.emissiveIntensity = 0.15;
      }

      // Update all controls
      const setVal = (sliderId, valId, val, decimals = null) => {
        const slider = document.getElementById(sliderId);
        const label = document.getElementById(valId);
        if (slider && typeof val !== 'undefined') slider.value = val;
        if (label && typeof val !== 'undefined') label.textContent = decimals !== null ? Number(val).toFixed(decimals) : val;
      };

      setVal('debug-extrude-depth', 'debug-extrude-depth-val', currentConfig.extrudeDepth, 1);
      setVal('debug-top-width', 'debug-top-width-val', currentConfig.topEdge.coreWidth, 1);
      setVal('debug-top-opacity', 'debug-top-opacity-val', currentConfig.topEdge.coreOpacity, 2);
      setVal('debug-top-glow', 'debug-top-glow-val', currentConfig.topEdge.glowIntensity, 2);
      setVal('debug-top-spread', 'debug-top-spread-val', currentConfig.topEdge.ribbonSpread, 2);

      setVal('debug-bot-width', 'debug-bot-width-val', currentConfig.bottomEdge.coreWidth, 1);
      setVal('debug-bot-opacity', 'debug-bot-opacity-val', currentConfig.bottomEdge.coreOpacity, 2);
      setVal('debug-bot-glow', 'debug-bot-glow-val', currentConfig.bottomEdge.glowIntensity, 2);
      setVal('debug-bot-spread', 'debug-bot-spread-val', currentConfig.bottomEdge.ribbonSpread, 2);
      setVal('debug-ground-bloom', 'debug-ground-bloom-val', currentConfig.bottomEdge.groundBloom, 2);

      setVal('debug-side-emissive', 'debug-side-emissive-val', currentConfig.sideWall.emissiveIntensity, 2);
      if (currentConfig.floorReflection) {
        setVal('debug-floor-refl', 'debug-floor-refl-val', currentConfig.floorReflection.reflectivity, 2);
        setVal('debug-floor-fresnel', 'debug-floor-fresnel-val', currentConfig.floorReflection.fresnelPower, 1);
      }

      const topPicker = document.getElementById('debug-top-color');
      const topHex = document.getElementById('debug-top-hex');
      if (topPicker) topPicker.value = currentConfig.topEdge.color;
      if (topHex) topHex.value = currentConfig.topEdge.color;

      const botPicker = document.getElementById('debug-bot-color');
      const botHex = document.getElementById('debug-bot-hex');
      if (botPicker) botPicker.value = currentConfig.bottomEdge.color;
      if (botHex) botHex.value = currentConfig.bottomEdge.color;

      const sidePicker = document.getElementById('debug-side-color');
      const sideHex = document.getElementById('debug-side-hex');
      if (sidePicker) sidePicker.value = currentConfig.sideWall.color;
      if (sideHex) sideHex.value = currentConfig.sideWall.color;

      // Update active state on preset buttons if present
      document.querySelectorAll('.debug-preset-btn').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-preset') === moodName);
      });

      updateOutputBox();
    };
  }

  // Initialize once DOM is ready or poll briefly if 3D scene finishes asynchronously
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(initDebugUI, 500));
  } else {
    setTimeout(initDebugUI, 500);
  }

})();
