import { GlobeScene, motionReduced, showGlobeStatus } from './GlobeScene.js';
import { bindGlobeScroll } from './scroll-bindings.js';

export { motionReduced, showGlobeStatus };

async function initHomeGlobe() {
  const section = document.querySelector('[data-ocean-explore]');
  const canvas = document.querySelector('[data-globe-canvas]');
  const canvasWrap = document.querySelector('[data-globe-canvas-wrap]');

  if (!section || !canvas || !canvasWrap || !window.LANCUN_DATA?.fiveOceans) {
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

  const ok = await scene.init();
  if (!ok) return null;

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
  initHomeGlobe()
    .then((api) => {
      window.LANCUN_homeGlobe = api;
      if (!api) return;
    })
    .catch((err) => {
      console.error('globe init failed', err);
      showGlobeStatus(
        '地球 3D 脚本加载失败。请用本地服务器打开：在项目目录运行 python -m http.server 8080，再访问 http://127.0.0.1:8080/index.html',
      );
    });
}

document.addEventListener('DOMContentLoaded', () => {
  if (window.gsap && window.ScrollTrigger) {
    window.gsap.registerPlugin(window.ScrollTrigger);
  }
  bootHomeGlobe();
});
