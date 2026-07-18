import * as THREE from '../vendor/three.module.min.js';
import { bubbleVert, bubbleFrag } from './shaders/bubble-shaders.js';
import { latLonToVector3 } from './utils/latlon.js';
import { createBubbleContentTexture } from './utils/textures.js';

const BUBBLE_COUNT_DESKTOP = 40;
const BUBBLE_COUNT_MOBILE = 20;

/** Convex-inspired defaults, scaled for our scene units. */
const BUBBLE_DEFAULTS = {
  uSpeed: 0.38,
  uBounds: new THREE.Vector3(0.55, 0.55, 0.55),
  uNoiseAmplitude: 0.028,
  uNoiseSpeed: 0.24,
  uNoiseFrequency: new THREE.Vector3(0.78, 0.71, 0.7),
  uBubbleOrbitTightness: 1.856,
  uBubbleDisplacementStrength: 0.32,
  uEarthOrigin: new THREE.Vector3(0, 0, 0),
  uJitterSpeed: 0.76,
  uJitterFrequency: 3.75,
  uJitterAmplitude: 0.033,
  uCamDistMin: 2.4,
  uCamDistMax: 0.45,
  uIorNormalsMin: -0.059,
  uIorNormalsMax: -0.03,
  uIorBg: 1.0,
  uShininess: 145.0,
  uSpecularStrength: 2.8,
  uDiffuseStrength: 1.15,
  uColorFresnelPower: 5.43,
  uFresnelColor: new THREE.Color(0x87ceeb),
  uLightPos: new THREE.Vector3(-1.5, 2.5, 3.0),
  uLightColor: new THREE.Color(0xffffff),
};

function bubbleCount() {
  return window.matchMedia('(max-width: 58rem)').matches ? BUBBLE_COUNT_MOBILE : BUBBLE_COUNT_DESKTOP;
}

/**
 * WebGL instanced bubbles with refraction sampling from earth render target.
 * Dual-pass contract (GlobeScene): layer 0 → earthRT → setDiffuse(earthRT.texture) → layer 1 bubble pass;
 * fragment shader samples tDiffuse via gl_FragCoord / uResolution (DPR-sized RT).
 * @param {THREE.Group} earthGroup
 */
export function createBubbles(earthGroup) {
  const count = bubbleCount();
  const geometry = new THREE.SphereGeometry(0.045, 16, 16);
  const offsets = new Float32Array(count * 3);
  const phases = new Float32Array(count);
  const scales = new Float32Array(count);
  const contents = new Float32Array(count);

  for (let i = 0; i < count; i += 1) {
    const lat = (Math.random() - 0.5) * 140;
    const lon = Math.random() * 360 - 180;
    const radius = 1.12 + Math.random() * 0.35;
    const pos = latLonToVector3(lat, lon, radius);
    offsets[i * 3] = pos.x;
    offsets[i * 3 + 1] = pos.y;
    offsets[i * 3 + 2] = pos.z;
    phases[i] = Math.random();
    scales[i] = 0.55 + Math.random() * 0.85;
    contents[i] = i % 7 === 0 ? 1 : 0;
  }

  geometry.setAttribute('iOffset', new THREE.InstancedBufferAttribute(offsets, 3));
  geometry.setAttribute('iPhase', new THREE.InstancedBufferAttribute(phases, 1));
  geometry.setAttribute('iScale', new THREE.InstancedBufferAttribute(scales, 1));
  geometry.setAttribute('iContent', new THREE.InstancedBufferAttribute(contents, 1));

  const contentTexture = createBubbleContentTexture();

  const material = new THREE.ShaderMaterial({
    uniforms: {
      tDiffuse: { value: null },
      tContent: { value: contentTexture },
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
      uCamDistMin: { value: BUBBLE_DEFAULTS.uCamDistMin },
      uCamDistMax: { value: BUBBLE_DEFAULTS.uCamDistMax },
      uIorNormalsMin: { value: BUBBLE_DEFAULTS.uIorNormalsMin },
      uIorNormalsMax: { value: BUBBLE_DEFAULTS.uIorNormalsMax },
      uIorBg: { value: BUBBLE_DEFAULTS.uIorBg },
      uShininess: { value: BUBBLE_DEFAULTS.uShininess },
      uSpecularStrength: { value: BUBBLE_DEFAULTS.uSpecularStrength },
      uDiffuseStrength: { value: BUBBLE_DEFAULTS.uDiffuseStrength },
      uColorFresnelPower: { value: BUBBLE_DEFAULTS.uColorFresnelPower },
      uFresnelColor: { value: BUBBLE_DEFAULTS.uFresnelColor.clone() },
      uLightPos: { value: BUBBLE_DEFAULTS.uLightPos.clone() },
      uLightColor: { value: BUBBLE_DEFAULTS.uLightColor.clone() },
    },
    vertexShader: bubbleVert,
    fragmentShader: bubbleFrag,
    transparent: true,
    depthWrite: false,
    blending: THREE.NormalBlending,
  });

  const mesh = new THREE.InstancedMesh(geometry, material, count);
  mesh.frustumCulled = false;
  mesh.renderOrder = 2;
  mesh.layers.set(1);
  earthGroup.add(mesh);

  return {
    mesh,
    material,
    count,
    update(time, reducedMotion) {
      material.uniforms.uTime.value = time;
      material.uniforms.uReducedMotion.value = reducedMotion ? 1 : 0;
    },
    setDiffuse(texture) {
      material.uniforms.tDiffuse.value = texture;
    },
    setSize(width, height) {
      material.uniforms.uResolution.value.set(width, height);
    },
    dispose() {
      contentTexture.dispose?.();
      geometry.dispose();
      material.dispose();
    },
  };
}
