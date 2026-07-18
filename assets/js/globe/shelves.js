import * as THREE from '../vendor/three.module.min.js';
import { loadShelvesMaskTexture } from './utils/textures.js';

/** Brand-aligned shelf colors (#3B82F6 family). */
const SHELVES_COLOR1 = new THREE.Color(0x3b82f6);
const SHELVES_COLOR2 = new THREE.Color(0x60a5fa);

/**
 * Continental shelf overlay with gradient sweep + noise (Convex-inspired).
 */
export async function createShelves(earthGroup) {
  const mask = await loadShelvesMaskTexture();

  const material = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: {
      uMask: { value: mask },
      uOffset: { value: 0 },
      uShelvesColor1: { value: SHELVES_COLOR1 },
      uShelvesColor2: { value: SHELVES_COLOR2 },
      uNoiseScale: { value: 10.0 },
      uNoiseStrength: { value: 0.35 },
      uNoiseSpeed: { value: 0.4 },
      uTime: { value: 0 },
      uAngle: { value: 0.65 },
    },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      varying vec3 vWorldPos;
      void main() {
        vUv = uv;
        vec4 world = modelMatrix * vec4(position, 1.0);
        vWorldPos = world.xyz;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }`,
    fragmentShader: /* glsl */ `
      uniform sampler2D uMask;
      uniform float uOffset;
      uniform vec3 uShelvesColor1;
      uniform vec3 uShelvesColor2;
      uniform float uNoiseScale;
      uniform float uNoiseStrength;
      uniform float uNoiseSpeed;
      uniform float uTime;
      uniform float uAngle;
      varying vec2 vUv;
      varying vec3 vWorldPos;

      float hash(vec2 p) {
        return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
      }

      float noise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        f = f * f * (3.0 - 2.0 * f);
        float a = hash(i);
        float b = hash(i + vec2(1.0, 0.0));
        float c = hash(i + vec2(0.0, 1.0));
        float d = hash(i + vec2(1.0, 1.0));
        return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
      }

      void main() {
        float shelvesMask = texture2D(uMask, vUv).r;

        vec2 coords = vec2(
          vWorldPos.x * cos(uAngle) - vWorldPos.y * sin(uAngle),
          vWorldPos.x * sin(uAngle) + vWorldPos.y * cos(uAngle)
        );
        float progress = mix(-2.0, 2.0, uOffset);
        float gradient = coords.x + coords.y + progress;
        float gradientMask = smoothstep(0.0, 1.0, gradient);

        float n = noise(vUv * uNoiseScale + uTime * uNoiseSpeed);
        n = mix(1.0 - uNoiseStrength, 1.0 + uNoiseStrength, n);

        float coastMask = gradientMask * shelvesMask * n;
        if (coastMask < 0.01) discard;

        vec3 shelfColor = mix(uShelvesColor1, uShelvesColor2, shelvesMask);
        float alpha = coastMask * 0.72;
        gl_FragColor = vec4(shelfColor, alpha);
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
    update(time) {
      material.uniforms.uTime.value = time;
    },
    dispose() {
      mask.dispose?.();
      material.dispose();
      mesh.geometry.dispose();
    },
  };
}
