export const bubbleVert = /* glsl */ `
attribute vec3 iOffset;
attribute float iPhase;
attribute float iScale;
attribute float iContent;

uniform float uTime;
uniform float uReducedMotion;
uniform float uSpeed;
uniform vec3 uBounds;
uniform float uNoiseAmplitude;
uniform float uNoiseSpeed;
uniform vec3 uNoiseFrequency;
uniform float uBubbleOrbitTightness;
uniform float uBubbleDisplacementStrength;
uniform vec3 uEarthOrigin;
uniform float uJitterSpeed;
uniform float uJitterFrequency;
uniform float uJitterAmplitude;

varying vec3 vNormal;
varying vec3 vViewDir;
varying vec3 vWorldPos;
varying vec2 vScreenUv;
varying vec2 vUv;
varying float vAlpha;
varying float vCenterToCamera;
varying float vContentMix;
varying float vDisplacement;

const float PI = 3.14159265359;

vec4 permute(vec4 x) { return mod(((x * 34.0) + 1.0) * x, 289.0); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

float snoise(vec3 v) {
  const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
  vec3 i = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);
  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + 2.0 * C.xxx;
  vec3 x3 = x0 - 1.0 + 3.0 * C.xxx;
  i = mod(i, 289.0);
  vec4 p = permute(permute(permute(
    i.z + vec4(0.0, i1.z, i2.z, 1.0))
    + i.y + vec4(0.0, i1.y, i2.y, 1.0))
    + i.x + vec4(0.0, i1.x, i2.x, 1.0));
  float n_ = 1.0 / 7.0;
  vec3 ns = n_ * vec3(1.0, 0.5, 0.25);
  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
  vec4 x_ = floor(j * ns.z) + 0.5;
  vec4 y_ = floor(j * ns.y) + 0.5;
  vec4 x = x_ * ns.x + 0.5;
  vec4 y = y_ * ns.y + 0.5;
  vec4 h = 1.0 - abs(x) - abs(y);
  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);
  vec4 s0 = floor(b0) * 2.0 + 1.0;
  vec4 s1 = floor(b1) * 2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));
  vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);
  vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
  p0 *= norm.x;
  p1 *= norm.y;
  p2 *= norm.z;
  p3 *= norm.w;
  vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
}

void main() {
  vUv = uv;
  vContentMix = iContent;

  vec3 centerPos = iOffset;
  float yTravel = uReducedMotion > 0.5
    ? iPhase * uBounds.y - uBounds.y * 0.5
    : mod(centerPos.y + uTime * uSpeed, uBounds.y) - uBounds.y * 0.5;
  centerPos.y = yTravel;

  float jitter = sin(centerPos.x + centerPos.z * uJitterFrequency + uTime * uJitterSpeed + iPhase * PI * 2.0);
  centerPos.x += jitter * uJitterAmplitude;

  float bubbleRadius = iScale;
  vec3 local = position * bubbleRadius + centerPos;

  float wobble = snoise(local * uNoiseFrequency + uTime * uNoiseSpeed + iPhase);
  wobble = wobble * 0.5 + 0.5;
  local += normal * wobble * uNoiseAmplitude;
  vDisplacement = wobble * uNoiseAmplitude;

  vec3 fromEarth = centerPos - uEarthOrigin;
  float dist = length(fromEarth);
  vec3 radial = dist > 0.0001 ? fromEarth / dist : vec3(0.0, 1.0, 0.0);
  vec3 tangent = normalize(cross(radial, vec3(0.0, 1.0, 0.0)));
  vec3 bitangent = cross(radial, tangent);
  vec3 orbitOffset = tangent * sin(uTime * 0.08 + iPhase * 6.28318) * 0.012 / uBubbleOrbitTightness
    + bitangent * cos(uTime * 0.08 + iPhase * 4.0) * 0.012 / uBubbleOrbitTightness;
  local += orbitOffset;

  float push = smoothstep(1.18, 0.92, dist);
  local += radial * push * uBubbleDisplacementStrength * 0.14;

  vec4 worldPosition = modelMatrix * vec4(local, 1.0);
  vec4 mvPosition = viewMatrix * worldPosition;

  vNormal = normalize(normalMatrix * normal);
  vViewDir = normalize(-mvPosition.xyz);
  vWorldPos = worldPosition.xyz;
  vScreenUv = (projectionMatrix * mvPosition).xy * 0.5 + 0.5;
  vCenterToCamera = abs(distance(centerPos, cameraPosition));

  // Soft edge fade scaled to uBounds (was hard-coded for large bounds → alpha≈0).
  float halfY = max(uBounds.y * 0.5, 0.01);
  float boundsFade = 1.0 - smoothstep(halfY * 0.78, halfY, abs(centerPos.y));
  // Liquid-glass body alpha — visible but not overpowering
  vAlpha = (0.11 + bubbleRadius * 0.18) * boundsFade;

  gl_Position = projectionMatrix * mvPosition;
}
`;

export const bubbleFrag = /* glsl */ `
uniform sampler2D tDiffuse;
uniform sampler2D tContent;
uniform vec2 uResolution;
uniform float uTime;
uniform float uCamDistMin;
uniform float uCamDistMax;
uniform float uIorNormalsMin;
uniform float uIorNormalsMax;
uniform float uIorBg;
uniform float uShininess;
uniform float uSpecularStrength;
uniform float uDiffuseStrength;
uniform float uAmbientStrength;
uniform float uNoiseAmplitude;
uniform float uColorFresnelPower;
uniform vec3 uFresnelColor;
uniform vec3 uSectionBgColor;
uniform vec3 uLightPos;
uniform vec3 uLightColor;
uniform float uAlphaBoost;

varying vec3 vNormal;
varying vec3 vViewDir;
varying vec3 vWorldPos;
varying vec2 vScreenUv;
varying vec2 vUv;
varying float vAlpha;
varying float vCenterToCamera;
varying float vContentMix;
varying float vDisplacement;

vec3 specularHighlight(vec3 lightColor, float shininess) {
  vec3 lightDir = normalize(uLightPos - vWorldPos);
  vec3 viewDir = normalize(vViewDir);
  vec3 halfDir = normalize(lightDir + viewDir);
  float ndotl = max(dot(normalize(vNormal), lightDir), 0.0);
  float ndoth = max(dot(normalize(vNormal), halfDir), 0.0);
  vec3 diffuse = ndotl * lightColor * uDiffuseStrength;
  vec3 spec = pow(ndoth, shininess) * lightColor * uSpecularStrength;
  return diffuse + spec;
}

void main() {
  vec2 uv = gl_FragCoord.xy / uResolution;

  float camT = smoothstep(uCamDistMax, uCamDistMin, vCenterToCamera);
  float iorScale = mix(uIorNormalsMax, uIorNormalsMin, camT);

  vec3 n = normalize(vNormal);
  vec3 viewDir = normalize(vViewDir);

  vec2 bendUv = uv + n.xy * iorScale;
  vec2 bendUvOuter = uv + n.xy * iorScale * 1.55 + n.yz * (iorScale * 0.34);
  vec4 bgCenter = texture2D(tDiffuse, clamp(bendUv, 0.0, 1.0));
  vec4 bgOuter = texture2D(tDiffuse, clamp(bendUvOuter, 0.0, 1.0));
  vec3 refracted = mix(bgCenter.rgb, bgOuter.rgb, 0.42);
  refracted = mix(refracted, refracted * uIorBg, 0.16);
  float bgPresence = max(bgCenter.a, bgOuter.a);
  refracted = mix(uSectionBgColor, refracted, max(bgPresence, 0.55));

  // Soft glass body — slight cool tint readable on light mist bg
  vec3 glassBody = mix(uSectionBgColor, vec3(0.78, 0.90, 0.98), 0.22);
  refracted = mix(glassBody, refracted, 0.76);

  vec3 lighting = specularHighlight(uLightColor, uShininess);
  vec3 color = refracted * (vec3(uAmbientStrength) + lighting);

  float fresnel = pow(1.0 - max(dot(viewDir, n), 0.0), uColorFresnelPower);
  float rimMix = mix(1.1, 0.88, smoothstep(0.0, max(uNoiseAmplitude * 2.0, 0.001), vDisplacement));
  // Cooler rim so glass reads on light seawater blue without overpowering
  vec3 rimTint = mix(vec3(0.45, 0.62, 0.78), uFresnelColor, 0.55);
  color += rimTint * fresnel * rimMix * 0.38;
  color += vec3(1.0) * pow(fresnel, 3.2) * 0.12;

  if (vContentMix > 0.5) {
    vec2 contentUv = vUv * 0.82 + 0.09;
    vec3 content = texture2D(tContent, contentUv).rgb;
    color = mix(color, content, 0.24 * (1.0 - fresnel * 0.72));
  }

  float specMask = lighting.g * 0.5 + 0.5;
  float alpha = (vAlpha + fresnel * 0.18 + specMask * 0.03) * uAlphaBoost;
  alpha = clamp(alpha, 0.06, 0.34);

  gl_FragColor = vec4(color, alpha);
}
`;
