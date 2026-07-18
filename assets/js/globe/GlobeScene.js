import * as THREE from '../vendor/three.module.min.js';
import { createEarth, configureRendererToneMapping } from './earth.js';
import { createShelves } from './shelves.js';
import { createBubbles } from './bubbles.js';
import { createMarkers } from './markers.js';

const MAX_DPR = 2;
/** Opaque mist-to — never clear with alpha=0 (Chromium composites as white). Matches v4 section. */
const SECTION_CLEAR = 0xe0f2fe;
/** Earth at world origin; screen placement via setViewOffset into right golden zone. */
const EARTH_OFFSET = new THREE.Vector3(0, 0, 0);
const CAMERA_FOV = 34;
/** Sphere mesh radius (+ atmosphere margin) for framing math. */
const EARTH_FRAME_RADIUS = 1.08;
/** Constitution v1.4: diameter = min(rightZoneW, rightZoneH) * this (8–12% margin). */
const EARTH_FIT_FRACTION = 0.74;
/** Full-viewport right golden zone: [0.38, 1.0] → center = 0.38 + 0.62/2. */
const RIGHT_ZONE_LEFT = 0.38;
const RIGHT_ZONE_WIDTH = 0.62;
/** Ball center as fraction of full canvas/section width (NOT inner page-width stage). */
const EARTH_VIEW_CENTER_X = RIGHT_ZONE_LEFT + RIGHT_ZONE_WIDTH * 0.5; // 0.69
/** rad/s — slow plumb-axis spin on earthGroup.rotation.y */
const EARTH_SPIN_SPEED = 0.085;
const DRAG_YAW_PER_PX = 0.0055;
const SPIN_RESUME_MS = 1200;

/** Three.js layers (constitution §2.2) — independent masks. */
const LAYER_EARTH = 0;
const LAYER_BUBBLE_BACK = 1;
const LAYER_BUBBLE_FRONT = 2;

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
    this.camera = new THREE.PerspectiveCamera(CAMERA_FOV, 1, 0.1, 100);
    this.camera.position.set(0, 0, 5.2);
    this.camera.lookAt(EARTH_OFFSET);
    this.camera.layers.enable(LAYER_EARTH);
    this.camera.layers.enable(LAYER_BUBBLE_BACK);
    this.camera.layers.enable(LAYER_BUBBLE_FRONT);

    this.running = false;
    this.visible = false;
    this.animationId = null;
    this.clock = new THREE.Clock();
    this.shelvesVisible = false;
    this.bubblesVisible = true;
    this.shelvesTween = null;

    this.earthRT = null;
    this.compositeRT = null;
    this.earthGroup = null;
    this.earthDisposeExtras = null;
    this.bubbles = null;
    this.shelves = null;
    this.markers = null;
    this.composer = null;
    this.resizeObserver = null;
    this.intersectionObserver = null;
    this.idleTimer = null;
    this._scrollApply = null;

    /** Independent Y spin (constitution v1.3) — not OrbitControls. */
    this._spinEnabled = true;
    this._dragging = false;
    this._lastPointerX = 0;
    this._yawUnsubs = [];

    this._initRenderer();
  }

  _initRenderer() {
    try {
      this.renderer = new THREE.WebGLRenderer({
        canvas: this.canvas,
        alpha: false,
        antialias: true,
        premultipliedAlpha: false,
        preserveDrawingBuffer: true,
      });
    } catch (err) {
      console.error('WebGL unavailable', err);
      showGlobeStatus('当前浏览器无法使用 WebGL，无法显示 3D 地球。');
      this.renderer = null;
      return;
    }

    configureRendererToneMapping(this.renderer);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, MAX_DPR));
    this.renderer.autoClear = true;
    this.renderer.setClearColor(SECTION_CLEAR, 1);
  }

  async init() {
    if (!this.renderer) return false;

    try {
      const { group, disposeExtras } = await createEarth({ scene: this.scene, renderer: this.renderer });
      this.earthGroup = group;
      this.earthGroup.position.copy(EARTH_OFFSET);
      this.earthGroup.traverse((obj) => {
        if (obj.isMesh || obj.isGroup) obj.layers.set(LAYER_EARTH);
      });
      this.earthDisposeExtras = disposeExtras;

      this.shelves = await createShelves(this.earthGroup);
      this.earthGroup.traverse((obj) => {
        if (obj.isMesh || obj.isGroup) obj.layers.set(LAYER_EARTH);
      });
      this.bubbles = createBubbles({ scene: this.scene, camera: this.camera });
      this.bubbles?.setEarthOrigin?.(EARTH_OFFSET);

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
        depthBuffer: true,
        stencilBuffer: false,
      });
      this.compositeRT = new THREE.WebGLRenderTarget(size.w, size.h, {
        minFilter: THREE.LinearFilter,
        magFilter: THREE.LinearFilter,
        depthBuffer: true,
        stencilBuffer: false,
      });

      this._bindEarthYawDrag();
      this._bindShelvesToggle();
      this._bindObservers();
      this._syncInitialVisibility();
      this.resize();
      this.applyMotion();

      if (this.visible && !motionReduced()) this.start();
      else this._renderFrame();

      if (typeof window !== 'undefined') {
        const layerMask = (obj) => obj?.layers?.mask;
        window.__globeDebug = {
          sceneChildren: this.scene.children.length,
          earthInScene: this.scene.children.includes(this.earthGroup),
          earthVisible: this.earthGroup.visible,
          earthPos: this.earthGroup.position.toArray(),
          camPos: this.camera.position.toArray(),
          bubblesVisible: this.bubblesVisible,
          running: this.running,
          spinEnabled: this._spinEnabled,
          layerMasks: {
            earth: layerMask(this.earthGroup),
            earthMesh: (() => {
              let m = null;
              this.earthGroup.traverse((o) => {
                if (!m && o.isMesh) m = layerMask(o);
              });
              return m;
            })(),
            backBubbles: layerMask(this.bubbles?.backMesh),
            frontBubbles: layerMask(this.bubbles?.frontMesh),
            expected: { earth: 1 << LAYER_EARTH, back: 1 << LAYER_BUBBLE_BACK, front: 1 << LAYER_BUBBLE_FRONT },
          },
        };
      }

      this.onReady?.();
      return true;
    } catch (err) {
      console.error('GlobeScene.init failed', err);
      showGlobeStatus(
        '地球 3D 初始化失败（' +
          (err?.message || err) +
          '）。请确认 WebGL 可用，并查看控制台 Network 是否有 404。',
      );
      return false;
    }
  }

  _bindEarthYawDrag() {
    const el = this.canvas;
    if (!el) return;

    const onDown = (e) => {
      if (e.button != null && e.button !== 0) return;
      this._dragging = true;
      this._spinEnabled = false;
      clearTimeout(this.idleTimer);
      this._lastPointerX = e.clientX;
      el.setPointerCapture?.(e.pointerId);
    };

    const onMove = (e) => {
      if (!this._dragging || !this.earthGroup) return;
      const dx = e.clientX - this._lastPointerX;
      this._lastPointerX = e.clientX;
      this.earthGroup.rotation.y += dx * DRAG_YAW_PER_PX;
    };

    const onUp = (e) => {
      if (!this._dragging) return;
      this._dragging = false;
      try {
        el.releasePointerCapture?.(e.pointerId);
      } catch {
        /* ignore */
      }
      this._resumeSpin();
    };

    el.addEventListener('pointerdown', onDown);
    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerup', onUp);
    el.addEventListener('pointercancel', onUp);
    el.addEventListener('lostpointercapture', onUp);

    this._yawUnsubs = [
      () => el.removeEventListener('pointerdown', onDown),
      () => el.removeEventListener('pointermove', onMove),
      () => el.removeEventListener('pointerup', onUp),
      () => el.removeEventListener('pointercancel', onUp),
      () => el.removeEventListener('lostpointercapture', onUp),
    ];
  }

  _resumeSpin() {
    clearTimeout(this.idleTimer);
    this.idleTimer = setTimeout(() => {
      if (!motionReduced()) this._spinEnabled = true;
    }, SPIN_RESUME_MS);
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

  _getSize() {
    const host = this.canvasWrap || this.section;
    const w = host?.clientWidth || this.section.clientWidth || 1;
    const h = host?.clientHeight || this.section.clientHeight || 1;
    return { w: Math.max(1, w), h: Math.max(1, h) };
  }

  /**
   * Constitution v1.4: place world origin at full-canvas x = 0.69 (viewport right golden center).
   * Three.js: positive offsetX shifts frustum sampling; negative offset moves content right.
   */
  _applyEarthViewOffset(w, h) {
    if (!this.camera || w < 1 || h < 1) return;
    const centerX = EARTH_VIEW_CENTER_X;
    const xOffset = -Math.round((centerX - 0.5) * w);
    this.camera.setViewOffset(w, h, xOffset, 0, w, h);
    this.camera.updateProjectionMatrix();
  }

  /**
   * Fit sphere diameter to min(rightZoneW, rightZoneH) * 0.74 — never clip left/right/top/bottom.
   */
  _fitCameraToRightZone(canvasW, canvasH) {
    if (!this.camera || canvasW < 1 || canvasH < 1) return;

    const rightZoneW = canvasW * RIGHT_ZONE_WIDTH;
    const rightZoneH = canvasH;
    const targetPx = Math.max(80, Math.min(rightZoneW, rightZoneH) * EARTH_FIT_FRACTION);

    const fovRad = THREE.MathUtils.degToRad(this.camera.fov);
    const tanHalf = Math.tan(fovRad * 0.5);
    // diameter_px ≈ (2R / z) / (2 tan(fov/2)) * canvasH  =>  z = R * canvasH / (tanHalf * diameter_px)
    let z = (EARTH_FRAME_RADIUS * canvasH) / (tanHalf * targetPx);
    // Soft clamp only: allow larger z so we never force a too-large sphere that clips.
    z = THREE.MathUtils.clamp(z, 2.8, 14);

    this.camera.position.set(0, 0, z);
    this.camera.lookAt(EARTH_OFFSET);
    this.camera.userData.homeZ = z;
  }

  /** Project earth origin to CSS pixel X fraction of canvas (debug + self-check). */
  _updateEarthScreenDebug(canvasW, canvasH) {
    if (!this.camera || !this.earthGroup || canvasW < 1) return;
    const v = EARTH_OFFSET.clone().project(this.camera);
    const screenX = (v.x * 0.5 + 0.5) * canvasW;
    const screenY = (-v.y * 0.5 + 0.5) * canvasH;
    const fracX = screenX / canvasW;
    if (typeof window !== 'undefined') {
      if (!window.__globeDebug) window.__globeDebug = {};
      window.__globeDebug.earthScreenX = screenX;
      window.__globeDebug.earthScreenY = screenY;
      window.__globeDebug.earthScreenFracX = fracX;
      window.__globeDebug.targetFracX = EARTH_VIEW_CENTER_X;
      window.__globeDebug.camPos = this.camera.position.toArray();
    }
  }

  resize() {
    if (!this.renderer) return;
    const { w, h } = this._getSize();
    if (w < 1 || h < 1) return;

    this.camera.aspect = w / h;
    this._fitCameraToRightZone(w, h);
    this._applyEarthViewOffset(w, h);
    const dpr = Math.min(window.devicePixelRatio, MAX_DPR);
    this.renderer.setPixelRatio(dpr);
    this.renderer.setSize(w, h, false);
    this.markers?.setSize(w, h);
    this.bubbles?.setSize(w * dpr, h * dpr);
    this.bubbles?.relayout(this.camera);

    if (this.earthRT) {
      this.earthRT.setSize(w * dpr, h * dpr);
    }
    if (this.compositeRT) {
      this.compositeRT.setSize(w * dpr, h * dpr);
    }
    this.composer?.setSize?.(w, h);
    this.composer?.setPixelRatio?.(dpr);

    this._updateEarthScreenDebug(w, h);
  }

  /**
   * Constitution §2.2 multi-pass:
   * A) Earth-only → RT (refraction)
   * B) Clear → earth (layer 0) writes depth
   * C) Back bubbles (layer 1) depth-tested → occluded by earth
   * D) Front bubbles (layer 2) over earth
   */
  _renderGlobeLayers() {
    if (!this.renderer || !this.earthGroup) return;

    const dpr = this.renderer.getPixelRatio();
    const size = this.renderer.getSize(new THREE.Vector2());
    const backMesh = this.bubbles?.backMesh;
    const frontMesh = this.bubbles?.frontMesh;
    const hasBubbles = this.bubblesVisible && (backMesh || frontMesh);

    const setCamLayer = (layer) => {
      this.camera.layers.disableAll();
      this.camera.layers.enable(layer);
    };

    setCamLayer(LAYER_EARTH);
    this.renderer.setRenderTarget(this.earthRT);
    this.renderer.setClearColor(SECTION_CLEAR, 1);
    this.renderer.clear(true, true, true);
    this.renderer.render(this.scene, this.camera);

    if (hasBubbles) {
      this.bubbles.setDiffuse(this.earthRT.texture);
      this.bubbles.setSize(size.x * dpr, size.y * dpr);
    }

    this.renderer.setRenderTarget(null);
    this.renderer.setViewport(0, 0, size.x * dpr, size.y * dpr);
    this.renderer.setClearColor(SECTION_CLEAR, 1);
    this.renderer.clear(true, true, true);
    setCamLayer(LAYER_EARTH);
    this.renderer.render(this.scene, this.camera);

    if (hasBubbles) {
      this.renderer.autoClear = false;

      if (backMesh) {
        setCamLayer(LAYER_BUBBLE_BACK);
        this.renderer.render(this.scene, this.camera);
      }

      if (frontMesh) {
        setCamLayer(LAYER_BUBBLE_FRONT);
        this.renderer.render(this.scene, this.camera);
      }

      this.renderer.autoClear = true;
    }

    this.camera.layers.disableAll();
    this.camera.layers.enable(LAYER_EARTH);
    this.camera.layers.enable(LAYER_BUBBLE_BACK);
    this.camera.layers.enable(LAYER_BUBBLE_FRONT);
  }

  _updateEarthSpin(delta) {
    if (!this.earthGroup || this._dragging || !this._spinEnabled || motionReduced()) return;
    this.earthGroup.rotation.y += EARTH_SPIN_SPEED * Math.min(delta, 0.05);
  }

  _renderFrame() {
    if (!this.renderer || !this.earthGroup) return;

    const reduced = motionReduced();
    const delta = this.clock.getDelta();
    const elapsed = this.clock.elapsedTime;
    this._updateEarthSpin(delta);
    this.bubbles?.update(elapsed, reduced);
    this.shelves?.update(elapsed);
    this._scrollApply?.();

    this._renderGlobeLayers();
    this.markers?.render(this.scene, this.camera);

    const { w, h } = this._getSize();
    this._updateEarthScreenDebug(w, h);

    if (typeof window !== 'undefined' && window.__globeDebug) {
      window.__globeDebug.earthRotY = this.earthGroup.rotation.y;
      window.__globeDebug.spinEnabled = this._spinEnabled;
      window.__globeDebug.dragging = this._dragging;
    }
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

  setBubblesVisible(on) {
    this.bubblesVisible = Boolean(on);
  }

  setScrollApply(fn) {
    this._scrollApply = fn;
  }

  applyMotion() {
    if (!this.renderer) return;

    const reduced = motionReduced();
    this.section.classList.toggle('ocean-explore--static', reduced);
    this._spinEnabled = !reduced && !this._dragging;

    if (reduced) {
      this.stop();
      this._renderFrame();
    } else if (this.visible && !this.running) {
      this.start();
    }
  }

  _syncInitialVisibility() {
    if (typeof IntersectionObserver === 'undefined') {
      this.visible = true;
      return;
    }

    const rect = this.section.getBoundingClientRect();
    const vh = window.innerHeight || document.documentElement.clientHeight || 1;
    this.visible = rect.bottom > 0 && rect.top < vh;
  }

  _bindObservers() {
    this._onResize = () => this.resize();
    window.addEventListener('resize', this._onResize);

    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(() => this.resize());
      this.resizeObserver.observe(this.section);
      if (this.canvasWrap && this.canvasWrap !== this.section) {
        this.resizeObserver.observe(this.canvasWrap);
      }
      const stage = this.section?.querySelector('.ocean-explore__stage');
      if (stage) this.resizeObserver.observe(stage);
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
    this._yawUnsubs.forEach((fn) => fn());
    this._yawUnsubs = [];

    this.bubbles?.dispose();
    this.shelves?.dispose();
    this.markers?.dispose();
    this.earthRT?.dispose();
    this.compositeRT?.dispose();
    this.earthDisposeExtras?.();
    this.composer?.dispose?.();
    this.renderer?.dispose();
  }
}
