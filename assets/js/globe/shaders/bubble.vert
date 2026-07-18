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
