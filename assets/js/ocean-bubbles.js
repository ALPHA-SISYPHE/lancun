/**
 * #ocean-explore interim — dark navy glass bubbles (v21)
 * Earth off. Convex-like dark bg + liquid elastic rise.
 */
import * as THREE from './vendor/three.module.min.js';
import { createBubbles } from './globe/bubbles.js';

/** Mid navy — matches brighter bottom-dark / top-light interim gradient. */
const SECTION_CLEAR = 0x1e4a8c;
const CAMERA_FOV = 34;
const MAX_DPR = 2;
const LAYER_BUBBLE_BACK = 1;
const LAYER_BUBBLE_FRONT = 2;

function motionReduced() {
  if (document.documentElement.dataset.reducedMotion === 'true') return true;
  if (typeof window.LANCUN_getPrefs === 'function' && window.LANCUN_getPrefs().reduceMotion) {
    return true;
  }
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function showStatus(message) {
  const el = document.querySelector('[data-globe-status]');
  if (!el) return;
  if (message) el.textContent = message;
  el.hidden = false;
}

function createDarkGradientTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  // Vertical: top light → bottom dark (canvas y=0 is top)
  const g = ctx.createLinearGradient(0, 0, 0, 512);
  g.addColorStop(0, '#5aa6e8');
  g.addColorStop(0.18, '#3d8fd4');
  g.addColorStop(0.38, '#2b6cb0');
  g.addColorStop(0.58, '#1a4578');
  g.addColorStop(0.78, '#0c1f38');
  g.addColorStop(1, '#050d16');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 512, 512);
  // Upper-center glow (Convex-like light filtering down)
  const topGlow = ctx.createRadialGradient(300, 110, 20, 290, 160, 300);
  topGlow.addColorStop(0, 'rgba(130, 190, 255, 0.5)');
  topGlow.addColorStop(0.45, 'rgba(60, 120, 200, 0.22)');
  topGlow.addColorStop(1, 'rgba(10, 22, 40, 0)');
  ctx.fillStyle = topGlow;
  ctx.fillRect(0, 0, 512, 512);
  // Soft bokeh for refraction interest
  for (let i = 0; i < 44; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 400;
    const r = 5 + Math.random() * 28;
    const glow = ctx.createRadialGradient(x, y, 0, x, y, r);
    glow.addColorStop(0, 'rgba(140, 195, 255, 0.22)');
    glow.addColorStop(1, 'rgba(10, 22, 40, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

class OceanBubbles {
  constructor({ section, canvas, canvasWrap }) {
    this.section = section;
    this.canvas = canvas;
    this.canvasWrap = canvasWrap;

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(CAMERA_FOV, 1, 0.1, 100);
    this.camera.position.set(0, 0, 5.2);
    this.camera.lookAt(0, 0, 0);
    this.camera.layers.enable(LAYER_BUBBLE_BACK);
    this.camera.layers.enable(LAYER_BUBBLE_FRONT);

    this.renderer = null;
    this.bubbles = null;
    this.diffuseRT = null;
    this.bgTexture = null;
    this.bgScene = null;
    this.bgCamera = null;
    this.bgMesh = null;
    this.running = false;
    this.visible = false;
    this.animationId = null;
    this.clock = new THREE.Clock();
    this.resizePending = false;
    this.resizeObserver = null;
    this.intersectionObserver = null;
    this._unsubs = [];
  }

  init() {
    this.section.classList.add('ocean-explore--dark-interim');

    try {
      this.renderer = new THREE.WebGLRenderer({
        canvas: this.canvas,
        alpha: false,
        antialias: true,
        premultipliedAlpha: false,
      });
    } catch (err) {
      console.error(err);
      showStatus('当前浏览器无法使用 WebGL，无法显示海洋气泡场景。');
      return false;
    }

    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.setClearColor(SECTION_CLEAR, 1);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, MAX_DPR));

    this.bgTexture = createDarkGradientTexture();
    this.bgScene = new THREE.Scene();
    this.bgCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    this.bgMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(2, 2),
      new THREE.MeshBasicMaterial({ map: this.bgTexture, depthTest: false, depthWrite: false }),
    );
    this.bgScene.add(this.bgMesh);

    this.bubbles = createBubbles({ scene: this.scene, camera: this.camera });
    this.bubbles.setEarthOrigin?.(new THREE.Vector3(0, 0, 0));

    this._bindObservers();
    this._syncVisible();
    this.resize();
    this.applyMotion();

    if (this.visible && !motionReduced()) this.start();
    else this._renderFrame();

    return true;
  }

  _getSize() {
    const host = this.canvasWrap || this.section;
    return {
      w: Math.max(1, host?.clientWidth || this.section.clientWidth || 1),
      h: Math.max(1, host?.clientHeight || this.section.clientHeight || 1),
    };
  }

  resize() {
    if (!this.renderer) return;
    const { w, h } = this._getSize();
    if (w < 1 || h < 1) return;

    this.renderer.setSize(w, h, false);
    const dpr = Math.min(window.devicePixelRatio, MAX_DPR);
    this.renderer.setPixelRatio(dpr);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();

    if (!this.diffuseRT) {
      this.diffuseRT = new THREE.WebGLRenderTarget(w * dpr, h * dpr, {
        minFilter: THREE.LinearFilter,
        magFilter: THREE.LinearFilter,
        depthBuffer: true,
      });
    } else {
      this.diffuseRT.setSize(w * dpr, h * dpr);
    }

    this.bubbles?.setSize(w * dpr, h * dpr);
    this.bubbles?.setDiffuse(this.diffuseRT.texture);
    this.bubbles?.relayout(this.camera);

    if (typeof window !== 'undefined') {
      window.__globeDebug = {
        module: 'ocean-bubbles@v27',
        earthRemoved: true,
        darkInterim: true,
        bubbles: true,
        camPos: this.camera.position.toArray(),
      };
    }
  }

  _scheduleResize() {
    if (this.resizePending) return;
    this.resizePending = true;
    requestAnimationFrame(() => {
      this.resizePending = false;
      this.resize();
    });
  }

  _syncVisible() {
    const rect = this.section.getBoundingClientRect();
    const vh = window.innerHeight || 1;
    this.visible = rect.bottom > 0 && rect.top < vh;
  }

  _bindObservers() {
    const onResize = () => this._scheduleResize();
    window.addEventListener('resize', onResize);
    window.addEventListener('load', onResize);
    window.visualViewport?.addEventListener('resize', onResize);
    this._unsubs.push(
      () => window.removeEventListener('resize', onResize),
      () => window.removeEventListener('load', onResize),
      () => window.visualViewport?.removeEventListener('resize', onResize),
    );

    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(() => this._scheduleResize());
      this.resizeObserver.observe(this.section);
      this.resizeObserver.observe(this.canvasWrap);
    }

    if (typeof IntersectionObserver !== 'undefined') {
      this.intersectionObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            this.visible = entry.isIntersecting;
            if (this.visible && !motionReduced()) this.start();
            else this.stop();
          });
        },
        { root: null, threshold: 0.08 },
      );
      this.intersectionObserver.observe(this.section);
    } else {
      this.visible = true;
    }
  }

  _renderFrame() {
    if (!this.renderer || !this.bubbles) return;
    const reduced = motionReduced();
    const t = this.clock.elapsedTime;
    this.bubbles.update(t, reduced);

    const size = this.renderer.getSize(new THREE.Vector2());
    const dpr = this.renderer.getPixelRatio();

    // Dark gradient into RT for IOR sampling
    this.renderer.setRenderTarget(this.diffuseRT);
    this.renderer.setClearColor(SECTION_CLEAR, 1);
    this.renderer.clear(true, true, true);
    if (this.bgScene && this.bgCamera) {
      this.renderer.render(this.bgScene, this.bgCamera);
    }
    this.renderer.setRenderTarget(null);

    this.renderer.setViewport(0, 0, size.x * dpr, size.y * dpr);
    this.renderer.setClearColor(SECTION_CLEAR, 1);
    this.renderer.clear(true, true, true);
    if (this.bgScene && this.bgCamera) {
      this.renderer.render(this.bgScene, this.bgCamera);
    }

    this.renderer.autoClear = false;
    this.camera.layers.disableAll();
    this.camera.layers.enable(LAYER_BUBBLE_BACK);
    this.renderer.render(this.scene, this.camera);

    this.camera.layers.disableAll();
    this.camera.layers.enable(LAYER_BUBBLE_FRONT);
    this.renderer.render(this.scene, this.camera);
    this.renderer.autoClear = true;

    this.camera.layers.disableAll();
    this.camera.layers.enable(LAYER_BUBBLE_BACK);
    this.camera.layers.enable(LAYER_BUBBLE_FRONT);
  }

  _tick = () => {
    if (!this.running) return;
    this.animationId = requestAnimationFrame(this._tick);
    this._renderFrame();
  };

  start() {
    if (this.running || !this.renderer) return;
    this.running = true;
    this.clock.start();
    this._tick();
  }

  stop() {
    this.running = false;
    if (this.animationId != null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  applyMotion() {
    const reduced = motionReduced();
    this.section.classList.toggle('ocean-explore--static', reduced);
    if (reduced) {
      this.stop();
      this._renderFrame();
    } else if (this.visible && !this.running) {
      this.start();
    }
  }

  dispose() {
    this.stop();
    this.resizeObserver?.disconnect();
    this.intersectionObserver?.disconnect();
    this._unsubs.forEach((fn) => fn());
    this.bubbles?.dispose();
    this.diffuseRT?.dispose();
    this.bgTexture?.dispose();
    this.bgMesh?.geometry?.dispose();
    this.bgMesh?.material?.dispose();
    this.renderer?.dispose();
  }
}

window.LANCUN_globeInitState = 'booting';

function boot() {
  if (document.body?.dataset?.page !== 'home') return;

  const section = document.querySelector('[data-ocean-explore]');
  const canvas = document.querySelector('[data-globe-canvas]');
  const canvasWrap = document.querySelector('[data-globe-canvas-wrap]');

  if (!section || !canvas || !canvasWrap) {
    window.LANCUN_globeInitState = 'failed';
    showStatus('页面结构未就绪，请刷新后重试。');
    return;
  }

  const scene = new OceanBubbles({ section, canvas, canvasWrap });
  try {
    const ok = scene.init();
    if (!ok) {
      window.LANCUN_globeInitState = 'failed';
      return;
    }
    window.LANCUN_homeGlobe = {
      applyMotion: () => scene.applyMotion(),
      setShelvesVisible: () => {},
      dispose: () => scene.dispose(),
    };
    window.LANCUN_globeInitState = 'ready';
    window.dispatchEvent(new Event('lancun-home-globe-ready'));
  } catch (err) {
    window.LANCUN_globeInitState = 'failed';
    console.error('ocean-bubbles boot failed', err);
    showStatus('海洋气泡场景初始化失败（' + (err?.message || err) + '）。');
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
