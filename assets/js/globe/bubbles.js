import * as THREE from '../vendor/three.module.min.js';
import { bubbleVert, bubbleFrag } from './shaders/bubble-shaders.js?v=76';
import { createBubbleContentTexture } from './utils/textures.js?v=76';

/** Far soft dust + mid glass + near bokeh discs (gold DOF). */
const COUNT_DESKTOP = { far: 220, mid: 14, near: 5 };
const COUNT_MOBILE = { far: 120, mid: 9, near: 3 };

const SIZE_MID = { min: 0.038, max: 0.085, hardMin: 0.03, hardMax: 0.1 };

const SEPARATION_MID = 0.45;
const PLACE_ATTEMPTS = 80;
const GEO_RADIUS = 0.055;

const BUBBLE_DEFAULTS = {
  uSpeed: 0.55,
  uBounds: new THREE.Vector3(1.55, 2.35, 1.35),
  uViewDepthMin: 1.5,
  uViewDepthMax: 6.8,
  uNoiseAmplitude: 0.0062,
  uNoiseSpeed: 0.12,
  uNoiseFrequency: new THREE.Vector3(1.35, 1.15, 1.25),
  uBubbleOrbitTightness: 2.2,
  uBubbleDisplacementStrength: 0.06,
  uEarthOrigin: new THREE.Vector3(1.08, -0.05, 0),
  uJitterSpeed: 0.16,
  uJitterFrequency: 2.2,
  uJitterAmplitude: 0.005,
  uElasticAmp: 0.0,
  uElasticSpeed: 0.65,
  uCamDistMin: 1.85,
  uCamDistMax: 0.32,
  uIorNormalsMin: -0.2,
  uIorNormalsMax: -0.09,
  uIorBg: 1.08,
  uShininess: 460.0,
  uSpecularStrength: 0.3,
  uDiffuseStrength: 0.3,
  uAmbientStrength: 0.6,
  uColorFresnelPower: 3.6,
  uFresnelColor: new THREE.Color(0xc0dff8),
  uSectionBgColor: new THREE.Color(0x163a72),
  uLightPos: new THREE.Vector3(-1.8, 4.5, 4.5),
  uLightColor: new THREE.Color(0xeef6ff),
  uAlphaBoost: 0.78,
};

/** Mid: gold-ref glass — IOR of Earth, soft F highlight, medium speed. */
const LOOK_MID = {
  uSpeed: 0.34,
  uNoiseAmplitude: 0.004,
  uSpecularStrength: 0.5,
  uDiffuseStrength: 0.22,
  uAmbientStrength: 0.7,
  uShininess: 240.0,
  uColorFresnelPower: 2.6,
  uAlphaBoost: 0.9,
  uIorBg: 1.12,
  uIorNormalsMin: -0.3,
  uIorNormalsMax: -0.15,
  uSectionBgColor: new THREE.Color(0x245a96),
  uFresnelColor: new THREE.Color(0xe8f2ff),
  uLightPos: new THREE.Vector3(2.6, 4.6, 4.2),
};

function bubbleCounts() {
  return window.matchMedia('(max-width: 58rem)').matches ? COUNT_MOBILE : COUNT_DESKTOP;
}

function aspectOf(camera) {
  return Math.max(camera.aspect || 1, 0.5);
}

function diameterVwToVh(camera, diameterVw) {
  return diameterVw * aspectOf(camera);
}

function diameterVwToScale(camera, dist, diameterVw) {
  const diameterVh = diameterVwToVh(camera, diameterVw);
  const fovRad = THREE.MathUtils.degToRad(camera.fov);
  const frustumH = 2 * dist * Math.tan(fovRad * 0.5);
  const worldRadius = diameterVh * frustumH * 0.5;
  return worldRadius / GEO_RADIUS;
}

function overlapsAccepted(ndcX, ndcY, ndcR, accepted, aspect, separation) {
  for (let i = 0; i < accepted.length; i += 1) {
    const a = accepted[i];
    const minSep = (ndcR + a.ndcR) * (1 + separation);
    const dxH = Math.abs(ndcX - a.ndcX) * aspect;
    if (dxH < minSep) return true;
    const dy = ndcY - a.ndcY;
    if (Math.hypot(dxH, dy) < minSep) return true;
  }
  return false;
}

function tryPlaceBubble(camera, rng, depthBias, accepted, diameterVw, separation, biasRight) {
  const aspect = aspectOf(camera);
  let ndcX = (rng() * 2 - 1) * 0.96;
  if (biasRight && rng() < 0.55) {
    ndcX = 0.05 + rng() * 0.9;
  }
  const ndcY = (rng() * 2 - 1) * 0.92;
  const depthT = THREE.MathUtils.clamp(
    Math.pow(rng(), 0.55) * 0.55 + depthBias * 0.45,
    0,
    1,
  );
  const target = new THREE.Vector3(ndcX, ndcY, 0.5);
  target.unproject(camera);
  const dir = target.sub(camera.position).normalize();
  const dist = THREE.MathUtils.lerp(
    BUBBLE_DEFAULTS.uViewDepthMin,
    BUBBLE_DEFAULTS.uViewDepthMax,
    depthT,
  );
  const position = camera.position.clone().add(dir.multiplyScalar(dist));
  const ndcR = diameterVwToVh(camera, diameterVw);
  if (overlapsAccepted(ndcX, ndcY, ndcR, accepted, aspect, separation)) return null;
  const scale = diameterVwToScale(camera, dist, diameterVw);
  return { position, scale, ndcX, ndcY, ndcR, diameterVw };
}

function fillBubbleAttributes(opts) {
  const {
    camera,
    count,
    offsets,
    phases,
    scales,
    contents,
    depthBias,
    accepted,
    sizeRange,
    separation,
    nearPrefer,
    biasRight,
  } = opts;

  for (let i = 0; i < count; i += 1) {
    let placed = null;
    const tSize = nearPrefer ? 0.25 + Math.random() * 0.75 : Math.random();
    let diameterVw = THREE.MathUtils.clamp(
      THREE.MathUtils.lerp(sizeRange.min, sizeRange.max, tSize),
      sizeRange.hardMin,
      sizeRange.hardMax,
    );

    for (let attempt = 0; attempt < PLACE_ATTEMPTS; attempt += 1) {
      if (attempt > 0 && attempt % 24 === 0) {
        diameterVw = Math.max(sizeRange.hardMin, diameterVw * 0.92);
      }
      placed = tryPlaceBubble(
        camera,
        Math.random,
        depthBias,
        accepted,
        diameterVw,
        separation,
        biasRight,
      );
      if (placed) break;
    }

    if (!placed) {
      diameterVw = sizeRange.hardMin;
      for (let attempt = 0; attempt < 40 && !placed; attempt += 1) {
        placed = tryPlaceBubble(
          camera,
          Math.random,
          depthBias,
          accepted,
          diameterVw,
          separation,
          biasRight,
        );
      }
    }

    if (!placed) {
      const ndcX = ((i % 7) / 6) * 1.8 - 0.9;
      const ndcY = -0.85 + (i / Math.max(count, 1)) * 1.7;
      const dist = BUBBLE_DEFAULTS.uViewDepthMax;
      const target = new THREE.Vector3(ndcX, ndcY, 0.5).unproject(camera);
      const dir = target.sub(camera.position).normalize();
      placed = {
        position: camera.position.clone().add(dir.multiplyScalar(dist)),
        scale: diameterVwToScale(camera, dist, sizeRange.hardMin),
        ndcX,
        ndcY,
        ndcR: diameterVwToVh(camera, sizeRange.hardMin),
        diameterVw: sizeRange.hardMin,
      };
    }

    accepted.push({
      ndcX: placed.ndcX,
      ndcY: placed.ndcY,
      ndcR: placed.ndcR,
    });

    offsets[i * 3] = placed.position.x;
    offsets[i * 3 + 1] = placed.position.y;
    offsets[i * 3 + 2] = placed.position.z;
    phases[i] = Math.random();
    scales[i] = placed.scale;
    contents[i] = 0;
  }
}

function buildUniforms(alphaBoost) {
  return {
    tDiffuse: { value: null },
    tContent: { value: null },
    uResolution: { value: new THREE.Vector2(1, 1) },
    uTime: { value: 0 },
    uReducedMotion: { value: 0 },
    uSpeed: { value: BUBBLE_DEFAULTS.uSpeed },
    uBounds: { value: BUBBLE_DEFAULTS.uBounds.clone() },
    uNoiseAmplitude: { value: BUBBLE_DEFAULTS.uNoiseAmplitude },
    uNoiseSpeed: { value: BUBBLE_DEFAULTS.uNoiseSpeed },
    uNoiseFrequency: { value: BUBBLE_DEFAULTS.uNoiseFrequency.clone() },
    uBubbleOrbitTightness: { value: BUBBLE_DEFAULTS.uBubbleOrbitTightness },
    uBubbleDisplacementStrength: { value: BUBBLE_DEFAULTS.uBubbleDisplacementStrength },
    uEarthOrigin: { value: BUBBLE_DEFAULTS.uEarthOrigin.clone() },
    uJitterSpeed: { value: BUBBLE_DEFAULTS.uJitterSpeed },
    uJitterFrequency: { value: BUBBLE_DEFAULTS.uJitterFrequency },
    uJitterAmplitude: { value: BUBBLE_DEFAULTS.uJitterAmplitude },
    uElasticAmp: { value: BUBBLE_DEFAULTS.uElasticAmp },
    uElasticSpeed: { value: BUBBLE_DEFAULTS.uElasticSpeed },
    uCamDistMin: { value: BUBBLE_DEFAULTS.uCamDistMin },
    uCamDistMax: { value: BUBBLE_DEFAULTS.uCamDistMax },
    uIorNormalsMin: { value: BUBBLE_DEFAULTS.uIorNormalsMin },
    uIorNormalsMax: { value: BUBBLE_DEFAULTS.uIorNormalsMax },
    uIorBg: { value: BUBBLE_DEFAULTS.uIorBg },
    uShininess: { value: BUBBLE_DEFAULTS.uShininess },
    uSpecularStrength: { value: BUBBLE_DEFAULTS.uSpecularStrength },
    uDiffuseStrength: { value: BUBBLE_DEFAULTS.uDiffuseStrength },
    uAmbientStrength: { value: BUBBLE_DEFAULTS.uAmbientStrength },
    uColorFresnelPower: { value: BUBBLE_DEFAULTS.uColorFresnelPower },
    uFresnelColor: { value: BUBBLE_DEFAULTS.uFresnelColor.clone() },
    uSectionBgColor: { value: BUBBLE_DEFAULTS.uSectionBgColor.clone() },
    uLightPos: { value: BUBBLE_DEFAULTS.uLightPos.clone() },
    uLightColor: { value: BUBBLE_DEFAULTS.uLightColor.clone() },
    uAlphaBoost: { value: alphaBoost },
  };
}

function applyLook(uniforms, look) {
  Object.keys(look).forEach((key) => {
    if (!uniforms[key]) return;
    const v = look[key];
    if (v && typeof v === 'object' && (v.isColor || v.isVector3)) {
      uniforms[key].value.copy(v);
    } else {
      uniforms[key].value = v;
    }
  });
}

/** Far: pale blue soft spot, no hard rim. */
function createFarDiscTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, 'rgba(140, 195, 255, 0.45)');
  g.addColorStop(0.35, 'rgba(90, 160, 235, 0.18)');
  g.addColorStop(0.7, 'rgba(50, 110, 190, 0.05)');
  g.addColorStop(1, 'rgba(20, 60, 120, 0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 64, 64);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** Unused — near layer uses procedural rim shader (keeps API for far texture path). */
function createNearBokehTexture() {
  return createFarDiscTexture();
}

/**
 * Far layer: soft bokeh dust — rice-grain, ~10–20% opacity, no rim (§10.2.A).
 */
function createSoftPointsLayer(opts) {
  const {
    scene,
    camera,
    count,
    layer,
    renderOrder,
    texture,
    opacity,
    speedMin,
    speedMax,
    sizeMin,
    sizeMax,
    distMin,
    distMax,
    depthTest,
    riseAmp,
  } = opts;

  const positions = new Float32Array(count * 3);
  const phases = new Float32Array(count);
  const speeds = new Float32Array(count);
  const sizes = new Float32Array(count);

  const place = (activeCamera) => {
    const aspect = aspectOf(activeCamera);
    for (let i = 0; i < count; i += 1) {
      const ndcX = (Math.random() * 2 - 1) * 0.98;
      const ndcY = (Math.random() * 2 - 1) * 0.98;
      const depthT = Math.random();
      const target = new THREE.Vector3(ndcX, ndcY, 0.5).unproject(activeCamera);
      const dir = target.sub(activeCamera.position).normalize();
      const dist = THREE.MathUtils.lerp(distMin, distMax, depthT);
      const p = activeCamera.position.clone().add(dir.multiplyScalar(dist));
      positions[i * 3] = p.x;
      positions[i * 3 + 1] = p.y;
      positions[i * 3 + 2] = p.z;
      phases[i] = Math.random() * Math.PI * 2;
      speeds[i] = speedMin + Math.random() * (speedMax - speedMin);
      sizes[i] = (sizeMin + Math.random() * (sizeMax - sizeMin)) * (aspect > 1 ? 1 : 0.9);
    }
  };

  place(camera);

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1));
  geometry.setAttribute('aSpeed', new THREE.BufferAttribute(speeds, 1));
  geometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));

  const material = new THREE.ShaderMaterial({
    uniforms: {
      tMap: { value: texture },
      uTime: { value: 0 },
      uReducedMotion: { value: 0 },
      uPixelRatio: { value: Math.min(window.devicePixelRatio || 1, 2) },
      uOpacity: { value: opacity },
      uRiseAmp: { value: riseAmp },
    },
    vertexShader: /* glsl */ `
      attribute float aPhase;
      attribute float aSpeed;
      attribute float aSize;
      uniform float uTime;
      uniform float uReducedMotion;
      uniform float uPixelRatio;
      uniform float uRiseAmp;
      varying float vFade;
      void main() {
        vec3 p = position;
        float t = uTime * aSpeed * (1.0 - uReducedMotion);
        p.y = mod(p.y + t + aPhase * 0.2 + uRiseAmp, uRiseAmp * 2.0) - uRiseAmp;
        p.x += sin(uTime * 0.08 + aPhase) * 0.025 * (1.0 - uReducedMotion);
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = aSize * uPixelRatio * (2.6 / max(-mv.z, 0.2));
        vFade = 1.0;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform sampler2D tMap;
      uniform float uOpacity;
      varying float vFade;
      void main() {
        vec4 tex = texture2D(tMap, gl_PointCoord);
        float a = tex.a * uOpacity * vFade;
        if (a < 0.006) discard;
        gl_FragColor = vec4(tex.rgb, a);
      }
    `,
    transparent: true,
    depthWrite: false,
    depthTest,
    blending: THREE.NormalBlending,
  });

  const points = new THREE.Points(geometry, material);
  points.frustumCulled = false;
  points.renderOrder = renderOrder;
  points.layers.set(layer);
  scene.add(points);

  return {
    points,
    material,
    count,
    relayout(activeCamera) {
      place(activeCamera);
      geometry.attributes.position.needsUpdate = true;
      geometry.attributes.aSize.needsUpdate = true;
    },
    update(time, reducedMotion) {
      material.uniforms.uTime.value = time;
      material.uniforms.uReducedMotion.value = reducedMotion ? 1 : 0;
    },
    setPixelRatio(dpr) {
      material.uniforms.uPixelRatio.value = dpr;
    },
    dispose() {
      scene.remove(points);
      geometry.dispose();
      material.dispose();
      texture.dispose();
    },
  };
}

/** Far layer: soft bokeh dust — rice-grain, ~10–20% opacity, no rim. */
function createFarDust({ scene, camera, count, layer }) {
  return createSoftPointsLayer({
    scene,
    camera,
    count,
    layer,
    renderOrder: -2,
    texture: createFarDiscTexture(),
    opacity: 0.12,
    speedMin: 0.026,
    speedMax: 0.06,
    sizeMin: 10,
    sizeMax: 32,
    distMin: 4.6,
    distMax: 7.8,
    depthTest: true,
    riseAmp: 2.6,
  });
}

/**
 * Near layer: soft-disc bokeh with thin crescent glass rim (gold DOF).
 * Procedural rim — ban mushy full-disc feather textures.
 */
function createNearBokeh({ scene, camera, count, layer }) {
  const sizeMin = 85;
  const sizeMax = 175;
  const distMin = 1.55;
  const distMax = 3.05;
  const speedMin = 0.52;
  const speedMax = 0.9;
  const riseAmp = 2.4;

  const positions = new Float32Array(count * 3);
  const phases = new Float32Array(count);
  const speeds = new Float32Array(count);
  const sizes = new Float32Array(count);

  const place = (activeCamera) => {
    const aspect = aspectOf(activeCamera);
    // Gold seats: large near discs prefer lower / right of copy zone
    const seats = [
      [0.55, -0.55],
      [-0.35, -0.35],
      [0.75, 0.15],
      [-0.55, 0.45],
      [0.2, -0.75],
    ];
    for (let i = 0; i < count; i += 1) {
      const seat = seats[i % seats.length];
      const ndcX = THREE.MathUtils.clamp(seat[0] + (Math.random() - 0.5) * 0.35, -0.95, 0.95);
      const ndcY = THREE.MathUtils.clamp(seat[1] + (Math.random() - 0.5) * 0.3, -0.92, 0.92);
      const depthT = 0.15 + Math.random() * 0.7;
      const target = new THREE.Vector3(ndcX, ndcY, 0.5).unproject(activeCamera);
      const dir = target.sub(activeCamera.position).normalize();
      const dist = THREE.MathUtils.lerp(distMin, distMax, depthT);
      const p = activeCamera.position.clone().add(dir.multiplyScalar(dist));
      positions[i * 3] = p.x;
      positions[i * 3 + 1] = p.y;
      positions[i * 3 + 2] = p.z;
      phases[i] = Math.random() * Math.PI * 2;
      speeds[i] = speedMin + Math.random() * (speedMax - speedMin);
      sizes[i] = (sizeMin + Math.random() * (sizeMax - sizeMin)) * (aspect > 1 ? 1 : 0.88);
    }
  };

  place(camera);

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1));
  geometry.setAttribute('aSpeed', new THREE.BufferAttribute(speeds, 1));
  geometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));

  const material = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uReducedMotion: { value: 0 },
      uPixelRatio: { value: Math.min(window.devicePixelRatio || 1, 2) },
      uRiseAmp: { value: riseAmp },
      uOpacity: { value: 1.0 },
    },
    vertexShader: /* glsl */ `
      attribute float aPhase;
      attribute float aSpeed;
      attribute float aSize;
      uniform float uTime;
      uniform float uReducedMotion;
      uniform float uPixelRatio;
      uniform float uRiseAmp;
      void main() {
        vec3 p = position;
        float t = uTime * aSpeed * (1.0 - uReducedMotion);
        p.y = mod(p.y + t + aPhase * 0.2 + uRiseAmp, uRiseAmp * 2.0) - uRiseAmp;
        p.x += sin(uTime * 0.08 + aPhase) * 0.025 * (1.0 - uReducedMotion);
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = aSize * uPixelRatio * (2.55 / max(-mv.z, 0.2));
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uOpacity;
      void main() {
        vec2 uv = gl_PointCoord * 2.0 - 1.0;
        float r = length(uv);
        if (r > 1.0) discard;

        // Gold near: bokeh ring — dark-blue core + always-readable soft rim
        float edge = 1.0 - smoothstep(0.92, 1.0, r);
        float rim = smoothstep(0.76, 0.86, r) * (1.0 - smoothstep(0.9, 0.99, r));
        float core = (1.0 - smoothstep(0.0, 0.72, r)) * 0.12;
        float haze = smoothstep(0.45, 0.78, r) * (1.0 - smoothstep(0.78, 0.9, r)) * 0.05;

        float crescent = clamp(0.35 + (-uv.x * 0.7 + uv.y * 0.9), 0.0, 1.0);
        crescent = pow(crescent, 1.05);
        // Floor rim so discs never collapse to mush blobs
        float rimLit = rim * mix(0.65, 1.15, crescent);

        vec3 body = vec3(0.16, 0.36, 0.66);
        vec3 rimCol = mix(vec3(0.6, 0.82, 1.0), vec3(0.92, 0.97, 1.0), crescent);
        vec3 color = body * (core * 1.6 + haze) + rimCol * rimLit;
        float alpha = (core + haze + rimLit * 0.95) * uOpacity * edge;
        alpha = clamp(alpha, 0.0, 0.75);
        if (alpha < 0.014) discard;
        gl_FragColor = vec4(color, alpha);
      }
    `,
    transparent: true,
    depthWrite: false,
    depthTest: false,
    blending: THREE.NormalBlending,
  });

  const points = new THREE.Points(geometry, material);
  points.frustumCulled = false;
  points.renderOrder = 4;
  points.layers.set(layer);
  scene.add(points);

  return {
    points,
    material,
    count,
    relayout(activeCamera) {
      place(activeCamera);
      geometry.attributes.position.needsUpdate = true;
      geometry.attributes.aSize.needsUpdate = true;
    },
    update(time, reducedMotion) {
      material.uniforms.uTime.value = time;
      material.uniforms.uReducedMotion.value = reducedMotion ? 1 : 0;
    },
    setPixelRatio(dpr) {
      material.uniforms.uPixelRatio.value = dpr;
    },
    dispose() {
      scene.remove(points);
      geometry.dispose();
      material.dispose();
    },
  };
}

function createBubbleGroup(opts) {
  const {
    scene,
    camera,
    count,
    depthBias,
    layer,
    depthTest,
    renderOrder,
    contentTexture,
    accepted,
    sizeRange,
    separation,
    nearPrefer,
    biasRight,
    look,
  } = opts;

  const geometry = new THREE.SphereGeometry(GEO_RADIUS, 32, 32);
  const offsets = new Float32Array(count * 3);
  const phases = new Float32Array(count);
  const scales = new Float32Array(count);
  const contents = new Float32Array(count);

  fillBubbleAttributes({
    camera,
    count,
    offsets,
    phases,
    scales,
    contents,
    depthBias,
    accepted,
    sizeRange,
    separation,
    nearPrefer,
    biasRight,
  });

  geometry.setAttribute('iOffset', new THREE.InstancedBufferAttribute(offsets, 3));
  geometry.setAttribute('iPhase', new THREE.InstancedBufferAttribute(phases, 1));
  geometry.setAttribute('iScale', new THREE.InstancedBufferAttribute(scales, 1));
  geometry.setAttribute('iContent', new THREE.InstancedBufferAttribute(contents, 1));

  const uniforms = buildUniforms(look.uAlphaBoost);
  uniforms.tContent.value = contentTexture;
  applyLook(uniforms, look);

  const material = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: bubbleVert,
    fragmentShader: bubbleFrag,
    transparent: true,
    depthWrite: depthTest,
    depthTest,
    blending: THREE.NormalBlending,
  });

  const mesh = new THREE.InstancedMesh(geometry, material, count);
  mesh.frustumCulled = false;
  mesh.renderOrder = renderOrder;
  mesh.layers.set(layer);
  scene.add(mesh);

  return {
    mesh,
    material,
    count,
    depthBias,
    sizeRange,
    separation,
    nearPrefer,
    biasRight,
    dispose() {
      scene.remove(mesh);
      geometry.dispose();
      material.dispose();
    },
  };
}

/**
 * Three visual tiers: far soft dust + mid glass + near soft bokeh discs.
 */
export function createBubbles({ scene, camera }) {
  const counts = bubbleCounts();
  const contentTexture = createBubbleContentTexture();
  const accepted = [];

  const far = createFarDust({
    scene,
    camera,
    count: counts.far,
    layer: 1,
  });

  const mid = createBubbleGroup({
    scene,
    camera,
    count: counts.mid,
    depthBias: 0.35,
    layer: 2,
    depthTest: false,
    renderOrder: 2,
    contentTexture,
    accepted,
    sizeRange: SIZE_MID,
    separation: SEPARATION_MID,
    nearPrefer: false,
    biasRight: true,
    look: LOOK_MID,
  });

  const near = createNearBokeh({
    scene,
    camera,
    count: counts.near,
    layer: 2,
  });

  const glassGroups = [mid];

  function relayoutAll(activeCamera) {
    if (!activeCamera) return;
    accepted.length = 0;
    far.relayout(activeCamera);
    near.relayout(activeCamera);
    glassGroups.forEach((g) => {
      const geo = g.mesh.geometry;
      fillBubbleAttributes({
        camera: activeCamera,
        count: g.count,
        offsets: geo.attributes.iOffset.array,
        phases: geo.attributes.iPhase.array,
        scales: geo.attributes.iScale.array,
        contents: geo.attributes.iContent.array,
        depthBias: g.depthBias,
        accepted,
        sizeRange: g.sizeRange,
        separation: g.separation,
        nearPrefer: g.nearPrefer,
        biasRight: g.biasRight,
      });
      geo.attributes.iOffset.needsUpdate = true;
      geo.attributes.iScale.needsUpdate = true;
      geo.attributes.iPhase.needsUpdate = true;
    });
  }

  return {
    backMesh: far.points,
    frontMesh: near.points,
    midMesh: mid.mesh,
    nearMesh: near.points,
    material: mid.material,
    count: counts.far + counts.mid + counts.near,
    scaleLimits: {
      diameterVwMin: SIZE_MID.min,
      diameterVwMax: SIZE_MID.max,
    },
    getScaleStats() {
      let min = Infinity;
      let max = -Infinity;
      let n = 0;
      glassGroups.forEach((g) => {
        const arr = g.mesh.geometry.attributes.iScale?.array;
        if (!arr) return;
        for (let i = 0; i < arr.length; i += 1) {
          const v = arr[i];
          if (v < min) min = v;
          if (v > max) max = v;
          n += 1;
        }
      });
      return {
        min: Number.isFinite(min) ? min : 0,
        max: Number.isFinite(max) ? max : 0,
        n,
        far: counts.far,
        mid: counts.mid,
        near: counts.near,
        accepted: accepted.length,
        diameterVwMin: SIZE_MID.min,
        diameterVwMax: SIZE_MID.max,
        nearBokeh: true,
      };
    },
    update(time, reducedMotion) {
      far.update(time, reducedMotion);
      near.update(time, reducedMotion);
      glassGroups.forEach((g) => {
        g.material.uniforms.uTime.value = time;
        g.material.uniforms.uReducedMotion.value = reducedMotion ? 1 : 0;
      });
    },
    relayout(activeCamera) {
      relayoutAll(activeCamera);
    },
    setDiffuse(texture) {
      glassGroups.forEach((g) => {
        g.material.uniforms.tDiffuse.value = texture;
      });
    },
    setSize(width, height) {
      glassGroups.forEach((g) => {
        g.material.uniforms.uResolution.value.set(width, height);
      });
    },
    setPixelRatio(dpr) {
      far.setPixelRatio(dpr);
      near.setPixelRatio(dpr);
    },
    setEarthOrigin(origin) {
      glassGroups.forEach((g) => {
        g.material.uniforms.uEarthOrigin.value.copy(origin);
      });
    },
    dispose() {
      far.dispose();
      near.dispose();
      glassGroups.forEach((g) => g.dispose());
      contentTexture.dispose?.();
    },
  };
}
