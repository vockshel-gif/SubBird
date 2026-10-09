/**
 * SunBird 3D Tactical Cyber Map of Sri Lanka
 * Faithful reproduction of the command-center 3D map style in media_1789747625578.png
 * Built with Three.js (WebGL) + Procedural Textures + HTML Billboard Badges
 */

(function () {
  'use strict';

  // State
  const mapState = {
    isInitialized: false,
    isCameraAnimating: false,
    autoRotate: false,
    is2DView: false,
    activeFilter: 'all',
    activeDestination: null,
    currentMood: 'light', // Default to daylight tropical light mood
    controls: null,
    camera: null,
    scene: null,
    renderer: null,
    ambientLight: null,
    keyLight: null,
    rimLight: null,
    underglowLight: null,
    islandGroup: null,
    islandMesh: null,
    sideMaterial: null,
    topMaterial: null,
    routesGroup: null,
    routeItems: [],
    markersGroup: null,
    radarGroup: null,
    floorMesh: null,
    floorCanvas: null,
    floorCtx: null,
    floorTexture: null,
    reflector: null,
    reflectorMaterial: null,
    motionGroup: null,
    primaryMotionRing: null,
    secondaryMotionRing: null,
    innerMotionRing: null,
    primaryMotionMat: null,
    primaryMotionCanvas: null,
    primaryMotionCtx: null,
    primaryMotionTexture: null,
    auraCanvas: null,
    auraCtx: null,
    groundAuraMesh: null,
    groundAuraTex: null,
    botRibbon: null,
    botCoreLine: null,
    botCoreMat: null,
    topRibbon: null,
    topCoreLine: null,
    topCoreMat: null,
    pts: null,
    normals: null,
    districtsGroup: null,
    districtItems: [],
    districtFillMeshes: [],
    weatherRainGroup: null,
    rainParticlesGeo: null,
    rainSpeeds: null,
    streakLength: 0.50,
    isWeatherOverlayActive: false,
    currentWeatherMonth: 8,
    activeWetDistricts: [],
    hoveredDistrict: null,
    domElements: {}
  };
  window.mapState = mapState;

  // Circular HUD Vector Icons matching user reference in media_1789870160443.png
  const HUD_CIRCULAR_ICONS = {
    moon: `<svg class="hud-circle-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <circle cx="12" cy="12" r="10.5" stroke-width="1.8"/>
      <path d="M14.2 6.6 A 6.5 6.5 0 0 0 7.5 12 A 6.5 6.5 0 0 0 14.2 17.4 A 5.5 5.5 0 0 1 14.2 6.6 Z" fill="currentColor" stroke="none"/>
    </svg>`,
    sun: `<svg class="hud-circle-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <circle cx="12" cy="12" r="10.5" stroke-width="1.8"/>
      <circle cx="12" cy="12" r="4.2" fill="currentColor" stroke="none"/>
      <line x1="12" y1="4.2" x2="12" y2="6.2" stroke-width="1.8" stroke-linecap="round"/>
      <line x1="12" y1="17.8" x2="12" y2="19.8" stroke-width="1.8" stroke-linecap="round"/>
      <line x1="4.2" y1="12" x2="6.2" y2="12" stroke-width="1.8" stroke-linecap="round"/>
      <line x1="17.8" y1="12" x2="19.8" y2="12" stroke-width="1.8" stroke-linecap="round"/>
      <line x1="6.5" y1="6.5" x2="7.9" y2="7.9" stroke-width="1.8" stroke-linecap="round"/>
      <line x1="17.5" y1="6.5" x2="16.1" y2="7.9" stroke-width="1.8" stroke-linecap="round"/>
      <line x1="6.5" y1="17.5" x2="7.9" y2="16.1" stroke-width="1.8" stroke-linecap="round"/>
      <line x1="17.5" y1="17.5" x2="16.1" y2="16.1" stroke-width="1.8" stroke-linecap="round"/>
    </svg>`,
    emerald: `<svg class="hud-circle-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <circle cx="12" cy="12" r="10.5" stroke-width="1.8"/>
      <polygon points="7,10.5 12,6.5 17,10.5 15,16.5 9,16.5" stroke-width="1.5"/>
      <line x1="7" y1="10.5" x2="17" y2="10.5" stroke-width="1.2"/>
      <line x1="12" y1="6.5" x2="12" y2="16.5" stroke-width="1.2"/>
    </svg>`,
    terrain: `<svg class="hud-circle-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <circle cx="12" cy="12" r="10.5" stroke-width="1.8"/>
      <polygon points="5,16.5 10.5,8.5 14,13 16,10 19,16.5" fill="currentColor" stroke="none"/>
    </svg>`,
    satellite: `<svg class="hud-circle-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <circle cx="12" cy="12" r="10.5" stroke-width="1.8"/>
      <rect x="10" y="10" width="4" height="4" stroke-width="1.5"/>
      <rect x="5.5" y="10.5" width="3.5" height="3" stroke-width="1.2"/>
      <rect x="15" y="10.5" width="3.5" height="3" stroke-width="1.2"/>
      <line x1="12" y1="6.5" x2="12" y2="10" stroke-width="1.5"/>
      <circle cx="12" cy="6" r="1" fill="currentColor" stroke="none"/>
    </svg>`,
    plan2D: `<svg class="hud-circle-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <circle cx="12" cy="12" r="10.5" stroke-width="1.8"/>
      <rect x="7" y="7" width="10" height="10" rx="1.5" stroke-width="1.6"/>
      <line x1="7" y1="12" x2="17" y2="12" stroke-width="1.2" stroke-dasharray="1.5 1.5"/>
      <line x1="12" y1="7" x2="12" y2="17" stroke-width="1.2" stroke-dasharray="1.5 1.5"/>
    </svg>`,
    view3D: `<svg class="hud-circle-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <circle cx="12" cy="12" r="10.5" stroke-width="1.8"/>
      <path d="M12 6.5L17.5 9.5V15.5L12 18.5L6.5 15.5V9.5L12 6.5Z" stroke-width="1.5"/>
      <line x1="12" y1="6.5" x2="12" y2="18.5" stroke-width="1.2"/>
      <line x1="12" y1="12.5" x2="17.5" y2="9.5" stroke-width="1.2"/>
      <line x1="12" y1="12.5" x2="6.5" y2="9.5" stroke-width="1.2"/>
    </svg>`
  };

  // Visual Theme Presets: Dark Cyber/Night Mood & Light Tropical/Daylight Mood
  const THEMES = {
    dark: {
      name: 'dark',
      label: '☀️ Light Mood',
      sceneBg: 0x040810,
      ambient: { color: 0xffffff, intensity: 0.58 },
      key: { color: 0xffffff, intensity: 0.52 },
      rim: { color: 0x29a9e2, intensity: 0.35 },
      underglow: { color: 0x1f75b9, intensity: 4.5 },
      side: { color: 0x0b192e, emissive: 0x0e2240, emissiveIntensity: 0.15 },
      topEdge: {
        color: 0xfbdc08,
        hex: '#fbdc08',
        opacity: 0.85,
        ribbonGrad: [
          { pos: 0.0, color: 'rgba(251, 220, 8, 0)' },
          { pos: 0.25, color: 'rgba(251, 220, 8, 0.75)' },
          { pos: 0.45, color: 'rgba(255, 240, 100, 0.95)' },
          { pos: 0.50, color: 'rgba(255, 255, 180, 1.0)' },
          { pos: 0.55, color: 'rgba(255, 240, 100, 0.95)' },
          { pos: 0.75, color: 'rgba(251, 220, 8, 0.75)' },
          { pos: 1.0, color: 'rgba(251, 220, 8, 0)' }
        ]
      },
      botEdge: {
        color: 0x29a9e2,
        hex: '#29a9e2',
        opacity: 1.0,
        ribbonGrad: [
          { pos: 0.0, color: 'rgba(31, 117, 185, 0)' },
          { pos: 0.25, color: 'rgba(41, 169, 226, 0.85)' },
          { pos: 0.45, color: 'rgba(143, 224, 255, 0.95)' },
          { pos: 0.50, color: 'rgba(143, 224, 255, 1.0)' },
          { pos: 0.55, color: 'rgba(143, 224, 255, 0.95)' },
          { pos: 0.75, color: 'rgba(41, 169, 226, 0.85)' },
          { pos: 1.0, color: 'rgba(31, 117, 185, 0)' }
        ]
      },
      aura: {
        c1: '#1f75b9', c1Rgba: 'rgba(31, 117, 185, 0.70)',
        c2: '#29a9e2', c2Rgba: 'rgba(41, 169, 226, 0.85)',
        c3: '#29a9e2', c3Rgba: 'rgba(41, 169, 226, 0.95)',
        c4: '#8fe0ff', c4Stroke: '#8fe0ff',
        fill: 'rgba(31, 117, 185, 0.25)'
      },
      floor: {
        bg: ['#061528', '#040e1b', '#030a13', '#02070f'],
        crossRgb: '41, 169, 226',
        ringsRgba: 'rgba(148, 163, 184, 0.10)'
      },
      motion: {
        stroke: '#abacac',
        opacity: 0.25
      },
      routes: {
        priority: { color: 0xfbdc08, ladder: 0xffea60 },
        normal: { color: 0x29a9e2, ladder: 0x8fe0ff }
      }
    },
    light: {
      name: 'light',
      label: '🌙 Dark Mood',
      sceneBg: 0xe8f4f8,
      ambient: { color: 0xffffff, intensity: 0.85 },
      key: { color: 0xfffaed, intensity: 0.85 },
      rim: { color: 0x0284c7, intensity: 0.40 },
      underglow: { color: 0x0284c7, intensity: 2.2 },
      side: { color: 0xc4d4e4, emissive: 0x1e3a5f, emissiveIntensity: 0.08 },
      topEdge: {
        color: 0xd97706,
        hex: '#d97706',
        opacity: 0.95,
        ribbonGrad: [
          { pos: 0.0, color: 'rgba(217, 119, 6, 0)' },
          { pos: 0.25, color: 'rgba(217, 119, 6, 0.75)' },
          { pos: 0.45, color: 'rgba(245, 158, 11, 0.95)' },
          { pos: 0.50, color: 'rgba(254, 243, 199, 1.0)' },
          { pos: 0.55, color: 'rgba(245, 158, 11, 0.95)' },
          { pos: 0.75, color: 'rgba(217, 119, 6, 0.75)' },
          { pos: 1.0, color: 'rgba(217, 119, 6, 0)' }
        ]
      },
      botEdge: {
        color: 0x0284c7,
        hex: '#0284c7',
        opacity: 1.0,
        ribbonGrad: [
          { pos: 0.0, color: 'rgba(2, 132, 199, 0)' },
          { pos: 0.25, color: 'rgba(2, 132, 199, 0.85)' },
          { pos: 0.45, color: 'rgba(56, 189, 248, 0.95)' },
          { pos: 0.50, color: 'rgba(186, 230, 253, 1.0)' },
          { pos: 0.55, color: 'rgba(56, 189, 248, 0.95)' },
          { pos: 0.75, color: 'rgba(2, 132, 199, 0.85)' },
          { pos: 1.0, color: 'rgba(2, 132, 199, 0)' }
        ]
      },
      aura: {
        c1: '#0284c7', c1Rgba: 'rgba(2, 132, 199, 0.60)',
        c2: '#0ea5e9', c2Rgba: 'rgba(14, 165, 233, 0.75)',
        c3: '#38bdf8', c3Rgba: 'rgba(56, 189, 248, 0.85)',
        c4: '#7dd3fc', c4Stroke: '#38bdf8',
        fill: 'rgba(2, 132, 199, 0.15)'
      },
      floor: {
        bg: ['#c9e7f8', '#d8effa', '#e8f5fb', '#f2f8fd'],
        crossRgb: '2, 132, 199',
        ringsRgba: 'rgba(100, 116, 139, 0.18)'
      },
      motion: {
        stroke: '#94a3b8',
        opacity: 0.30
      },
      routes: {
        priority: { color: 0xd97706, ladder: 0xf59e0b },
        normal: { color: 0x0284c7, ladder: 0x38bdf8 }
      }
    },
    emerald: {
      name: 'emerald',
      label: '☀️ Light Mood',
      sceneBg: 0x020a04,
      ambient: { color: 0xffffff, intensity: 0.55 },
      key: { color: 0xffffff, intensity: 0.52 },
      rim: { color: 0x22c55e, intensity: 0.40 },
      underglow: { color: 0x0e7a00, intensity: 4.8 },
      side: { color: 0x143914, emissive: 0x0a220a, emissiveIntensity: 0.10 },
      topEdge: {
        color: 0xffffff,
        hex: '#ffffff',
        opacity: 0.55,
        coreWidth: 5.3,
        glowIntensity: 3.0,
        ribbonSpread: 0.06,
        ribbonGrad: [
          { pos: 0.0, color: 'rgba(255, 255, 255, 0)' },
          { pos: 0.25, color: 'rgba(255, 255, 255, 0.45)' },
          { pos: 0.45, color: 'rgba(255, 255, 255, 0.85)' },
          { pos: 0.50, color: 'rgba(255, 255, 255, 1.0)' },
          { pos: 0.55, color: 'rgba(255, 255, 255, 0.85)' },
          { pos: 0.75, color: 'rgba(255, 255, 255, 0.45)' },
          { pos: 1.0, color: 'rgba(255, 255, 255, 0)' }
        ]
      },
      botEdge: {
        color: 0x0e7a00,
        hex: '#0e7a00',
        opacity: 1.0,
        coreWidth: 3.8,
        glowIntensity: 1.5,
        ribbonSpread: 0.15,
        groundBloom: 1.0,
        ribbonGrad: [
          { pos: 0.0, color: 'rgba(14, 122, 0, 0)' },
          { pos: 0.25, color: 'rgba(14, 122, 0, 0.85)' },
          { pos: 0.45, color: 'rgba(34, 197, 94, 0.95)' },
          { pos: 0.50, color: 'rgba(134, 239, 172, 1.0)' },
          { pos: 0.55, color: 'rgba(34, 197, 94, 0.95)' },
          { pos: 0.75, color: 'rgba(14, 122, 0, 0.85)' },
          { pos: 1.0, color: 'rgba(14, 122, 0, 0)' }
        ]
      },
      aura: {
        c1: '#073b00', c1Rgba: 'rgba(7, 59, 0, 0.70)',
        c2: '#0e7a00', c2Rgba: 'rgba(14, 122, 0, 0.85)',
        c3: '#22c55e', c3Rgba: 'rgba(34, 197, 94, 0.95)',
        c4: '#86efac', c4Stroke: '#4ade80',
        fill: 'rgba(14, 122, 0, 0.22)'
      },
      floor: {
        bg: ['#041408', '#030f06', '#020a04', '#010502'],
        crossRgb: '34, 197, 94',
        ringsRgba: 'rgba(34, 197, 94, 0.12)'
      },
      motion: {
        stroke: '#22c55e',
        opacity: 0.25
      },
      routes: {
        priority: { color: 0xffffff, ladder: 0x86efac },
        normal: { color: 0x0e7a00, ladder: 0x4ade80 }
      },
      floorReflection: {
        reflectivity: 0.15,
        fresnelPower: 5.0
      },
      extrudeDepth: 1.7
    }
  };
  window.MAP_THEMES = THEMES;

  // Default Camera Poses
  const CAMERA_POSES = {
    isometric: {
      position: { x: 6, y: 20, z: 22 },
      target: { x: 0, y: 1.2, z: 0 }
    },
    topDown: {
      position: { x: 0, y: 52, z: 0.05 },
      target: { x: 0, y: 1.2, z: 0 }
    }
  };

  /**
   * Dynamically calculates optimal top-down camera height so the entire island
   * of Sri Lanka (from Jaffna/Delft to Galle/Dondra) is fully visible regardless
   * of the viewport aspect ratio.
   */
  function get2DCameraDistance() {
    const container = mapState.domElements.container;
    const aspect = container ? (container.clientWidth / Math.max(container.clientHeight, 1)) : 1.77;
    // Sri Lanka dimensions in 3D scene: Z-span is 30.1 units (-15.05 to +15.05), X-span is 17.2 units (-8.8 to +8.5)
    // Target visible area with comfortable 20% margin
    const targetVisibleHeight = 36.0;
    const targetVisibleWidth = 22.0;
    const requiredH = Math.max(targetVisibleHeight, targetVisibleWidth / Math.max(aspect, 0.1));
    const fovHalfRad = THREE.MathUtils.degToRad((mapState.camera ? mapState.camera.fov : 40) / 2);
    return Math.max(50.0, (requiredH / 2) / Math.tan(fovHalfRad));
  }

  // Tactical Navigation & Viewport Constraints (Limits navigation to prevent user disorientation)
  const NAV_LIMITS = {
    '3d': {
      minDistance: 8.0,             // Close enough for rich details on islands
      maxDistance: 45.0,            // Keeps Sri Lanka prominently framed
      minPolarAngle: Math.PI / 5.2, // ~34.6°: Prevents disorienting flip directly overhead
      maxPolarAngle: Math.PI / 2.35,// ~76.6°: Prevents dipping flat onto horizon or below floor
      minAzimuthAngle: -1.05,       // ~ -60.1°: Allows viewing West/Northwest (Mannar, Delft, Jaffna)
      maxAzimuthAngle: 1.45,        // ~ +83.0°: Allows viewing East/Southeast (Yala, Trincomalee)
      panBounds: { minX: -9.5, maxX: 9.0, minY: 0.8, maxY: 2.5, minZ: -16.0, maxZ: 16.0 }
    },
    '2d': {
      minDistance: 8.0,             // Deep zoom into any city/route like a 2D canvas
      maxDistance: 85.0,            // Zoom out past full island view
      minPolarAngle: 0.001,         // Strict lock: directly overhead, no tilt
      maxPolarAngle: 0.001,         // Strict lock: directly overhead, no tilt
      minAzimuthAngle: 0.0,         // Strict lock: True North is locked at 12 o'clock, zero rotation
      maxAzimuthAngle: 0.0,         // Strict lock: True North is locked at 12 o'clock, zero rotation
      panBounds: { minX: -14.0, maxX: 14.0, minY: 0.8, maxY: 2.0, minZ: -18.0, maxZ: 18.0 }
    }
  };

  function applyNavigationLimits(is2D) {
    if (!mapState.controls) return;
    const cfg = is2D ? NAV_LIMITS['2d'] : NAV_LIMITS['3d'];
    mapState.controls.minDistance = cfg.minDistance;
    mapState.controls.maxDistance = cfg.maxDistance;
    mapState.controls.minPolarAngle = cfg.minPolarAngle;
    mapState.controls.maxPolarAngle = cfg.maxPolarAngle;
    mapState.controls.minAzimuthAngle = cfg.minAzimuthAngle;
    mapState.controls.maxAzimuthAngle = cfg.maxAzimuthAngle;

    if (is2D) {
      // 2D Canvas Mode: Disable 3D tilt/rotation, left-drag pans like a 2D canvas
      mapState.controls.enableRotate = false;
      mapState.controls.minAzimuthAngle = 0.0;
      mapState.controls.maxAzimuthAngle = 0.0;
      mapState.controls.minPolarAngle = 0.001;
      mapState.controls.maxPolarAngle = 0.001;
      mapState.controls.mouseButtons = {
        LEFT: THREE.MOUSE.PAN,
        MIDDLE: THREE.MOUSE.DOLLY,
        RIGHT: THREE.MOUSE.PAN
      };
      mapState.controls.touches = {
        ONE: THREE.TOUCH.PAN,
        TWO: THREE.TOUCH.DOLLY_PAN
      };
    } else {
      // 3D Perspective Mode: Left-drag rotates/orbits, right-drag pans
      mapState.controls.enableRotate = true;
      mapState.controls.mouseButtons = {
        LEFT: THREE.MOUSE.ROTATE,
        MIDDLE: THREE.MOUSE.DOLLY,
        RIGHT: THREE.MOUSE.PAN
      };
      mapState.controls.touches = {
        ONE: THREE.TOUCH.ROTATE,
        TWO: THREE.TOUCH.DOLLY_PAN
      };
    }
  }

  /**
   * Dynamically updates the top-right interaction controls hint for 2D vs 3D mode
   */
  function updateInteractionHint(is2D) {
    const hintContainer = document.querySelector('.map-interaction-hint');
    if (!hintContainer) return;

    if (is2D) {
      hintContainer.innerHTML = `
        <div class="hint-item">
          <svg class="hint-icon" viewBox="0 0 32 32" fill="none" aria-hidden="true">
            <circle class="hint-ring" cx="16" cy="16" r="14" stroke="currentColor" stroke-width="2.4"/>
            <path class="hint-mouse-palm" d="M 8 15 h 16 v 3.5 a 8 8 0 0 1 -16 0 Z" fill="#64748b"/>
            <path class="hint-mouse-btn-active" d="M 8 14 V 11 A 7 7 0 0 1 14.8 5.2 V 14 Z" fill="#ef4444"/>
            <path class="hint-mouse-btn-inactive" d="M 17.2 14 V 5.2 A 7 7 0 0 1 24 11 V 14 Z" fill="#cbd5e1"/>
            <rect class="hint-mouse-wheel" x="14.3" y="6.8" width="3.4" height="6.8" rx="1.7" fill="#ffffff" stroke="#64748b" stroke-width="0.8"/>
          </svg>
          <span>Left-Drag: Pan</span>
        </div>
        <div class="hint-sep"></div>
        <div class="hint-item">
          <svg class="hint-icon" viewBox="0 0 32 32" fill="none" aria-hidden="true">
            <circle class="hint-ring" cx="16" cy="16" r="14" stroke="currentColor" stroke-width="2.4"/>
            <path class="hint-mouse-palm" d="M 8 15 h 16 v 3.5 a 8 8 0 0 1 -16 0 Z" fill="#64748b"/>
            <path class="hint-mouse-btn-inactive" d="M 8 14 V 11 A 7 7 0 0 1 14.8 5.2 V 14 Z" fill="#cbd5e1"/>
            <path class="hint-mouse-btn-inactive" d="M 17.2 14 V 5.2 A 7 7 0 0 1 24 11 V 14 Z" fill="#cbd5e1"/>
            <rect class="hint-mouse-wheel-active" x="14.3" y="6.8" width="3.4" height="6.8" rx="1.7" fill="#0284c7"/>
          </svg>
          <span>Scroll: Zoom</span>
        </div>
      `;
    } else {
      hintContainer.innerHTML = `
        <div class="hint-item">
          <svg class="hint-icon" viewBox="0 0 32 32" fill="none" aria-hidden="true">
            <circle class="hint-ring" cx="16" cy="16" r="14" stroke="currentColor" stroke-width="2.4"/>
            <path class="hint-mouse-palm" d="M 8 15 h 16 v 3.5 a 8 8 0 0 1 -16 0 Z" fill="#64748b"/>
            <path class="hint-mouse-btn-active" d="M 8 14 V 11 A 7 7 0 0 1 14.8 5.2 V 14 Z" fill="#ef4444"/>
            <path class="hint-mouse-btn-inactive" d="M 17.2 14 V 5.2 A 7 7 0 0 1 24 11 V 14 Z" fill="#cbd5e1"/>
            <rect class="hint-mouse-wheel" x="14.3" y="6.8" width="3.4" height="6.8" rx="1.7" fill="#ffffff" stroke="#64748b" stroke-width="0.8"/>
          </svg>
          <span>Left-Drag: Orbit 3D</span>
        </div>
        <div class="hint-sep"></div>
        <div class="hint-item">
          <svg class="hint-icon" viewBox="0 0 32 32" fill="none" aria-hidden="true">
            <circle class="hint-ring" cx="16" cy="16" r="14" stroke="currentColor" stroke-width="2.4"/>
            <path class="hint-mouse-palm" d="M 8 15 h 16 v 3.5 a 8 8 0 0 1 -16 0 Z" fill="#64748b"/>
            <path class="hint-mouse-btn-inactive" d="M 8 14 V 11 A 7 7 0 0 1 14.8 5.2 V 14 Z" fill="#cbd5e1"/>
            <path class="hint-mouse-btn-active" d="M 17.2 14 V 5.2 A 7 7 0 0 1 24 11 V 14 Z" fill="#ef4444"/>
            <rect class="hint-mouse-wheel" x="14.3" y="6.8" width="3.4" height="6.8" rx="1.7" fill="#ffffff" stroke="#64748b" stroke-width="0.8"/>
          </svg>
          <span>Right-Drag: Pan</span>
        </div>
        <div class="hint-sep"></div>
        <div class="hint-item">
          <svg class="hint-icon" viewBox="0 0 32 32" fill="none" aria-hidden="true">
            <circle class="hint-ring" cx="16" cy="16" r="14" stroke="currentColor" stroke-width="2.4"/>
            <path class="hint-mouse-palm" d="M 8 15 h 16 v 3.5 a 8 8 0 0 1 -16 0 Z" fill="#64748b"/>
            <path class="hint-mouse-btn-inactive" d="M 8 14 V 11 A 7 7 0 0 1 14.8 5.2 V 14 Z" fill="#cbd5e1"/>
            <path class="hint-mouse-btn-inactive" d="M 17.2 14 V 5.2 A 7 7 0 0 1 24 11 V 14 Z" fill="#cbd5e1"/>
            <rect class="hint-mouse-wheel-active" x="14.3" y="6.8" width="3.4" height="6.8" rx="1.7" fill="#0284c7"/>
          </svg>
          <span>Scroll: Zoom</span>
        </div>
      `;
    }
  }

  // Marker Billboard Cache: { id: { element: HTMLElement, worldPos: THREE.Vector3, data: Object } }
  const markerBillboards = [];

  document.addEventListener('DOMContentLoaded', () => {
    // Initialize map when DOM is ready
    init3DMap();
  });

  function init3DMap() {
    const container = document.getElementById('map-3d-canvas-container');
    if (!container || !window.THREE || !window.SRI_LANKA_GEO) {
      console.warn('Map container, THREE or SRI_LANKA_GEO not ready yet.');
      return;
    }

    // Cache HUD DOM Elements
    mapState.domElements = {
      container,
      overlay: document.getElementById('map-markers-overlay'),
      tooltip: document.getElementById('map-destination-tooltip'),
      routeFilter: document.getElementById('map-route-filter'),
      btnLayerToggle: document.getElementById('map-btn-layer-toggle'),
      btnAutoRotate: document.getElementById('map-btn-autorotate'),
      btnViewToggle: document.getElementById('map-btn-view-toggle'),
      btnResetView: document.getElementById('map-btn-reset-view'),
      btnZoomIn: document.getElementById('map-btn-zoom-in'),
      btnZoomOut: document.getElementById('map-btn-zoom-out')
    };

    // 1. Scene Setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x040810);
    scene.fog = null; // No distance fog: ensures map remains 100% crisp, bright, and vibrant when zooming out
    mapState.scene = scene;

    // 2. Camera Setup
    const aspect = container.clientWidth / container.clientHeight;
    const camera = new THREE.PerspectiveCamera(40, aspect, 1.0, 300);
    camera.position.set(
      CAMERA_POSES.isometric.position.x,
      CAMERA_POSES.isometric.position.y,
      CAMERA_POSES.isometric.position.z
    );
    mapState.camera = camera;

    // 3. WebGL Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
      logarithmicDepthBuffer: true
    });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.12;
    container.appendChild(renderer.domElement);
    mapState.renderer = renderer;

    // 4. OrbitControls with Tactical Constraints
    const controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.rotateSpeed = 0.80;
    controls.zoomSpeed = 0.85;
    controls.panSpeed = 0.85;
    controls.target.set(0, 1.2, 0);
    mapState.controls = controls;
    applyNavigationLimits(false);
    controls.update();

    // 5. Lighting Setup (Tactical Cyber Ambience)
    setupLighting(scene);

    // 6. Holographic Radar Ground Floor
    createHolographicRadarFloor(scene);

    // 6b. Rotating Sci-Fi Motion Graphic Rings (media_1789756231614.png & media_1789756247843.png)
    createMotionGraphicRings(scene);

    // 7. 3D Extruded Sri Lanka Landmass
    createExtrudedSriLanka(scene);

    // 8. Glowing Expressway Routes (Corridors)
    createExpresswayRoutes(scene);

    // 9. Floating 3D Location Markers & Billboards
    createLocationMarkers(scene);

    // 9b. 25 Official Administrative Districts Weather & Monsoon Overlay
    createWeatherDistrictOverlay(scene);

    // 9c. Dynamic Monsoon Rainfall Particle System
    createRainfallParticleSystem(scene);

    // 9e. Initialize Weather for Current Arrival Date (August default)
    updateWeatherForDate(window.currentArrivalDate || '2026-08-27');

    // 10. HUD Controls & Listeners
    setupHUDEventListeners();

    // 10b. Initialize active mood ('light')
    setMapMood('light');

    // 10c. Initial sync of itinerary road routes if appState already has assigned destinations
    if (window.appState && window.appState.dayDestinations) {
      updateItineraryRoutes(window.appState.dayDestinations);
    }

    // 11. Window & Container Resize Handlers
    window.addEventListener('resize', onWindowResize);
    if (window.ResizeObserver && container) {
      const resizeObserver = new ResizeObserver(() => {
        onWindowResize();
      });
      resizeObserver.observe(container);
    }

    // 12. Start Render Loop
    mapState.isInitialized = true;
    requestAnimationFrame(animate);
  }

  /**
   * Sets up lighting for the tactical cyber look in media_1789747625578.png
   */
  function setupLighting(scene) {
    // Ambient soft daylight keeping terrain relief crisp and rich without washout
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.58);
    scene.add(ambientLight);
    mapState.ambientLight = ambientLight;

    // Key directional light from top-front - balanced illumination matching reference
    const keyLight = new THREE.DirectionalLight(0xffffff, 0.52);
    keyLight.position.set(12, 38, 20);
    scene.add(keyLight);
    mapState.keyLight = keyLight;

    // Soft rim light highlighting landmass contours
    const rimLight = new THREE.DirectionalLight(0x29a9e2, 0.35);
    rimLight.position.set(-20, 25, -20);
    scene.add(rimLight);
    mapState.rimLight = rimLight;

    // Island underglow point light (illuminating bottom edges with Sunbird royal azure blue #1f75b9)
    const underglowLight = new THREE.PointLight(0x1f75b9, 4.5, 45);
    underglowLight.position.set(0, -0.2, 0);
    scene.add(underglowLight);
    mapState.underglowLight = underglowLight;
  }

  /**
   * Renders the holographic ocean floor canvas with radial gradient, crosses, and range rings
   */
  function drawFloorTexture(theme) {
    const canvas = mapState.floorCanvas;
    const ctx = mapState.floorCtx;
    if (!canvas || !ctx) return;
    const size = canvas.width;
    const cx = size / 2;
    const cy = size / 2;

    ctx.clearRect(0, 0, size, size);

    // 1. Oceanic background radial gradient
    const bgGrad = ctx.createRadialGradient(cx, cy, 50, cx, cy, cx);
    const stops = [0, 0.45, 0.85, 1.0];
    theme.floor.bg.forEach((col, idx) => {
      bgGrad.addColorStop(stops[idx] !== undefined ? stops[idx] : idx / (theme.floor.bg.length - 1), col);
    });
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, size, size);

    // 2. Tactical "X" Cross Grid Pattern (with radial distance fade from island center)
    ctx.lineWidth = 1.0;
    const spacing = 36;
    const arm = 3.2;
    const innerRadius = 160;
    const outerRadius = 920;

    for (let y = 0; y <= size + spacing; y += spacing / 2) {
      const row = Math.round(y / (spacing / 2));
      const xOffset = (row % 2 === 1) ? (spacing / 2) : 0;
      for (let x = xOffset; x <= size + spacing; x += spacing) {
        const dist = Math.hypot(x - cx, y - cy);
        if (dist >= outerRadius) continue;

        // Smoothstep falloff as distance from island/middle increases
        let fade = 1.0;
        if (dist > innerRadius) {
          const t = (dist - innerRadius) / (outerRadius - innerRadius);
          fade = 1.0 - (t * t * (3.0 - 2.0 * t));
        }

        const alpha = 0.22 * fade;
        if (alpha < 0.004) continue;

        ctx.strokeStyle = `rgba(${theme.floor.crossRgb}, ${alpha.toFixed(3)})`;
        ctx.beginPath();
        ctx.moveTo(x - arm, y - arm);
        ctx.lineTo(x + arm, y + arm);
        ctx.moveTo(x - arm, y + arm);
        ctx.lineTo(x + arm, y - arm);
        ctx.stroke();
      }
    }

    // Helper: Draw radar circle
    function drawCircle(radius, strokeStyle, lineWidth, dash = []) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.strokeStyle = strokeStyle;
      ctx.lineWidth = lineWidth;
      ctx.setLineDash(dash);
      ctx.stroke();
      ctx.restore();
    }

    // 3. Subtle low-contrast range rings
    drawCircle(380, theme.floor.ringsRgba, 1.0);
    drawCircle(720, theme.floor.ringsRgba, 1.0, [8, 12]);
    drawCircle(960, theme.floor.ringsRgba, 1.0);

    if (mapState.floorTexture) {
      mapState.floorTexture.needsUpdate = true;
    }
  }

  /**
   * Creates the dark ocean plane with holographic radar rings, ticks, and compass arcs.
   */
  function createHolographicRadarFloor(scene) {
    const radarGroup = new THREE.Group();

    // Generate high-res procedural radar canvas
    const size = 2048;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    mapState.floorCanvas = canvas;
    mapState.floorCtx = ctx;

    // Draw initial floor texture according to current mood
    const initialTheme = THEMES[mapState.currentMood] || THEMES.light;
    drawFloorTexture(initialTheme);

    const texture = new THREE.CanvasTexture(canvas);
    texture.generateMipmaps = true;
    mapState.floorTexture = texture;

    // Extended floor geometry (240x240) spanning seamlessly to horizon on extreme zoom-out
    const floorGeo = new THREE.PlaneGeometry(240, 240);

    let floorMesh;
    if (typeof THREE.Reflector === 'function') {
      floorMesh = new THREE.Reflector(floorGeo, {
        clipBias: 0.003,
        textureWidth: 1024,
        textureHeight: 1024,
        tRadar: texture,
        reflectivity: 0.15,
        fresnelPower: 5.0,
        depthWrite: false
      });
      floorMesh.name = 'radarWaterReflector';
      mapState.reflector = floorMesh;
      mapState.reflectorMaterial = floorMesh.material;
    } else {
      const floorMat = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: false,
        depthWrite: false
      });
      floorMesh = new THREE.Mesh(floorGeo, floorMat);
    }

    floorMesh.rotation.x = -Math.PI / 2;
    floorMesh.position.y = -0.05;
    radarGroup.add(floorMesh);
    mapState.floorMesh = floorMesh;

    scene.add(radarGroup);
    mapState.radarGroup = radarGroup;
  }

  /**
   * Creates the rotating tactical motion graphic rings in the background ocean floor
   * Faithfully reproduces the exact segmented circle shape from media_1789756231614.png
  /**
   * Continuous Motion Graphic Rotating Ring in the background floor
   * Matching exact shape and ash color from user reference media_1789756231614.png
   * Pure matte ash gray (#abacac), NO luminous glow, smooth continuous rotation
   */
  /**
   * Renders the rotating segmented motion graphic ring canvas
   */
  function drawMotionRingTexture(theme) {
    const canvas = mapState.primaryMotionCanvas;
    const ctx = mapState.primaryMotionCtx;
    if (!canvas || !ctx) return;
    const size = canvas.width;
    const cx = size / 2;
    const cy = size / 2;
    const rMid = 760;
    const thickness = 28;

    const segments = [
      { startDeg: 307, spanDeg: 80 },
      { startDeg: 37,  spanDeg: 36 },
      { startDeg: 79,  spanDeg: 38 },
      { startDeg: 127, spanDeg: 80 },
      { startDeg: 217, spanDeg: 80 }
    ];

    ctx.clearRect(0, 0, size, size);
    ctx.save();
    ctx.lineWidth = thickness;
    ctx.strokeStyle = theme.motion.stroke;
    ctx.lineCap = 'butt';
    segments.forEach((seg) => {
      const startAngle = ((((seg.startDeg - 90) % 360) + 360) % 360) * Math.PI / 180;
      const endAngle = startAngle + (seg.spanDeg * Math.PI / 180);
      ctx.beginPath();
      ctx.arc(cx, cy, rMid, startAngle, endAngle, false);
      ctx.stroke();
    });
    ctx.restore();

    if (mapState.primaryMotionMat) {
      mapState.primaryMotionMat.opacity = theme.motion.opacity;
    }
    if (mapState.primaryMotionTexture) {
      mapState.primaryMotionTexture.needsUpdate = true;
    }
  }

  function createMotionGraphicRings(scene) {
    const motionGroup = new THREE.Group();
    motionGroup.rotation.x = -Math.PI / 2;
    motionGroup.position.set(0, 0.035, 0);

    // 1. PRIMARY SEGMENTED RING
    const primaryCanvas = document.createElement('canvas');
    const size = 2048;
    primaryCanvas.width = size;
    primaryCanvas.height = size;
    const ctx = primaryCanvas.getContext('2d');

    mapState.primaryMotionCanvas = primaryCanvas;
    mapState.primaryMotionCtx = ctx;

    const initialTheme = THEMES[mapState.currentMood] || THEMES.light;
    drawMotionRingTexture(initialTheme);

    const primaryTexture = new THREE.CanvasTexture(primaryCanvas);
    primaryTexture.generateMipmaps = true;
    mapState.primaryMotionTexture = primaryTexture;

    // Compact scale (32.5x32.5) making the ring smaller than Sri Lanka's 30-unit length
    const primaryGeo = new THREE.PlaneGeometry(32.5, 32.5);
    const primaryMat = new THREE.MeshBasicMaterial({
      map: primaryTexture,
      transparent: true,
      blending: THREE.NormalBlending,
      opacity: initialTheme.motion.opacity,
      depthWrite: false
    });
    const primaryMesh = new THREE.Mesh(primaryGeo, primaryMat);
    motionGroup.add(primaryMesh);
    mapState.primaryMotionRing = primaryMesh;
    mapState.primaryMotionMat = primaryMat;
    mapState.secondaryMotionRing = null;
    mapState.innerMotionRing = null;

    scene.add(motionGroup);
    mapState.motionGroup = motionGroup;
  }

  /**
   * Generates high-detail satellite/GIS relief map texture for the top face
   * matching the dark tactical map texture in media_1789747625578.png
   */
  function generateIslandTopTexture() {
    const size = 2048;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    // 1. Base dark cyber topography
    const grad = ctx.createLinearGradient(0, 0, size, size);
    grad.addColorStop(0, '#0a1d2e');
    grad.addColorStop(0.35, '#102b40');
    grad.addColorStop(0.65, '#14344d');
    grad.addColorStop(1, '#0c2235');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);

    // 2. Central Highlands mountainous mass elevation tint (green-tinted peaks)
    const mountainGrad = ctx.createRadialGradient(size * 0.48, size * 0.65, 30, size * 0.48, size * 0.65, 320);
    mountainGrad.addColorStop(0, 'rgba(22, 78, 55, 0.65)');
    mountainGrad.addColorStop(0.4, 'rgba(15, 60, 48, 0.45)');
    mountainGrad.addColorStop(0.8, 'rgba(10, 40, 40, 0.15)');
    mountainGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = mountainGrad;
    ctx.beginPath();
    ctx.arc(size * 0.48, size * 0.65, 320, 0, Math.PI * 2);
    ctx.fill();

    // 3. Elevation contour lines across the island
    ctx.lineWidth = 1.4;
    for (let r = 70; r < 950; r += 40) {
      ctx.beginPath();
      ctx.arc(size * 0.48, size * 0.62, r, 0, Math.PI * 2);
      ctx.strokeStyle = (r % 120 === 0) ? 'rgba(0, 255, 170, 0.16)' : 'rgba(56, 189, 248, 0.08)';
      ctx.stroke();
    }

    // 4. Detailed River Systems & Inland Reservoirs (Sri Lanka Tanks / Wewas)
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.55)';
    ctx.lineWidth = 2.5;

    // Mahaweli Ganga River to Koddiyar Bay Trincomalee
    ctx.beginPath();
    ctx.moveTo(size * 0.48, size * 0.62);
    ctx.bezierCurveTo(size * 0.56, size * 0.52, size * 0.62, size * 0.42, size * 0.74, size * 0.32);
    ctx.stroke();

    // Kelani Ganga River to Colombo
    ctx.beginPath();
    ctx.moveTo(size * 0.46, size * 0.66);
    ctx.bezierCurveTo(size * 0.38, size * 0.67, size * 0.30, size * 0.68, size * 0.24, size * 0.70);
    ctx.stroke();

    // Kalu Ganga River
    ctx.beginPath();
    ctx.moveTo(size * 0.45, size * 0.70);
    ctx.bezierCurveTo(size * 0.38, size * 0.72, size * 0.32, size * 0.75, size * 0.26, size * 0.78);
    ctx.stroke();

    // Water Reservoirs (Parakrama Samudra, Victoria, Minneriya)
    function drawLake(x, y, w, h) {
      ctx.fillStyle = 'rgba(56, 189, 248, 0.65)';
      ctx.beginPath();
      ctx.ellipse(x, y, w, h, Math.PI / 4, 0, Math.PI * 2);
      ctx.fill();
    }
    drawLake(size * 0.58, size * 0.46, 18, 10); // Parakrama Samudra
    drawLake(size * 0.54, size * 0.42, 14, 8);  // Minneriya
    drawLake(size * 0.50, size * 0.63, 16, 9);  // Victoria
    drawLake(size * 0.38, size * 0.38, 18, 12); // Anuradhapura Nuwara Wewa

    // 5. Dense Satellite Street Capillary Networks (High Contrast White/Cyan Roads)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
    ctx.lineWidth = 1.0;
    // Major radial road webs around Colombo & Kandy
    function drawRoadWeb(cx, cy, count, maxDist) {
      for (let i = 0; i < count; i++) {
        const ang = (i / count) * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        const dist = maxDist * (0.6 + Math.random() * 0.5);
        ctx.lineTo(cx + Math.cos(ang) * dist, cy + Math.sin(ang) * dist);
        ctx.stroke();
      }
    }
    drawRoadWeb(size * 0.25, size * 0.69, 16, 140); // Colombo Web
    drawRoadWeb(size * 0.48, size * 0.62, 12, 110); // Kandy Web
    drawRoadWeb(size * 0.31, size * 0.89, 10, 80);  // Galle Web
    drawRoadWeb(size * 0.30, size * 0.15, 10, 90);  // Jaffna Web

    // 6. Urban City Node Clusters (Colombo, Kandy, Galle, Jaffna, Trinco)
    function drawCityCluster(x, y, radius, color) {
      const cgrad = ctx.createRadialGradient(x, y, 2, x, y, radius);
      cgrad.addColorStop(0, color);
      cgrad.addColorStop(0.35, color.replace('1)', '0.45)'));
      cgrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = cgrad;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();

      // Core bright light dot
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    drawCityCluster(size * 0.25, size * 0.69, 75, 'rgba(0, 255, 170, 0.65)'); // Colombo Metro
    drawCityCluster(size * 0.48, size * 0.62, 55, 'rgba(56, 189, 248, 0.55)'); // Kandy Basin
    drawCityCluster(size * 0.31, size * 0.89, 45, 'rgba(0, 255, 170, 0.50)'); // Galle Fort
    drawCityCluster(size * 0.30, size * 0.15, 50, 'rgba(168, 85, 247, 0.55)'); // Jaffna
    drawCityCluster(size * 0.54, size * 0.44, 48, 'rgba(0, 255, 170, 0.50)'); // Cultural Triangle
    drawCityCluster(size * 0.74, size * 0.32, 45, 'rgba(56, 189, 248, 0.50)'); // Trincomalee

    // Stippled cyber urban dots
    ctx.fillStyle = 'rgba(255, 255, 255, 0.28)';
    for (let i = 0; i < 280; i++) {
      const rx = (Math.random() * 0.5 + 0.25) * size;
      const ry = (Math.random() * 0.75 + 0.15) * size;
      ctx.fillRect(rx, ry, 1.5, 1.5);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.generateMipmaps = true;
    return texture;
  }

  /**
   * Creates the 3D extruded Sri Lanka island matching media_1789747625578.png
   * with clean glowing green neon borders and depth extrusion.
   */
  function createExtrudedSriLanka(scene) {
    const islandGroup = new THREE.Group();
    // Rotate island group slightly for the signature dramatic isometric orientation
    islandGroup.rotation.y = -0.18;

    const geo = window.SRI_LANKA_GEO;
    const pts = geo.boundary;

    // 1. Build THREE.Shape from main island 757 boundary points + all sub-islands
    const mainShape = new THREE.Shape();
    mainShape.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) {
      mainShape.lineTo(pts[i][0], pts[i][1]);
    }
    mainShape.closePath();

    const allShapes = [mainShape];
    if (geo.islands && Array.isArray(geo.islands)) {
      geo.islands.forEach((isl) => {
        if (isl.points && isl.points.length > 2) {
          const islShape = new THREE.Shape();
          islShape.moveTo(isl.points[0][0], isl.points[0][1]);
          for (let j = 1; j < isl.points.length; j++) {
            islShape.lineTo(isl.points[j][0], isl.points[j][1]);
          }
          islShape.closePath();
          allShapes.push(islShape);
        }
      });
    }

    // 2. Extrude Geometry (Height: 2.2 units, sheer vertical walls matching media_1789789500210.png)
    const extrudeSettings = {
      depth: 2.2,
      bevelEnabled: false
    };
    const geometry = new THREE.ExtrudeGeometry(allShapes, extrudeSettings);

    // 2b. Precise Geographic UV Mapping for Top Surface:
    // Maps every vertex on the 3D model to its exact geographic pixel in the high-res terrain texture!
    const posAttr = geometry.attributes.position;
    const uvAttr = geometry.attributes.uv;

    const tl_lon = 79.453125;
    const lonRange = 82.265625 - 79.453125;
    const mercTop = 0.17794178;
    const mercBot = 0.09817477;
    const mercRange = mercTop - mercBot;
    const centerLon = 80.79355;
    const centerLat = 7.87665;
    const scale = 7.68;

    for (let i = 0; i < posAttr.count; i++) {
      const x = posAttr.getX(i);
      const y = posAttr.getY(i);
      const z = posAttr.getZ(i);

      // Map UVs for top surface (z > 2.0)
      if (z > 2.0) {
        const lon = x / scale + centerLon;
        const lat = y / scale + centerLat;
        const u = (lon - tl_lon) / lonRange;
        const latRad = (lat * Math.PI) / 180.0;
        const mercY = Math.log(Math.tan(Math.PI / 4.0 + latRad / 2.0));
        const v = (mercY - mercBot) / mercRange;
        uvAttr.setXY(i, u, v);
      }
    }
    uvAttr.needsUpdate = true;

    // 3. Load High-Resolution Real Terrain Texture (Google Maps Terrain)
    const terrainSrc = (window.MAP_TEXTURES && window.MAP_TEXTURES.terrain) ? window.MAP_TEXTURES.terrain : 'assets/sri_lanka_tactical_terrain.jpg';
    const satelliteSrc = (window.MAP_TEXTURES && window.MAP_TEXTURES.satellite) ? window.MAP_TEXTURES.satellite : 'assets/sri_lanka_satellite.jpg';

    const textureLoader = new THREE.TextureLoader();
    const terrainTexture = textureLoader.load(terrainSrc, (tex) => {
      tex.generateMipmaps = true;
      tex.minFilter = THREE.LinearMipmapLinearFilter;
      tex.magFilter = THREE.LinearFilter;
      tex.anisotropy = 16;
      tex.needsUpdate = true;
      if (topMaterial) topMaterial.needsUpdate = true;
    });

    const satelliteTexture = textureLoader.load(satelliteSrc, (tex) => {
      tex.generateMipmaps = true;
      tex.minFilter = THREE.LinearMipmapLinearFilter;
      tex.magFilter = THREE.LinearFilter;
      tex.anisotropy = 16;
      tex.needsUpdate = true;
    });

    mapState.textures = {
      terrain: terrainTexture,
      satellite: satelliteTexture
    };

    const topMaterial = new THREE.MeshStandardMaterial({
      map: terrainTexture,
      roughness: 0.55,
      metalness: 0.04,
      polygonOffset: true,
      polygonOffsetFactor: 1,
      polygonOffsetUnits: 1
    });
    mapState.topMaterial = topMaterial;

    // Side walls: deep midnight navy cliff walls matching Sunbird brand palette
    const sideMaterial = new THREE.MeshStandardMaterial({
      color: 0x0b192e,
      roughness: 0.60,
      metalness: 0.15,
      emissive: 0x0e2240,
      emissiveIntensity: 0.15,
      polygonOffset: true,
      polygonOffsetFactor: 1,
      polygonOffsetUnits: 1
    });

    const islandMesh = new THREE.Mesh(geometry, [topMaterial, sideMaterial]);
    islandMesh.rotation.x = -Math.PI / 2;
    islandMesh.position.y = 0;
    islandMesh.scale.z = 1.7 / 2.20;
    islandGroup.add(islandMesh);
    mapState.islandMesh = islandMesh;

    // Precompute 2D outward unit normals for all 757 boundary vertices (in world X, Z coordinates)
    // Physically decoupling outlines from cliff walls eliminates Z-fighting flickering during navigation
    const N = pts.length;
    const normals = [];
    for (let i = 0; i < N; i++) {
      const prev = pts[(i - 1 + N) % N];
      const next = pts[(i + 1) % N];
      const tx = next[0] - prev[0];
      const ty = next[1] - prev[1];
      const len = Math.hypot(tx, ty) || 1;
      // Outward unit normal in world (X, Z) space
      normals.push({ nx: -ty / len, nz: -tx / len });
    }

    // 4. CONTOUR-ALIGNED PROCEDURAL GROUND GLOW CANVAS
    const auraCanvas = document.createElement('canvas');
    const auraSize = 2048;
    auraCanvas.width = auraSize;
    auraCanvas.height = auraSize;
    const actx = auraCanvas.getContext('2d');
    const auraSpan = 52;

    mapState.pts = pts;
    mapState.normals = normals;
    mapState.auraCanvas = auraCanvas;
    mapState.auraCtx = actx;

    const initialTheme = THEMES[mapState.currentMood] || THEMES.light;
    drawAuraTexture(initialTheme);

    const groundAuraTex = new THREE.CanvasTexture(auraCanvas);
    groundAuraTex.generateMipmaps = true;
    mapState.groundAuraTex = groundAuraTex;

    const groundAuraGeo = new THREE.PlaneGeometry(auraSpan, auraSpan);
    const groundAuraMat = new THREE.MeshBasicMaterial({
      map: groundAuraTex,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    const groundAuraMesh = new THREE.Mesh(groundAuraGeo, groundAuraMat);
    groundAuraMesh.name = 'groundAura';
    groundAuraMesh.rotation.x = -Math.PI / 2;
    groundAuraMesh.position.set(0, 0.025, 0);
    islandGroup.add(groundAuraMesh);
    mapState.groundAuraMesh = groundAuraMesh;

    // Helper: Procedural Vertical Neon Ribbon Mesh along coastline perimeter with outward normal offset
    function createRibbonMesh(pts, normals, yBottom, yTop, offsetDist, colorGrad) {
      const ribbonCanvas = document.createElement('canvas');
      ribbonCanvas.width = 32;
      ribbonCanvas.height = 256;
      const rctx = ribbonCanvas.getContext('2d');
      const grad = rctx.createLinearGradient(0, 0, 0, 256);
      colorGrad.forEach(stop => grad.addColorStop(stop.pos, stop.color));
      rctx.fillStyle = grad;
      rctx.fillRect(0, 0, 32, 256);

      const ribbonTex = new THREE.CanvasTexture(ribbonCanvas);
      const count = pts.length;
      const positions = [];
      const uvs = [];
      const indices = [];

      for (let i = 0; i < count; i++) {
        const p = pts[i];
        const n = normals[i];
        // Physically offset outward by offsetDist away from cliff wall
        const x = p[0] + n.nx * offsetDist;
        const z = -p[1] + n.nz * offsetDist;
        const u = i / (count - 1);
        positions.push(x, yBottom, z);
        uvs.push(u, 1);
        positions.push(x, yTop, z);
        uvs.push(u, 0);
      }

      for (let i = 0; i < count; i++) {
        const next = (i + 1) % count;
        const b1 = i * 2;
        const t1 = i * 2 + 1;
        const b2 = next * 2;
        const t2 = next * 2 + 1;
        indices.push(b1, b2, t1);
        indices.push(t1, b2, t2);
      }

      const geom = new THREE.BufferGeometry();
      geom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      geom.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
      geom.setIndex(indices);
      geom.computeVertexNormals();

      const mat = new THREE.MeshBasicMaterial({
        map: ribbonTex,
        transparent: true,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
        depthWrite: false,
        polygonOffset: true,
        polygonOffsetFactor: -3,
        polygonOffsetUnits: -3
      });
      const mesh = new THREE.Mesh(geom, mat);
      mesh.name = 'glowRibbon';
      mesh.userData.ribbonCanvas = ribbonCanvas;
      mesh.userData.rctx = rctx;
      mesh.userData.ribbonTex = ribbonTex;
      mesh.userData.pts = pts;
      mesh.userData.normals = normals;
      mesh.userData.offsetDist = offsetDist;
      mesh.userData.yBottom = yBottom;
      mesh.userData.yTop = yTop;
      return mesh;
    }

    // 5. GLOWING BOTTOM EDGE (Sunbird Cerulean Blue #29a9e2 & Royal Azure #1f75b9)
    // Vertical cerulean ribbon (y: 0.01 to 0.16) offset 0.035 outward + vibrant baseline loop at y = 0.06 (#29a9e2)
    const botRibbonGrad = initialTheme.botEdge.ribbonGrad;
    const botRibbon = createRibbonMesh(pts, normals, 0.01, 0.16, 0.035, botRibbonGrad);
    botRibbon.renderOrder = 14;
    islandGroup.add(botRibbon);

    const botCorePts = pts.map((p, i) => new THREE.Vector3(
      p[0] + normals[i].nx * 0.035,
      0.06,
      -p[1] + normals[i].nz * 0.035
    ));
    const botCoreGeo = new THREE.BufferGeometry().setFromPoints(botCorePts);
    const botCoreMat = new THREE.LineBasicMaterial({
      color: initialTheme.botEdge.color,
      linewidth: 3.8,
      transparent: true,
      opacity: initialTheme.botEdge.opacity,
      blending: THREE.AdditiveBlending
    });
    const botCoreLine = new THREE.LineLoop(botCoreGeo, botCoreMat);
    botCoreLine.renderOrder = 16;
    islandGroup.add(botCoreLine);

    // 6. GLOWING TOP EDGE RIM
    const topRibbonGrad = initialTheme.topEdge.ribbonGrad;
    const topRibbon = createRibbonMesh(pts, normals, 2.16, 2.22, 0.035, topRibbonGrad);
    topRibbon.material.opacity = 3.0;
    topRibbon.position.y = 1.7 - 2.20;
    topRibbon.renderOrder = 24;
    islandGroup.add(topRibbon);

    const topCorePts = pts.map((p, i) => new THREE.Vector3(
      p[0] + normals[i].nx * 0.025,
      2.22,
      -p[1] + normals[i].nz * 0.025
    ));
    const topCoreGeo = new THREE.BufferGeometry().setFromPoints(topCorePts);
    const topCoreMat = new THREE.LineBasicMaterial({
      color: initialTheme.topEdge.color,
      linewidth: 5.3,
      transparent: true,
      opacity: initialTheme.topEdge.opacity,
      blending: THREE.AdditiveBlending
    });
    const topCoreLine = new THREE.LineLoop(topCoreGeo, topCoreMat);
    topCoreLine.position.y = 1.7 - 2.20;
    topCoreLine.renderOrder = 26;
    islandGroup.add(topCoreLine);

    // 7. GLOWING OUTLINES & RIBBONS FOR SUB-ISLANDS (Mannar & Northern Islands)
    if (geo.islands && Array.isArray(geo.islands)) {
      geo.islands.forEach((isl) => {
        const ipts = isl.points;
        if (!ipts || ipts.length < 3) return;
        const count = ipts.length;
        const polyNormals = [];
        for (let i = 0; i < count; i++) {
          const prev = ipts[(i - 1 + count) % count];
          const next = ipts[(i + 1) % count];
          const tx = next[0] - prev[0];
          const ty = next[1] - prev[1];
          const len = Math.hypot(tx, ty) || 1;
          polyNormals.push({ nx: -ty / len, nz: -tx / len });
        }

        // Top edge neon rim
        const iTopPts = ipts.map((p, i) => new THREE.Vector3(
          p[0] + polyNormals[i].nx * 0.025,
          2.22,
          -p[1] + polyNormals[i].nz * 0.025
        ));
        const iTopGeo = new THREE.BufferGeometry().setFromPoints(iTopPts);
        const iTopLine = new THREE.LineLoop(iTopGeo, topCoreMat);
        iTopLine.position.y = 1.7 - 2.20;
        iTopLine.renderOrder = 26;
        islandGroup.add(iTopLine);

        // Bottom edge neon rim
        const iBotPts = ipts.map((p, i) => new THREE.Vector3(
          p[0] + polyNormals[i].nx * 0.035,
          0.06,
          -p[1] + polyNormals[i].nz * 0.035
        ));
        const iBotGeo = new THREE.BufferGeometry().setFromPoints(iBotPts);
        const iBotLine = new THREE.LineLoop(iBotGeo, botCoreMat);
        iBotLine.renderOrder = 16;
        islandGroup.add(iBotLine);

        // Glow ribbon for prominent islands
        if (count >= 30) {
          const iTopRib = createRibbonMesh(ipts, polyNormals, 2.16, 2.22, 0.035, topRibbonGrad);
          iTopRib.material = topRibbon.material;
          iTopRib.position.y = 1.7 - 2.20;
          iTopRib.renderOrder = 24;
          islandGroup.add(iTopRib);

          const iBotRib = createRibbonMesh(ipts, polyNormals, 0.01, 0.16, 0.035, botRibbonGrad);
          iBotRib.material = botRibbon.material;
          iBotRib.renderOrder = 14;
          islandGroup.add(iBotRib);
        }
      });
    }

    scene.add(islandGroup);
    mapState.islandGroup = islandGroup;

    // Expose references on mapState
    mapState.sideMaterial = sideMaterial;
    mapState.groundAuraMesh = groundAuraMesh;
    mapState.botRibbon = botRibbon;
    mapState.botCoreLine = botCoreLine;
    mapState.botCoreMat = botCoreMat;
    mapState.topRibbon = topRibbon;
    mapState.topCoreLine = topCoreLine;
    mapState.topCoreMat = topCoreMat;
    mapState.pts = pts;
    mapState.normals = normals;
  }

  /**
   * Renders the contour-aligned procedural ground glow canvas
   */
  function drawAuraTexture(theme) {
    const canvas = mapState.auraCanvas;
    const ctx = mapState.auraCtx;
    const pts = mapState.pts;
    const geo = window.SRI_LANKA_GEO;
    if (!canvas || !ctx || !pts) return;
    const auraSize = canvas.width;
    const acx = auraSize / 2;
    const acy = auraSize / 2;
    const auraSpan = 52;
    const kScale = auraSize / auraSpan;

    function traceBoundaryPath(c) {
      // Main island boundary
      c.beginPath();
      c.moveTo(acx + pts[0][0] * kScale, acy - pts[0][1] * kScale);
      for (let i = 1; i < pts.length; i++) {
        c.lineTo(acx + pts[i][0] * kScale, acy - pts[i][1] * kScale);
      }
      c.closePath();

      // All sub-islands (Mannar & Northern Islands)
      if (geo && geo.islands && Array.isArray(geo.islands)) {
        geo.islands.forEach((isl) => {
          const ipts = isl.points;
          if (ipts && ipts.length > 2) {
            c.moveTo(acx + ipts[0][0] * kScale, acy - ipts[0][1] * kScale);
            for (let j = 1; j < ipts.length; j++) {
              c.lineTo(acx + ipts[j][0] * kScale, acy - ipts[j][1] * kScale);
            }
            c.closePath();
          }
        });
      }
    }

    ctx.clearRect(0, 0, auraSize, auraSize);

    // Pass 1: Wide luminous pool
    ctx.save();
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.shadowColor = theme.aura.c1;
    ctx.shadowBlur = 140;
    ctx.strokeStyle = theme.aura.c1Rgba;
    ctx.lineWidth = 40;
    traceBoundaryPath(ctx);
    ctx.stroke();
    ctx.restore();

    // Pass 2: Mid vibrant bloom
    ctx.save();
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.shadowColor = theme.aura.c2;
    ctx.shadowBlur = 75;
    ctx.strokeStyle = theme.aura.c2Rgba;
    ctx.lineWidth = 22;
    traceBoundaryPath(ctx);
    ctx.stroke();
    ctx.restore();

    // Pass 3: Inner aura
    ctx.save();
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.shadowColor = theme.aura.c3;
    ctx.shadowBlur = 35;
    ctx.strokeStyle = theme.aura.c3Rgba;
    ctx.lineWidth = 12;
    traceBoundaryPath(ctx);
    ctx.stroke();
    ctx.restore();

    // Pass 4: Core line
    ctx.save();
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.shadowColor = theme.aura.c4;
    ctx.shadowBlur = 16;
    ctx.strokeStyle = theme.aura.c4Stroke;
    ctx.lineWidth = 6;
    traceBoundaryPath(ctx);
    ctx.stroke();
    ctx.restore();

    // Pass 5: Under-island soft fill
    ctx.fillStyle = theme.aura.fill;
    traceBoundaryPath(ctx);
    ctx.fill();

    if (mapState.groundAuraTex) {
      mapState.groundAuraTex.needsUpdate = true;
    }
  }

  /**
   * Updates vertical 32x256 ribbon gradient texture
   */
  function updateRibbonTexture(ribbonMesh, gradStops) {
    if (!ribbonMesh || !ribbonMesh.userData || !ribbonMesh.userData.rctx) return;
    const rctx = ribbonMesh.userData.rctx;
    const tex = ribbonMesh.userData.ribbonTex;
    rctx.clearRect(0, 0, 32, 256);
    const grad = rctx.createLinearGradient(0, 0, 0, 256);
    gradStops.forEach(stop => grad.addColorStop(stop.pos, stop.color));
    rctx.fillStyle = grad;
    rctx.fillRect(0, 0, 32, 256);
    tex.needsUpdate = true;
  }

  /**
   * Dynamically switches the 3D map between Dark Cyber Mood and Light Daylight Mood
   */
  function setMapMood(moodName) {
    const theme = THEMES[moodName];
    if (!theme) return;
    mapState.currentMood = moodName;

    // 1. Scene background
    if (mapState.scene) {
      mapState.scene.background.setHex(theme.sceneBg);
    }

    // 2. Lighting
    if (mapState.ambientLight) {
      mapState.ambientLight.color.setHex(theme.ambient.color);
      mapState.ambientLight.intensity = theme.ambient.intensity;
    }
    if (mapState.keyLight) {
      mapState.keyLight.color.setHex(theme.key.color);
      mapState.keyLight.intensity = theme.key.intensity;
    }
    if (mapState.rimLight) {
      mapState.rimLight.color.setHex(theme.rim.color);
      mapState.rimLight.intensity = theme.rim.intensity;
    }
    if (mapState.underglowLight) {
      mapState.underglowLight.color.setHex(theme.underglow.color);
      mapState.underglowLight.intensity = theme.underglow.intensity;
    }

    // 3. Floor & Radar Canvas
    drawFloorTexture(theme);

    // 4. Motion Graphic Ring
    drawMotionRingTexture(theme);

    // 5. Side Wall Material
    if (mapState.sideMaterial) {
      mapState.sideMaterial.color.setHex(theme.side.color);
      mapState.sideMaterial.emissive.setHex(theme.side.emissive);
      mapState.sideMaterial.emissiveIntensity = theme.side.emissiveIntensity;
      mapState.sideMaterial.needsUpdate = true;
    }

    // 6. Ground Bloom Aura
    drawAuraTexture(theme);

    // 7. Bottom Edge Ribbon & Core
    if (mapState.botRibbon) {
      updateRibbonTexture(mapState.botRibbon, theme.botEdge.ribbonGrad);
      if (typeof theme.botEdge.glowIntensity === 'number') {
        mapState.botRibbon.material.opacity = theme.botEdge.glowIntensity;
      }
    }
    if (mapState.botCoreMat) {
      mapState.botCoreMat.color.setHex(theme.botEdge.color);
      mapState.botCoreMat.opacity = theme.botEdge.opacity;
    }

    // 8. Top Edge Ribbon & Core
    if (mapState.topRibbon) {
      updateRibbonTexture(mapState.topRibbon, theme.topEdge.ribbonGrad);
      if (typeof theme.topEdge.glowIntensity === 'number') {
        mapState.topRibbon.material.opacity = theme.topEdge.glowIntensity;
      }
    }
    if (mapState.topCoreMat) {
      mapState.topCoreMat.color.setHex(theme.topEdge.color);
      mapState.topCoreMat.opacity = theme.topEdge.opacity;
    }

    // 9. Routes
    if (mapState.routeItems) {
      mapState.routeItems.forEach(item => {
        const rc = item.isPriority ? theme.routes.priority : theme.routes.normal;
        if (item.coreTrackMat) item.coreTrackMat.color.setHex(rc.color);
        if (item.rungsMaterial) item.rungsMaterial.color.setHex(rc.ladder);
        if (item.railsMat) item.railsMat.color.setHex(rc.color);
      });
    }

    // 9b. Floor Water Reflection
    if (theme.floorReflection && mapState.reflectorMaterial && mapState.reflectorMaterial.uniforms) {
      if (typeof theme.floorReflection.reflectivity === 'number') {
        mapState.reflectorMaterial.uniforms['reflectivity'].value = theme.floorReflection.reflectivity;
      }
      if (typeof theme.floorReflection.fresnelPower === 'number') {
        mapState.reflectorMaterial.uniforms['fresnelPower'].value = theme.floorReflection.fresnelPower;
      }
    }

    // 10. DOM HUD
    const mapCard = document.getElementById('map-section');
    if (mapCard) {
      mapCard.classList.toggle('light-mood', moodName === 'light');
      mapCard.classList.toggle('emerald-mood', moodName === 'emerald');
    }
    const moodBtn = document.getElementById('map-btn-mood-toggle');
    if (moodBtn) {
      const iconSpan = moodBtn.querySelector('.btn-icon');
      const labelSpan = moodBtn.querySelector('#map-mood-label');
      if (moodName === 'light') {
        if (iconSpan) iconSpan.innerHTML = HUD_CIRCULAR_ICONS.moon;
        if (labelSpan) labelSpan.textContent = 'Dark Mood';
        moodBtn.title = 'Current: Light Mood. Click to switch to Cyber Dark.';
      } else if (moodName === 'dark') {
        if (iconSpan) iconSpan.innerHTML = HUD_CIRCULAR_ICONS.emerald;
        if (labelSpan) labelSpan.textContent = 'Emerald Mood';
        moodBtn.title = 'Current: Cyber Dark. Click to switch to Emerald Mood.';
      } else {
        if (iconSpan) iconSpan.innerHTML = HUD_CIRCULAR_ICONS.sun;
        if (labelSpan) labelSpan.textContent = 'Light Mood';
        moodBtn.title = 'Current: Emerald Mood. Click to switch to Light Mood.';
      }
      moodBtn.classList.toggle('active', moodName !== 'dark');
    }
  }
  mapState.setMood = setMapMood;

  /**
   * Procedural Road Texture reproducing media_1789918814688.png
   * - Tactical forest green roadbed (#235c34) with neon green stripes (#86efac) for Highways
   * - Dark slate asphalt roadbed (#1e293b) with amber gold stripes (#fbbf24) for Normal Routes
   */
  function createRoadTexture(mode = 'highway') {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    const isNormal = (mode === 'normal');

    // Base roadbed
    ctx.fillStyle = isNormal ? '#1e293b' : '#235c34';
    ctx.fillRect(0, 0, 128, 256);

    // Subtle road surface inner tone
    ctx.fillStyle = isNormal ? '#293548' : '#2f6838';
    ctx.fillRect(16, 0, 96, 256);

    // Outer border rails (left & right)
    ctx.fillStyle = isNormal ? '#d97706' : '#6ee7b7';
    ctx.fillRect(0, 0, 14, 256);
    ctx.fillRect(114, 0, 14, 256);

    // Bright core inside rails
    ctx.fillStyle = isNormal ? '#fbbf24' : '#86efac';
    ctx.fillRect(3, 0, 8, 256);
    ctx.fillRect(117, 0, 8, 256);

    // Dashed Center Line - perfectly seamless 64px cycle dividing 256px tile evenly
    const dashHeight = 38;
    const gapHeight = 26;
    const cycle = dashHeight + gapHeight; // 64px (exactly 4 cycles per 256px)
    ctx.fillStyle = isNormal ? '#fef08a' : '#86efac';
    for (let y = 0; y < 256; y += cycle) {
      ctx.fillRect(52, y, 24, dashHeight);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.ClampToEdgeWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.anisotropy = 8;
    return texture;
  }

  /**
   * Denoises and smooths raw GPS polyline coordinates to eliminate micro-jitters,
   * acute angle reversals, and high-frequency noise while strictly preserving
   * the exact coordinates of the terminal waypoints.
   */
  function smoothRouteCoordinates(rawPts) {
    if (!rawPts || rawPts.length < 3) return rawPts;

    // 1. Deduplicate & remove micro-segments (< 0.035 units)
    const pts = [rawPts[0]];
    for (let i = 1; i < rawPts.length - 1; i++) {
      const prev = pts[pts.length - 1];
      const curr = rawPts[i];
      const d = Math.hypot(curr[0] - prev[0], curr[1] - prev[1]);
      if (d >= 0.035) {
        pts.push(curr);
      }
    }
    pts.push(rawPts[rawPts.length - 1]);
    if (pts.length < 3) return pts;

    // 2. Remove sharp acute zigzag spikes where points oscillate back and forth
    const filtered = [pts[0]];
    for (let i = 1; i < pts.length - 1; i++) {
      const pPrev = filtered[filtered.length - 1];
      const pCurr = pts[i];
      const pNext = pts[i + 1];

      const v1x = pCurr[0] - pPrev[0];
      const v1y = pCurr[1] - pPrev[1];
      const v2x = pNext[0] - pCurr[0];
      const v2y = pNext[1] - pCurr[1];
      const len1 = Math.hypot(v1x, v1y);
      const len2 = Math.hypot(v2x, v2y);

      if (len1 > 0.001 && len2 > 0.001) {
        const dot = (v1x * v2x + v1y * v2y) / (len1 * len2);
        // If angle between consecutive short segments is sharper than ~110 deg (dot < -0.35)
        if (dot < -0.35 && len1 < 0.20 && len2 < 0.20) {
          // Relax spike towards segment midpoint
          filtered.push([
            0.5 * pCurr[0] + 0.25 * pPrev[0] + 0.25 * pNext[0],
            0.5 * pCurr[1] + 0.25 * pPrev[1] + 0.25 * pNext[1]
          ]);
          continue;
        }
      }
      filtered.push(pCurr);
    }
    filtered.push(pts[pts.length - 1]);

    // 3. Gentle 2-pass Laplacian relaxation on interior points (preserves start & end)
    const smoothed = [filtered[0]];
    for (let iter = 0; iter < 2; iter++) {
      const src = (iter === 0) ? filtered : smoothed.slice();
      smoothed.length = 0;
      smoothed.push(src[0]);
      for (let i = 1; i < src.length - 1; i++) {
        const p0 = src[i - 1];
        const p1 = src[i];
        const p2 = src[i + 1];
        smoothed.push([
          0.20 * p0[0] + 0.60 * p1[0] + 0.20 * p2[0],
          0.20 * p0[1] + 0.60 * p1[1] + 0.20 * p2[1]
        ]);
      }
      smoothed.push(src[src.length - 1]);
    }

    return smoothed;
  }

  /**
   * Builds a silky, smooth, continuous 3D road ribbon mesh from an array of coordinates [x, y],
   * mapping the authentic highway texture onto terrain elevation.
   * Features:
   * - High-density adaptive curve sampling (0.022 units)
   * - Curvature-aware inner-turn width clamping (zero self-intersections or bowtie folds)
   * - Forward vertex monotonicity enforcement
   * - Seamless rounded end caps on terminal boundaries
   */
  function buildRoadRibbonMesh(points, texture, width = 0.36) {
    if (!points || points.length < 2) return null;

    const smoothed = smoothRouteCoordinates(points);
    // Convert 2D [x, y] to 3D Vector3 points (y = groundY + 0.035, z = -pt[1])
    const v3Points = smoothed.map(p => new THREE.Vector3(p[0], 2.21 + 0.035, -p[1]));
    const curve = new THREE.CatmullRomCurve3(v3Points, false, 'centripetal', 0.5);

    const length = curve.getLength();
    // High-resolution sampling density for silky curves
    const divisions = Math.max(30, Math.round(length / 0.022));
    const sampledPoints = curve.getSpacedPoints(divisions);

    const halfW = width / 2;
    const vertices = [];
    const uvs = [];
    const indices = [];

    // Accumulate distance along path for proportional UV repetition
    let cumDist = 0;
    const repeatScale = 0.70; // Physical length of one dash cycle
    const leftVertices = [];
    const rightVertices = [];

    for (let i = 0; i < sampledPoints.length; i++) {
      const curr = sampledPoints[i];
      if (i > 0) {
        cumDist += curr.distanceTo(sampledPoints[i - 1]);
      }

      // Compute tangent
      let tangent;
      if (i === 0) {
        tangent = new THREE.Vector3().subVectors(sampledPoints[1], curr).normalize();
      } else if (i === sampledPoints.length - 1) {
        tangent = new THREE.Vector3().subVectors(curr, sampledPoints[i - 1]).normalize();
      } else {
        tangent = new THREE.Vector3().subVectors(sampledPoints[i + 1], sampledPoints[i - 1]).normalize();
      }

      // Horizontal normal perpendicular to tangent (lying in X-Z plane)
      const norm = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();

      // Adaptive inner-turn width clamping to prevent self-intersection on tight bends
      let curL = halfW;
      let curR = halfW;
      if (i > 0 && i < sampledPoints.length - 1) {
        const tPrev = new THREE.Vector3().subVectors(curr, sampledPoints[i - 1]).normalize();
        const tNext = new THREE.Vector3().subVectors(sampledPoints[i + 1], curr).normalize();
        const ds = (sampledPoints[i].distanceTo(sampledPoints[i - 1]) + sampledPoints[i + 1].distanceTo(sampledPoints[i])) * 0.5;
        const crossY = tPrev.x * tNext.z - tPrev.z * tNext.x;
        const dotT = Math.max(-1, Math.min(1, tPrev.dot(tNext)));
        const dTheta = Math.acos(dotT);
        const kappa = dTheta / Math.max(0.001, ds);
        const radius = 1.0 / Math.max(0.001, kappa);
        const safeRadius = Math.max(0.04, radius * 0.72);

        if (crossY > 0) {
          // Turning left: left side is inner curve
          curL = Math.min(halfW, safeRadius);
        } else {
          // Turning right: right side is inner curve
          curR = Math.min(halfW, safeRadius);
        }
      }

      let lPt = new THREE.Vector3().copy(curr).addScaledVector(norm, curL);
      let rPt = new THREE.Vector3().copy(curr).addScaledVector(norm, -curR);

      // Forward monotonicity check: ensure inner vertices never invert backwards
      if (i > 0) {
        const segDir = new THREE.Vector3().subVectors(curr, sampledPoints[i - 1]).normalize();
        const minStep = 0.003;
        const lStep = new THREE.Vector3().subVectors(lPt, leftVertices[i - 1]).dot(segDir);
        if (lStep < minStep) {
          lPt.copy(leftVertices[i - 1]).addScaledVector(segDir, minStep);
        }
        const rStep = new THREE.Vector3().subVectors(rPt, rightVertices[i - 1]).dot(segDir);
        if (rStep < minStep) {
          rPt.copy(rightVertices[i - 1]).addScaledVector(segDir, minStep);
        }
      }

      leftVertices.push(lPt);
      rightVertices.push(rPt);

      vertices.push(lPt.x, lPt.y, lPt.z);
      vertices.push(rPt.x, rPt.y, rPt.z);

      const vCoord = cumDist / repeatScale;
      uvs.push(0.0, vCoord);
      uvs.push(1.0, vCoord);

      if (i < sampledPoints.length - 1) {
        const base = i * 2;
        indices.push(base, base + 1, base + 2);
        indices.push(base + 1, base + 3, base + 2);
      }
    }

    // Add rounded start cap at i = 0 (sweeping backwards from left to right)
    const p0 = sampledPoints[0];
    const t0 = new THREE.Vector3().subVectors(sampledPoints[1], p0).normalize();
    const n0 = new THREE.Vector3(-t0.z, 0, t0.x).normalize();
    const capSegments = 8;
    const p0CenterIdx = vertices.length / 3;
    vertices.push(p0.x, p0.y, p0.z);
    uvs.push(0.5, 0.0);

    const startCapIndices = [0]; // index 0 is left vertex of step 0
    for (let s = 1; s < capSegments; s++) {
      const phi = (s / capSegments) * Math.PI;
      const cosP = Math.cos(phi);
      const sinP = Math.sin(phi);
      const capPt = new THREE.Vector3().copy(p0)
        .addScaledVector(n0, cosP * halfW)
        .addScaledVector(t0, -sinP * halfW);
      const vIdx = vertices.length / 3;
      vertices.push(capPt.x, capPt.y, capPt.z);
      uvs.push(0.5 - 0.5 * cosP, -sinP * halfW / repeatScale);
      startCapIndices.push(vIdx);
    }
    startCapIndices.push(1); // index 1 is right vertex of step 0
    for (let s = 0; s < capSegments; s++) {
      indices.push(p0CenterIdx, startCapIndices[s], startCapIndices[s + 1]);
    }

    // Add rounded end cap at i = sampledPoints.length - 1 (sweeping forwards from right to left)
    const pN = sampledPoints[sampledPoints.length - 1];
    const tN = new THREE.Vector3().subVectors(pN, sampledPoints[sampledPoints.length - 2]).normalize();
    const nN = new THREE.Vector3(-tN.z, 0, tN.x).normalize();
    const pNCenterIdx = vertices.length / 3;
    const vEnd = cumDist / repeatScale;
    vertices.push(pN.x, pN.y, pN.z);
    uvs.push(0.5, vEnd);

    const lastBase = (sampledPoints.length - 1) * 2;
    const endCapIndices = [lastBase + 1]; // right vertex of last step
    for (let s = 1; s < capSegments; s++) {
      const phi = (s / capSegments) * Math.PI;
      const cosP = Math.cos(phi);
      const sinP = Math.sin(phi);
      const capPt = new THREE.Vector3().copy(pN)
        .addScaledVector(nN, -cosP * halfW)
        .addScaledVector(tN, sinP * halfW);
      const vIdx = vertices.length / 3;
      vertices.push(capPt.x, capPt.y, capPt.z);
      uvs.push(0.5 + 0.5 * cosP, vEnd + sinP * halfW / repeatScale);
      endCapIndices.push(vIdx);
    }
    endCapIndices.push(lastBase); // left vertex of last step
    for (let s = 0; s < capSegments; s++) {
      indices.push(pNCenterIdx, endCapIndices[s], endCapIndices[s + 1]);
    }

    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geom.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geom.setIndex(indices);
    geom.computeVertexNormals();

    const mat = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      opacity: 0.98,
      side: THREE.DoubleSide,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -4,
      polygonOffsetUnits: -4
    });

    const mesh = new THREE.Mesh(geom, mat);
    mesh.renderOrder = 30;
    return { mesh, curve, length };
  }

  /**
   * Initializes the expressway routes group
   */
  function createExpresswayRoutes(scene) {
    const routesGroup = new THREE.Group();
    // Match islandGroup rotation and extrude depth (1.7)
    routesGroup.rotation.y = -0.18;
    routesGroup.position.y = 1.7 - 2.20;

    mapState.routesGroup = routesGroup;
    mapState.roadBadges = [];
    mapState.activeRouteSegments = [];
    mapState.routeMode = 'highway';
    mapState.roadTextures = {
      highway: createRoadTexture('highway'),
      normal: createRoadTexture('normal')
    };
    mapState.roadTexture = mapState.roadTextures.highway;

    scene.add(routesGroup);
  }

  /**
   * Dynamically renders authentic road ribbons connecting assigned destinations
   * according to user's day-by-day itinerary. Gracefully handles unassigned days
   * as clear breaks in the route path. Supports Highway and Normal route modes.
   * Contiguous legs are chained into unbroken, seamless continuous ribbons.
   */
  function updateItineraryRoutes(dayDestinations) {
    if (!mapState.routesGroup || !window.SRI_LANKA_ROUTES) return;
    mapState.lastDayDestinations = dayDestinations;

    // Clear existing route meshes
    while (mapState.routesGroup.children.length > 0) {
      const child = mapState.routesGroup.children[0];
      if (child.geometry) child.geometry.dispose();
      mapState.routesGroup.remove(child);
    }

    // Clear existing road telemetry badges
    if (mapState.roadBadges) {
      mapState.roadBadges.forEach(b => {
        if (b.element && b.element.parentNode) {
          b.element.parentNode.removeChild(b.element);
        }
      });
    }
    mapState.roadBadges = [];
    mapState.activeRouteSegments = [];

    if (!dayDestinations || !Array.isArray(dayDestinations) || dayDestinations.length === 0) {
      return;
    }

    const currentMode = mapState.routeMode || (window.SRI_LANKA_ROUTES ? window.SRI_LANKA_ROUTES.getRouteMode() : 'highway');
    if (!mapState.roadTextures) {
      mapState.roadTextures = {
        highway: createRoadTexture('highway'),
        normal: createRoadTexture('normal')
      };
    }
    const activeRoadTexture = mapState.roadTextures[currentMode] || mapState.roadTextures.highway;
    mapState.roadTexture = activeRoadTexture;

    const totalDays = dayDestinations.length;

    // 1. Identify all active driving legs (supporting 1 or 2 destinations per day)
    const drivingLegs = [];
    let currentOrigin = 'airport';

    for (let d = 0; d < totalDays; d++) {
      const rawDest = dayDestinations[d];
      if (!rawDest) {
        // Unassigned day creates a break in route chain!
        currentOrigin = null;
        continue;
      }

      // rawDest can be a string ('Kandy') or an array (['Polonnaruwa', 'Anuradhapura'])
      const destList = Array.isArray(rawDest) ? rawDest.filter(Boolean) : [rawDest];
      if (destList.length === 0) {
        currentOrigin = null;
        continue;
      }

      for (let s = 0; s < destList.length; s++) {
        const nextDest = destList[s];
        if (!currentOrigin) {
          // Cannot connect from broken origin, but this destination becomes the new origin
          currentOrigin = nextDest;
          continue;
        }

        if (currentOrigin !== nextDest) {
          const routeData = window.SRI_LANKA_ROUTES.findRoute(currentOrigin, nextDest, currentMode);
          if (routeData && routeData.points && routeData.points.length >= 2) {
            drivingLegs.push({
              day: d + 1,
              subLeg: s,
              origin: currentOrigin,
              destination: nextDest,
              routeData: routeData,
              points: routeData.points
            });
          }
        }
        currentOrigin = nextDest;
      }
    }

    // 2. Group contiguous connected legs into seamless chains
    const chains = [];
    let currentChain = null;

    for (let i = 0; i < drivingLegs.length; i++) {
      const leg = drivingLegs[i];
      if (!currentChain) {
        currentChain = {
          legs: [leg],
          endDestination: leg.destination,
          points: [...leg.points]
        };
      } else {
        if (currentChain.endDestination === leg.origin) {
          // Connected leg! Append points seamlessly (skip duplicate junction vertex)
          currentChain.legs.push(leg);
          currentChain.endDestination = leg.destination;
          currentChain.points.push(...leg.points.slice(1));
        } else {
          // Disconnected leg: finish current chain and start a new one
          chains.push(currentChain);
          currentChain = {
            legs: [leg],
            endDestination: leg.destination,
            points: [...leg.points]
          };
        }
      }
    }
    if (currentChain) {
      chains.push(currentChain);
    }

    // 3. Build seamless continuous ribbon mesh for each chain
    chains.forEach(chain => {
      const ribbon = buildRoadRibbonMesh(chain.points, activeRoadTexture);
      if (ribbon && ribbon.mesh) {
        mapState.routesGroup.add(ribbon.mesh);

        // Populate telemetry & active segments for each leg in this chain
        chain.legs.forEach(leg => {
          // Compute individual leg midpoint for road telemetry badge
          let midPointLocal;
          if (leg.points.length >= 2) {
            const legV3 = leg.points.map(p => new THREE.Vector3(p[0], 2.21 + 0.035, -p[1]));
            const legCurve = new THREE.CatmullRomCurve3(legV3, false, 'centripetal', 0.5);
            midPointLocal = legCurve.getPointAt(0.5);
          } else {
            midPointLocal = ribbon.curve.getPointAt(0.5);
          }

          mapState.activeRouteSegments.push({
            day: leg.day,
            origin: leg.origin,
            destination: leg.destination,
            routeData: leg.routeData,
            midPointLocal: midPointLocal,
            ribbon: ribbon
          });
        });
      }
    });
  }

  /**
   * Switches routing mode between 'highway' (expressways & arterial bypasses)
   * and 'normal' (traditional coastal & town roads), dynamically re-rendering
   * road textures and geometry.
   */
  function setRouteMode(mode) {
    if (mode !== 'highway' && mode !== 'normal') return;
    mapState.routeMode = mode;
    if (window.SRI_LANKA_ROUTES) {
      window.SRI_LANKA_ROUTES.setRouteMode(mode);
    }
    if (!mapState.roadTextures) {
      mapState.roadTextures = {
        highway: createRoadTexture('highway'),
        normal: createRoadTexture('normal')
      };
    }
    mapState.roadTexture = mapState.roadTextures[mode] || mapState.roadTextures.highway;

    if (mapState.lastDayDestinations) {
      updateItineraryRoutes(mapState.lastDayDestinations);
    }
  }

  mapState.updateItineraryRoutes = updateItineraryRoutes;
  mapState.updateRoute = updateItineraryRoutes;
  mapState.setRouteMode = setRouteMode;
  mapState.getActiveRouteSegments = () => mapState.activeRouteSegments || [];
  mapState.getRouteForDay = (day) => (mapState.activeRouteSegments || []).find(s => s.day === day) || null;

  /**
   * Creates 3D anchor pins with glowing vertical stems, and registers
   * crisp HTML billboard badges in screen-space matching media_1789747625578.png.
   */
  function createLocationMarkers(scene) {
    const markersGroup = new THREE.Group();
    // Match islandGroup rotation and extrude depth (1.7)
    markersGroup.rotation.y = -0.18;
    markersGroup.position.y = 1.7 - 2.20;

    const overlay = mapState.domElements.overlay;
    if (!overlay) return;

    overlay.innerHTML = '';
    markerBillboards.length = 0;

    const geo = window.SRI_LANKA_GEO;

    // Stagger heights slightly so adjacent badges never collide!
    const heightOffsets = {
      'airport': 2.8,
      'colombo': 2.4,
      'sigiriya': 3.4,
      'dambulla': 1.9,
      'kandy': 2.3,
      'nuwara-eliya': 2.9,
      'ella': 2.2,
      'galle': 2.1,
      'mirissa': 3.0,
      'yala': 2.3,
      'udawalawe': 2.6,
      'bentota': 2.5,
      'unawatuna': 2.2,
      'negombo': 2.0,
      'trincomalee': 2.4,
      'arugam-bay': 2.5,
      'passikudah': 2.2,
      'jaffna': 2.5,
      'anuradhapura': 2.3,
      'polonnaruwa': 2.8,
      'wilpattu': 2.7,
      'sinharaja': 2.2,
      'horton-plains': 3.2,
      'adams-peak': 3.6,
      'tangalle': 2.2,
      'weligama': 2.4,
      'hikkaduwa': 2.6,
      'minneriya': 2.2,
      'kitulgala': 2.4,
      'mannar': 2.4,
      'pigeon-island': 2.6,
      'delft-island': 2.5,
      'casuarina-beach': 2.8,
      'nainativu': 2.2
    };

    const colorMap = {
      'red': { core: 0xff2a5f, glow: 0xff3b6b },
      'purple': { core: 0xd946ef, glow: 0xe879f9 },
      'orange': { core: 0xffb703, glow: 0xfdc500 },
      'blue': { core: 0x00f0ff, glow: 0x38bdf8 }
    };

    const pulseRings = [];
    mapState.pulseRings = pulseRings;

    geo.destinations.forEach((dest, idx) => {
      const x = dest.xy[0];
      const z = -dest.xy[1];
      const groundY = 2.21;
      const colors = colorMap[dest.type] || colorMap['blue'];

      // 1. High-Contrast Multi-Layer Destination Indicator Ring (Bullseye Reticle ⦿)
      // Layer 1: High-Contrast Dark Backing Rim (guarantees contrast against ANY terrain or overlay)
      const backingGeo = new THREE.RingGeometry(0.15, 0.45, 32);
      const backingMat = new THREE.MeshBasicMaterial({
        color: 0x000000,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.90,
        depthWrite: false
      });
      const backingMesh = new THREE.Mesh(backingGeo, backingMat);
      backingMesh.rotation.x = -Math.PI / 2;
      backingMesh.position.set(x, groundY + 0.015, z);
      backingMesh.renderOrder = 44;
      markersGroup.add(backingMesh);

      // Layer 2: Main Luminous High-Chroma Ring
      const ringGeo = new THREE.RingGeometry(0.23, 0.39, 32);
      const ringMat = new THREE.MeshBasicMaterial({
        color: colors.core,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.95,
        depthWrite: false
      });
      const ringMesh = new THREE.Mesh(ringGeo, ringMat);
      ringMesh.rotation.x = -Math.PI / 2;
      ringMesh.position.set(x, groundY + 0.022, z);
      ringMesh.renderOrder = 45;
      markersGroup.add(ringMesh);

      // Layer 3: Center Target Bullseye Dot (⦿)
      const dotGeo = new THREE.CircleGeometry(0.08, 16);
      const dotMat = new THREE.MeshBasicMaterial({
        color: colors.core,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.95,
        depthWrite: false
      });
      const dotMesh = new THREE.Mesh(dotGeo, dotMat);
      dotMesh.rotation.x = -Math.PI / 2;
      dotMesh.position.set(x, groundY + 0.024, z);
      dotMesh.renderOrder = 46;
      markersGroup.add(dotMesh);

      // Layer 4: Animated Expanding Radar Wave (Pulse Ring)
      const pulseGeo = new THREE.RingGeometry(0.24, 0.36, 32);
      const pulseMat = new THREE.MeshBasicMaterial({
        color: colors.glow,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.70,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      });
      const pulseMesh = new THREE.Mesh(pulseGeo, pulseMat);
      pulseMesh.rotation.x = -Math.PI / 2;
      pulseMesh.position.set(x, groundY + 0.018, z);
      pulseMesh.renderOrder = 43;
      markersGroup.add(pulseMesh);

      const pulseObj = {
        mesh: pulseMesh,
        material: pulseMat,
        baseIdx: idx
      };
      pulseRings.push(pulseObj);

      // 2. Interactive HTML Marker with Transparent Hit Area & Animated Tactical HUD Callout (Matching media_1789872097254.png)
      const markerEl = document.createElement('div');
      markerEl.className = `map-hud-marker marker-${dest.type}`;
      markerEl.dataset.destId = dest.id;

      markerEl.innerHTML = `
        <div class="marker-hit-area" title="${dest.name} (${dest.category})"></div>
        <div class="marker-callout-wrap">
          <svg class="marker-leader-svg" viewBox="0 0 260 140" fill="none">
            <!-- Main Upper Branch to Title -->
            <path class="leader-line-glow" d="M 0 120 L 0 65 L 42 22 L 72 22" />
            <path class="leader-line-core" d="M 0 120 L 0 65 L 42 22 L 72 22" />
            <circle class="leader-dot" cx="72" cy="22" r="3.5" />

            <!-- Lower Branch into Telemetry Card -->
            <path class="leader-line-glow" d="M 0 85 L 30 85 L 45 70 L 72 70" />
            <path class="leader-line-core" d="M 0 85 L 30 85 L 45 70 L 72 70" />
          </svg>

          <div class="marker-hud-card">
            <div class="marker-hud-title">${dest.name.toUpperCase()}</div>
            <div class="marker-hud-subrow">
              <span>SURVEY AREA: ${dest.category.toUpperCase()}</span>
              <span>SURVEY DATA: 2026</span>
            </div>
            <div class="marker-hud-telemetry">
              <span class="telemetry-reticle tl"></span>
              <span class="telemetry-reticle tr"></span>
              <span class="telemetry-reticle bl"></span>
              <span class="telemetry-reticle br"></span>
              <div class="telemetry-row">
                <span class="telemetry-label">ECO-TOURISM STATUS:</span>
                <span class="telemetry-val">${dest.tag.toUpperCase()}</span>
              </div>
              <div class="telemetry-row">
                <span class="telemetry-label">SURVEY DATA:</span>
                <span class="telemetry-val">2026 &bull; LAT ${dest.lat.toFixed(2)}° N, ${dest.lon.toFixed(2)}° E</span>
              </div>
            </div>
          </div>
        </div>
      `;

      // Compute initial world position at the ground location
      const baseLocalPos = new THREE.Vector3(x, groundY + 0.05, z);
      const deltaY = 1.7 - 2.20;
      const initialPos = baseLocalPos.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), -0.18);
      initialPos.y += deltaY;

      const billboardItem = {
        id: dest.id,
        element: markerEl,
        worldPos: initialPos,
        baseLocalPos: baseLocalPos,
        ringMesh: ringMesh,
        backingMesh: backingMesh,
        dotMesh: dotMesh,
        pulseMesh: pulseMesh,
        userScale: 1.0,
        distScale: 1.0,
        data: dest
      };
      pulseObj.item = billboardItem;
      markerBillboards.push(billboardItem);

      // Hover & Click interaction ONLY on original 3D ring hit area
      const hitAreaEl = markerEl.querySelector('.marker-hit-area');
      if (hitAreaEl) {
        hitAreaEl.addEventListener('mouseenter', () => {
          billboardItem.userScale = 1.25;
          ringMat.opacity = 1.0;
        });
        hitAreaEl.addEventListener('mouseleave', () => {
          if (!markerEl.classList.contains('is-active')) {
            billboardItem.userScale = 1.0;
            ringMat.opacity = 0.95;
          }
        });

        // Click to pin/unpin destination HUD
        hitAreaEl.addEventListener('click', (e) => {
          e.stopPropagation();
          const wasActive = markerEl.classList.contains('is-active');
          document.querySelectorAll('.map-hud-marker.is-active').forEach(m => m.classList.remove('is-active'));
          if (mapState.markerBillboards) {
            mapState.markerBillboards.forEach(b => {
              b.userScale = 1.0;
              if (b.ringMesh) {
                b.ringMesh.material.opacity = 0.95;
              }
            });
          }
          if (!wasActive) {
            markerEl.classList.add('is-active');
            billboardItem.userScale = 1.25;
            ringMat.opacity = 1.0;
          }
          focusOnDestination(dest);
          if (window.selectDestinationByName) {
            window.selectDestinationByName(dest.name);
          }
        });
      }

      overlay.appendChild(markerEl);
    });

    scene.add(markersGroup);
    mapState.markersGroup = markersGroup;
    mapState.markerBillboards = markerBillboards;
  }

  /**
   * Category Icon SVGs matching the visual badges in media_1789747625578.png
   */
  function getCategoryIconSvg(icon) {
    switch (icon) {
      case 'plane':
        return '<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/></svg>';
      case 'landmark':
      case 'temple':
        return '<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 3L2 9h20L12 3zm-7 8h2v8H5v-8zm4 0h2v8H9v-8zm4 0h2v8h-2v-8zm4 0h2v8h-2v-8zM2 21h20v2H2v-2z"/></svg>';
      case 'shield':
        return '<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z"/></svg>';
      case 'train':
        return '<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2c-4 0-8 .5-8 4v9.5C4 17.43 5.57 19 7.5 19L6 20.5v.5h12v-.5L16.5 19c1.93 0 3.5-1.57 3.5-3.5V6c0-3.5-4-4-8-4zm0 2c3.5 0 6 .34 6 2H6c0-1.66 2.5-2 6-2zm-5 13c-.83 0-1.5-.67-1.5-1.5S6.17 14 7 14s1.5.67 1.5 1.5S7.83 17 7 17zm10 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm1-5H6V8h12v4z"/></svg>';
      case 'paw':
        return '<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 13c-2.5 0-5 2-5 4.5 0 1.5 1 2.5 2.5 2.5 1.5 0 2-1 2.5-1s1 1 2.5 1c1.5 0 2.5-1 2.5-2.5 0-2.5-2.5-4.5-5-4.5zM4.5 11c1.4 0 2.5-1.1 2.5-2.5S5.9 6 4.5 6 2 7.1 2 8.5 3.1 11 4.5 11zm15 0c1.4 0 2.5-1.1 2.5-2.5S20.9 6 19.5 6 17 7.1 17 8.5s1.1 2.5 2.5 2.5zM8.5 6C9.9 6 11 4.9 11 3.5S9.9 1 8.5 1 6 2.1 6 3.5 7.1 6 8.5 6zm7 0c1.4 0 2.5-1.1 2.5-2.5S16.9 1 15.5 1 13 2.1 13 3.5 14.1 6 15.5 6z"/></svg>';
      case 'anchor':
        return '<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="4" r="2"/><path d="M13 7h-2v4H7v2h4v7.92c-3.95-.49-7-3.85-7-7.92H2c0 5.18 3.95 9.45 9 9.95V24h2v-1.05c5.05-.5 9-4.77 9-9.95h-2c0 4.07-3.05 7.43-7 7.92V13h4v-2h-4V7z"/></svg>';
      case 'sun':
        return '<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32l1.41 1.41M2 12h2m16 0h2M4.93 19.07l1.41-1.41m11.32-11.32l1.41-1.41" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
      case 'coffee':
        return '<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M20 3H4v10c0 2.21 1.79 4 4 4h6c2.21 0 4-1.79 4-4v-3h2c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 5h-2V5h2v3zM2 21h18v2H2z"/></svg>';
      case 'compass':
        return '<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="2"/><polygon points="12,6 15,12 12,18 9,12" fill="currentColor"/></svg>';
      default:
        return '<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="5"/></svg>';
    }
  }

  /**
   * Projects 3D marker coordinates onto 2D screen positions and dynamically
   * rescales marker rings so they remain "sticky" elements with a constant
   * apparent size on screen regardless of camera zoom distance or 2D/3D mode.
   */
  function updateMarkerBillboards() {
    if (!mapState.camera || !mapState.domElements.container) return;

    const camera = mapState.camera;
    const container = mapState.domElements.container;
    const halfW = container.clientWidth / 2;
    const halfH = container.clientHeight / 2;

    const tempV = new THREE.Vector3();
    const rotY = mapState.islandGroup ? mapState.islandGroup.rotation.y : -0.18;
    const deltaY = 1.7 - 2.20;

    markerBillboards.forEach((item) => {
      tempV.copy(item.baseLocalPos);
      tempV.applyAxisAngle(new THREE.Vector3(0, 1, 0), rotY);
      tempV.y += deltaY;

      // Distance from camera to marker in world space
      // Reference isometric distance is 30.0 units
      const dist = camera.position.distanceTo(tempV);
      const distScale = dist / 30.0;
      item.distScale = distScale;

      const userScale = item.userScale || 1.0;
      const finalScale = distScale * userScale;

      if (item.ringMesh) item.ringMesh.scale.set(finalScale, finalScale, finalScale);
      if (item.backingMesh) item.backingMesh.scale.set(finalScale, finalScale, finalScale);
      if (item.dotMesh) item.dotMesh.scale.set(finalScale, finalScale, finalScale);

      tempV.project(camera);

      // Check if behind camera
      if (tempV.z > 1.0) {
        item.element.style.display = 'none';
        return;
      }

      item.element.style.display = 'block';
      const x = (tempV.x * halfW) + halfW;
      const y = -(tempV.y * halfH) + halfH;

      item.element.style.transform = `translate(${x}px, ${y}px)`;
    });

    // Update road telemetry badges along highways (matching media_1789918872719.png)
    if (mapState.roadBadges && mapState.roadBadges.length > 0) {
      mapState.roadBadges.forEach(badge => {
        tempV.copy(badge.baseLocalPos);
        tempV.applyAxisAngle(new THREE.Vector3(0, 1, 0), rotY);
        tempV.y += deltaY + 0.12; // Float slightly above road
        tempV.project(camera);

        if (tempV.z > 1.0) {
          badge.element.style.display = 'none';
          return;
        }

        badge.element.style.display = 'flex';
        const bx = (tempV.x * halfW) + halfW;
        const by = -(tempV.y * halfH) + halfH;
        badge.element.style.transform = `translate(-50%, -50%) translate(${bx}px, ${by}px)`;
      });
    }
  }

  /**
   * Smoothly animates camera to focus on a clicked destination
   */
  function focusOnDestination(dest) {
    if (!mapState.camera || !mapState.controls) return;

    mapState.activeDestination = dest.id;
    const targetX = dest.xy[0];
    const targetZ = -dest.xy[1];

    const startPos = mapState.camera.position.clone();
    const endPos = new THREE.Vector3(targetX + 3, 11, targetZ + 12);

    const startTarget = mapState.controls.target.clone();
    const endTarget = new THREE.Vector3(targetX, 2, targetZ);

    animateCamera(startPos, endPos, startTarget, endTarget, 1000);
  }

  /**
   * Public helper to focus camera on a destination by its ID or name
   */
  function focusOnDestinationById(destId) {
    const geo = window.SRI_LANKA_GEO;
    if (!geo || !geo.destinations || !destId) return;
    const cleanQuery = destId.toLowerCase().replace(/[-_]/g, ' ').trim();
    const dest = geo.destinations.find(d => {
      const dId = d.id.toLowerCase().replace(/[-_]/g, ' ').trim();
      const dName = d.name.toLowerCase().replace(/[-_]/g, ' ').trim();
      const dTag = d.tag.toLowerCase().replace(/[-_]/g, ' ').trim();
      return (
        dId === cleanQuery ||
        dName === cleanQuery ||
        dTag === cleanQuery ||
        dName.includes(cleanQuery) ||
        dTag.includes(cleanQuery) ||
        cleanQuery.includes(dName) ||
        cleanQuery.includes(dId)
      );
    });
    if (dest) {
      focusOnDestination(dest);
      const marker = document.querySelector(`.map-hud-marker[data-dest-id="${dest.id}"]`);
      if (marker) {
        document.querySelectorAll('.map-hud-marker.is-active').forEach(m => m.classList.remove('is-active'));
        marker.classList.add('is-active');
        if (mapState.markerBillboards) {
          mapState.markerBillboards.forEach(b => {
            const isActive = (b.id === dest.id);
            b.userScale = isActive ? 1.25 : 1.0;
            const op = isActive ? 1.0 : 0.95;
            if (b.ringMesh) {
              b.ringMesh.material.opacity = op;
            }
          });
        }
      }
    }
  }
  mapState.focusOnDestinationById = focusOnDestinationById;

  /**
   * Creates the 25 official administrative districts overlay on the 3D map.
   * Renders translucent colored territory fills and glowing neon boundary borders.
   */
  function createWeatherDistrictOverlay(scene) {
    const districtsGroup = new THREE.Group();
    // Match islandGroup rotation and extrude depth
    districtsGroup.rotation.y = -0.18;
    districtsGroup.position.y = 1.7 - 2.20;

    const geo = window.SRI_LANKA_GEO;
    if (!geo || !geo.districts || !Array.isArray(geo.districts)) {
      console.warn('SRI_LANKA_GEO.districts not found.');
      return;
    }

    mapState.districtItems = [];
    mapState.districtFillMeshes = [];

    geo.districts.forEach((dist) => {
      // Compute bounding box for rainfall spawn
      let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
      dist.polygons.forEach((ring) => {
        ring.forEach((p) => {
          if (p[0] < minX) minX = p[0];
          if (p[0] > maxX) maxX = p[0];
          if (p[1] < minY) minY = p[1];
          if (p[1] > maxY) maxY = p[1];
        });
      });
      dist.bbox = { minX, maxX, minY, maxY };

      const fillMeshes = [];
      const lineLoops = [];

      dist.polygons.forEach((ring) => {
        if (!ring || ring.length < 3) return;

        // 1. Territory Shape Fill
        const shape = new THREE.Shape();
        shape.moveTo(ring[0][0], ring[0][1]);
        for (let i = 1; i < ring.length; i++) {
          shape.lineTo(ring[i][0], ring[i][1]);
        }
        shape.closePath();

        const fillGeo = new THREE.ShapeGeometry(shape);
        const fillMat = new THREE.MeshBasicMaterial({
          color: 0xef4444, // will be updated by updateWeatherForDate
          transparent: true,
          opacity: 0.28,
          side: THREE.DoubleSide,
          depthWrite: false,
          polygonOffset: true,
          polygonOffsetFactor: -2,
          polygonOffsetUnits: -2
        });

        const fillMesh = new THREE.Mesh(fillGeo, fillMat);
        fillMesh.rotation.x = -Math.PI / 2;
        fillMesh.position.y = 2.215;
        fillMesh.renderOrder = 25;
        fillMesh.userData = { district: dist };
        districtsGroup.add(fillMesh);
        fillMeshes.push(fillMesh);
        mapState.districtFillMeshes.push(fillMesh);

        // 2. Neon Boundary Line Loop
        const linePts = ring.map(p => new THREE.Vector3(p[0], 2.22, -p[1]));
        const lineGeo = new THREE.BufferGeometry().setFromPoints(linePts);
        const lineMat = new THREE.LineBasicMaterial({
          color: 0xff2a5f,
          linewidth: 2.0,
          transparent: true,
          opacity: 0.85
        });

        const lineLoop = new THREE.LineLoop(lineGeo, lineMat);
        lineLoop.renderOrder = 26;
        districtsGroup.add(lineLoop);
        lineLoops.push(lineLoop);
      });

      mapState.districtItems.push({
        district: dist,
        fillMeshes,
        lineLoops
      });
    });

    scene.add(districtsGroup);
    mapState.districtsGroup = districtsGroup;
  }

  /**
   * Helper to get a random 3D spawn position over currently wet districts
   */
  function getRandomRainSpawnPoint() {
    const wet = (mapState.activeWetDistricts && mapState.activeWetDistricts.length > 0)
      ? mapState.activeWetDistricts
      : (window.SRI_LANKA_GEO && window.SRI_LANKA_GEO.districts ? window.SRI_LANKA_GEO.districts : []);

    if (wet.length === 0) {
      return { x: 0, z: 0 };
    }

    const dist = wet[Math.floor(Math.random() * wet.length)];
    if (!dist.bbox) {
      return { x: dist.centroid[0], z: -dist.centroid[1] };
    }

    const x = dist.bbox.minX + Math.random() * (dist.bbox.maxX - dist.bbox.minX);
    const z = -(dist.bbox.minY + Math.random() * (dist.bbox.maxY - dist.bbox.minY));
    return { x, z };
  }

  /**
   * Creates a dynamic rainfall particle system over wet/unsuitable districts.
   * Uses realistic falling line streaks with monsoon wind tilt.
   */
  function createRainfallParticleSystem(scene) {
    const weatherRainGroup = new THREE.Group();
    weatherRainGroup.rotation.y = -0.18;
    weatherRainGroup.position.y = 1.7 - 2.20;

    const rainCount = 1800;
    const positions = new Float32Array(rainCount * 2 * 3); // 2 vertices per streak
    const speeds = new Float32Array(rainCount);
    const streakLength = 0.50;

    for (let i = 0; i < rainCount; i++) {
      speeds[i] = 0.16 + Math.random() * 0.14; // Fall speed
      const spawn = getRandomRainSpawnPoint();
      const y = 2.22 + Math.random() * 6.5;

      // Top vertex
      positions[i * 6] = spawn.x;
      positions[i * 6 + 1] = y;
      positions[i * 6 + 2] = spawn.z;

      // Bottom vertex (angled slightly with wind)
      positions[i * 6 + 3] = spawn.x - 0.04;
      positions[i * 6 + 4] = y - streakLength;
      positions[i * 6 + 5] = spawn.z + 0.04;
    }

    const rainGeo = new THREE.BufferGeometry();
    rainGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const rainMat = new THREE.LineBasicMaterial({
      color: 0x60a5fa,
      linewidth: 1.5,
      transparent: true,
      opacity: 0.70,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    const rainLines = new THREE.LineSegments(rainGeo, rainMat);
    rainLines.renderOrder = 30;
    weatherRainGroup.add(rainLines);

    scene.add(weatherRainGroup);
    mapState.weatherRainGroup = weatherRainGroup;
    mapState.rainParticlesGeo = rainGeo;
    mapState.rainSpeeds = speeds;
    mapState.streakLength = streakLength;
  }

  /**
   * Updates district territory colors, borders, and rainfall simulation
   * based on the arrival date / month.
   */
  function updateWeatherForDate(dateStr) {
    if (!dateStr) return;
    const parts = dateStr.split('-');
    const month = (parts.length >= 2) ? parseInt(parts[1], 10) : 8;
    mapState.currentWeatherMonth = month;

    const wetDistricts = [];

    if (mapState.districtItems && mapState.districtItems.length > 0) {
      mapState.districtItems.forEach((item) => {
        const dist = item.district;
        const climate = (dist.monthly && dist.monthly[month - 1]) ? dist.monthly[month - 1] : null;
        if (!climate) return;

        let fillColor, fillOpacity, lineColor, lineOpacity;

        if (climate.status === 'unsuitable') {
          // RED: Monsoon / Flooding / Rough Seas / Landslides
          fillColor = 0xef4444;
          fillOpacity = 0.35;
          lineColor = 0xff2a5f;
          lineOpacity = 0.95;
          wetDistricts.push(dist);
        } else if (climate.status === 'moderate') {
          // AMBER: Convectional afternoon thunderstorms
          fillColor = 0xf59e0b;
          fillOpacity = 0.22;
          lineColor = 0xfbbf24;
          lineOpacity = 0.75;
          wetDistricts.push(dist);
        } else {
          // GREEN / CYAN: Favorable / Peak Dry Season
          fillColor = 0x10b981;
          fillOpacity = 0.12;
          lineColor = 0x34d399;
          lineOpacity = 0.50;
        }

        item.fillMeshes.forEach((mesh) => {
          mesh.material.color.setHex(fillColor);
          mesh.material.opacity = fillOpacity;
          mesh.material.needsUpdate = true;
        });

        item.lineLoops.forEach((loop) => {
          loop.material.color.setHex(lineColor);
          loop.material.opacity = lineOpacity;
          loop.material.needsUpdate = true;
        });
      });
    }

    mapState.activeWetDistricts = wetDistricts;

    // Adjust rain particle visibility and opacity based on wetness
    if (mapState.weatherRainGroup) {
      const hasRain = (wetDistricts.length > 0);
      mapState.weatherRainGroup.visible = mapState.isWeatherOverlayActive && hasRain;
    }
  }
  mapState.updateWeatherForDate = updateWeatherForDate;
  window.updateMapWeather = updateWeatherForDate;

  /**
   * Sets up interactive HUD listeners (Route Filter, Auto-Rotate, 3D/2D, Reset, Zoom)
   */
  function setupHUDEventListeners() {
    const dom = mapState.domElements;

    // 0. Visual Theme Mood Toggle (Cycles: Light -> Dark -> Emerald -> Light)
    const btnMood = document.getElementById('map-btn-mood-toggle');
    if (btnMood) {
      btnMood.addEventListener('click', () => {
        const moodOrder = ['light', 'dark', 'emerald'];
        const currentIndex = moodOrder.indexOf(mapState.currentMood);
        const nextMood = moodOrder[(currentIndex + 1) % moodOrder.length];
        setMapMood(nextMood);
      });
    }

    // 0a. Dismiss active tactical callout markers when clicking empty map background
    if (dom.container) {
      dom.container.addEventListener('click', (e) => {
        if (!e.target.closest('.map-hud-marker')) {
          document.querySelectorAll('.map-hud-marker.is-active').forEach(m => m.classList.remove('is-active'));
          if (mapState.markerBillboards) {
            mapState.markerBillboards.forEach(b => {
              b.userScale = 1.0;
              if (b.ringMesh) {
                b.ringMesh.material.opacity = 0.95;
              }
            });
          }
        }
      });
    }

    // 0b. 25 Districts Weather & Monsoon Radar Toggle
    const btnWeather = document.getElementById('map-btn-weather-toggle');
    if (btnWeather) {
      btnWeather.addEventListener('click', () => {
        mapState.isWeatherOverlayActive = !mapState.isWeatherOverlayActive;
        btnWeather.classList.toggle('active', mapState.isWeatherOverlayActive);
        if (mapState.districtsGroup) {
          mapState.districtsGroup.visible = mapState.isWeatherOverlayActive;
        }
        if (mapState.weatherRainGroup) {
          mapState.weatherRainGroup.visible = mapState.isWeatherOverlayActive && (mapState.activeWetDistricts.length > 0);
        }
      });
    }

    // 1. Route Filter Dropdown
    if (dom.routeFilter) {
      dom.routeFilter.addEventListener('change', (e) => {
        applyRouteFilter(e.target.value);
      });
    }

    // 1b. Terrain / Satellite Layer Toggle
    if (dom.btnLayerToggle) {
      dom.btnLayerToggle.addEventListener('click', () => {
        const isCurrentlySatellite = dom.btnLayerToggle.classList.contains('active');
        const nextLayer = isCurrentlySatellite ? 'terrain' : 'satellite';
        if (mapState.textures && mapState.textures[nextLayer] && mapState.topMaterial) {
          mapState.topMaterial.map = mapState.textures[nextLayer];
          mapState.topMaterial.needsUpdate = true;
        }
        dom.btnLayerToggle.classList.toggle('active', !isCurrentlySatellite);
        const iconSpan = dom.btnLayerToggle.querySelector('.btn-icon');
        const labelSpan = dom.btnLayerToggle.querySelector('#map-layer-label') || dom.btnLayerToggle.querySelector('.btn-label');
        if (iconSpan) iconSpan.innerHTML = isCurrentlySatellite ? HUD_CIRCULAR_ICONS.terrain : HUD_CIRCULAR_ICONS.satellite;
        if (labelSpan) labelSpan.textContent = isCurrentlySatellite ? 'Terrain' : 'Satellite';
      });
    }

    // 2. Auto-Rotate Toggle
    if (dom.btnAutoRotate) {
      dom.btnAutoRotate.addEventListener('click', () => {
        mapState.autoRotate = !mapState.autoRotate;
        dom.btnAutoRotate.classList.toggle('active', mapState.autoRotate);
      });
    }

    // 3. 3D / 2D Perspective Toggle
    if (dom.btnViewToggle) {
      dom.btnViewToggle.addEventListener('click', () => {
        if (mapState.isCameraAnimating) return;
        mapState.is2DView = !mapState.is2DView;
        dom.btnViewToggle.classList.toggle('active', mapState.is2DView);
        const iconSpan = dom.btnViewToggle.querySelector('.btn-icon');
        if (iconSpan) iconSpan.innerHTML = mapState.is2DView ? HUD_CIRCULAR_ICONS.view3D : HUD_CIRCULAR_ICONS.plan2D;
        dom.btnViewToggle.querySelector('.btn-label').textContent = mapState.is2DView ? '3D View' : '2D Plan';

        updateInteractionHint(mapState.is2DView);

        let targetPos, targetLook;
        if (mapState.is2DView) {
          const dist = get2DCameraDistance();
          targetPos = new THREE.Vector3(0, dist, 0.05);
          targetLook = new THREE.Vector3(0, 1.2, 0);
        } else {
          targetPos = new THREE.Vector3(CAMERA_POSES.isometric.position.x, CAMERA_POSES.isometric.position.y, CAMERA_POSES.isometric.position.z);
          targetLook = new THREE.Vector3(CAMERA_POSES.isometric.target.x, CAMERA_POSES.isometric.target.y, CAMERA_POSES.isometric.target.z);
        }

        const startRotY = mapState.islandGroup ? mapState.islandGroup.rotation.y : (mapState.is2DView ? -0.18 : 0.0);
        const endRotY = mapState.is2DView ? 0.0 : -0.18;

        animateCamera(
          mapState.camera.position.clone(),
          targetPos,
          mapState.controls.target.clone(),
          targetLook,
          850,
          startRotY,
          endRotY,
          () => {
            applyNavigationLimits(mapState.is2DView);
          }
        );
      });
    }

    // 4. Reset View Button
    if (dom.btnResetView) {
      dom.btnResetView.addEventListener('click', () => {
        if (mapState.isCameraAnimating) return;
        mapState.is2DView = false;
        mapState.autoRotate = false;
        if (dom.btnAutoRotate) dom.btnAutoRotate.classList.remove('active');
        if (dom.btnViewToggle) {
          dom.btnViewToggle.classList.remove('active');
          dom.btnViewToggle.querySelector('.btn-label').textContent = '2D Plan';
          const iconSpan = dom.btnViewToggle.querySelector('.btn-icon');
          if (iconSpan) iconSpan.innerHTML = HUD_CIRCULAR_ICONS.plan2D;
        }

        updateInteractionHint(false);

        const startRotY = mapState.islandGroup ? mapState.islandGroup.rotation.y : 0.0;
        const endRotY = -0.18;

        const pose = CAMERA_POSES.isometric;
        animateCamera(
          mapState.camera.position.clone(),
          new THREE.Vector3(pose.position.x, pose.position.y, pose.position.z),
          mapState.controls.target.clone(),
          new THREE.Vector3(pose.target.x, pose.target.y, pose.target.z),
          800,
          startRotY,
          endRotY,
          () => {
            applyNavigationLimits(false);
          }
        );
      });
    }

    // 5. In-Canvas Zoom Buttons
    if (dom.btnZoomIn) {
      dom.btnZoomIn.addEventListener('click', () => {
        zoomCamera(-0.25);
      });
    }
    if (dom.btnZoomOut) {
      dom.btnZoomOut.addEventListener('click', () => {
        zoomCamera(0.25);
      });
    }
  }

  /**
   * Synchronously sets Y-rotation for all 3D island groups to maintain alignment
   */
  function setIslandRotationY(rotY) {
    if (mapState.islandGroup) mapState.islandGroup.rotation.y = rotY;
    if (mapState.routesGroup) mapState.routesGroup.rotation.y = rotY;
    if (mapState.markersGroup) mapState.markersGroup.rotation.y = rotY;
    if (mapState.districtsGroup) mapState.districtsGroup.rotation.y = rotY;
    if (mapState.weatherRainGroup) mapState.weatherRainGroup.rotation.y = rotY;
  }

  /**
   * Filters displayed routes and markers based on selected itinerary trail
   */
  function applyRouteFilter(filterVal) {
    mapState.activeFilter = filterVal;

    const filterMap = {
      'all': null,
      'classic': ['airport', 'colombo', 'kandy', 'nuwara-eliya', 'ella', 'yala', 'galle', 'mirissa'],
      'cultural': ['sigiriya', 'dambulla', 'anuradhapura', 'kandy'],
      'southern': ['airport', 'colombo', 'galle', 'mirissa', 'yala'],
      'highlands': ['kandy', 'nuwara-eliya', 'ella'],
      'northern': ['anuradhapura', 'jaffna', 'trincomalee']
    };

    const allowedDestIds = filterMap[filterVal];

    markerBillboards.forEach((item) => {
      const isVisible = (!allowedDestIds || allowedDestIds.includes(item.id));
      item.element.style.opacity = isVisible ? '1' : '0.22';
      item.element.style.pointerEvents = isVisible ? 'auto' : 'none';
    });
  }

  /**
   * Incremental zoom helper
   */
  function zoomCamera(delta) {
    if (!mapState.camera || !mapState.controls) return;
    const offset = new THREE.Vector3().subVectors(mapState.camera.position, mapState.controls.target);
    const newLength = THREE.MathUtils.clamp(offset.length() * (1 + delta), mapState.controls.minDistance, mapState.controls.maxDistance);
    offset.setLength(newLength);
    mapState.camera.position.copy(mapState.controls.target).add(offset);
  }

  /**
   * Smooth camera animation tween helper using spherical coordinate interpolation
   * to eliminate gimbal lock, screen-roll snapping, and orientation jumps.
   */
  function animateCamera(startPos, endPos, startTarget, endTarget, duration, startRotY, endRotY, onComplete) {
    if (typeof startRotY === 'function') {
      onComplete = startRotY;
      startRotY = undefined;
      endRotY = undefined;
    }

    mapState.isCameraAnimating = true;
    if (mapState.controls) {
      mapState.controls.enabled = false;
    }

    const startTime = performance.now();

    // Compute start & end offsets relative to respective targets
    const startOffset = new THREE.Vector3().subVectors(startPos, startTarget);
    const endOffset = new THREE.Vector3().subVectors(endPos, endTarget);

    const startRadius = Math.max(startOffset.length(), 0.001);
    const endRadius = Math.max(endOffset.length(), 0.001);

    const startPhi = Math.max(0.0001, Math.acos(THREE.MathUtils.clamp(startOffset.y / startRadius, -1, 1)));
    const endPhi = Math.max(0.0001, Math.acos(THREE.MathUtils.clamp(endOffset.y / endRadius, -1, 1)));

    let startTheta = Math.atan2(startOffset.x, startOffset.z);
    let endTheta = Math.atan2(endOffset.x, endOffset.z);

    // If directly overhead, azimuth relative to True North is strictly 0.0 (prevents branch-cut PI flips)
    if (Math.hypot(startOffset.x, startOffset.z) < 0.15) {
      startTheta = 0.0;
    }
    if (Math.hypot(endOffset.x, endOffset.z) < 0.15) {
      endTheta = 0.0;
    }

    // Shortest path for azimuth rotation
    let dTheta = (endTheta - startTheta) % (Math.PI * 2);
    if (dTheta > Math.PI) dTheta -= Math.PI * 2;
    if (dTheta < -Math.PI) dTheta += Math.PI * 2;

    const curTarget = new THREE.Vector3();

    function step(now) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1.0);
      // Cubic ease-out
      const ease = 1 - Math.pow(1 - progress, 3);

      const curRadius = THREE.MathUtils.lerp(startRadius, endRadius, ease);
      const curPhi = THREE.MathUtils.lerp(startPhi, endPhi, ease);
      const curTheta = startTheta + dTheta * ease;

      curTarget.lerpVectors(startTarget, endTarget, ease);

      const sinPhi = Math.sin(curPhi);
      const curX = curTarget.x + curRadius * sinPhi * Math.sin(curTheta);
      const curY = curTarget.y + curRadius * Math.cos(curPhi);
      const curZ = curTarget.z + curRadius * sinPhi * Math.cos(curTheta);

      mapState.camera.position.set(curX, curY, curZ);
      mapState.controls.target.copy(curTarget);
      mapState.camera.lookAt(curTarget);

      if (startRotY !== undefined && endRotY !== undefined) {
        const curRotY = THREE.MathUtils.lerp(startRotY, endRotY, ease);
        setIslandRotationY(curRotY);
      }

      if (progress < 1.0) {
        requestAnimationFrame(step);
      } else {
        // Ensure final exact values
        mapState.camera.position.copy(endPos);
        mapState.controls.target.copy(endTarget);
        mapState.camera.lookAt(endTarget);

        if (startRotY !== undefined && endRotY !== undefined) {
          setIslandRotationY(endRotY);
        }

        // Apply new limits / mode settings BEFORE re-enabling controls to avoid clamping snaps
        if (typeof onComplete === 'function') {
          onComplete();
        }

        if (mapState.controls) {
          mapState.controls.enabled = true;
          mapState.controls.update();
        }
        mapState.isCameraAnimating = false;
      }
    }

    requestAnimationFrame(step);
  }

  function onWindowResize() {
    const container = mapState.domElements.container;
    if (!container || !mapState.camera || !mapState.renderer) return;

    const width = container.clientWidth;
    const height = container.clientHeight;
    if (width === 0 || height === 0) return;

    mapState.camera.aspect = width / height;
    mapState.camera.updateProjectionMatrix();

    mapState.renderer.setSize(width, height);
  }

  /**
   * Main 60fps Animation Loop
   */
  function animate() {
    requestAnimationFrame(animate);

    // 1. Continuous Background Motion Graphic Rotation (media_1789756231614.png)
    if (mapState.primaryMotionRing) {
      mapState.primaryMotionRing.rotation.z -= 0.0055; // Smooth continuous clockwise motion graphic rotation
    }

    // 1-road. Animated Tactical Traffic Flow on Highway Ribbons (media_1789918814688.png)
    if (mapState.roadTexture) {
      mapState.roadTexture.offset.y -= 0.0015; // Smooth continuous traffic dash flow
    }

    // 1a. Destination Radar Pulse Wave Animation (Eye-grabbing tactical beacons)
    if (mapState.pulseRings && mapState.pulseRings.length > 0) {
      const t = performance.now() * 0.0018;
      const count = mapState.pulseRings.length;
      for (let i = 0; i < count; i++) {
        const p = mapState.pulseRings[i];
        const phase = (t + p.baseIdx * 0.28) % 2.0;
        const prog = phase / 2.0;
        const distScale = p.item && p.item.distScale ? p.item.distScale : 1.0;
        const s = (1.0 + prog * 0.85) * distScale;
        p.mesh.scale.set(s, s, s);
        p.material.opacity = Math.pow(1.0 - prog, 1.5) * 0.75;
      }
    }

    // 1b. Dynamic Monsoon Rainfall Animation
    if (mapState.isWeatherOverlayActive && mapState.rainParticlesGeo && mapState.weatherRainGroup && mapState.weatherRainGroup.visible) {
      const pos = mapState.rainParticlesGeo.attributes.position.array;
      const speeds = mapState.rainSpeeds;
      const streakLength = mapState.streakLength || 0.50;
      const count = speeds.length;
      const isSWM = (mapState.currentWeatherMonth >= 5 && mapState.currentWeatherMonth <= 9);
      const windX = isSWM ? -0.05 : 0.04;
      const windZ = isSWM ? 0.05 : -0.04;

      for (let i = 0; i < count; i++) {
        const speed = speeds[i];
        pos[i * 6 + 1] -= speed;     // Top Y
        pos[i * 6 + 4] -= speed;     // Bottom Y
        pos[i * 6] += windX * 0.15;   // Top X
        pos[i * 6 + 3] += windX * 0.15; // Bottom X

        // When bottom hits terrain level
        if (pos[i * 6 + 4] < 2.22) {
          const spawn = getRandomRainSpawnPoint();
          const newY = 7.2 + Math.random() * 2.8;
          pos[i * 6] = spawn.x;
          pos[i * 6 + 1] = newY;
          pos[i * 6 + 2] = spawn.z;
          pos[i * 6 + 3] = spawn.x + windX;
          pos[i * 6 + 4] = newY - streakLength;
          pos[i * 6 + 5] = spawn.z + windZ;
        }
      }
      mapState.rainParticlesGeo.attributes.position.needsUpdate = true;
    }

    // 2. Cinematic Surveillance Auto-Scan (when enabled)
    if (mapState.autoRotate && mapState.controls && !mapState.is2DView && !mapState.isCameraAnimating) {
      // Oscillate gracefully within tactical azimuth arc (prevents spinning into confusing reverse views)
      const t = performance.now() * 0.00045;
      const centerAzimuth = 0.25; // ~14.3° (default south-southwest vantage)
      const sweepRange = 0.65;    // sweeps smoothly between -0.40 rad and +0.90 rad
      const targetAzimuth = centerAzimuth + Math.sin(t) * sweepRange;

      const offset = new THREE.Vector3().subVectors(mapState.camera.position, mapState.controls.target);
      const radius = THREE.MathUtils.clamp(offset.length(), NAV_LIMITS['3d'].minDistance, NAV_LIMITS['3d'].maxDistance);
      const polar = THREE.MathUtils.clamp(Math.acos(offset.y / Math.max(radius, 0.001)), NAV_LIMITS['3d'].minPolarAngle, NAV_LIMITS['3d'].maxPolarAngle);

      mapState.camera.position.x = mapState.controls.target.x + radius * Math.sin(polar) * Math.sin(targetAzimuth);
      mapState.camera.position.y = mapState.controls.target.y + radius * Math.cos(polar);
      mapState.camera.position.z = mapState.controls.target.z + radius * Math.sin(polar) * Math.cos(targetAzimuth);
    }

    // 3. Enforce tactical pan bounding box on controls.target so Sri Lanka never leaves the viewport
    if (mapState.controls && !mapState.isCameraAnimating) {
      const cfg = mapState.is2DView ? NAV_LIMITS['2d'] : NAV_LIMITS['3d'];
      const prevX = mapState.controls.target.x;
      const prevY = mapState.controls.target.y;
      const prevZ = mapState.controls.target.z;

      const clampedX = THREE.MathUtils.clamp(prevX, cfg.panBounds.minX, cfg.panBounds.maxX);
      const clampedY = THREE.MathUtils.clamp(prevY, cfg.panBounds.minY, cfg.panBounds.maxY);
      const clampedZ = THREE.MathUtils.clamp(prevZ, cfg.panBounds.minZ, cfg.panBounds.maxZ);

      const dx = clampedX - prevX;
      const dy = clampedY - prevY;
      const dz = clampedZ - prevZ;

      if (dx !== 0 || dy !== 0 || dz !== 0) {
        mapState.controls.target.set(clampedX, clampedY, clampedZ);
        mapState.camera.position.x += dx;
        mapState.camera.position.y += dy;
        mapState.camera.position.z += dz;
      }

      if (mapState.is2DView) {
        // Enforce upright True-North alignment in 2D mode: camera x & z lock with target
        mapState.camera.position.x = mapState.controls.target.x;
        mapState.camera.position.z = mapState.controls.target.z + 0.05;
        mapState.camera.lookAt(mapState.controls.target);
      }

      mapState.controls.update();
    }

    // Project 3D coordinates to 2D HTML badges and update sticky marker scales
    updateMarkerBillboards();

    mapState.renderer.render(mapState.scene, mapState.camera);
  }

})();
