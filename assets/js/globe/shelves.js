import * as THREE from '../../vendor/three.module.min.js';
import { loadShelvesMaskTexture } from './utils/textures.js';

const SHELF_COLOR = new THREE.Color(0x5eead4);

/**
 * Continental shelf overlay with animated uOffset uniform.
 */
export async function createShelves(earthGroup) {
  const mask = await loadShelvesMaskTexture();

  const material = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: {
      uMask: { value: mask },
      uOffset: { value: 0 },
      uColor: { value: SHELF_COLOR },
    },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }`,
    fragmentShader: /* glsl */ `
      uniform sampler2D uMask;
      uniform float uOffset;
      uniform vec3 uColor;
      varying vec2 vUv;
      void main() {
        float m = texture2D(uMask, vUv).r;
        float alpha = m * uOffset * 0.55;
        if (alpha < 0.01) discard;
        gl_FragColor = vec4(uColor, alpha);
      }`,
  });

  const mesh = new THREE.Mesh(new THREE.SphereGeometry(1.012, 64, 64), material);
  earthGroup.add(mesh);

  return {
    mesh,
    material,
    get offset() {
      return material.uniforms.uOffset.value;
    },
    set offset(v) {
      material.uniforms.uOffset.value = v;
    },
    dispose() {
      mask.dispose?.();
      material.dispose();
      mesh.geometry.dispose();
    },
  };
}
