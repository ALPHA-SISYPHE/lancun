/**
 * @deprecated Backup of pre-Phase-A monolithic globe. Active entry: assets/js/globe/index.js
 * Kept for reference; not loaded by index.html.
 */
import * as THREE from './vendor/three.module.min.js';
import { OrbitControls } from './vendor/OrbitControls.js';
import { CSS2DRenderer, CSS2DObject } from './vendor/CSS2DRenderer.js';

const EARTH_LOCAL = 'assets/media/earth.jpg';
const EARTH_REMOTE = 'https://threejs.org/examples/textures/planets/earth_atmos_2048.jpg';
const CLOUDS_LOCAL = 'assets/media/earth-clouds.png';
const CLOUDS_REMOTE = 'https://threejs.org/examples/textures/planets/earth_clouds_1024.png';

function motionReduced() {
  if (document.documentElement.dataset.reducedMotion === 'true') return true;
  if (typeof window.LANCUN_getPrefs === 'function' && window.LANCUN_getPrefs().reduceMotion) return true;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function showGlobeStatus(message) {
  const el = document.querySelector('[data-globe-status]');
  if (!el) return;
  if (message) el.textContent = message;
  el.hidden = false;
}

function latLonToVector3(lat, lon, radius) {
  const phi = THREE.MathUtils.degToRad(90 - lat);
  const theta = THREE.MathUtils.degToRad(lon + 180);
  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta),
  );
}

function loadTexture(url) {
  return new Promise((resolve, reject) => {
    new THREE.TextureLoader().load(url, resolve, undefined, reject);
  });
}

async function loadEarthTextures() {
  try {
    return await loadTexture(EARTH_LOCAL);
  } catch {
    return loadTexture(EARTH_REMOTE);
  }
}

async function loadCloudTextures() {
  try {
    return await loadTexture(CLOUDS_LOCAL);
  } catch {
    return loadTexture(CLOUDS_REMOTE);
  }
}

function initHomeGlobe() {
  const section = document.querySelector('[data-ocean-explore]');
  const canvas = document.querySelector('[data-globe-canvas]');
  const canvasWrap = document.querySelector('[data-globe-canvas-wrap]');
  if (!section || !canvas || !canvasWrap || !window.LANCUN_DATA?.fiveOceans) {
    showGlobeStatus('页面数据未就绪，请刷新后重试。');
    return null;
  }

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  } catch (err) {
    console.error('WebGL unavailable', err);
    showGlobeStatus('当前浏览器无法使用 WebGL，无法显示 3D 地球。');
    return null;
  }

  const intro = section.querySelector('[data-ocean-intro]');
  const detail = section.querySelector('[data-ocean-detail]');
  const detailTitle = section.querySelector('[data-ocean-detail-title]');
  const detailText = section.querySelector('[data-ocean-detail-text]');
  const detailLink = section.querySelector('[data-ocean-detail-link]');
  const closeBtn = section.querySelector('[data-ocean-close]');

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
  camera.position.set(0, 0.12, 2.75);

  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);

  const labelRenderer = new CSS2DRenderer();
  labelRenderer.domElement.className = 'globe-label-layer';
  canvasWrap.appendChild(labelRenderer.domElement);

  const ambient = new THREE.AmbientLight(0x6a9cb8, 0.5);
  scene.add(ambient);
  const keyLight = new THREE.DirectionalLight(0xffffff, 1.55);
  keyLight.position.set(-5, 3.2, 4);
  scene.add(keyLight);
  const fillLight = new THREE.DirectionalLight(0x3a7a9a, 0.4);
  fillLight.position.set(3, -1, -2);
  scene.add(fillLight);

  const earthGroup = new THREE.Group();
  scene.add(earthGroup);

  const markerPins = [];
  let markersBuilt = false;
  let controls = null;
  let animationId = null;
  let activeId = null;
  let running = true;
  let resizeObserver = null;

  const earthGeometry = new THREE.SphereGeometry(1, 64, 64);
  const earthMaterial = new THREE.MeshPhongMaterial({
    color: 0x1a6b82,
    specular: new THREE.Color(0x556688),
    shininess: 22,
  });
  const earthMesh = new THREE.Mesh(earthGeometry, earthMaterial);
  earthGroup.add(earthMesh);

  const atmosphere = new THREE.Mesh(
    new THREE.SphereGeometry(1.08, 64, 64),
    new THREE.MeshBasicMaterial({
      color: 0x3b82f6,
      transparent: true,
      opacity: 0.12,
      side: THREE.BackSide,
    }),
  );
  earthGroup.add(atmosphere);

  const showIntro = () => {
    activeId = null;
    intro.hidden = false;
    detail.hidden = true;
    markerPins.forEach(({ el }) => el.classList.remove('is-active'));
  };

  const showDetail = (ocean) => {
    activeId = ocean.id;
    detailTitle.textContent = ocean.title;
    detailText.textContent = ocean.text;
    if (detailLink) {
      detailLink.href = ocean.learnMoreHref || 'pages/ocean.html';
      detailLink.textContent = `继续了解${ocean.name}`;
    }
    intro.hidden = true;
    detail.hidden = false;
    markerPins.forEach(({ el, ocean: o }) => {
      el.classList.toggle('is-active', o.id === ocean.id);
    });
    closeBtn?.focus();
  };

  closeBtn?.addEventListener('click', () => showIntro());

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !detail.hidden) {
      showIntro();
      intro.querySelector('h2')?.focus();
    }
  });

  const buildMarkers = () => {
    if (markersBuilt) return;
    markersBuilt = true;
    window.LANCUN_DATA.fiveOceans.forEach((ocean) => {
      const el = document.createElement('button');
      el.type = 'button';
      el.className = 'globe-pin';
      el.dataset.oceanId = ocean.id;
      el.setAttribute('aria-label', `查看${ocean.name}介绍`);
      el.innerHTML = '<span aria-hidden="true">+</span>';
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        showDetail(ocean);
      });
      const label = new CSS2DObject(el);
      label.position.copy(latLonToVector3(ocean.lat, ocean.lon, 1.06));
      earthGroup.add(label);
      markerPins.push({ el, ocean, label });
    });
  };

  buildMarkers();

  loadEarthTextures()
    .then((earthMap) => {
      earthMap.colorSpace = THREE.SRGBColorSpace;
      earthMaterial.map = earthMap;
      earthMaterial.color.setHex(0xffffff);
      earthMaterial.needsUpdate = true;

      loadCloudTextures()
        .then((cloudMap) => {
          cloudMap.colorSpace = THREE.SRGBColorSpace;
          const clouds = new THREE.Mesh(
            new THREE.SphereGeometry(1.015, 64, 64),
            new THREE.MeshPhongMaterial({
              map: cloudMap,
              transparent: true,
              opacity: 0.24,
              depthWrite: false,
            }),
          );
          earthGroup.add(clouds);
        })
        .catch(() => {});
    })
    .catch((err) => {
      console.error('Earth texture failed to load', err);
    });

  controls = new OrbitControls(camera, canvas);
  controls.enablePan = false;
  controls.enableZoom = false;
  controls.enableDamping = true;
  controls.dampingFactor = 0.06;
  controls.minPolarAngle = Math.PI * 0.28;
  controls.maxPolarAngle = Math.PI * 0.72;
  controls.autoRotate = !motionReduced();
  controls.autoRotateSpeed = 0.35;

  let idleTimer = null;
  const resumeAutoRotate = () => {
    clearTimeout(idleTimer);
    idleTimer = setTimeout(() => {
      if (!motionReduced()) controls.autoRotate = true;
    }, 1200);
  };

  controls.addEventListener('start', () => {
    controls.autoRotate = false;
    clearTimeout(idleTimer);
  });
  controls.addEventListener('end', resumeAutoRotate);

  const resize = () => {
    const sceneEl = canvas.closest('[data-globe-scene]');
    if (!sceneEl || !canvasWrap) return;
    let w = sceneEl.clientWidth;
    let h = canvasWrap.clientHeight;
    if (w < 1) w = canvasWrap.clientWidth;
    if (h < 1) h = w;
    if (w < 1 || h < 1) return;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h, false);
    labelRenderer.setSize(w, h);
  };

  const animate = () => {
    if (!running) return;
    animationId = requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
    labelRenderer.render(scene, camera);
  };

  const applyMotion = () => {
    if (!controls) return;
    const reduced = motionReduced();
    controls.autoRotate = !reduced;
    section.classList.toggle('ocean-explore--static', reduced);
    if (reduced) {
      running = false;
      if (animationId != null) cancelAnimationFrame(animationId);
      controls.update();
      renderer.render(scene, camera);
      labelRenderer.render(scene, camera);
    } else if (!running) {
      running = true;
      animate();
    }
  };

  resize();
  requestAnimationFrame(resize);
  window.addEventListener('resize', resize);
  if (typeof ResizeObserver !== 'undefined') {
    resizeObserver = new ResizeObserver(() => resize());
    resizeObserver.observe(canvasWrap);
    resizeObserver.observe(canvas.closest('[data-globe-scene]') || canvasWrap);
  }
  animate();

  window.dispatchEvent(new Event('lancun-home-globe-ready'));

  return {
    applyMotion,
    dispose: () => {
      running = false;
      if (animationId != null) cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resize);
      resizeObserver?.disconnect();
      labelRenderer.domElement.remove();
      renderer.dispose();
    },
  };
}

function bootHomeGlobe() {
  if (document.body.dataset.page !== 'home') return;
  try {
    window.LANCUN_homeGlobe = initHomeGlobe();
    if (!window.LANCUN_homeGlobe) return;
  } catch (err) {
    console.error('home-globe init failed', err);
    showGlobeStatus(
      '地球 3D 脚本加载失败。请用本地服务器打开：在项目目录运行 python -m http.server 8080，再访问 http://127.0.0.1:8080/index.html',
    );
  }
}

document.addEventListener('DOMContentLoaded', bootHomeGlobe);
