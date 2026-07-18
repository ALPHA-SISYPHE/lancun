export const bubbleVert = /* glsl */ `
attribute vec3 iOffset;
attribute float iPhase;
attribute float iScale;

uniform float uTime;
uniform float uReducedMotion;

varying vec3 vNormal;
varying vec3 vViewDir;
varying vec2 vScreenUv;
varying float vAlpha;

void main() {
  vec3 local = position * iScale;

  float rise = uReducedMotion > 0.5
    ? iPhase * 0.35
    : mod(uTime * 0.18 + iPhase, 1.0) * 0.35;
  local += iOffset;
  local.y += rise;

  float orbit = uReducedMotion > 0.5 ? 0.0 : uTime * 0.12 + iPhase * 6.28318;
  local.x += sin(orbit + iPhase * 3.0) * 0.04;
  local.z += cos(orbit + iPhase * 2.0) * 0.04;

  vec4 mvPosition = modelViewMatrix * vec4(local, 1.0);
  vNormal = normalize(normalMatrix * normal);
  vViewDir = normalize(-mvPosition.xyz);
  vScreenUv = (projectionMatrix * mvPosition).xy * 0.5 + 0.5;
  vAlpha = 0.28 + iScale * 0.35;

  gl_Position = projectionMatrix * mvPosition;
}
`;

export const bubbleFrag = /* glsl */ `
uniform sampler2D tDiffuse;
uniform vec2 uResolution;
uniform float uTime;

varying vec3 vNormal;
varying vec3 vViewDir;
varying vec2 vScreenUv;
varying float vAlpha;

void main() {
  vec2 uv = gl_FragCoord.xy / uResolution;
  vec2 refractOffset = vNormal.xy * 0.018 + vNormal.yz * 0.008;
  vec3 refracted = texture2D(tDiffuse, uv + refractOffset).rgb;

  float fresnel = pow(1.0 - max(dot(normalize(vViewDir), normalize(vNormal)), 0.0), 2.8);
  vec3 tint = vec3(0.72, 0.92, 1.0);
  vec3 color = mix(refracted, tint, fresnel * 0.42);
  color += vec3(0.15, 0.25, 0.35) * fresnel;

  float alpha = vAlpha + fresnel * 0.38;
  gl_FragColor = vec4(color, clamp(alpha, 0.0, 0.82));
}
`;
