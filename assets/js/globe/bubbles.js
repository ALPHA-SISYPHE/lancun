import * as THREE from '../vendor/three.module.min.js';
import { bubbleVert, bubbleFrag } from './shaders/bubble-shaders.js';
import { createBubbleContentTexture } from './utils/textures.js';

const BUBBLE_COUNT_DESKTOP = { back: 24, front: 36 };
const BUBBLE_COUNT_MOBILE = { back: 10, front: 16 };

/** Convex-inspired liquid-glass on dark interim navy. */
const BUBBLE_DEFAULTS = {
  uSpeed: 0.55,
  uBounds: new THREE.Vector3(1.55, 2.35, 1.35),
  uViewDepthMin: 1.5,
  uViewDepthMax: 6.8,
  uNoiseAmplitude: 0.045,
  uNoiseSpeed: 0.38,
  uNoiseFrequency: new THREE.Vector3(1.15, 0.95, 1.05),
  uBubbleOrbitTightness: 2.2,
  uBubbleDisplacementStrength: 0.06,
  uEarthOrigin: new THREE.Vector3(0, 0, 0),
  uJitterSpeed: 0.35,
  uJitterFrequency: 2.2,
  uJitterAmplitude: 0.028,
  uElasticAmp: 0.3,
  uElasticSpeed: 2.1,
  uCamDistMin: 1.85,
  uCamDistMax: 0.32,
  uIorNormalsMin: -0.16,
  uIorNormalsMax: -0.07,
  uIorBg: 1.12,
  uShininess: 300.0,
  uSpecularStrength: 3.25,
  uDiffuseStrength: 0.58,
  uAmbientStrength: 0.6,
  uColorFresnelPower: 2.35,
  uFresnelColor: new THREE.Color(0xd8ecff),
  uSectionBgColor: new THREE.Color(0x1e4a8c),
  uLightPos: new THREE.Vector3(-1.8, 4.5, 4.5),
  uLightColor: new THREE.Color(0xffffff),
  uAlphaBoost: 1.08,
};

function bubbleCounts() {
  return window.matchMedia('(max-width: 58rem)').matches
    ? BUBBLE_COUNT_MOBILE
    : BUBBLE_COUNT_DESKTOP;
}

/**
 * Full-viewport frustum placement; depthBias: 0 = nearer (front), 1 = farther (back).
 * @param {THREE.PerspectiveCamera} camera
 * @param {() => number} rng
 * @param {number} depthBias
 */
function placeInViewFrustum(camera, rng, depthBias) {
  const ndcX = (rng() * 2 - 1) * 1.28;
  const ndcY = (rng() * 2 - 1) * 1.15;
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

  return {
    position: camera.position.clone().add(dir.multiplyScalar(dist)),
    depthT,
  };
}

function fillBubbleAttributes(camera, count, offsets, phases, scales, contents, depthBias) {
  for (let i = 0; i < count; i += 1) {
    const { position, depthT } = placeInViewFrustum(camera, Math.random, depthBias);
    offsets[i * 3] = position.x;
    offsets[i * 3 + 1] = position.y;
    offsets[i * 3 + 2] = position.z;
    phases[i] = Math.random();
    const depthScale = THREE.MathUtils.lerp(0.22, 0.92, depthT);
    // Nearer = larger glass orbs; seed a few hero droplets on front layer
    const nearBoost = depthBias < 0.4 ? 1.55 : 0.85;
    let s = depthScale * nearBoost * (0.9 + Math.random() * 0.65);
    if (depthBias < 0.4 && (i === 0 || i === 5 || i === 12)) s *= 1.55;
    scales[i] = s;
    contents[i] = i === 3 || i === 11 ? 1 : 0;
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
  } = opts;

  const geometry = new THREE.SphereGeometry(0.055, 32, 32);
  const offsets = new Float32Array(count * 3);
  const phases = new Float32Array(count);
  const scales = new Float32Array(count);
  const contents = new Float32Array(count);

  fillBubbleAttributes(camera, count, offsets, phases, scales, contents, depthBias);

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
    // Back bubbles write depth so they occlude each other; earth still occludes them via pass order.
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
    relayout(activeCamera) {
      if (!activeCamera) return;
      fillBubbleAttributes(
        activeCamera,
        count,
        geometry.attributes.iOffset.array,
        geometry.attributes.iPhase.array,
        geometry.attributes.iScale.array,
        geometry.attributes.iContent.array,
        depthBias,
      );
      geometry.attributes.iOffset.needsUpdate = true;
      geometry.attributes.iScale.needsUpdate = true;
    },
    dispose() {
      scene.remove(mesh);
      geometry.dispose();
      material.dispose();
    },
  };
}

/**
 * Dual bubble groups (constitution §2.2):
 * back = layer 1 (behind earth, depth-tested), front = layer 2.
 * Earth stays exclusively on layer 0 — never share mask with bubbles.
 * @param {{ scene: THREE.Scene, camera: THREE.PerspectiveCamera }} options
 */
export function createBubbles({ scene, camera }) {
  const counts = bubbleCounts();
  const contentTexture = createBubbleContentTexture();

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
  });

  const groups = [back, front];

  return {
    backMesh: back.mesh,
    frontMesh: front.mesh,
    /** @deprecated use back/front materials via setEarthOrigin */
    material: front.material,
    count: counts.back + counts.front,
    update(time, reducedMotion) {
      groups.forEach((g) => {
        g.material.uniforms.uTime.value = time;
        g.material.uniforms.uReducedMotion.value = reducedMotion ? 1 : 0;
      });
    },
    relayout(activeCamera) {
      groups.forEach((g) => g.relayout(activeCamera));
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
