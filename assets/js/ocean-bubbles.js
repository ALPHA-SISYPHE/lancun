/**
 * #ocean-explore — video-bg + earth-default (v76)
 * Default: static Earth over CSS/video bg; bubbles off unless ?bubbles=1 or localStorage.
 * Bubble stack code retained for opt-in.
 */
import * as THREE from './vendor/three.module.min.js';
import { createBubbles } from './globe/bubbles.js?v=76';
import { loadEarthTexture, loadCloudTexture } from './globe/utils/textures.js?v=76';

/** Fallback clear when no video / IOR RT sample. */
const SECTION_CLEAR = 0x050a14;

/** Bubbles opt-in: ?bubbles=1 or localStorage.lancun.oceanBubbles === '1' */
function bubblesEnabled() {
  try {
    const q = new URLSearchParams(window.location.search);
    const flag = q.get('bubbles');
    if (flag === '1' || flag === 'true') return true;
    if (flag === '0' || flag === 'false') return false;
    return window.localStorage?.getItem('lancun.oceanBubbles') === '1';
  } catch {
    return false;
  }
}
const CAMERA_FOV = 34;
const MAX_DPR = 2;
const LAYER_EARTH = 0;
const LAYER_BUBBLE_BACK = 1;
const LAYER_BUBBLE_FRONT = 2;

/** Right-zone mass: NDC x≈0.69 → world ~+1.05 at z=0 with current FOV/cam. */
const EARTH_POS = new THREE.Vector3(0.98, -0.02, 0);
const EARTH_RADIUS = 1.18;

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

/** Gold BG: near-black navy + restrained cobalt behind Earth (no #8ed0ff wash). */
function createDarkGradientTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#02060e';
  ctx.fillRect(0, 0, 512, 512);

  // Cobalt seat — tight to Earth; left/top stay near-black (ban cyan wash)
  const spot = ctx.createRadialGradient(385, 255, 2, 365, 258, 200);
  spot.addColorStop(0, '#3a88c8');
  spot.addColorStop(0.12, '#2868a8');
  spot.addColorStop(0.32, '#163a72');
  spot.addColorStop(0.52, '#0a1e40');
  spot.addColorStop(0.74, '#050e1c');
  spot.addColorStop(1, '#02060e');
  ctx.fillStyle = spot;
  ctx.fillRect(0, 0, 512, 512);

  const leftShade = ctx.createLinearGradient(0, 0, 280, 0);
  leftShade.addColorStop(0, 'rgba(1, 4, 12, 0.94)');
  leftShade.addColorStop(0.55, 'rgba(1, 4, 12, 0.55)');
  leftShade.addColorStop(0.85, 'rgba(1, 4, 12, 0.18)');
  leftShade.addColorStop(1, 'rgba(1, 4, 12, 0)');
  ctx.fillStyle = leftShade;
  ctx.fillRect(0, 0, 512, 512);

  // Kill upper-left cyan wash
  const topLeft = ctx.createRadialGradient(80, 60, 10, 140, 120, 220);
  topLeft.addColorStop(0, 'rgba(1, 4, 12, 0.55)');
  topLeft.addColorStop(1, 'rgba(1, 4, 12, 0)');
  ctx.fillStyle = topLeft;
  ctx.fillRect(0, 0, 512, 512);

  const vig = ctx.createRadialGradient(360, 255, 60, 300, 270, 400);
  vig.addColorStop(0, 'rgba(0,0,0,0)');
  vig.addColorStop(0.4, 'rgba(2, 8, 18, 0.12)');
  vig.addColorStop(1, 'rgba(1, 4, 12, 0.92)');
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, 512, 512);

  // Very faint deep-field dust (not bright bokeh wash)
  for (let i = 0; i < 16; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    const r = 2 + Math.random() * 8;
    const glow = ctx.createRadialGradient(x, y, 0, x, y, r);
    glow.addColorStop(0, 'rgba(80, 140, 200, 0.05)');
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

function createFallbackEarthTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  const g = ctx.createLinearGradient(0, 0, 0, 256);
  g.addColorStop(0, '#1a4a8c');
  g.addColorStop(0.5, '#0d2d5c');
  g.addColorStop(1, '#061828');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 512, 256);
  ctx.fillStyle = 'rgba(60, 140, 90, 0.55)';
  [[120, 90, 70, 40], [280, 100, 90, 50], [380, 140, 50, 30]].forEach(([x, y, rx, ry]) => {
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
  });
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
    this.camera.layers.enable(LAYER_EARTH);
    this.camera.layers.enable(LAYER_BUBBLE_BACK);
    this.camera.layers.enable(LAYER_BUBBLE_FRONT);

    this.renderer = null;
    this.bubbles = null;
    this.earthGroup = null;
    this.earthMesh = null;
    this.earthAtmo = null;
    this.earthClouds = null;
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
    this.bubblesOn = false;
    this.useVideoClear = true;
  }

  init() {
    this.section.classList.add('ocean-explore--dark-interim');
    this.section.classList.add('ocean-explore--video-bg');
    this.bubblesOn = bubblesEnabled();
    this.useVideoClear = true;
    if (!this.bubblesOn) this.section.classList.add('ocean-explore--earth-only');

    try {
      this.renderer = new THREE.WebGLRenderer({
        canvas: this.canvas,
        alpha: true,
        antialias: true,
        premultipliedAlpha: false,
      });
    } catch (err) {
      console.error(err);
      showStatus('当前浏览器无法使用 WebGL，无法显示海洋场景。');
      return false;
    }

    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, MAX_DPR));

    // Radial canvas BG only when bubbles need IOR sample (video shows through otherwise)
    if (this.bubblesOn) {
      this.bgTexture = createDarkGradientTexture();
      this.bgScene = new THREE.Scene();
      this.bgCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
      this.bgMesh = new THREE.Mesh(
        new THREE.PlaneGeometry(2, 2),
        new THREE.MeshBasicMaterial({ map: this.bgTexture, depthTest: false, depthWrite: false }),
      );
      this.bgScene.add(this.bgMesh);
    }

    this._addLights();
    this._addStaticEarthPlaceholder();

    if (this.bubblesOn) {
      this.bubbles = createBubbles({ scene: this.scene, camera: this.camera });
      this.bubbles.setEarthOrigin?.(EARTH_POS.clone());
    } else {
      this.bubbles = null;
    }

    this._bindShelvesToggle();
    this._bindObservers();
    this._syncVisible();
    this.resize();
    this.applyMotion();

    if (this.visible && !motionReduced() && this.bubblesOn) this.start();
    else this._renderFrame();

    this._loadEarthTextureAsync();
    this._loadCloudTextureAsync();

    return true;
  }

  _addLights() {
    // Gold: strong day limb + deep night side (lower fill than earlier bright wash)
    const key = new THREE.DirectionalLight(0xfff6e8, 2.55);
    key.position.set(-2.2, 3.6, 2.8);
    key.layers.enable(LAYER_EARTH);
    this.scene.add(key);

    const fill = new THREE.AmbientLight(0x6a8ab0, 0.32);
    fill.layers.enable(LAYER_EARTH);
    this.scene.add(fill);

    const hemi = new THREE.HemisphereLight(0xc4dcff, 0x060e18, 0.38);
    hemi.layers.enable(LAYER_EARTH);
    this.scene.add(hemi);

    const rim = new THREE.DirectionalLight(0xffd8a0, 0.42);
    rim.position.set(3.2, 0.4, -1.2);
    rim.layers.enable(LAYER_EARTH);
    this.scene.add(rim);
  }

  /** Fully static placeholder — match gold size/seat/brightness; no spin/drag. */
  _addStaticEarthPlaceholder() {
    const geo = new THREE.SphereGeometry(EARTH_RADIUS, 64, 64);
    const mat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.68,
      metalness: 0.0,
      emissive: new THREE.Color(0x040c18),
      emissiveIntensity: 0.03,
      map: createFallbackEarthTexture(),
    });
    this.earthMesh = new THREE.Mesh(geo, mat);
    this.earthMesh.layers.set(LAYER_EARTH);
    this.earthMesh.renderOrder = 0;
    this.earthMesh.position.copy(EARTH_POS);
    // Fixed orientation — Americas-facing like gold refs
    this.earthMesh.rotation.set(0.22, -0.82, 0.04);

    // Static cloud shell (no spin) — gold day look
    const cloudGeo = new THREE.SphereGeometry(EARTH_RADIUS * 1.012, 48, 48);
    const cloudMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.42,
      depthWrite: false,
      roughness: 1,
      metalness: 0,
    });
    this.earthClouds = new THREE.Mesh(cloudGeo, cloudMat);
    this.earthClouds.layers.set(LAYER_EARTH);
    this.earthClouds.renderOrder = 1;
    this.earthClouds.position.copy(EARTH_POS);
    this.earthClouds.rotation.copy(this.earthMesh.rotation);

    // Gold: hairline soft limb — NOT a neon HUD ring (iter notes P0)
    const atmoGeo = new THREE.SphereGeometry(EARTH_RADIUS * 1.018, 64, 64);
    const atmoMat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      side: THREE.BackSide,
      blending: THREE.NormalBlending,
      uniforms: {
        uColor: { value: new THREE.Color(0x9ad0ff) },
      },
      vertexShader: /* glsl */ `
        varying vec3 vNormal;
        varying vec3 vView;
        void main() {
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          vNormal = normalize(normalMatrix * normal);
          vView = normalize(-mv.xyz);
          gl_Position = projectionMatrix * mv;
        }
      `,
      fragmentShader: /* glsl */ `
        uniform vec3 uColor;
        varying vec3 vNormal;
        varying vec3 vView;
        void main() {
          float ndv = max(dot(normalize(vNormal), normalize(vView)), 0.0);
          // Sharp falloff → thin rim only
          float fresnel = pow(1.0 - ndv, 5.5);
          float band = smoothstep(0.55, 0.92, fresnel) * (1.0 - smoothstep(0.92, 1.0, fresnel));
          float a = band * 0.045;
          if (a < 0.004) discard;
          gl_FragColor = vec4(uColor, a);
        }
      `,
    });
    this.earthAtmo = new THREE.Mesh(atmoGeo, atmoMat);
    this.earthAtmo.layers.set(LAYER_EARTH);
    this.earthAtmo.renderOrder = -1;
    this.earthAtmo.position.copy(EARTH_POS);

    this.earthGroup = new THREE.Group();
    this.earthGroup.add(this.earthAtmo);
    this.earthGroup.add(this.earthMesh);
    this.earthGroup.add(this.earthClouds);
    this._addStaticPlusMarkers();
    this.earthGroup.layers.set(LAYER_EARTH);
    this.scene.add(this.earthGroup);
  }

  /** Decorative + markers (static composition — gold P5). */
  _addStaticPlusMarkers() {
    const mk = (lat, lon) => {
      const canvas = document.createElement('canvas');
      canvas.width = 64;
      canvas.height = 64;
      const ctx = canvas.getContext('2d');
      ctx.strokeStyle = 'rgba(255,255,255,0.8)';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(32, 32, 18, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(32, 18);
      ctx.lineTo(32, 46);
      ctx.moveTo(18, 32);
      ctx.lineTo(46, 32);
      ctx.stroke();
      const tex = new THREE.CanvasTexture(canvas);
      const mat = new THREE.SpriteMaterial({
        map: tex,
        transparent: true,
        depthTest: true,
        depthWrite: false,
        opacity: 0.88,
      });
      const sprite = new THREE.Sprite(mat);
      const phi = THREE.MathUtils.degToRad(90 - lat);
      const theta = THREE.MathUtils.degToRad(lon + 180);
      const r = EARTH_RADIUS * 1.015;
      sprite.position.set(
        -r * Math.sin(phi) * Math.cos(theta),
        r * Math.cos(phi),
        r * Math.sin(phi) * Math.sin(theta),
      );
      sprite.scale.set(0.09, 0.09, 1);
      sprite.layers.set(LAYER_EARTH);
      this.earthMesh.add(sprite);
    };
    // Americas-facing seats (approx)
    mk(25, -70);
    mk(-10, -40);
    mk(40, -100);
  }

  async _loadEarthTextureAsync() {
    try {
      const tex = await loadEarthTexture();
      if (!this.earthMesh || !tex) return;
      tex.colorSpace = THREE.SRGBColorSpace;
      const prev = this.earthMesh.material.map;
      this.earthMesh.material.map = tex;
      this.earthMesh.material.needsUpdate = true;
      prev?.dispose?.();
      this._renderFrame();
    } catch (err) {
      console.warn('Static earth texture fallback retained', err);
    }
  }

  async _loadCloudTextureAsync() {
    try {
      const tex = await loadCloudTexture();
      if (!this.earthClouds || !tex) return;
      tex.colorSpace = THREE.SRGBColorSpace;
      const prev = this.earthClouds.material.map;
      this.earthClouds.material.map = tex;
      this.earthClouds.material.transparent = true;
      this.earthClouds.material.opacity = 0.55;
      this.earthClouds.material.needsUpdate = true;
      prev?.dispose?.();
      this._renderFrame();
    } catch (err) {
      console.warn('Cloud texture unavailable — soft procedural veil', err);
      if (!this.earthClouds) return;
      // Soft white noise veil so day look still has cloud mass
      const c = document.createElement('canvas');
      c.width = 256;
      c.height = 128;
      const ctx = c.getContext('2d');
      ctx.fillStyle = 'rgba(0,0,0,0)';
      ctx.fillRect(0, 0, 256, 128);
      for (let i = 0; i < 120; i += 1) {
        const x = Math.random() * 256;
        const y = Math.random() * 128;
        const r = 4 + Math.random() * 18;
        const g = ctx.createRadialGradient(x, y, 0, x, y, r);
        g.addColorStop(0, 'rgba(255,255,255,0.55)');
        g.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      }
      const tex = new THREE.CanvasTexture(c);
      this.earthClouds.material.map = tex;
      this.earthClouds.material.opacity = 0.35;
      this.earthClouds.material.needsUpdate = true;
    }
  }

  _bindShelvesToggle() {
    const btn = this.section.querySelector('[data-shelves-toggle]');
    if (!btn) return;
    const stateEl = btn.querySelector('[data-shelves-state]');
    const onClick = () => {
      const on = btn.getAttribute('data-state') !== 'on';
      btn.setAttribute('data-state', on ? 'on' : 'off');
      btn.setAttribute('aria-pressed', on ? 'true' : 'false');
      if (stateEl) stateEl.textContent = on ? 'On' : 'Off';
    };
    btn.addEventListener('click', onClick);
    this._unsubs.push(() => btn.removeEventListener('click', onClick));
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

    if (this.bubbles) {
      this.bubbles.setSize(w * dpr, h * dpr);
      this.bubbles.setPixelRatio?.(dpr);
      this.bubbles.setDiffuse(this.diffuseRT.texture);
      this.bubbles.relayout(this.camera);
    }

    this._syncDebug();
  }

  _syncDebug() {
    if (typeof window === 'undefined') return;
    const uTime = this.bubbles?.frontMesh?.material?.uniforms?.uTime?.value ?? null;
    const earthNdc = (() => {
      if (!this.earthMesh) return null;
      const v = this.earthMesh.position.clone().project(this.camera);
      return { x: (v.x + 1) * 0.5, y: (1 - v.y) * 0.5 };
    })();
    window.__globeDebug = {
      module: 'ocean-bubbles@v76',
      earthClouds: !!this.earthClouds,
      earthRemoved: false,
      earthStaticPlaceholder: true,
      darkInterim: true,
      videoBg: this.useVideoClear,
      bubblesOn: this.bubblesOn,
      bubbles: !!this.bubbles,
      running: this.running,
      visible: this.visible,
      uTime,
      reduced: motionReduced(),
      bubbleCount: this.bubbles?.count ?? null,
      scaleStats: this.bubbles?.getScaleStats?.() ?? null,
      camPos: this.camera?.position?.toArray?.() ?? null,
      earthPos: this.earthMesh?.position?.toArray?.() ?? null,
      earthNdc,
    };
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
            if (this.visible && !motionReduced() && this.bubblesOn) this.start();
            else {
              this.stop();
              if (this.visible) this._renderFrame();
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

  _renderFrame() {
    if (!this.renderer) return;
    const reduced = motionReduced();
    const t = this.clock.getElapsedTime();
    this.bubbles?.update(t, reduced);
    // Earth stays frozen — no rotation

    const size = this.renderer.getSize(new THREE.Vector2());
    const dpr = this.renderer.getPixelRatio();

    if (this.bubbles && this.diffuseRT) {
      // Dark radial into RT for IOR sampling (+ earth silhouette for refraction)
      this.renderer.setRenderTarget(this.diffuseRT);
      this.renderer.setClearColor(SECTION_CLEAR, 1);
      this.renderer.clear(true, true, true);
      if (this.bgScene && this.bgCamera) {
        this.renderer.render(this.bgScene, this.bgCamera);
      }
      this.renderer.autoClear = false;
      this.camera.layers.disableAll();
      this.camera.layers.enable(LAYER_EARTH);
      this.renderer.render(this.scene, this.camera);
      this.renderer.autoClear = true;
      this.renderer.setRenderTarget(null);
    }

    this.renderer.setViewport(0, 0, size.x * dpr, size.y * dpr);
    // Transparent clear so ocean-explore-bg.mp4 shows through
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.clear(true, true, true);

    this.renderer.autoClear = false;
    if (this.bubbles) {
      this.camera.layers.disableAll();
      this.camera.layers.enable(LAYER_BUBBLE_BACK);
      this.renderer.render(this.scene, this.camera);
    }

    this.camera.layers.disableAll();
    this.camera.layers.enable(LAYER_EARTH);
    this.renderer.render(this.scene, this.camera);

    if (this.bubbles) {
      this.camera.layers.disableAll();
      this.camera.layers.enable(LAYER_BUBBLE_FRONT);
      this.renderer.render(this.scene, this.camera);
    }
    this.renderer.autoClear = true;

    this.camera.layers.disableAll();
    this.camera.layers.enable(LAYER_EARTH);
    this.camera.layers.enable(LAYER_BUBBLE_BACK);
    this.camera.layers.enable(LAYER_BUBBLE_FRONT);
    this._syncDebug();
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
    if (reduced || !this.bubblesOn) {
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
    this.earthMesh?.geometry?.dispose();
    this.earthMesh?.material?.map?.dispose?.();
    this.earthMesh?.material?.dispose?.();
    this.earthAtmo?.geometry?.dispose();
    this.earthAtmo?.material?.dispose?.();
    this.earthClouds?.geometry?.dispose();
    this.earthClouds?.material?.map?.dispose?.();
    this.earthClouds?.material?.dispose?.();
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
