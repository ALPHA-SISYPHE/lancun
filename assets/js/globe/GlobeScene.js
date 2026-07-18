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
/** Sphere mesh radius (+ atmosphere / marker margin) for framing math. Constitution v1.8. */
const EARTH_FRAME_RADIUS = 1.12;
/** Constitution v1.7/v1.8: ratio constant — earth diameter = copy panel height * this. */
const EARTH_COPY_HEIGHT_RATIO = 1.12;
/** Minimum sensible copy panel height when layout not yet measured (px). */
const COPY_PANEL_MIN_HEIGHT = 40;
/** Canvas edge margin for containment (fraction of canvas). */
const FRAMING_MARGIN = 0.02;
/** Min gap between copy panel right edge and earth projection left (px). */
const COPY_PANEL_GAP = 16;
/** Slop when testing copy/stage side-by-side layout (px). */
const SIDE_BY_SIDE_SLOP = 12;
/** Binary-search iterations for max diameter at fixed center. */
const FRAMING_BINARY_ITER = 20;
/** Forced-shrink factor when containment still fails. */
const FRAMING_FORCE_SHRINK = 0.92;
const FRAMING_MIN_DIAMETER = 40;
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
    this._resizePending = false;

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
      requestAnimationFrame(() => this._scheduleResize());
      setTimeout(() => this._scheduleResize(), 200);
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
   * Constitution v1.8: visible safe rect in canvas-local px (viewport ∩ host − header).
   */
  _getVisibleFramingRect(canvasW, canvasH) {
    const marginX = canvasW * FRAMING_MARGIN;
    const marginY = canvasH * FRAMING_MARGIN;
    const fallback = {
      left: marginX,
      right: canvasW - marginX,
      top: marginY,
      bottom: canvasH - marginY,
    };

    const host = this.canvasWrap || this.section;
    const hostRect = host?.getBoundingClientRect();
    if (!hostRect || canvasW < 1 || canvasH < 1) return fallback;

    const vv = typeof window !== 'undefined' ? window.visualViewport : null;
    const visLeft = vv?.offsetLeft ?? 0;
    const visTop = vv?.offsetTop ?? 0;
    const visRight = visLeft + (vv?.width ?? window.innerWidth);
    const visBottom = visTop + (vv?.height ?? window.innerHeight);

    const intersectLeft = Math.max(hostRect.left, visLeft);
    const intersectTop = Math.max(hostRect.top, visTop);
    const intersectRight = Math.min(hostRect.right, visRight);
    const intersectBottom = Math.min(hostRect.bottom, visBottom);

    let headerH = 76;
    if (this.section && typeof getComputedStyle !== 'undefined') {
      const smt = getComputedStyle(this.section).scrollMarginTop;
      const parsed = parseFloat(smt);
      if (!Number.isNaN(parsed) && parsed > 0) headerH = parsed;
    }
    const safeTop = Math.max(intersectTop, hostRect.top + headerH);

    let left = intersectLeft - hostRect.left + marginX;
    let right = intersectRight - hostRect.left - marginX;
    let top = safeTop - hostRect.top + marginY;
    let bottom = intersectBottom - hostRect.top - marginY;

    left = THREE.MathUtils.clamp(left, marginX, canvasW - marginX);
    right = THREE.MathUtils.clamp(right, marginX, canvasW - marginX);
    top = THREE.MathUtils.clamp(top, marginY, canvasH - marginY);
    bottom = THREE.MathUtils.clamp(bottom, marginY, canvasH - marginY);

    if (right <= left || bottom <= top) return fallback;
    return { left, right, top, bottom };
  }

  /**
   * Constitution v1.7: measure copy island anchor in canvas-local coordinates.
   */
  _measureCopyAnchor(canvasW, canvasH) {
    const panel =
      this.section?.querySelector('[data-ocean-panel]') ||
      this.section?.querySelector('.ocean-explore__copy');
    const stage = this.section?.querySelector('.ocean-explore__stage');
    const host = this.canvasWrap || this.section;
    const hostRect = host?.getBoundingClientRect();
    const w = canvasW;
    const h = canvasH;

    if (!panel || !hostRect || w < 1 || h < 1) {
      return {
        copyHeight: Math.max(COPY_PANEL_MIN_HEIGHT, h * 0.35),
        copyCenterX: w * 0.2,
        copyCenterY: h * 0.5,
        copyRight: w * 0.38,
        isSideBySide: w >= 720,
      };
    }

    const panelRect = panel.getBoundingClientRect();
    const stageRect = stage?.getBoundingClientRect();
    let copyHeight = panelRect.height;
    if (copyHeight < COPY_PANEL_MIN_HEIGHT) {
      copyHeight = Math.max(COPY_PANEL_MIN_HEIGHT, h * 0.35);
    }

    const copyLeft = panelRect.left - hostRect.left;
    const copyRight = panelRect.right - hostRect.left;
    const copyCenterX = copyLeft + panelRect.width * 0.5;
    const copyCenterY = panelRect.top + panelRect.height * 0.5 - hostRect.top;

    const isSideBySide = stageRect
      ? panelRect.right <= stageRect.left + SIDE_BY_SIDE_SLOP && stageRect.width > 40
      : copyRight < w * 0.55;

    return {
      copyHeight,
      copyCenterX,
      copyCenterY: THREE.MathUtils.clamp(copyCenterY, h * 0.08, h * 0.92),
      copyRight,
      isSideBySide,
    };
  }

  _zFromDiameter(canvasH, diameterPx) {
    const fovRad = THREE.MathUtils.degToRad(this.camera.fov);
    const tanHalf = Math.tan(fovRad * 0.5);
    let z = (EARTH_FRAME_RADIUS * canvasH) / (tanHalf * Math.max(80, diameterPx));
    return THREE.MathUtils.clamp(z, 2.8, 14);
  }

  _applyViewOffsetForCenter(canvasW, canvasH, centerX, centerY) {
    const xOffset = -Math.round(centerX - canvasW * 0.5);
    const yOffset = -Math.round(centerY - canvasH * 0.5);
    this.camera.setViewOffset(canvasW, canvasH, xOffset, yOffset, canvasW, canvasH);
    this.camera.updateProjectionMatrix();
    return { xOffset, yOffset };
  }

  _projectEarthBounds(canvasW, canvasH) {
    const toScreen = (x, y, z) => {
      const v = new THREE.Vector3(x, y, z).project(this.camera);
      return {
        x: (v.x * 0.5 + 0.5) * canvasW,
        y: (-v.y * 0.5 + 0.5) * canvasH,
      };
    };

    const R = EARTH_FRAME_RADIUS;
    const samples = [toScreen(0, 0, 0)];
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2;
      samples.push(toScreen(Math.cos(a) * R, Math.sin(a) * R, 0));
    }
    samples.push(toScreen(0, R, 0), toScreen(0, -R, 0));

    const xs = samples.map((p) => p.x);
    const ys = samples.map((p) => p.y);
    const center = samples[0];

    return {
      centerX: center.x,
      centerY: center.y,
      top: Math.min(...ys),
      bottom: Math.max(...ys),
      left: Math.min(...xs),
      right: Math.max(...xs),
      diameter: Math.max(Math.max(...ys) - Math.min(...ys), Math.max(...xs) - Math.min(...xs)),
    };
  }

  _boundsContainmentOk(bounds, safeRect, anchor) {
    const contained =
      bounds.left >= safeRect.left &&
      bounds.right <= safeRect.right &&
      bounds.top >= safeRect.top &&
      bounds.bottom <= safeRect.bottom;
    const clearCopy = !anchor.isSideBySide || bounds.left >= anchor.copyRight + COPY_PANEL_GAP;
    return contained && clearCopy;
  }

  _applyFramingCandidate(canvasW, canvasH, diameterPx, centerX, centerY) {
    const z = this._zFromDiameter(canvasH, diameterPx);
    this.camera.position.set(0, 0, z);
    this.camera.lookAt(EARTH_OFFSET);
    const offsets = this._applyViewOffsetForCenter(canvasW, canvasH, centerX, centerY);
    const bounds = this._projectEarthBounds(canvasW, canvasH);
    return { z, diameterPx, bounds, offsets };
  }

  _testFramingFit(canvasW, canvasH, diameterPx, centerX, centerY, safeRect, anchor) {
    const candidate = this._applyFramingCandidate(canvasW, canvasH, diameterPx, centerX, centerY);
    return {
      ...candidate,
      ok: this._boundsContainmentOk(candidate.bounds, safeRect, anchor),
    };
  }

  /**
   * Constitution v1.8: Containment First — binary max diameter, X nudge, forced shrink.
   */
  _resolveEarthFraming(canvasW, canvasH) {
    if (!this.camera || canvasW < 1 || canvasH < 1) return null;

    const anchor = this._measureCopyAnchor(canvasW, canvasH);
    const safeRect = this._getVisibleFramingRect(canvasW, canvasH);
    const targetCenterY = anchor.isSideBySide ? anchor.copyCenterY : canvasH * 0.5;
    const preferredCenterX = anchor.isSideBySide ? canvasW * EARTH_VIEW_CENTER_X : canvasW * 0.5;
    const artTarget = anchor.copyHeight * EARTH_COPY_HEIGHT_RATIO;
    const maxArtD = Math.max(80, artTarget);

    let solverMode = 'binary';
    let bestD = 80;
    let bestX = preferredCenterX;

    let lo = 80;
    let hi = maxArtD;
    for (let i = 0; i < FRAMING_BINARY_ITER; i++) {
      const mid = (lo + hi) / 2;
      const { ok } = this._testFramingFit(
        canvasW,
        canvasH,
        mid,
        preferredCenterX,
        targetCenterY,
        safeRect,
        anchor,
      );
      if (ok) {
        bestD = mid;
        lo = mid;
      } else {
        hi = mid;
      }
    }

    let fit = this._testFramingFit(
      canvasW,
      canvasH,
      bestD,
      preferredCenterX,
      targetCenterY,
      safeRect,
      anchor,
    );

    if (!fit.ok) {
      solverMode = 'xNudge';
      const minX = anchor.isSideBySide
        ? anchor.copyRight + COPY_PANEL_GAP + bestD / 2
        : safeRect.left + bestD / 2;
      for (let x = preferredCenterX; x >= minX; x -= canvasW * 0.01) {
        const trial = this._testFramingFit(
          canvasW,
          canvasH,
          bestD,
          x,
          targetCenterY,
          safeRect,
          anchor,
        );
        if (trial.ok) {
          bestX = x;
          fit = trial;
          break;
        }
      }
    } else {
      bestX = preferredCenterX;
    }

    if (!fit.ok) {
      solverMode = 'forcedShrink';
      let d = bestD;
      while (d > FRAMING_MIN_DIAMETER) {
        const trial = this._testFramingFit(
          canvasW,
          canvasH,
          d,
          bestX,
          targetCenterY,
          safeRect,
          anchor,
        );
        if (trial.ok) {
          bestD = d;
          fit = trial;
          break;
        }
        d *= FRAMING_FORCE_SHRINK;
      }
    }

    if (!fit.ok) {
      solverMode = 'safeRectCenter';
      const rightZoneLeft = canvasW * RIGHT_ZONE_LEFT;
      bestX =
        Math.max(rightZoneLeft, safeRect.left) +
        (safeRect.right - Math.max(rightZoneLeft, safeRect.left)) / 2;
      let d = bestD;
      while (d > FRAMING_MIN_DIAMETER) {
        const trial = this._testFramingFit(
          canvasW,
          canvasH,
          d,
          bestX,
          targetCenterY,
          safeRect,
          anchor,
        );
        if (trial.ok) {
          bestD = d;
          fit = trial;
          break;
        }
        d *= FRAMING_FORCE_SHRINK;
      }
    }

    if (!fit.ok) {
      bestD = FRAMING_MIN_DIAMETER;
      bestX = (safeRect.left + safeRect.right) / 2;
      fit = this._testFramingFit(
        canvasW,
        canvasH,
        bestD,
        bestX,
        targetCenterY,
        safeRect,
        anchor,
      );
      solverMode = 'safeRectCenter';
    }

    const resolved = {
      z: fit.z,
      diameterPx: bestD,
      artTarget,
      bounds: fit.bounds,
      offsets: fit.offsets,
      anchor,
      targetCenterX: bestX,
      targetCenterY,
      safeRect,
      solverMode,
    };

    this.camera.userData.homeZ = resolved.z;
    this.camera.userData.copyPanelHeight = anchor.copyHeight;
    this.camera.userData.earthArtTarget = artTarget;
    this.camera.userData.earthTargetDiameter = resolved.diameterPx;
    this.camera.userData.resolvedDiameter = resolved.diameterPx;
    this.camera.userData.targetCenterX = resolved.targetCenterX;
    this.camera.userData.targetCenterY = resolved.targetCenterY;
    this.camera.userData.copyPanelCenterY = anchor.copyCenterY;
    this.camera.userData.copyPanelCenterFracY = anchor.copyCenterY / canvasH;
    this.camera.userData.targetFracY = resolved.targetCenterY / canvasH;
    this.camera.userData.targetCenterXFrac = resolved.targetCenterX / canvasW;
    this.camera.userData.viewOffsetY = resolved.offsets.yOffset;
    this.camera.userData.isSideBySide = anchor.isSideBySide;
    this.camera.userData.framingBounds = resolved.bounds;
    this.camera.userData.visibleSafeRect = resolved.safeRect;
    this.camera.userData.solverMode = resolved.solverMode;
    this.camera.userData.containmentOk = this._boundsContainmentOk(
      resolved.bounds,
      safeRect,
      anchor,
    );

    return resolved;
  }

  /** Project earth origin + diameter to CSS pixels (debug + self-check). */
  _updateEarthScreenDebug(canvasW, canvasH) {
    if (!this.camera || !this.earthGroup || canvasW < 1) return;

    const bounds = this._projectEarthBounds(canvasW, canvasH);
    const fracX = bounds.centerX / canvasW;
    const fracY = bounds.centerY / canvasH;

    const copyPanelHeight = this.camera.userData.copyPanelHeight ?? 0;
    const copyPanelCenterFracY = this.camera.userData.copyPanelCenterFracY ?? 0.5;
    const targetFracY = this.camera.userData.targetFracY ?? 0.5;
    const earthScreenDiameter = bounds.diameter;
    const diameterToCopyRatio =
      copyPanelHeight > 0 ? earthScreenDiameter / copyPanelHeight : null;
    const yAlignDelta =
      this.camera.userData.isSideBySide && copyPanelCenterFracY
        ? fracY - copyPanelCenterFracY
        : null;

    const safeRect = this.camera.userData.visibleSafeRect ?? this._getVisibleFramingRect(canvasW, canvasH);
    const clipRight = bounds.right - safeRect.right;
    const clipBottom = bounds.bottom - safeRect.bottom;
    const clipLeft = safeRect.left - bounds.left;
    const clipTop = safeRect.top - bounds.top;

    if (typeof window !== 'undefined') {
      if (!window.__globeDebug) window.__globeDebug = {};
      window.__globeDebug.earthScreenX = bounds.centerX;
      window.__globeDebug.earthScreenY = bounds.centerY;
      window.__globeDebug.earthScreenFracX = fracX;
      window.__globeDebug.earthScreenFracY = fracY;
      window.__globeDebug.targetFracX = this.camera.userData.targetCenterXFrac ?? EARTH_VIEW_CENTER_X;
      window.__globeDebug.targetFracY = targetFracY;
      window.__globeDebug.copyPanelCenterFracY = copyPanelCenterFracY;
      window.__globeDebug.copyPanelCenterY = this.camera.userData.copyPanelCenterY;
      window.__globeDebug.viewOffsetY = this.camera.userData.viewOffsetY;
      window.__globeDebug.isSideBySide = this.camera.userData.isSideBySide;
      window.__globeDebug.containmentOk = this.camera.userData.containmentOk;
      window.__globeDebug.boundsTop = bounds.top;
      window.__globeDebug.boundsBottom = bounds.bottom;
      window.__globeDebug.boundsLeft = bounds.left;
      window.__globeDebug.boundsRight = bounds.right;
      window.__globeDebug.visibleSafeRect = safeRect;
      window.__globeDebug.clipRight = clipRight;
      window.__globeDebug.clipBottom = clipBottom;
      window.__globeDebug.clipLeft = clipLeft;
      window.__globeDebug.clipTop = clipTop;
      window.__globeDebug.solverMode = this.camera.userData.solverMode;
      window.__globeDebug.yAlignDelta = yAlignDelta;
      window.__globeDebug.ratioActual = diameterToCopyRatio;
      window.__globeDebug.camPos = this.camera.position.toArray();
      window.__globeDebug.copyPanelHeight = copyPanelHeight;
      window.__globeDebug.earthArtTarget = this.camera.userData.earthArtTarget;
      window.__globeDebug.earthTargetDiameter = this.camera.userData.earthTargetDiameter;
      window.__globeDebug.resolvedDiameter = this.camera.userData.resolvedDiameter;
      window.__globeDebug.earthScreenDiameter = earthScreenDiameter;
      window.__globeDebug.diameterToCopyRatio = diameterToCopyRatio;
      window.__globeDebug.targetDiameterToCopyRatio = EARTH_COPY_HEIGHT_RATIO;
    }
  }

  resize() {
    if (!this.renderer) return;
    const { w, h } = this._getSize();
    if (w < 1 || h < 1) return;

    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this._resolveEarthFraming(w, h);
    const dpr = Math.min(window.devicePixelRatio, MAX_DPR);
    this.renderer.setPixelRatio(dpr);
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

  setScrollApply(_fn) {
    /* Constitution v1.8: scroll dolly abolished — framing locked via _resolveEarthFraming. */
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
    this._scheduleResize = () => {
      if (this._resizePending) return;
      this._resizePending = true;
      requestAnimationFrame(() => {
        this._resizePending = false;
        this.resize();
      });
    };
    this._onResize = () => this._scheduleResize();
    this._onLoad = () => this._scheduleResize();
    window.addEventListener('resize', this._onResize);
    window.addEventListener('load', this._onLoad);
    window.visualViewport?.addEventListener('resize', this._onResize);

    if (typeof document !== 'undefined' && document.fonts?.ready) {
      document.fonts.ready.then(() => this._scheduleResize()).catch(() => {});
    }

    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(() => this._scheduleResize());
      this.resizeObserver.observe(this.section);
      if (this.canvasWrap && this.canvasWrap !== this.section) {
        this.resizeObserver.observe(this.canvasWrap);
      }
      const copyPanel =
        this.section?.querySelector('[data-ocean-panel]') ||
        this.section?.querySelector('.ocean-explore__copy');
      if (copyPanel) this.resizeObserver.observe(copyPanel);
      const layout = this.section?.querySelector('.ocean-explore__layout');
      if (layout) this.resizeObserver.observe(layout);
      const stage = this.section?.querySelector('.ocean-explore__stage');
      if (stage) this.resizeObserver.observe(stage);
    }

    if (typeof IntersectionObserver !== 'undefined') {
      this.intersectionObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            this.visible = entry.isIntersecting;
            if (this.visible) {
              this._scheduleResize();
              if (!motionReduced()) this.start();
            } else {
              this.stop();
            }
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
    window.removeEventListener('load', this._onLoad);
    window.visualViewport?.removeEventListener('resize', this._onResize);
    this.resizeObserver?.disconnect();
    this.intersectionObserver?.disconnect();
    clearTimeout(this.idleTimer);
    this.shelvesTween?.kill?.();
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
