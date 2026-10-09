/**
 * SunBird - 3D Vehicle Showcase Module
 * Features:
 * - High-fidelity WebGL 3D interactive viewer for Car (Toyota Prius) and Van (Toyota HiAce)
 * - Animated rotating motion graphic turntable ring matching tactical 3D cyber map aesthetic
 * - Smooth mouse/touch drag-to-rotate inspection
 * - Carousel navigation (< Car > / < Van >) matching media_1790351351159.png
 * - Automatic default vehicle selection based on Pax count (1-3 Pax -> Car, 4+ Pax -> Van)
 * - Dynamic Pax capacity visualization, seat occupancy indicators, and recommendation badges
 */

(function () {
  'use strict';

  // Vehicle specifications database
  const VEHICLES = [
    {
      id: 'car',
      name: 'Car',
      fullName: 'Toyota Prius Hybrid',
      type: 'Sedan / Hybrid',
      maxPax: 3,
      luggage: '2 - 3 Bags',
      rate: '$55 / day',
      features: 'Prius Hybrid • Dual A/C',
      typeIcon: '⚡',
      modelType: 'glb',
      modelPath: 'Vehicles/Prius Car/source/toyota_prius_2012.glb',
      baseScale: 3.5,
      rotationY: -Math.PI * 0.72,
      cameraPos: { x: 0, y: 1.8, z: 5.4 },
      targetLook: { x: 0, y: 0.6, z: 0 }
    },
    {
      id: 'van',
      name: 'Van',
      fullName: 'Toyota HiAce Luxury KDH',
      type: 'High-Roof Passenger Van',
      maxPax: 10,
      luggage: '8 - 10 Bags',
      rate: '$95 / day',
      features: 'High Roof • Dual A/C',
      typeIcon: '🚐',
      modelType: 'obj',
      objPath: 'Vehicles/Van/source/hiace/Hiace.obj',
      texturePath: 'Vehicles/Van/source/hiace/Hiace_Base.png',
      baseScale: 3.5,
      rotationY: Math.PI * 0.28,
      cameraPos: { x: 0, y: 2.0, z: 5.6 },
      targetLook: { x: 0, y: 0.7, z: 0 }
    }
  ];

  let currentIndex = 0;
  let initialized = false;
  let isUserOverridden = false;

  // Three.js instances
  let scene, camera, renderer, animationFrameId;
  let canvasWrapper, canvasElement;
  let motionRingMesh, shadowMesh;
  const loadedModels = {}; // Cache for preloaded Three.js groups
  let activeVehicleGroup = null;

  // Interaction controls
  let isDragging = false;
  let prevMouseX = 0;
  let userRotY = 0;
  let autoRotateSpeed = 0.003;
  let lastTime = 0;

  /**
   * Initializes the 3D Vehicle Showcase module
   */
  function initVehicleShowcase() {
    if (initialized) {
      updateShowcaseForCurrentState();
      return;
    }

    canvasWrapper = document.getElementById('vehicle-canvas-wrapper');
    canvasElement = document.getElementById('vehicle-3d-canvas');
    if (!canvasWrapper || !canvasElement || typeof THREE === 'undefined') {
      return;
    }

    setupThreeScene();
    setupEventListeners();
    preloadVehicleModels();

    initialized = true;

    // Synchronize initial state
    updateShowcaseForCurrentState();
  }

  /**
   * Builds Three.js scene, cameras, lighting, turntable ring & shadow
   */
  function setupThreeScene() {
    scene = new THREE.Scene();

    const width = canvasWrapper.clientWidth || 600;
    const height = canvasWrapper.clientHeight || 270;

    camera = new THREE.PerspectiveCamera(32, width / height, 0.1, 100);
    camera.position.set(0, 1.85, 5.5);
    camera.lookAt(0, 0.65, 0);

    renderer = new THREE.WebGLRenderer({
      canvas: canvasElement,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setClearColor(0x000000, 0); // Transparent to blend seamlessly

    // Lighting
    const ambLight = new THREE.AmbientLight(0xffffff, 1.4);
    scene.add(ambLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.6);
    dirLight.position.set(4, 8, 5);
    scene.add(dirLight);

    const rimLight = new THREE.DirectionalLight(0x38bdf8, 1.0);
    rimLight.position.set(-5, 3, -4);
    scene.add(rimLight);

    const groundBounce = new THREE.DirectionalLight(0x1e293b, 0.4);
    groundBounce.position.set(0, -4, 0);
    scene.add(groundBounce);

    // Ground Shadow Disc
    const shadowGeo = new THREE.PlaneGeometry(3.6, 3.6);
    shadowGeo.rotateX(-Math.PI / 2);
    const sCan = document.createElement('canvas');
    sCan.width = 256;
    sCan.height = 256;
    const sCtx = sCan.getContext('2d');
    const sGrad = sCtx.createRadialGradient(128, 128, 20, 128, 128, 120);
    sGrad.addColorStop(0, 'rgba(5, 8, 17, 0.88)');
    sGrad.addColorStop(0.6, 'rgba(5, 8, 17, 0.45)');
    sGrad.addColorStop(1, 'rgba(5, 8, 17, 0)');
    sCtx.fillStyle = sGrad;
    sCtx.fillRect(0, 0, 256, 256);
    const sTex = new THREE.CanvasTexture(sCan);
    shadowMesh = new THREE.Mesh(
      shadowGeo,
      new THREE.MeshBasicMaterial({ map: sTex, transparent: true, depthWrite: false })
    );
    shadowMesh.position.y = 0.001;
    scene.add(shadowMesh);

    // Procedural Motion Graphic Turntable Ring
    const ringTex = createMotionGraphicRingTexture();
    const ringGeo = new THREE.PlaneGeometry(3.8, 3.8);
    ringGeo.rotateX(-Math.PI / 2);
    const ringMat = new THREE.MeshBasicMaterial({
      map: ringTex,
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false
    });
    motionRingMesh = new THREE.Mesh(ringGeo, ringMat);
    motionRingMesh.position.y = 0.005;
    scene.add(motionRingMesh);

    // Start Animation Loop
    animate();
  }

  /**
   * Generates a high-tech tactical motion graphic turntable ring texture
   */
  function createMotionGraphicRingTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    const cx = 256, cy = 256;

    ctx.clearRect(0, 0, 512, 512);

    // Outer subtle glowing perimeter
    ctx.beginPath();
    ctx.arc(cx, cy, 240, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.35)';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Main high-chroma ring (matching media_1790351351159.png)
    ctx.beginPath();
    ctx.arc(cx, cy, 215, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(147, 197, 253, 0.82)';
    ctx.lineWidth = 14;
    ctx.stroke();

    // Segmented radar tick marks
    const numTicks = 48;
    for (let i = 0; i < numTicks; i++) {
      const angle = (i / numTicks) * Math.PI * 2;
      const isMajor = i % 4 === 0;
      const r1 = isMajor ? 186 : 194;
      const r2 = 202;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(angle) * r1, cy + Math.sin(angle) * r1);
      ctx.lineTo(cx + Math.cos(angle) * r2, cy + Math.sin(angle) * r2);
      ctx.strokeStyle = isMajor ? 'rgba(56, 189, 248, 0.95)' : 'rgba(255, 255, 255, 0.4)';
      ctx.lineWidth = isMajor ? 3 : 1.5;
      ctx.stroke();
    }

    // 4 glowing cardinal brackets
    for (let i = 0; i < 4; i++) {
      const a = (i * Math.PI) / 2;
      ctx.beginPath();
      ctx.arc(cx, cy, 242, a - 0.16, a + 0.16);
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 5;
      ctx.stroke();
    }

    // Inner subtle tech circle
    ctx.beginPath();
    ctx.arc(cx, cy, 160, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.25)';
    ctx.lineWidth = 2;
    ctx.stroke();

    const tex = new THREE.CanvasTexture(canvas);
    tex.anisotropy = 8;
    return tex;
  }

  function base64ToArrayBuffer(base64) {
    const binary_string = window.atob(base64);
    const len = binary_string.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binary_string.charCodeAt(i);
    }
    return bytes.buffer;
  }

  /**
   * Preloads both Car and Van models into memory
   */
  function preloadVehicleModels() {
    // 1. Preload Car (Prius GLB)
    if (window.VEHICLE_DATA && window.VEHICLE_DATA.priusGlbBase64 && THREE.GLTFLoader) {
      try {
        const gltfLoader = new THREE.GLTFLoader();
        const buffer = base64ToArrayBuffer(window.VEHICLE_DATA.priusGlbBase64);
        gltfLoader.parse(
          buffer,
          '',
          (gltf) => {
            const model = gltf.scene;
            const wrapper = new THREE.Group();
            wrapper.add(model);

            const box = new THREE.Box3().setFromObject(wrapper);
            const center = box.getCenter(new THREE.Vector3());
            const size = box.getSize(new THREE.Vector3());

            model.position.x = -center.x;
            model.position.y = -box.min.y; // Sit directly on floor y=0
            model.position.z = -center.z;

            const maxDim = Math.max(size.x, size.y, size.z);
            const scale = VEHICLES[0].baseScale / maxDim;
            wrapper.scale.setScalar(scale);
            wrapper.rotation.y = VEHICLES[0].rotationY;

            loadedModels['car'] = wrapper;

            if (currentIndex === 0) {
              displayVehicleModel(0);
            }
          },
          (err) => console.warn('Vehicle GLB parse error:', err)
        );
      } catch (e) {
        console.warn('Prius in-memory load error:', e);
      }
    } else if (THREE.GLTFLoader) {
      const gltfLoader = new THREE.GLTFLoader();
      gltfLoader.load(
        VEHICLES[0].modelPath,
        (gltf) => {
          const model = gltf.scene;
          const wrapper = new THREE.Group();
          wrapper.add(model);

          const box = new THREE.Box3().setFromObject(wrapper);
          const center = box.getCenter(new THREE.Vector3());
          const size = box.getSize(new THREE.Vector3());

          model.position.x = -center.x;
          model.position.y = -box.min.y; // Sit directly on floor y=0
          model.position.z = -center.z;

          const maxDim = Math.max(size.x, size.y, size.z);
          const scale = VEHICLES[0].baseScale / maxDim;
          wrapper.scale.setScalar(scale);
          wrapper.rotation.y = VEHICLES[0].rotationY;

          loadedModels['car'] = wrapper;

          // If car is currently active, display it
          if (currentIndex === 0) {
            displayVehicleModel(0);
          }
        },
        undefined,
        (err) => console.warn('Vehicle GLB load error:', err)
      );
    }

    // 2. Preload Van (HiAce OBJ + Texture)
    if (window.VEHICLE_DATA && window.VEHICLE_DATA.hiaceObjText && THREE.OBJLoader) {
      try {
        const texLoader = new THREE.TextureLoader();
        const texData = window.VEHICLE_DATA.hiaceTextureBase64 || VEHICLES[1].texturePath;
        texLoader.load(texData, (texture) => {
          texture.flipY = true;
          const mat = new THREE.MeshStandardMaterial({
            map: texture,
            roughness: 0.45,
            metalness: 0.15
          });

          const objLoader = new THREE.OBJLoader();
          const obj = objLoader.parse(window.VEHICLE_DATA.hiaceObjText);
          obj.traverse((child) => {
            if (child.isMesh) {
              child.material = mat;
            }
          });

          const wrapper = new THREE.Group();
          wrapper.add(obj);

          const box = new THREE.Box3().setFromObject(wrapper);
          const center = box.getCenter(new THREE.Vector3());
          const size = box.getSize(new THREE.Vector3());

          obj.position.x = -center.x;
          obj.position.y = -box.min.y;
          obj.position.z = -center.z;

          const maxDim = Math.max(size.x, size.y, size.z);
          const scale = VEHICLES[1].baseScale / maxDim;
          wrapper.scale.setScalar(scale);
          wrapper.rotation.y = VEHICLES[1].rotationY;

          loadedModels['van'] = wrapper;

          if (currentIndex === 1) {
            displayVehicleModel(1);
          }
        });
      } catch (e) {
        console.warn('HiAce in-memory load error:', e);
      }
    } else if (THREE.OBJLoader) {
      const texLoader = new THREE.TextureLoader();
      texLoader.load(
        VEHICLES[1].texturePath,
        (texture) => {
          texture.flipY = true;
          const mat = new THREE.MeshStandardMaterial({
            map: texture,
            roughness: 0.45,
            metalness: 0.15
          });

          const objLoader = new THREE.OBJLoader();
          objLoader.load(
            VEHICLES[1].objPath,
            (obj) => {
              obj.traverse((child) => {
                if (child.isMesh) {
                  child.material = mat;
                }
              });

              const wrapper = new THREE.Group();
              wrapper.add(obj);

              const box = new THREE.Box3().setFromObject(wrapper);
              const center = box.getCenter(new THREE.Vector3());
              const size = box.getSize(new THREE.Vector3());

              obj.position.x = -center.x;
              obj.position.y = -box.min.y;
              obj.position.z = -center.z;

              const maxDim = Math.max(size.x, size.y, size.z);
              const scale = VEHICLES[1].baseScale / maxDim;
              wrapper.scale.setScalar(scale);
              wrapper.rotation.y = VEHICLES[1].rotationY;

              loadedModels['van'] = wrapper;

              // If van is currently active, display it
              if (currentIndex === 1) {
                displayVehicleModel(1);
              }
            },
            undefined,
            (err) => console.warn('Vehicle OBJ load error:', err)
          );
        },
        undefined,
        (err) => console.warn('Vehicle Texture load error:', err)
      );
    }
  }

  /**
   * Switches the active 3D model in the scene
   */
  function displayVehicleModel(index) {
    const v = VEHICLES[index];
    if (!v || !scene) return;

    // Remove existing active model
    if (activeVehicleGroup) {
      scene.remove(activeVehicleGroup);
      activeVehicleGroup = null;
    }

    userRotY = 0; // Reset user drag rotation

    const modelGroup = loadedModels[v.id];
    if (modelGroup) {
      modelGroup.rotation.y = v.rotationY;
      scene.add(modelGroup);
      activeVehicleGroup = modelGroup;
    }
  }

  /**
   * Render loop with motion graphic ring rotation and idle car floating
   */
  function animate(time = 0) {
    animationFrameId = requestAnimationFrame(animate);

    const delta = (time - lastTime) * 0.001;
    lastTime = time;

    // Rotate motion graphic ring smoothly
    if (motionRingMesh) {
      motionRingMesh.rotation.y += 0.007;
    }

    // Apply user rotation or subtle idle float
    if (activeVehicleGroup) {
      if (!isDragging) {
        // Gentle subtle turntable drift
        activeVehicleGroup.rotation.y += autoRotateSpeed;
      }
    }

    if (renderer && scene && camera) {
      renderer.render(scene, camera);
    }
  }

  /**
   * Mouse and Touch interaction for 360° vehicle inspection
   */
  function setupEventListeners() {
    if (!canvasWrapper) return;

    // Mouse drag
    canvasWrapper.addEventListener('mousedown', (e) => {
      isDragging = true;
      prevMouseX = e.clientX;
    });

    window.addEventListener('mousemove', (e) => {
      if (!isDragging || !activeVehicleGroup) return;
      const deltaX = e.clientX - prevMouseX;
      prevMouseX = e.clientX;
      activeVehicleGroup.rotation.y += deltaX * 0.012;
    });

    window.addEventListener('mouseup', () => {
      isDragging = false;
    });

    // Touch drag
    canvasWrapper.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        isDragging = true;
        prevMouseX = e.touches[0].clientX;
      }
    }, { passive: true });

    window.addEventListener('touchmove', (e) => {
      if (!isDragging || !activeVehicleGroup || e.touches.length !== 1) return;
      const deltaX = e.touches[0].clientX - prevMouseX;
      prevMouseX = e.touches[0].clientX;
      activeVehicleGroup.rotation.y += deltaX * 0.012;
    }, { passive: true });

    window.addEventListener('touchend', () => {
      isDragging = false;
    });

    // Carousel buttons (< and >)
    const prevBtn = document.getElementById('vehicle-prev-btn');
    const nextBtn = document.getElementById('vehicle-next-btn');

    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        isUserOverridden = true;
        stepVehicle(-1);
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        isUserOverridden = true;
        stepVehicle(1);
      });
    }

    // Window resize
    window.addEventListener('resize', handleResize);

    // Watch for Vehicle tab becoming active to resize WebGL viewport
    const vehicleTabBtn = document.querySelector('[data-target="itin-tab-vehicle"]');
    if (vehicleTabBtn) {
      vehicleTabBtn.addEventListener('click', () => {
        setTimeout(handleResize, 50);
      });
    }
  }

  /**
   * Resizes canvas to match container
   */
  function handleResize() {
    if (!canvasWrapper || !renderer || !camera) return;
    const width = canvasWrapper.clientWidth;
    const height = canvasWrapper.clientHeight;
    if (width > 0 && height > 0) {
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    }
  }

  /**
   * Step to previous or next vehicle
   */
  function stepVehicle(dir) {
    const total = VEHICLES.length;
    currentIndex = (currentIndex + dir + total) % total;
    displayVehicleModel(currentIndex);
    updateVehicleInfoUI();
    saveSelectedVehicleToState();
  }

  /**
   * Set vehicle explicitly by ID ('car' or 'van')
   */
  function selectVehicleById(id, isAuto = false) {
    const idx = VEHICLES.findIndex((v) => v.id === id);
    if (idx !== -1) {
      currentIndex = idx;
      displayVehicleModel(currentIndex);
      updateVehicleInfoUI();
      if (!isAuto) {
        isUserOverridden = true;
      }
      saveSelectedVehicleToState();
    }
  }

  /**
   * Auto-selects vehicle matching pax count:
   * 1-3 Pax -> Car
   * 4+ Pax  -> Van
   */
  function onPaxCountChanged(paxCount, force = false) {
    const pax = parseInt(paxCount, 10) || 1;
    const recommendedId = pax <= 3 ? 'car' : 'van';

    if (!isUserOverridden || force) {
      selectVehicleById(recommendedId, true);
    } else {
      // Even if user overridden, update the fit visualization!
      updateVehicleInfoUI();
    }
  }

  /**
   * Saves current vehicle selection into appState
   */
  function saveSelectedVehicleToState() {
    const current = VEHICLES[currentIndex];
    if (window.appState && current) {
      window.appState.selectedVehicle = current.id;
      window.appState.vehicleName = current.fullName;
      if (typeof window.saveCurrentItineraryToStorage === 'function') {
        window.saveCurrentItineraryToStorage();
      }
      if (typeof window.syncLiveItineraryToStorage === 'function') {
        window.syncLiveItineraryToStorage();
      }
    }
  }

  /**
   * Refreshes the UI text and the passenger capacity pill
   */
  function updateVehicleInfoUI() {
    const v = VEHICLES[currentIndex];
    if (!v) return;

    // 1. Vehicle Title (matches media_1790351351159.png)
    const titleEl = document.getElementById('vehicle-type-label');
    if (titleEl) {
      titleEl.textContent = v.name;
    }

    // 2. Capacity Number and Pill Tooltip
    const capNumEl = document.getElementById('vehicle-cap-num');
    if (capNumEl) {
      capNumEl.textContent = v.maxPax;
    }

    const capPillEl = document.getElementById('vehicle-cap-pill');
    if (capPillEl) {
      capPillEl.title = `Accommodates up to ${v.maxPax} passengers`;
    }
  }

  /**
   * Updates state on tab switch or itinerary load
   */
  function updateShowcaseForCurrentState() {
    const pax = (window.appState && window.appState.touristsCount) ? window.appState.touristsCount : 7;
    const savedVehicle = (window.appState && window.appState.selectedVehicle);

    if (savedVehicle) {
      selectVehicleById(savedVehicle, false);
    } else {
      onPaxCountChanged(pax, false);
    }
    handleResize();
  }

  // Export public API to window
  window.vehicleShowcase = {
    init: initVehicleShowcase,
    selectVehicle: selectVehicleById,
    onPaxCountChanged: onPaxCountChanged,
    handleResize: handleResize,
    updateUI: updateVehicleInfoUI
  };

  // Auto-init on DOMContentLoaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initVehicleShowcase);
  } else {
    setTimeout(initVehicleShowcase, 100);
  }
})();
