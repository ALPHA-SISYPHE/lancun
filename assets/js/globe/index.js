import { GlobeScene, motionReduced, showGlobeStatus } from './GlobeScene.js';
import { bindGlobeScroll } from './scroll-bindings.js';

export { motionReduced, showGlobeStatus };

const GLOBE_INIT_TIMEOUT_MS = 25000;

function withTimeout(promise, label, timeoutMs = GLOBE_INIT_TIMEOUT_MS) {
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      window.setTimeout(() => {
        reject(new Error(`${label} timed out after ${Math.round(timeoutMs / 1000)}s`));
      }, timeoutMs);
    }),
  ]);
}

async function initHomeGlobe() {
  const section = document.querySelector('[data-ocean-explore]');
  const canvas = document.querySelector('[data-globe-canvas]');
  const canvasWrap = document.querySelector('[data-globe-canvas-wrap]');

  if (!section || !canvas || !canvasWrap || !window.LANCUN_DATA?.fiveOceans) {
    window.LANCUN_globeInitState = 'failed';
    showGlobeStatus('页面数据未就绪，请刷新后重试。');
    return null;
  }

  const scene = new GlobeScene({
    section,
    canvas,
    canvasWrap,
    oceans: window.LANCUN_DATA.fiveOceans,
    onReady: () => {
      window.dispatchEvent(new Event('lancun-home-globe-ready'));
    },
  });

  const ok = await withTimeout(scene.init(), 'Globe scene init');
  if (!ok) {
    window.LANCUN_globeInitState = 'failed';
    return null;
  }

  const scrollBinding = bindGlobeScroll({
    section,
    camera: scene.camera,
    earthGroup: scene.earthGroup,
    reduceMotion: motionReduced,
  });
  scene.setScrollApply(scrollBinding.apply);

  return {
    applyMotion: () => scene.applyMotion(),
    setShelvesVisible: (on) => scene.setShelvesVisible(on),
    dispose: () => {
      scrollBinding.dispose();
      scene.dispose();
    },
  };
}

function bootHomeGlobe() {
  if (document.body.dataset.page !== 'home') return;
  window.LANCUN_globeInitState = 'booting';
  initHomeGlobe()
    .then((api) => {
      window.LANCUN_homeGlobe = api;
      window.LANCUN_globeInitState = api ? 'ready' : 'failed';
      if (!api) return;
    })
    .catch((err) => {
      window.LANCUN_globeInitState = 'failed';
      console.error('globe init failed', err);
      showGlobeStatus(
        '地球 3D 初始化失败（' +
          (err?.message || err) +
          '）。请确认 WebGL 可用，并查看控制台 Network 是否有 404。',
      );
    });
}

function bootGlobeModule() {
  if (window.gsap && window.ScrollTrigger) {
    window.gsap.registerPlugin(window.ScrollTrigger);
  }
  bootHomeGlobe();
}

// Mark booting as soon as the module graph evaluates so the HTML watchdog
// does not treat a slow WebGL init as a missing script.
window.LANCUN_globeInitState = 'booting';

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootGlobeModule);
} else {
  bootGlobeModule();
}
