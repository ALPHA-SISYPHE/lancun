import * as THREE from '../../vendor/three.module.min.js';
import { bubbleVert, bubbleFrag } from './shaders/bubble-shaders.js';
import { latLonToVector3 } from './utils/latlon.js';

const BUBBLE_COUNT_DESKTOP = 40;
const BUBBLE_COUNT_MOBILE = 20;

function bubbleCount() {
  return window.matchMedia('(max-width: 58rem)').matches ? BUBBLE_COUNT_MOBILE : BUBBLE_COUNT_DESKTOP;
}

/**
 * WebGL instanced bubbles with refraction sampling from earth render target.
 * @param {THREE.Group} earthGroup
 */
export function createBubbles(earthGroup) {
  const count = bubbleCount();
  const geometry = new THREE.SphereGeometry(0.045, 12, 12);
  const offsets = new Float32Array(count * 3);
  const phases = new Float32Array(count);
  const scales = new Float32Array(count);

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
  }

  geometry.setAttribute('iOffset', new THREE.InstancedBufferAttribute(offsets, 3));
  geometry.setAttribute('iPhase', new THREE.InstancedBufferAttribute(phases, 1));
  geometry.setAttribute('iScale', new THREE.InstancedBufferAttribute(scales, 1));

  const material = new THREE.ShaderMaterial({
    uniforms: {
      tDiffuse: { value: null },
      uResolution: { value: new THREE.Vector2(1, 1) },
      uTime: { value: 0 },
      uReducedMotion: { value: 0 },
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
      geometry.dispose();
      material.dispose();
    },
  };
}
