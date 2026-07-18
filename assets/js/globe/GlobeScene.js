import * as THREE from '../vendor/three.module.min.js';
import { OrbitControls } from '../vendor/OrbitControls.js';
import { createEarth, configureRendererToneMapping } from './earth.js';
import { createShelves } from './shelves.js';
import { createBubbles } from './bubbles.js';
import { createMarkers } from './markers.js';
import { createGlobeComposer } from './composer.js';

const MAX_DPR = 2;

export function motionReduced() {
  if (document.documentElement.dataset.reducedMotion === 'true') return true;
  if (typeof window.LANCUN_getPrefs === 'function' && window.LANCUN_getPrefs().reduceMotion) return true;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function showGlobeStatus(message) {
  const el = document.querySelector('[data-globe-status]');
  if (!el) return;
  if (message) el.textContent = message;
  el.hidden = false;
}

export class GlobeScene {
  constructor(options) {
    this.section = options.section;
    this.canvas = options.canvas;
    this.canvasWrap = options.canvasWrap;
    this.oceans = options.oceans;
    this.onReady = options.onReady;

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    this.camera.position.set(0, 0.12, 2.75);
    this.camera.layers.enable(0);
    this.camera.layers.enable(1);

    this.running = false;
    this.visible = false;
    this.animationId = null;
    this.clock = new THREE.Clock();
    this.shelvesVisible = false;
    this.shelvesTween = null;

    this.earthRT = null;
    this.compositeRT = null;
    this.earthGroup = null;
    this.earthDisposeExtras = null;
    this.bubbles = null;
    this.shelves = null;
    this.markers = null;
    this.controls = null;
    this.composer = null;
    this.resizeObserver = null;
    this.intersectionObserver = null;
    this.idleTimer = null;
    this._scrollApply = null;

    this._initRenderer();
  }

  _initRenderer() {
    try {
      this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, alpha: true, antialias: true });
    } catch (err) {
      console.error('WebGL unavailable', err);
      showGlobeStatus('当前浏览器无法使用 WebGL，无法显示 3D 地球。');
      this.renderer = null;
      return;
    }

    configureRendererToneMapping(this.renderer);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, MAX_DPR));
    this.renderer.setClearColor(0x000000, 0);
    this.composer = createGlobeComposer(this.renderer);
  }

  async init() {
    if (!this.renderer) return false;

    const { group, disposeExtras } = await createEarth({ scene: this.scene, renderer: this.renderer });
    this.earthGroup = group;
    this.earthDisposeExtras = disposeExtras;

    this.shelves = await createShelves(this.earthGroup);
    this.bubbles = createBubbles(this.earthGroup);

    this.markers = createMarkers({
      earthGroup: this.earthGroup,
      canvasWrap: this.canvasWrap,
      section: this.section,
      oceans: this.oceans,
    });

    const size = this._getSize();
    this.earthRT = new THREE.WebGLRenderTarget(size.w, size.h, {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
    });
    this.compositeRT = new THREE.WebGLRenderTarget(size.w, size.h, {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
    });

    this.controls = new OrbitControls(this.camera, this.canvas);
    this.controls.enablePan = false;
    this.controls.enableZoom = false;
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.06;
    this.controls.minPolarAngle = Math.PI * 0.28;
    this.controls.maxPolarAngle = Math.PI * 0.72;
    this.controls.autoRotate = !motionReduced();
    this.controls.autoRotateSpeed = 0.35;

    this.controls.addEventListener('start', () => {
      this.controls.autoRotate = false;
      clearTimeout(this.idleTimer);
    });
    this.controls.addEventListener('end', () => this._resumeAutoRotate());

    this._bindShelvesToggle();
    this._bindObservers();
    this.resize();
    this.applyMotion();

    if (this.visible) this.start();
    this.onReady?.();
    return true;
  }

  _bindShelvesToggle() {
    const toggle = this.section.querySelector('[data-shelves-toggle]');
    if (!toggle) return;

    const syncAria = () => {
      toggle.setAttribute('aria-pressed', String(this.shelvesVisible));
      toggle.dataset.state = this.shelvesVisible ? 'on' : 'off';
    };

    toggle.addEventListener('click', () => {
      this.setShelvesVisible(!this.shelvesVisible);
      syncAria();
    });

    syncAria();
  }

  setShelvesVisible(on) {
    this.shelvesVisible = on;
    const target = on ? 1 : 0;

    if (this.shelvesTween) {
      this.shelvesTween.kill();
      this.shelvesTween = null;
    }

    if (!this.shelves) return;

    if (motionReduced() || !window.gsap) {
      this.shelves.offset = target;
      return;
    }

    this.shelvesTween = window.gsap.to(this.shelves.material.uniforms.uOffset, {
      value: target,
      duration: 1.2,
      ease: 'power2.inOut',
    });
  }

  _resumeAutoRotate() {
    clearTimeout(this.idleTimer);
    this.idleTimer = setTimeout(() => {
      if (!motionReduced()) this.controls.autoRotate = true;
    }, 1200);
  }

  _getSize() {
    const sceneEl = this.canvas.closest('[data-globe-scene]');
    let w = sceneEl?.clientWidth || this.canvasWrap.clientWidth;
    let h = this.canvasWrap.clientHeight;
    if (w < 1) w = this.canvasWrap.clientWidth;
    if (h < 1) h = w;
    return { w: Math.max(1, w), h: Math.max(1, h) };
  }

  resize() {
    if (!this.renderer) return;
    const { w, h } = this._getSize();
    if (w < 1 || h < 1) return;

    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    const dpr = Math.min(window.devicePixelRatio, MAX_DPR);
    this.renderer.setPixelRatio(dpr);
    this.renderer.setSize(w, h, false);
    this.markers?.setSize(w, h);
    this.bubbles?.setSize(w * dpr, h * dpr);

    if (this.earthRT) {
      this.earthRT.setSize(w * dpr, h * dpr);
    }
    if (this.compositeRT) {
      this.compositeRT.setSize(w * dpr, h * dpr);
    }
    this.composer?.setSize(w, h);
    this.composer?.setPixelRatio?.(dpr);
  }

  _renderGlobeLayers() {
    const dpr = this.renderer.getPixelRatio();
    const size = this.renderer.getSize(new THREE.Vector2());

    this.camera.layers.set(0);
    this.renderer.setRenderTarget(this.earthRT);
    this.renderer.clear();
    this.renderer.render(this.scene, this.camera);

    const outputTarget = this.composer?.enabled ? this.compositeRT : null;
    this.camera.layers.set(0);
    this.renderer.setRenderTarget(outputTarget);
    this.renderer.clear();
    this.renderer.render(this.scene, this.camera);

    if (this.bubbles?.mesh) {
      this.bubbles.setDiffuse(this.earthRT.texture);
      this.bubbles.setSize(size.x * dpr, size.y * dpr);
      this.camera.layers.set(1);
      this.renderer.render(this.scene, this.camera);
      this.camera.layers.set(0);
    }
  }

  _renderFrame() {
    if (!this.renderer || !this.earthGroup) return;

    const reduced = motionReduced();
    const elapsed = this.clock.getElapsedTime();
    this.bubbles?.update(elapsed, reduced);
    this.shelves?.update(elapsed);
    this.controls?.update();
    this._scrollApply?.();

    this._renderGlobeLayers();

    if (this.composer?.enabled && this.compositeRT) {
      this.composer.setInputTexture(this.compositeRT.texture);
      this.composer.render(this.clock.getDelta());
    }

    this.markers?.render(this.scene, this.camera);
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

  setScrollApply(fn) {
    this._scrollApply = fn;
  }

  applyMotion() {
    if (!this.renderer) return;

    const reduced = motionReduced();
    this.section.classList.toggle('ocean-explore--static', reduced);

    if (this.controls) {
      this.controls.autoRotate = !reduced;
    }

    if (reduced) {
      this.stop();
      this._renderFrame();
    } else if (this.visible && !this.running) {
      this.start();
    }
  }

  _bindObservers() {
    this._onResize = () => this.resize();
    window.addEventListener('resize', this._onResize);

    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(() => this.resize());
      this.resizeObserver.observe(this.canvasWrap);
      const sceneEl = this.canvas.closest('[data-globe-scene]');
      if (sceneEl) this.resizeObserver.observe(sceneEl);
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

  dispose() {
    this.stop();
    window.removeEventListener('resize', this._onResize);
    this.resizeObserver?.disconnect();
    this.intersectionObserver?.disconnect();
    clearTimeout(this.idleTimer);
    this.shelvesTween?.kill?.();
    this._scrollApply = null;

    this.bubbles?.dispose();
    this.shelves?.dispose();
    this.markers?.dispose();
    this.earthRT?.dispose();
    this.compositeRT?.dispose();
    this.earthDisposeExtras?.();
    this.controls?.dispose();
    this.composer?.dispose();
    this.renderer?.dispose();
  }
}
