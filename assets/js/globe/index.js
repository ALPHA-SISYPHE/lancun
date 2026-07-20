/**
 * #ocean-explore — 3D Earth MVP (globe v2)
 */
import * as THREE from '../vendor/three.module.min.js';
import { CSS2DRenderer } from '../vendor/CSS2DRenderer.js';
import { createEarthGroup } from './earth.js';
import { createGlobeControls } from './controls.js';
import { createOceanMarkers } from './markers.js';
import { getProjectedFraction } from './utils/framing.js';

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
  const oceans = window.LANCUN_DATA?.fiveOceans;

  if (!section || !canvas || !canvasWrap || !oceans?.length) {
    return null;
  }

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  } catch {
    showGlobeStatus('当前浏览器不支持 WebGL，无法显示 3D 地球。');
    return null;
  }

  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.25;

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x0a1628, 0.06);

  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
  camera.position.set(0, 0.12, 2.75);
  camera.lookAt(0, 0, 0);

  scene.add(new THREE.AmbientLight(0x6a9cb8, 0.65));
  const keyLight = new THREE.DirectionalLight(0xffffff, 1.55);
  keyLight.position.set(-3, 2, 4);
  scene.add(keyLight);
  const fillLight = new THREE.DirectionalLight(0x3a7a9a, 0.4);
  fillLight.position.set(2, -1, 3);
  scene.add(fillLight);

  const labelRenderer = new CSS2DRenderer();
  labelRenderer.domElement.className = 'globe-label-layer';
  canvasWrap.appendChild(labelRenderer.domElement);

  const { group: earthGroup, update: updateEarth } = await createEarthGroup();
  scene.add(earthGroup);
  createOceanMarkers(earthGroup, oceans);

  const { controls, syncTarget, updateAutoSpin, applyMotion, dispose: disposeControls } = createGlobeControls(
    camera,
    canvas,
    earthGroup,
    { motionReduced },
  );

  let running = true;
  let animationId = null;
  let resizeObserver = null;
  let intersectionObserver = null;
  let visible = true;
  const clock = new THREE.Clock();

  const applySeat = () => {
    earthGroup.position.set(0, 0, 0);
    syncTarget();
    camera.updateProjectionMatrix();
    camera.updateMatrixWorld(true);

    const projected = getProjectedFraction(camera, earthGroup.position);
    window.__globeDebug = {
      module: 'globe@v4',
      earthScreenFracX: projected.x,
      earthScreenFracY: projected.y,
      earthPos: earthGroup.position.toArray(),
      isNarrow: isNarrowViewport(),
    };
  };

  const resize = () => {
    const host = canvas.closest('[data-globe-scene]') || canvasWrap;
    const w = host.clientWidth;
    const h = host.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    labelRenderer.setSize(w, h);
    camera.aspect = w / h;
    applySeat();
  };

  const animate = () => {
    if (!running) return;
    animationId = requestAnimationFrame(animate);
    if (!visible) return;
    const dt = clock.getDelta();
    updateEarth(dt);
    updateAutoSpin(dt);
    controls.update();
    renderer.render(scene, camera);
    labelRenderer.render(scene, camera);
  };

  applySeat();
  resize();
  requestAnimationFrame(resize);
  animate();

  window.addEventListener('resize', resize);
  if (typeof ResizeObserver !== 'undefined') {
    resizeObserver = new ResizeObserver(() => resize());
    resizeObserver.observe(canvas.closest('[data-globe-scene]') || canvasWrap);
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

  return {
    applyMotion: () => {
      applyMotion();
      section.classList.toggle('ocean-explore--static', motionReduced());
    },
    dispose: () => {
      running = false;
      if (animationId != null) cancelAnimationFrame(animationId);
      disposeControls();
      window.removeEventListener('resize', resize);
      resizeObserver?.disconnect();
      intersectionObserver?.disconnect();
      controls.dispose();
      renderer.dispose();
      labelRenderer.domElement.remove();
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
