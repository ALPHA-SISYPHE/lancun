/**
 * #ocean-explore — single-file globe (constitution v1.9)
 * Framing: earthGroup.position + camera.z (no setViewOffset, no scroll dolly).
 */
import * as THREE from './vendor/three.module.min.js';
import { CSS3DSprite, CSS3DRenderer } from './vendor/CSS3DRenderer.js';

const SECTION_CLEAR = 0xe0f2fe;
const CAMERA_FOV = 34;
const EARTH_FRAME_RADIUS = 1.12;
const EARTH_COPY_RATIO = 1.12;
const FRAMING_MARGIN = 0.02;
const COPY_GAP = 16;
const EARTH_CENTER_X = 0.69;
const RIGHT_ZONE_LEFT = 0.38;
const MAX_DPR = 2;
const SPIN_SPEED = 0.085;
const DRAG_YAW = 0.0055;
const SPIN_RESUME_MS = 1200;
const MIN_DIAMETER = 48;
const BINARY_ITERS = 22;
const LAYER_EARTH = 0;
const LAYER_BUBBLE_BACK = 1;
const LAYER_BUBBLE_FRONT = 2;
const INITIAL_YAW = THREE.MathUtils.degToRad(48);

const EARTH_LOCAL = 'assets/media/earth.jpg';
const EARTH_REMOTE = 'https://threejs.org/examples/textures/planets/earth_atmos_2048.jpg';
const CLOUDS_LOCAL = 'assets/media/earth-clouds.png';
const CLOUDS_REMOTE = 'https://threejs.org/examples/textures/planets/earth_clouds_1024.png';
const SHELVES_LOCAL = 'assets/media/globe/shelves-mask.png';

/* —— helpers —— */
function motionReduced() {
  if (document.documentElement.dataset.reducedMotion === 'true') return true;
  if (typeof window.LANCUN_getPrefs === 'function' && window.LANCUN_getPrefs().reduceMotion) return true;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function showStatus(message) {
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

function loadTexture(url, timeoutMs = 8000) {
  return new Promise((resolve, reject) => {
    let settled = false;
    const timer = window.setTimeout(() => {
      if (settled) return;
      settled = true;
      reject(new Error(`Texture timeout: ${url}`));
    }, timeoutMs);
    new THREE.TextureLoader().load(
      url,
      (t) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        resolve(t);
      },
      undefined,
      (err) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        reject(err instanceof Error ? err : new Error(String(err)));
      },
    );
  });
}

async function loadEarthMap() {
  try {
    return await loadTexture(EARTH_LOCAL);
  } catch {
    try {
      return await loadTexture(EARTH_REMOTE);
    } catch {
      return null;
    }
  }
}

async function loadCloudMap() {
  try {
    return await loadTexture(CLOUDS_LOCAL);
  } catch {
    try {
      return await loadTexture(CLOUDS_REMOTE);
    } catch {
      return null;
    }
  }
}

function buildShelvesProcedural(size = 512) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  const img = ctx.createImageData(size, size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const u = (x + 0.5) / size;
      const v = (y + 0.5) / size;
      const lon = u * 360 - 180;
      const lat = 90 - v * 180;
      const coast =
        Math.exp(-((lon - 120) ** 2) / 1800) * Math.exp(-((lat - 20) ** 2) / 800) +
        Math.exp(-((lon + 80) ** 2) / 2200) * Math.exp(-((lat - 30) ** 2) / 900) +
        Math.exp(-((lon - 20) ** 2) / 1600) * Math.exp(-((lat + 10) ** 2) / 700);
      const byte = Math.round(THREE.MathUtils.clamp(coast * 255, 0, 255));
      const i = (y * size + x) * 4;
      img.data[i] = byte;
      img.data[i + 1] = byte;
      img.data[i + 2] = byte;
      img.data[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.NoColorSpace;
  return tex;
}

async function loadShelvesMask() {
  try {
    const t = await loadTexture(SHELVES_LOCAL);
    t.colorSpace = THREE.NoColorSpace;
    return t;
  } catch {
    return buildShelvesProcedural();
  }
}

/* —— bubble shaders (liquid glass) —— */
const BUBBLE_VERT = /* glsl */ `
attribute vec3 iOffset;
attribute float iPhase;
attribute float iScale;
uniform float uTime;
uniform float uReducedMotion;
uniform float uSpeed;
uniform vec3 uBounds;
varying vec3 vNormal;
varying vec3 vViewDir;
varying float vAlpha;
void main() {
  vec3 centerPos = iOffset;
  float yTravel = uReducedMotion > 0.5
    ? iPhase * uBounds.y - uBounds.y * 0.5
    : mod(centerPos.y + uTime * uSpeed, uBounds.y) - uBounds.y * 0.5;
  centerPos.y = yTravel;
  centerPos.x += sin(centerPos.z * 3.0 + uTime * 0.28 + iPhase * 6.28) * 0.006;
  vec3 local = position * iScale + centerPos;
  vec4 mv = modelViewMatrix * vec4(local, 1.0);
  vNormal = normalize(normalMatrix * normal);
  vViewDir = normalize(-mv.xyz);
  float halfY = max(uBounds.y * 0.5, 0.01);
  float fade = 1.0 - smoothstep(halfY * 0.78, halfY, abs(centerPos.y));
  vAlpha = (0.12 + iScale * 0.16) * fade;
  gl_Position = projectionMatrix * mv;
}
`;

const BUBBLE_FRAG = /* glsl */ `
uniform vec3 uSectionBgColor;
uniform vec3 uFresnelColor;
varying vec3 vNormal;
varying vec3 vViewDir;
varying float vAlpha;
void main() {
  vec3 n = normalize(vNormal);
  vec3 viewDir = normalize(vViewDir);
  float fresnel = pow(1.0 - max(dot(viewDir, n), 0.0), 3.8);
  vec3 body = mix(uSectionBgColor, vec3(0.78, 0.90, 0.98), 0.28);
  vec3 color = body + uFresnelColor * fresnel * 0.42 + vec3(1.0) * pow(fresnel, 3.0) * 0.12;
  float alpha = clamp(vAlpha + fresnel * 0.16, 0.07, 0.32);
  gl_FragColor = vec4(color, alpha);
}
`;

/* —— OceanGlobe —— */
class OceanGlobe {
  constructor({ section, canvas, canvasWrap, oceans }) {
    this.section = section;
    this.canvas = canvas;
    this.canvasWrap = canvasWrap;
    this.oceans = oceans || [];

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(CAMERA_FOV, 1, 0.1, 100);
    this.camera.position.set(0, 0, 5.2);
    this.camera.lookAt(0, 0, 0);
    this.camera.layers.enable(LAYER_EARTH);
    this.camera.layers.enable(LAYER_BUBBLE_BACK);
    this.camera.layers.enable(LAYER_BUBBLE_FRONT);

    this.renderer = null;
    this.earthGroup = null;
    this.shelves = null;
    this.backBubbles = null;
    this.frontBubbles = null;
    this.earthRT = null;
    this.labelRenderer = null;
    this.markerPins = [];

    this.running = false;
    this.visible = false;
    this.animationId = null;
    this.clock = new THREE.Clock();
    this.shelvesOn = false;
    this.spinEnabled = true;
    this.dragging = false;
    this.lastPointerX = 0;
    this.idleTimer = null;
    this.resizePending = false;
    this.resizeObserver = null;
    this.intersectionObserver = null;
    this._unsubs = [];
  }

  async init() {
    try {
      this.renderer = new THREE.WebGLRenderer({
        canvas: this.canvas,
        alpha: false,
        antialias: true,
        premultipliedAlpha: false,
        preserveDrawingBuffer: true,
      });
    } catch (err) {
      console.error(err);
      showStatus('当前浏览器无法使用 WebGL，无法显示 3D 地球。');
      return false;
    }

    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.48;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.setClearColor(SECTION_CLEAR, 1);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, MAX_DPR));

    this._addLights();
    await this._buildEarth();
    await this._buildShelves();
    this._buildBubbles();
    this._buildMarkers();
    this._bindDrag();
    this._bindShelvesToggle();
    this._bindObservers();
    this._syncVisible();
    this.resize();
    requestAnimationFrame(() => this._scheduleResize());
    setTimeout(() => this._scheduleResize(), 200);

    if (this.visible && !motionReduced()) this.start();
    else this._renderFrame();

    return true;
  }

  _addLights() {
    this.scene.add(new THREE.HemisphereLight(0xf0f8ff, 0x5a7a98, 1.45));
    this.scene.add(new THREE.AmbientLight(0xd0e8f8, 1.05));
    const key = new THREE.DirectionalLight(0xffffff, 1.55);
    key.position.set(-2.4, 3.6, 4.5);
    this.scene.add(key);
    const fill = new THREE.DirectionalLight(0xc8e8ff, 0.72);
    fill.position.set(3.4, 1.0, 2.6);
    this.scene.add(fill);
    const rim = new THREE.DirectionalLight(0xa5d0ff, 0.48);
    rim.position.set(0.2, -1.0, -3.8);
    this.scene.add(rim);
  }

  async _buildEarth() {
    const group = new THREE.Group();
    group.rotation.y = INITIAL_YAW;

    const mat = new THREE.MeshPhongMaterial({
      color: 0xe8f2fc,
      shininess: 14,
      specular: 0x444444,
      emissive: 0x1a4060,
      emissiveIntensity: 0.35,
    });
    const earth = new THREE.Mesh(new THREE.SphereGeometry(1, 64, 64), mat);
    earth.layers.set(LAYER_EARTH);
    group.add(earth);

    const atmo = new THREE.Mesh(
      new THREE.SphereGeometry(1.045, 64, 64),
      new THREE.MeshBasicMaterial({
        color: 0x60a5fa,
        transparent: true,
        opacity: 0.14,
        side: THREE.BackSide,
        depthWrite: false,
      }),
    );
    atmo.layers.set(LAYER_EARTH);
    group.add(atmo);

    const earthMap = await loadEarthMap();
    if (earthMap) {
      earthMap.colorSpace = THREE.SRGBColorSpace;
      mat.map = earthMap;
      mat.color.set(0xdceeff);
      mat.needsUpdate = true;
    } else {
      mat.color.set(0x60a5fa);
    }

    const cloudMap = await loadCloudMap();
    if (cloudMap) {
      cloudMap.colorSpace = THREE.SRGBColorSpace;
      const clouds = new THREE.Mesh(
        new THREE.SphereGeometry(1.015, 64, 64),
        new THREE.MeshPhongMaterial({
          map: cloudMap,
          transparent: true,
          opacity: 0.28,
          depthWrite: false,
        }),
      );
      clouds.layers.set(LAYER_EARTH);
      group.add(clouds);
    }

    group.traverse((o) => {
      if (o.isMesh || o.isGroup) o.layers.set(LAYER_EARTH);
    });
    this.scene.add(group);
    this.earthGroup = group;
  }

  async _buildShelves() {
    const mask = await loadShelvesMask();
    const material = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      uniforms: {
        uMask: { value: mask },
        uOffset: { value: 0 },
        uTime: { value: 0 },
        uColor1: { value: new THREE.Color(0x3b82f6) },
        uColor2: { value: new THREE.Color(0x60a5fa) },
      },
      vertexShader: /* glsl */ `
        varying vec2 vUv;
        varying vec3 vWorldPos;
        void main() {
          vUv = uv;
          vWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }`,
      fragmentShader: /* glsl */ `
        uniform sampler2D uMask;
        uniform float uOffset;
        uniform float uTime;
        uniform vec3 uColor1;
        uniform vec3 uColor2;
        varying vec2 vUv;
        varying vec3 vWorldPos;
        void main() {
          float m = texture2D(uMask, vUv).r;
          float progress = mix(-2.0, 2.0, uOffset);
          float g = smoothstep(0.0, 1.0, vWorldPos.x + vWorldPos.y + progress);
          float coast = g * m;
          if (coast < 0.01) discard;
          gl_FragColor = vec4(mix(uColor1, uColor2, m), coast * 0.72);
        }`,
    });
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(1.012, 64, 64), material);
    mesh.layers.set(LAYER_EARTH);
    this.earthGroup.add(mesh);
    this.shelves = { mesh, material, mask };
  }

  _makeBubbleMesh(count, layer) {
    const geo = new THREE.SphereGeometry(1, 16, 16);
    const mat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      uniforms: {
        uTime: { value: 0 },
        uReducedMotion: { value: motionReduced() ? 1 : 0 },
        uSpeed: { value: 0.1 },
        uBounds: { value: new THREE.Vector3(1.35, 1.85, 1.15) },
        uSectionBgColor: { value: new THREE.Color(SECTION_CLEAR) },
        uFresnelColor: { value: new THREE.Color(0x7eb8e0) },
      },
      vertexShader: BUBBLE_VERT,
      fragmentShader: BUBBLE_FRAG,
    });
    const mesh = new THREE.InstancedMesh(geo, mat, count);
    mesh.layers.set(layer);
    mesh.frustumCulled = false;

    const offsets = new Float32Array(count * 3);
    const phases = new Float32Array(count);
    const scales = new Float32Array(count);
    const depthBias = layer === LAYER_BUBBLE_BACK ? 1 : 0;
    for (let i = 0; i < count; i++) {
      const ndcX = (Math.random() * 2 - 1) * 1.2;
      const ndcY = (Math.random() * 2 - 1) * 1.1;
      const depthT = Math.pow(Math.random(), 0.55) * 0.55 + depthBias * 0.45;
      const target = new THREE.Vector3(ndcX, ndcY, 0.5).unproject(this.camera);
      const dir = target.sub(this.camera.position).normalize();
      const dist = THREE.MathUtils.lerp(1.6, 7.2, depthT);
      const p = this.camera.position.clone().add(dir.multiplyScalar(dist));
      offsets[i * 3] = p.x;
      offsets[i * 3 + 1] = p.y;
      offsets[i * 3 + 2] = p.z;
      phases[i] = Math.random();
      scales[i] = THREE.MathUtils.lerp(0.22, 0.9, depthT) * (0.88 + Math.random() * 0.28);
    }
    geo.setAttribute('iOffset', new THREE.InstancedBufferAttribute(offsets, 3));
    geo.setAttribute('iPhase', new THREE.InstancedBufferAttribute(phases, 1));
    geo.setAttribute('iScale', new THREE.InstancedBufferAttribute(scales, 1));
    this.scene.add(mesh);
    return mesh;
  }

  _buildBubbles() {
    const mobile = window.matchMedia('(max-width: 58rem)').matches;
    const backN = mobile ? 12 : 28;
    const frontN = mobile ? 14 : 32;
    this.backBubbles = this._makeBubbleMesh(backN, LAYER_BUBBLE_BACK);
    this.frontBubbles = this._makeBubbleMesh(frontN, LAYER_BUBBLE_FRONT);
  }

  _buildMarkers() {
    this.labelRenderer = new CSS3DRenderer();
    this.labelRenderer.domElement.className = 'globe-label-layer';
    this.canvasWrap.appendChild(this.labelRenderer.domElement);

    const intro = this.section.querySelector('[data-ocean-intro]');
    const detail = this.section.querySelector('[data-ocean-detail]');
    const detailTitle = this.section.querySelector('[data-ocean-detail-title]');
    const detailText = this.section.querySelector('[data-ocean-detail-text]');
    const detailLink = this.section.querySelector('[data-ocean-detail-link]');
    const closeBtn = this.section.querySelector('[data-ocean-close]');

    const showIntro = () => {
      if (intro) intro.hidden = false;
      if (detail) detail.hidden = true;
      this.markerPins.forEach(({ el }) => el.classList.remove('is-active'));
    };

    const showDetail = (ocean) => {
      if (detailTitle) detailTitle.textContent = ocean.title;
      if (detailText) detailText.textContent = ocean.text;
      if (detailLink) {
        detailLink.href = ocean.learnMoreHref || 'pages/ocean.html';
        detailLink.textContent = `继续了解${ocean.name}`;
      }
      if (intro) intro.hidden = true;
      if (detail) detail.hidden = false;
      this.markerPins.forEach(({ el, ocean: o }) => {
        el.classList.toggle('is-active', o.id === ocean.id);
      });
      closeBtn?.focus();
    };

    closeBtn?.addEventListener('click', showIntro);
    const onKey = (e) => {
      if (e.key === 'Escape' && detail && !detail.hidden) showIntro();
    };
    document.addEventListener('keydown', onKey);
    this._unsubs.push(() => document.removeEventListener('keydown', onKey));

    const camPos = new THREE.Vector3();
    const markerPos = new THREE.Vector3();

    this.oceans.forEach((ocean) => {
      const el = document.createElement('button');
      el.type = 'button';
      el.className = 'globe-pin';
      el.setAttribute('aria-label', `查看${ocean.name}介绍`);
      el.innerHTML = '<span aria-hidden="true">+</span>';
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        showDetail(ocean);
      });
      const label = new CSS3DSprite(el);
      label.position.copy(latLonToVector3(ocean.lat, ocean.lon, 1.06));
      label.scale.setScalar(0.0015);
      label.layers.set(LAYER_EARTH);
      this.earthGroup.add(label);
      this.markerPins.push({ el, ocean, label, camPos, markerPos });
    });

    this._updateMarkerVisibility = () => {
      this.camera.getWorldPosition(camPos);
      this.markerPins.forEach(({ label }) => {
        label.getWorldPosition(markerPos);
        label.visible = markerPos.dot(camPos) > 0.05;
      });
    };
  }

  _bindDrag() {
    const el = this.canvas;
    const onDown = (e) => {
      if (e.button != null && e.button !== 0) return;
      this.dragging = true;
      this.spinEnabled = false;
      clearTimeout(this.idleTimer);
      this.lastPointerX = e.clientX;
      el.setPointerCapture?.(e.pointerId);
    };
    const onMove = (e) => {
      if (!this.dragging || !this.earthGroup) return;
      const dx = e.clientX - this.lastPointerX;
      this.lastPointerX = e.clientX;
      this.earthGroup.rotation.y += dx * DRAG_YAW;
    };
    const onUp = (e) => {
      if (!this.dragging) return;
      this.dragging = false;
      try {
        el.releasePointerCapture?.(e.pointerId);
      } catch {
        /* ignore */
      }
      clearTimeout(this.idleTimer);
      this.idleTimer = setTimeout(() => {
        if (!motionReduced()) this.spinEnabled = true;
      }, SPIN_RESUME_MS);
    };
    el.addEventListener('pointerdown', onDown);
    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerup', onUp);
    el.addEventListener('pointercancel', onUp);
    this._unsubs.push(
      () => el.removeEventListener('pointerdown', onDown),
      () => el.removeEventListener('pointermove', onMove),
      () => el.removeEventListener('pointerup', onUp),
      () => el.removeEventListener('pointercancel', onUp),
    );
  }

  _bindShelvesToggle() {
    const toggle = this.section.querySelector('[data-shelves-toggle]');
    if (!toggle) return;
    const sync = () => {
      toggle.setAttribute('aria-pressed', String(this.shelvesOn));
      toggle.dataset.state = this.shelvesOn ? 'on' : 'off';
    };
    toggle.addEventListener('click', () => {
      this.setShelvesVisible(!this.shelvesOn);
      sync();
    });
    sync();
  }

  setShelvesVisible(on) {
    this.shelvesOn = Boolean(on);
    const target = this.shelvesOn ? 1 : 0;
    if (!this.shelves) return;
    if (motionReduced() || !window.gsap) {
      this.shelves.material.uniforms.uOffset.value = target;
      return;
    }
    window.gsap.to(this.shelves.material.uniforms.uOffset, {
      value: target,
      duration: 1.2,
      ease: 'power2.inOut',
    });
  }

  _getSize() {
    const host = this.canvasWrap || this.section;
    return {
      w: Math.max(1, host?.clientWidth || this.section.clientWidth || 1),
      h: Math.max(1, host?.clientHeight || this.section.clientHeight || 1),
    };
  }

  _measureAnchor(w, h) {
    const panel =
      this.section.querySelector('[data-ocean-panel]') ||
      this.section.querySelector('.ocean-explore__copy');
    const stage = this.section.querySelector('.ocean-explore__stage');
    const host = this.canvasWrap || this.section;
    const hostRect = host.getBoundingClientRect();
    if (!panel) {
      return {
        copyHeight: Math.max(40, h * 0.35),
        copyCenterY: h * 0.5,
        copyRight: w * 0.38,
        isSideBySide: w >= 720,
      };
    }
    const pr = panel.getBoundingClientRect();
    const sr = stage?.getBoundingClientRect();
    const copyHeight = Math.max(40, pr.height);
    const copyRight = pr.right - hostRect.left;
    const copyCenterY = THREE.MathUtils.clamp(
      pr.top + pr.height * 0.5 - hostRect.top,
      h * 0.08,
      h * 0.92,
    );
    const isSideBySide = sr
      ? pr.right <= sr.left + 12 && sr.width > 40
      : copyRight < w * 0.55;
    return { copyHeight, copyCenterY, copyRight, isSideBySide };
  }

  _visibleSafeRect(w, h) {
    const mx = w * FRAMING_MARGIN;
    const my = h * FRAMING_MARGIN;
    const host = this.canvasWrap || this.section;
    const hostRect = host.getBoundingClientRect();
    const vv = window.visualViewport;
    const visL = vv?.offsetLeft ?? 0;
    const visT = vv?.offsetTop ?? 0;
    const visR = visL + (vv?.width ?? window.innerWidth);
    const visB = visT + (vv?.height ?? window.innerHeight);
    const iL = Math.max(hostRect.left, visL);
    const iT = Math.max(hostRect.top, visT);
    const iR = Math.min(hostRect.right, visR);
    const iB = Math.min(hostRect.bottom, visB);
    let headerH = 76;
    const smt = parseFloat(getComputedStyle(this.section).scrollMarginTop);
    if (!Number.isNaN(smt) && smt > 0) headerH = smt;
    const safeTop = Math.max(iT, hostRect.top + headerH);
    let left = iL - hostRect.left + mx;
    let right = iR - hostRect.left - mx;
    let top = safeTop - hostRect.top + my;
    let bottom = iB - hostRect.top - my;
    if (right <= left || bottom <= top) {
      return { left: mx, right: w - mx, top: my, bottom: h - my };
    }
    return { left, right, top, bottom };
  }

  _zFromDiameter(h, diameterPx) {
    const tanHalf = Math.tan(THREE.MathUtils.degToRad(this.camera.fov) * 0.5);
    return THREE.MathUtils.clamp(
      (EARTH_FRAME_RADIUS * h) / (tanHalf * Math.max(80, diameterPx)),
      2.8,
      14,
    );
  }

  /** Screen px → world XY at z=0 for camera on +Z looking at origin. */
  _screenToWorldXY(sx, sy, w, h, camZ) {
    const ndcX = (sx / w) * 2 - 1;
    const ndcY = -((sy / h) * 2 - 1);
    const tanHalf = Math.tan(THREE.MathUtils.degToRad(this.camera.fov) * 0.5);
    const aspect = w / h;
    return {
      x: ndcX * tanHalf * camZ * aspect,
      y: ndcY * tanHalf * camZ,
    };
  }

  _applyPose(w, h, diameterPx, centerX, centerY) {
    if (this.camera.clearViewOffset) this.camera.clearViewOffset();
    const z = this._zFromDiameter(h, diameterPx);
    this.camera.position.set(0, 0, z);
    this.camera.aspect = w / h;
    this.camera.lookAt(0, 0, 0);
    this.camera.updateProjectionMatrix();
    const { x, y } = this._screenToWorldXY(centerX, centerY, w, h, z);
    this.earthGroup.position.set(x, y, 0);
    this.camera.updateMatrixWorld(true);
    return z;
  }

  _projectBounds(w, h) {
    const toScreen = (wx, wy, wz) => {
      const v = new THREE.Vector3(wx, wy, wz).project(this.camera);
      return {
        x: (v.x * 0.5 + 0.5) * w,
        y: (-v.y * 0.5 + 0.5) * h,
      };
    };
    const origin = this.earthGroup.position;
    const R = EARTH_FRAME_RADIUS;
    const samples = [toScreen(origin.x, origin.y, origin.z)];
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2;
      samples.push(
        toScreen(origin.x + Math.cos(a) * R, origin.y + Math.sin(a) * R, origin.z),
      );
    }
    const xs = samples.map((p) => p.x);
    const ys = samples.map((p) => p.y);
    return {
      centerX: samples[0].x,
      centerY: samples[0].y,
      left: Math.min(...xs),
      right: Math.max(...xs),
      top: Math.min(...ys),
      bottom: Math.max(...ys),
      diameter: Math.max(Math.max(...ys) - Math.min(...ys), Math.max(...xs) - Math.min(...xs)),
    };
  }

  _fits(bounds, safe, anchor) {
    const contained =
      bounds.left >= safe.left &&
      bounds.right <= safe.right &&
      bounds.top >= safe.top &&
      bounds.bottom <= safe.bottom;
    const clearCopy = !anchor.isSideBySide || bounds.left >= anchor.copyRight + COPY_GAP;
    return contained && clearCopy;
  }

  _resolveFraming(w, h) {
    if (!this.earthGroup || !this.camera) return;
    const anchor = this._measureAnchor(w, h);
    const safe = this._visibleSafeRect(w, h);
    const targetY = anchor.isSideBySide ? anchor.copyCenterY : h * 0.5;
    let centerX = anchor.isSideBySide ? w * EARTH_CENTER_X : w * 0.5;
    const artTarget = anchor.copyHeight * EARTH_COPY_RATIO;
    let solverMode = 'binary';
    let bestD = 80;

    let lo = 80;
    let hi = Math.max(80, artTarget);
    for (let i = 0; i < BINARY_ITERS; i++) {
      const mid = (lo + hi) / 2;
      this._applyPose(w, h, mid, centerX, targetY);
      const bounds = this._projectBounds(w, h);
      if (this._fits(bounds, safe, anchor)) {
        bestD = mid;
        lo = mid;
      } else {
        hi = mid;
      }
    }

    this._applyPose(w, h, bestD, centerX, targetY);
    let bounds = this._projectBounds(w, h);
    if (!this._fits(bounds, safe, anchor)) {
      solverMode = 'xNudge';
      const minX = anchor.isSideBySide
        ? anchor.copyRight + COPY_GAP + bestD / 2
        : safe.left + bestD / 2;
      for (let x = centerX; x >= minX; x -= w * 0.01) {
        this._applyPose(w, h, bestD, x, targetY);
        bounds = this._projectBounds(w, h);
        if (this._fits(bounds, safe, anchor)) {
          centerX = x;
          break;
        }
      }
    }

    if (!this._fits(bounds, safe, anchor)) {
      solverMode = 'forcedShrink';
      let d = bestD;
      while (d > MIN_DIAMETER) {
        this._applyPose(w, h, d, centerX, targetY);
        bounds = this._projectBounds(w, h);
        if (this._fits(bounds, safe, anchor)) {
          bestD = d;
          break;
        }
        d *= 0.92;
      }
    }

    if (!this._fits(bounds, safe, anchor)) {
      solverMode = 'safeRectCenter';
      centerX =
        Math.max(w * RIGHT_ZONE_LEFT, safe.left) +
        (safe.right - Math.max(w * RIGHT_ZONE_LEFT, safe.left)) / 2;
      let d = bestD;
      while (d > MIN_DIAMETER) {
        this._applyPose(w, h, d, centerX, targetY);
        bounds = this._projectBounds(w, h);
        if (this._fits(bounds, safe, anchor)) {
          bestD = d;
          break;
        }
        d *= 0.92;
      }
    }

    if (!this._fits(bounds, safe, anchor)) {
      bestD = MIN_DIAMETER;
      centerX = (safe.left + safe.right) / 2;
      this._applyPose(w, h, bestD, centerX, targetY);
      bounds = this._projectBounds(w, h);
      solverMode = 'safeRectCenter';
    }

    this._framing = {
      anchor,
      safe,
      bounds,
      bestD,
      centerX,
      targetY,
      artTarget,
      solverMode,
      containmentOk: this._fits(bounds, safe, anchor),
    };
  }

  _publishDebug(w, h) {
    if (!this._framing) return;
    const { anchor, safe, bounds, bestD, artTarget, solverMode, containmentOk, targetY, centerX } =
      this._framing;
    const ratio = anchor.copyHeight > 0 ? bounds.diameter / anchor.copyHeight : null;
    const yDelta = anchor.isSideBySide ? bounds.centerY / h - anchor.copyCenterY / h : null;
    window.__globeDebug = {
      ...(window.__globeDebug || {}),
      earthScreenX: bounds.centerX,
      earthScreenY: bounds.centerY,
      earthScreenFracX: bounds.centerX / w,
      earthScreenFracY: bounds.centerY / h,
      targetFracX: centerX / w,
      targetFracY: targetY / h,
      copyPanelCenterFracY: anchor.copyCenterY / h,
      copyPanelHeight: anchor.copyHeight,
      isSideBySide: anchor.isSideBySide,
      containmentOk,
      boundsTop: bounds.top,
      boundsBottom: bounds.bottom,
      boundsLeft: bounds.left,
      boundsRight: bounds.right,
      visibleSafeRect: safe,
      clipRight: bounds.right - safe.right,
      clipBottom: bounds.bottom - safe.bottom,
      clipLeft: safe.left - bounds.left,
      clipTop: safe.top - bounds.top,
      solverMode,
      yAlignDelta: yDelta,
      diameterToCopyRatio: ratio,
      ratioActual: ratio,
      earthScreenDiameter: bounds.diameter,
      earthTargetDiameter: bestD,
      earthArtTarget: artTarget,
      targetDiameterToCopyRatio: EARTH_COPY_RATIO,
      camPos: this.camera.position.toArray(),
      earthPos: this.earthGroup.position.toArray(),
      module: 'ocean-globe@v19',
    };
  }

  resize() {
    if (!this.renderer || !this.earthGroup) return;
    const { w, h } = this._getSize();
    if (w < 1 || h < 1) return;
    this.renderer.setSize(w, h, false);
    const dpr = Math.min(window.devicePixelRatio, MAX_DPR);
    this.renderer.setPixelRatio(dpr);
    this._resolveFraming(w, h);
    this.labelRenderer?.setSize(w, h);
    if (!this.earthRT) {
      this.earthRT = new THREE.WebGLRenderTarget(w * dpr, h * dpr, {
        minFilter: THREE.LinearFilter,
        magFilter: THREE.LinearFilter,
        depthBuffer: true,
      });
    } else {
      this.earthRT.setSize(w * dpr, h * dpr);
    }
    this._publishDebug(w, h);
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
    document.fonts?.ready?.then(() => this._scheduleResize()).catch(() => {});

    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(() => this._scheduleResize());
      this.resizeObserver.observe(this.section);
      this.resizeObserver.observe(this.canvasWrap);
      const panel = this.section.querySelector('[data-ocean-panel]');
      if (panel) this.resizeObserver.observe(panel);
      const layout = this.section.querySelector('.ocean-explore__layout');
      if (layout) this.resizeObserver.observe(layout);
    }

    if (typeof IntersectionObserver !== 'undefined') {
      this.intersectionObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            this.visible = entry.isIntersecting;
            if (this.visible) {
              this._scheduleResize();
              if (!motionReduced()) this.start();
            } else this.stop();
          });
        },
        { root: null, threshold: 0.08 },
      );
      this.intersectionObserver.observe(this.section);
    } else {
      this.visible = true;
    }
  }

  _renderLayers() {
    const setLayer = (layer) => {
      this.camera.layers.disableAll();
      this.camera.layers.enable(layer);
    };
    const size = this.renderer.getSize(new THREE.Vector2());
    const dpr = this.renderer.getPixelRatio();

    setLayer(LAYER_EARTH);
    if (this.earthRT) {
      this.renderer.setRenderTarget(this.earthRT);
      this.renderer.setClearColor(SECTION_CLEAR, 1);
      this.renderer.clear(true, true, true);
      this.renderer.render(this.scene, this.camera);
    }

    this.renderer.setRenderTarget(null);
    this.renderer.setViewport(0, 0, size.x * dpr, size.y * dpr);
    this.renderer.setClearColor(SECTION_CLEAR, 1);
    this.renderer.clear(true, true, true);
    setLayer(LAYER_EARTH);
    this.renderer.render(this.scene, this.camera);

    this.renderer.autoClear = false;
    if (this.backBubbles) {
      setLayer(LAYER_BUBBLE_BACK);
      this.renderer.render(this.scene, this.camera);
    }
    if (this.frontBubbles) {
      setLayer(LAYER_BUBBLE_FRONT);
      this.renderer.render(this.scene, this.camera);
    }
    this.renderer.autoClear = true;

    this.camera.layers.disableAll();
    this.camera.layers.enable(LAYER_EARTH);
    this.camera.layers.enable(LAYER_BUBBLE_BACK);
    this.camera.layers.enable(LAYER_BUBBLE_FRONT);
  }

  _renderFrame() {
    if (!this.renderer || !this.earthGroup) return;
    const reduced = motionReduced();
    const delta = this.clock.getDelta();
    const t = this.clock.elapsedTime;

    if (!this.dragging && this.spinEnabled && !reduced) {
      this.earthGroup.rotation.y += SPIN_SPEED * Math.min(delta, 0.05);
    }
    if (this.shelves) this.shelves.material.uniforms.uTime.value = t;
    const rm = reduced ? 1 : 0;
    if (this.backBubbles) {
      this.backBubbles.material.uniforms.uTime.value = t;
      this.backBubbles.material.uniforms.uReducedMotion.value = rm;
    }
    if (this.frontBubbles) {
      this.frontBubbles.material.uniforms.uTime.value = t;
      this.frontBubbles.material.uniforms.uReducedMotion.value = rm;
    }

    this._renderLayers();
    this._updateMarkerVisibility?.();
    this.labelRenderer?.render(this.scene, this.camera);

    const { w, h } = this._getSize();
    this._publishDebug(w, h);
    if (window.__globeDebug) {
      window.__globeDebug.earthRotY = this.earthGroup.rotation.y;
      window.__globeDebug.spinEnabled = this.spinEnabled;
      window.__globeDebug.dragging = this.dragging;
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

  applyMotion() {
    const reduced = motionReduced();
    this.section.classList.toggle('ocean-explore--static', reduced);
    this.spinEnabled = !reduced && !this.dragging;
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
    clearTimeout(this.idleTimer);
    this._unsubs.forEach((fn) => fn());
    this.labelRenderer?.domElement?.remove();
    this.earthRT?.dispose();
    this.renderer?.dispose();
  }
}

/* —— boot —— */
window.LANCUN_globeInitState = 'booting';

async function boot() {
  if (document.body?.dataset?.page !== 'home') return;
  const section = document.querySelector('[data-ocean-explore]');
  const canvas = document.querySelector('[data-globe-canvas]');
  const canvasWrap = document.querySelector('[data-globe-canvas-wrap]');
  if (!section || !canvas || !canvasWrap || !window.LANCUN_DATA?.fiveOceans) {
    window.LANCUN_globeInitState = 'failed';
    showStatus('页面数据未就绪，请刷新后重试。');
    return;
  }

  const globe = new OceanGlobe({
    section,
    canvas,
    canvasWrap,
    oceans: window.LANCUN_DATA.fiveOceans,
  });

  try {
    const ok = await Promise.race([
      globe.init(),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Globe init timed out after 25s')), 25000),
      ),
    ]);
    if (!ok) {
      window.LANCUN_globeInitState = 'failed';
      return;
    }
    window.LANCUN_homeGlobe = {
      applyMotion: () => globe.applyMotion(),
      setShelvesVisible: (on) => globe.setShelvesVisible(on),
      dispose: () => globe.dispose(),
    };
    window.LANCUN_globeInitState = 'ready';
    window.dispatchEvent(new Event('lancun-home-globe-ready'));
  } catch (err) {
    window.LANCUN_globeInitState = 'failed';
    console.error('ocean-globe boot failed', err);
    showStatus('地球 3D 初始化失败（' + (err?.message || err) + '）。');
  }
}

function startBoot() {
  if (window.gsap && window.ScrollTrigger) {
    window.gsap.registerPlugin(window.ScrollTrigger);
  }
  boot();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', startBoot);
} else {
  startBoot();
}
