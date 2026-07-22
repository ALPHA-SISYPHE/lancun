/**
 * #ocean-explore — 3D Earth MVP (globe v2)
 */
import * as THREE from '../vendor/three.module.min.js';
import { createEarthGroup } from './earth.js';
import { createGlobeControls } from './controls.js';
import { createOceanMarkers } from './markers.js';
import {
  EARTH_SCREEN_FILL,
  EARTH_SCREEN_FILL_NARROW,
  EARTH_VISUAL_RADIUS,
  getProjectedFraction,
  getProjectedSphereFill,
  solveCameraDistanceForFill,
} from './utils/framing.js';

const NARROW_MQ = '(max-width: 58rem)';

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

function isNarrowViewport() {
  return window.matchMedia(NARROW_MQ).matches;
}

async function initGlobe() {
  const section = document.querySelector('[data-ocean-explore]');
  const canvas = document.querySelector('[data-globe-canvas]');
  const canvasWrap = document.querySelector('[data-globe-canvas-wrap]');
  const hotspotLayer = document.querySelector('[data-globe-hotspot-layer]');
  const oceans = window.OCEAN_HOTSPOTS || window.LANCUN_DATA?.fiveOceans;

  if (!section || !canvas || !canvasWrap || !hotspotLayer || !oceans?.length) {
    return null;
  }

  const getHost = () => canvas.closest('[data-globe-scene]') || canvasWrap;

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  } catch {
    showGlobeStatus('当前浏览器不支持 WebGL，无法显示 3D 地球。');
    return null;
  }

  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isNarrowViewport() ? 1.5 : 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.25;

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x0a1628, 0.06);

  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
  camera.position.set(0, 0.12, 2.75);
  camera.lookAt(0, 0, 0);

  const CAMERA_Y = 0.12;

  scene.add(new THREE.AmbientLight(0x6a9cb8, 0.65));
  const keyLight = new THREE.DirectionalLight(0xffffff, 1.55);
  keyLight.position.set(-3, 2, 4);
  scene.add(keyLight);
  const fillLight = new THREE.DirectionalLight(0x3a7a9a, 0.4);
  fillLight.position.set(2, -1, 3);
  scene.add(fillLight);

  const { group: earthGroup, update: updateEarth } = await createEarthGroup();
  scene.add(earthGroup);

  const markerApi = createOceanMarkers(earthGroup, oceans, hotspotLayer);

  const syncHotspots = () => {
    markerApi.updateHotspotPositions(camera, earthGroup, getHost());
  };

  const { controls, syncTarget, updateAutoSpin, applyMotion, dispose: disposeControls, rotateToLng, isDragging, isAutoSpinning } =
    createGlobeControls(camera, canvas, earthGroup, {
      motionReduced,
      onEarthRotationChange: syncHotspots,
    });

  let running = true;
  let animationId = null;
  let resizeObserver = null;
  let intersectionObserver = null;
  let visible = true;
  let pageVisible = !document.hidden;
  const clock = new THREE.Clock();

  const getScreenFill = () => (isNarrowViewport() ? EARTH_SCREEN_FILL_NARROW : EARTH_SCREEN_FILL);

  const applySeat = () => {
    earthGroup.position.set(0, 0, 0);
    camera.updateProjectionMatrix();

    const z = solveCameraDistanceForFill(
      camera,
      EARTH_VISUAL_RADIUS,
      getScreenFill(),
      camera.aspect,
      CAMERA_Y,
    );
    camera.position.set(0, CAMERA_Y, z);
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
    camera.updateMatrixWorld(true);
    syncTarget();

    const projected = getProjectedFraction(camera, earthGroup.position);
    getProjectedSphereFill(camera, EARTH_VISUAL_RADIUS, camera.aspect);
    window.__globeDebug = {
      module: 'globe@v21-acceptance',
      earthScreenFill: getScreenFill(),
      earthScreenFracX: projected.x,
      earthScreenFracY: projected.y,
      earthPos: earthGroup.position.toArray(),
      earthRot: [earthGroup.rotation.x, earthGroup.rotation.y, earthGroup.rotation.z],
      cameraZ: camera.position.z,
      isDragging: isDragging(),
      autoSpin: isAutoSpinning(),
      isNarrow: isNarrowViewport(),
    };
  };

  const resize = () => {
    const host = getHost();
    const w = host.clientWidth;
    const h = host.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    applySeat();
    markerApi.updateHotspotPositions(camera, earthGroup, host);
  };

  const animate = () => {
    if (!running) return;
    animationId = requestAnimationFrame(animate);
    if (!visible || !pageVisible) return;
    const dt = clock.getDelta();
    updateEarth(dt);
    updateAutoSpin(dt);
    controls.update();
    markerApi.updateHotspotPositions(camera, earthGroup, getHost());
    renderer.render(scene, camera);
  };

  applySeat();
  resize();
  requestAnimationFrame(resize);
  animate();

  const onVisibilityChange = () => {
    pageVisible = !document.hidden;
    if (pageVisible) clock.getDelta();
  };

  window.addEventListener('resize', resize);
  document.addEventListener('visibilitychange', onVisibilityChange);

  if (typeof ResizeObserver !== 'undefined') {
    resizeObserver = new ResizeObserver(() => resize());
    resizeObserver.observe(getHost());
  }

  if (typeof IntersectionObserver !== 'undefined') {
    intersectionObserver = new IntersectionObserver(
      (entries) => {
        visible = entries.some((e) => e.isIntersecting);
        if (visible) clock.getDelta();
      },
      { threshold: 0.05 },
    );
    intersectionObserver.observe(section);
  }

  section.classList.toggle('ocean-explore--static', motionReduced());

  window.dispatchEvent(new Event('lancun-home-globe-ready'));

  const rotateToOcean = (id) => {
    const list = window.OCEAN_HOTSPOTS || oceans;
    const ocean = list.find((item) => item.id === id);
    if (!ocean) return;
    const lng = ocean.lng ?? ocean.lon;
    if (typeof lng === 'number') rotateToLng(lng);
  };

  return {
    markerApi,
    rotateToOcean,
    applyMotion: () => {
      applyMotion();
      section.classList.toggle('ocean-explore--static', motionReduced());
    },
    dispose: () => {
      running = false;
      if (animationId != null) cancelAnimationFrame(animationId);
      disposeControls();
      window.removeEventListener('resize', resize);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      resizeObserver?.disconnect();
      intersectionObserver?.disconnect();
      controls.dispose();
      markerApi.dispose();
      renderer.dispose();
      hotspotLayer.innerHTML = '';
    },
  };
}

function bootGlobe() {
  if (document.body.dataset.page !== 'home') return;

  window.LANCUN_globeInitState = 'booting';

  initGlobe()
    .then((api) => {
      if (!api) {
        window.LANCUN_globeInitState = 'failed';
        return;
      }
      window.LANCUN_homeGlobe = api;
      window.LANCUN_globeInitState = 'ready';
    })
    .catch((err) => {
      console.error('globe init failed', err);
      window.LANCUN_globeInitState = 'failed';
      showGlobeStatus('3D 地球初始化失败，请刷新页面或查看控制台。');
    });
}

window.LANCUN_globeInitState = 'pending';

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootGlobe);
} else {
  bootGlobe();
}

export { initGlobe };
