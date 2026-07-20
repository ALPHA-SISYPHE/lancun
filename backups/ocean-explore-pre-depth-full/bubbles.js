import * as THREE from '../vendor/three.module.min.js';
import { bubbleVert, bubbleFrag } from './shaders/bubble-shaders.js';
import { createBubbleContentTexture } from './utils/textures.js';

/** Sparse Convex-like counts (~12 desktop / ~8 mobile). */
const BUBBLE_COUNT_DESKTOP = { back: 4, front: 8 };
const BUBBLE_COUNT_MOBILE = { back: 3, front: 5 };

/** Screen-space diameter as fraction of viewport WIDTH (Convex refs ~3%–9.5%). */
const DIAMETER_VW_MIN = 0.03;
const DIAMETER_VW_MAX = 0.085;
const DIAMETER_VW_HARD_MIN = 0.025;
const DIAMETER_VW_HARD_MAX = 0.1;

/** Extra gap beyond r1+r2 in NDC-height units; also used as horizontal corridor margin. */
const SEPARATION = 0.7;
const PLACE_ATTEMPTS = 80;
const GEO_RADIUS = 0.055;

/** Convex-inspired liquid-glass on dark interim navy. */
const BUBBLE_DEFAULTS = {
  uSpeed: 0.55,
  uBounds: new THREE.Vector3(1.55, 2.35, 1.35),
  uViewDepthMin: 1.5,
  uViewDepthMax: 6.8,
  /** Liquid micro-deform: fine surface wobble, stay near-sphere (not blob). */
  uNoiseAmplitude: 0.0062,
  uNoiseSpeed: 0.12,
  uNoiseFrequency: new THREE.Vector3(1.35, 1.15, 1.25),
  uBubbleOrbitTightness: 2.2,
  uBubbleDisplacementStrength: 0.06,
  uEarthOrigin: new THREE.Vector3(0, 0, 0),
  uJitterSpeed: 0.16,
  uJitterFrequency: 2.2,
  uJitterAmplitude: 0.005,
  /** No axial squash — liquid feel comes from surface noise only. */
  uElasticAmp: 0.0,
  uElasticSpeed: 0.65,
  uCamDistMin: 1.85,
  uCamDistMax: 0.32,
  uIorNormalsMin: -0.2,
  uIorNormalsMax: -0.09,
  uIorBg: 1.08,
  uShininess: 460.0,
  /** Soft gold-ref rim (F): glass lens + delicate thin crescent. */
  uSpecularStrength: 0.3,
  uDiffuseStrength: 0.3,
  uAmbientStrength: 0.6,
  uColorFresnelPower: 3.6,
  uFresnelColor: new THREE.Color(0xc0dff8),
  uSectionBgColor: new THREE.Color(0x1e4a8c),
  uLightPos: new THREE.Vector3(-1.8, 4.5, 4.5),
  uLightColor: new THREE.Color(0xeef6ff),
  uAlphaBoost: 0.78,
};

function bubbleCounts() {
  return window.matchMedia('(max-width: 58rem)').matches
    ? BUBBLE_COUNT_MOBILE
    : BUBBLE_COUNT_DESKTOP;
}

function aspectOf(camera) {
  return Math.max(camera.aspect || 1, 0.5);
}

/** Convert width-fraction diameter to height-fraction for frustum math / NDC radii. */
function diameterVwToVh(camera, diameterVw) {
  return diameterVw * aspectOf(camera);
}

/**
 * World-space iScale so sphere (GEO_RADIUS * iScale) spans diameterVw of viewport width at dist.
 */
function diameterVwToScale(camera, dist, diameterVw) {
  const diameterVh = diameterVwToVh(camera, diameterVw);
  const fovRad = THREE.MathUtils.degToRad(camera.fov);
  const frustumH = 2 * dist * Math.tan(fovRad * 0.5);
  const worldRadius = (diameterVh * frustumH) * 0.5;
  return worldRadius / GEO_RADIUS;
}

function overlapsAccepted(ndcX, ndcY, ndcR, accepted, aspect) {
  for (let i = 0; i < accepted.length; i += 1) {
    const a = accepted[i];
    const minSep = (ndcR + a.ndcR) * (1 + SEPARATION);
    // Horizontal corridor: survives pure Y rise without crossing.
    const dxH = Math.abs(ndcX - a.ndcX) * aspect;
    if (dxH < minSep) return true;
    const dy = ndcY - a.ndcY;
    if (Math.hypot(dxH, dy) < minSep) return true;
  }
  return false;
}

/**
 * Place one bubble: NDC sample + depth → world pos + VW-relative scale; reject if overlaps.
 * @returns {{ position: THREE.Vector3, scale: number, ndcX: number, ndcY: number, ndcR: number, diameterVw: number } | null}
 */
function tryPlaceBubble(camera, rng, depthBias, accepted, diameterVw) {
  const aspect = aspectOf(camera);
  const ndcX = (rng() * 2 - 1) * 0.92;
  const ndcY = (rng() * 2 - 1) * 0.88;
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
  // NDC radii are in height-normalized units (same as previous vh-based ndcR).
  const ndcR = diameterVwToVh(camera, diameterVw);
  if (overlapsAccepted(ndcX, ndcY, ndcR, accepted, aspect)) return null;
  const scale = diameterVwToScale(camera, dist, diameterVw);
  return { position, scale, ndcX, ndcY, ndcR, diameterVw };
}

/**
 * Fill attributes for a layer; shares `accepted` with the other layer for global non-overlap.
 */
function fillBubbleAttributes(camera, count, offsets, phases, scales, contents, depthBias, accepted) {
  const nearPrefer = depthBias < 0.4;
  for (let i = 0; i < count; i += 1) {
    let placed = null;
    // Spread across [MIN, MAX] — keep mins readable (no dust). Front slightly larger bias.
    const tSize = nearPrefer
      ? 0.25 + Math.random() * 0.75
      : Math.random() * 0.65;
    let diameterVw = THREE.MathUtils.clamp(
      THREE.MathUtils.lerp(DIAMETER_VW_MIN, DIAMETER_VW_MAX, tSize),
      DIAMETER_VW_HARD_MIN,
      DIAMETER_VW_HARD_MAX,
    );

    for (let attempt = 0; attempt < PLACE_ATTEMPTS; attempt += 1) {
      if (attempt > 0 && attempt % 24 === 0) {
        // Nudge smaller for packing only — never below hard min.
        diameterVw = Math.max(DIAMETER_VW_HARD_MIN, diameterVw * 0.92);
      }
      placed = tryPlaceBubble(camera, Math.random, depthBias, accepted, diameterVw);
      if (placed) break;
    }

    if (!placed) {
      diameterVw = DIAMETER_VW_HARD_MIN;
      for (let attempt = 0; attempt < 40 && !placed; attempt += 1) {
        placed = tryPlaceBubble(camera, Math.random, depthBias, accepted, diameterVw);
      }
    }

    if (!placed) {
      const aspect = aspectOf(camera);
      const ndcX = i % 2 === 0 ? -0.85 : 0.85;
      const ndcY = -0.75 + (i / Math.max(count, 1)) * 1.4;
      const dist = BUBBLE_DEFAULTS.uViewDepthMax;
      const target = new THREE.Vector3(ndcX, ndcY, 0.5).unproject(camera);
      const dir = target.sub(camera.position).normalize();
      const ndcR = diameterVwToVh(camera, DIAMETER_VW_HARD_MIN);
      placed = {
        position: camera.position.clone().add(dir.multiplyScalar(dist)),
        scale: diameterVwToScale(camera, dist, DIAMETER_VW_HARD_MIN),
        ndcX,
        ndcY,
        ndcR,
        diameterVw: DIAMETER_VW_HARD_MIN,
      };
      if (overlapsAccepted(ndcX, ndcY, placed.ndcR, accepted, aspect)) {
        placed.ndcX = THREE.MathUtils.clamp(ndcX + (i + 1) * 0.12, -0.95, 0.95);
      }
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
    contents[i] = i === 2 ? 1 : 0;
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

/**
 * @param {{
 *   scene: THREE.Scene,
 *   camera: THREE.PerspectiveCamera,
 *   count: number,
 *   depthBias: number,
 *   layer: number,
 *   depthTest: boolean,
 *   renderOrder: number,
 *   alphaBoost: number,
 *   contentTexture: THREE.Texture,
 *   accepted: Array<{ ndcX: number, ndcY: number, ndcR: number }>,
 * }} opts
 */
function createBubbleGroup(opts) {
  const {
    scene,
    camera,
    count,
    depthBias,
    layer,
    depthTest,
    renderOrder,
    alphaBoost,
    contentTexture,
    accepted,
  } = opts;

  const geometry = new THREE.SphereGeometry(GEO_RADIUS, 32, 32);
  const offsets = new Float32Array(count * 3);
  const phases = new Float32Array(count);
  const scales = new Float32Array(count);
  const contents = new Float32Array(count);

  fillBubbleAttributes(camera, count, offsets, phases, scales, contents, depthBias, accepted);

  geometry.setAttribute('iOffset', new THREE.InstancedBufferAttribute(offsets, 3));
  geometry.setAttribute('iPhase', new THREE.InstancedBufferAttribute(phases, 1));
  geometry.setAttribute('iScale', new THREE.InstancedBufferAttribute(scales, 1));
  geometry.setAttribute('iContent', new THREE.InstancedBufferAttribute(contents, 1));

  const uniforms = buildUniforms(alphaBoost);
  uniforms.tContent.value = contentTexture;

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
    accepted,
    relayout() {
      /* joint relayout handled by createBubbles */
    },
    dispose() {
      scene.remove(mesh);
      geometry.dispose();
      material.dispose();
    },
  };
}

/**
 * Dual bubble groups: sparse, viewport-relative size, NDC non-overlap (horizontal corridors).
 * @param {{ scene: THREE.Scene, camera: THREE.PerspectiveCamera }} options
 */
export function createBubbles({ scene, camera }) {
  const counts = bubbleCounts();
  const contentTexture = createBubbleContentTexture();
  const accepted = [];

  const back = createBubbleGroup({
    scene,
    camera,
    count: counts.back,
    depthBias: 0.78,
    layer: 1,
    depthTest: true,
    renderOrder: -1,
    alphaBoost: 0.95,
    contentTexture,
    accepted,
  });

  const front = createBubbleGroup({
    scene,
    camera,
    count: counts.front,
    depthBias: 0.12,
    layer: 2,
    depthTest: false,
    renderOrder: 2,
    alphaBoost: 1.25,
    contentTexture,
    accepted,
  });

  const groups = [back, front];

  function relayoutAll(activeCamera) {
    if (!activeCamera) return;
    accepted.length = 0;
    groups.forEach((g) => {
      const geo = g.mesh.geometry;
      fillBubbleAttributes(
        activeCamera,
        g.count,
        geo.attributes.iOffset.array,
        geo.attributes.iPhase.array,
        geo.attributes.iScale.array,
        geo.attributes.iContent.array,
        g.depthBias,
        accepted,
      );
      geo.attributes.iOffset.needsUpdate = true;
      geo.attributes.iScale.needsUpdate = true;
      geo.attributes.iPhase.needsUpdate = true;
    });
  }

  return {
    backMesh: back.mesh,
    frontMesh: front.mesh,
    /** @deprecated use back/front materials via setEarthOrigin */
    material: front.material,
    count: counts.back + counts.front,
    scaleLimits: {
      diameterVwMin: DIAMETER_VW_MIN,
      diameterVwMax: DIAMETER_VW_MAX,
    },
    getScaleStats() {
      let min = Infinity;
      let max = -Infinity;
      let n = 0;
      groups.forEach((g) => {
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
        min,
        max,
        n,
        accepted: accepted.length,
        diameterVwMin: DIAMETER_VW_MIN,
        diameterVwMax: DIAMETER_VW_MAX,
      };
    },
    update(time, reducedMotion) {
      groups.forEach((g) => {
        g.material.uniforms.uTime.value = time;
        g.material.uniforms.uReducedMotion.value = reducedMotion ? 1 : 0;
      });
    },
    relayout(activeCamera) {
      relayoutAll(activeCamera);
    },
    setDiffuse(texture) {
      groups.forEach((g) => {
        g.material.uniforms.tDiffuse.value = texture;
      });
    },
    setSize(width, height) {
      groups.forEach((g) => {
        g.material.uniforms.uResolution.value.set(width, height);
      });
    },
    setEarthOrigin(origin) {
      groups.forEach((g) => {
        g.material.uniforms.uEarthOrigin.value.copy(origin);
      });
    },
    dispose() {
      groups.forEach((g) => g.dispose());
      contentTexture.dispose?.();
    },
  };
}
