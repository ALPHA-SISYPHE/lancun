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
uniform float uElasticAmp;
uniform float uElasticSpeed;

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

float fbm(vec3 p) {
  float v = 0.0;
  float a = 0.55;
  for (int i = 0; i < 3; i++) {
    v += a * snoise(p);
    p = p * 2.05 + 13.7;
    a *= 0.5;
  }
  return v;
}

void main() {
  vUv = uv;
  vContentMix = iContent;

  vec3 centerPos = iOffset;
  float riseT = uTime * uSpeed + iPhase * uBounds.y;
  float yTravel = uReducedMotion > 0.5
    ? iPhase * uBounds.y - uBounds.y * 0.5
    : mod(centerPos.y + riseT, uBounds.y) - uBounds.y * 0.5;
  centerPos.y = yTravel;

  // Soft lateral drift (not scale pulse)
  float drift = sin(centerPos.y * 0.9 + uTime * uJitterSpeed + iPhase * PI * 2.0);
  centerPos.x += drift * uJitterAmplitude;
  centerPos.z += cos(centerPos.y * 0.7 + uTime * 0.19 + iPhase) * uJitterAmplitude * 0.65;

  // Elastic fluid: squash/stretch along rise axis (volume-ish)
  float elasticPhase = uTime * uElasticSpeed + iPhase * PI * 2.0;
  float stretchY = 1.0 + sin(elasticPhase) * uElasticAmp;
  float stretchXZ = 1.0 / sqrt(max(stretchY, 0.75));
  if (uReducedMotion > 0.5) {
    stretchY = 1.0;
    stretchXZ = 1.0;
  }
  vec3 deformed = position;
  deformed.y *= stretchY;
  deformed.xz *= stretchXZ;

  // Multi-octave surface wobble along normal
  float noiseT = uReducedMotion > 0.5 ? iPhase : uTime * uNoiseSpeed;
  float n1 = fbm(deformed * uNoiseFrequency + vec3(iPhase * 3.1, noiseT, iPhase * 1.7));
  float n2 = snoise(deformed * uNoiseFrequency * 1.8 + vec3(noiseT * 0.6, iPhase, -noiseT));
  float surface = n1 * 0.72 + n2 * 0.28;
  float disp = surface * uNoiseAmplitude;
  if (uReducedMotion > 0.5) disp *= 0.35;
  deformed += normal * disp;
  vDisplacement = abs(disp);

  float bubbleRadius = iScale;
  vec3 local = deformed * bubbleRadius + centerPos;

  // Gentle orbit around scene origin (kept subtle without earth)
  vec3 fromEarth = centerPos - uEarthOrigin;
  float dist = length(fromEarth);
  vec3 radial = dist > 0.0001 ? fromEarth / dist : vec3(0.0, 1.0, 0.0);
  vec3 tangent = normalize(cross(radial, vec3(0.0, 1.0, 0.0)));
  if (length(tangent) < 0.001) tangent = vec3(1.0, 0.0, 0.0);
  vec3 bitangent = cross(radial, tangent);
  float orbitAmt = 0.014 / max(uBubbleOrbitTightness, 0.5);
  if (uReducedMotion < 0.5) {
    local += tangent * sin(uTime * 0.09 + iPhase * 6.28318) * orbitAmt
      + bitangent * cos(uTime * 0.07 + iPhase * 4.0) * orbitAmt;
  }

  float push = smoothstep(1.18, 0.92, dist);
  local += radial * push * uBubbleDisplacementStrength * 0.1;

  vec4 worldPosition = modelMatrix * vec4(local, 1.0);
  vec4 mvPosition = viewMatrix * worldPosition;

  // Approximate normal after elastic stretch
  vec3 nLocal = normalize(normal * vec3(1.0 / stretchXZ, 1.0 / stretchY, 1.0 / stretchXZ));
  vNormal = normalize(normalMatrix * nLocal);
  vViewDir = normalize(-mvPosition.xyz);
  vWorldPos = worldPosition.xyz;
  vScreenUv = (projectionMatrix * mvPosition).xy * 0.5 + 0.5;
  vCenterToCamera = abs(distance(centerPos, cameraPosition));

  float halfY = max(uBounds.y * 0.5, 0.01);
  float boundsFade = 1.0 - smoothstep(halfY * 0.86, halfY, abs(centerPos.y));
  // Filled liquid body (avoid thin ring look)
  vAlpha = (0.28 + bubbleRadius * 0.35) * boundsFade;

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

void main() {
  vec2 uv = gl_FragCoord.xy / uResolution;

  float camT = smoothstep(uCamDistMax, uCamDistMin, vCenterToCamera);
  float iorScale = mix(uIorNormalsMax, uIorNormalsMin, camT);

  vec3 n = normalize(vNormal);
  vec3 viewDir = normalize(vViewDir);

  vec2 bendUv = uv + n.xy * iorScale;
  vec2 bendUvOuter = uv + n.xy * iorScale * 1.7 + n.yz * (iorScale * 0.4);
  vec4 bgCenter = texture2D(tDiffuse, clamp(bendUv, 0.0, 1.0));
  vec4 bgOuter = texture2D(tDiffuse, clamp(bendUvOuter, 0.0, 1.0));
  vec3 refracted = mix(bgCenter.rgb, bgOuter.rgb, 0.45);
  refracted = mix(refracted, refracted * uIorBg, 0.22);
  float bgPresence = max(bgCenter.a, bgOuter.a);
  refracted = mix(uSectionBgColor, refracted, max(bgPresence, 0.65));

  // Liquid glass body on dark navy — filled translucent core + rim
  vec3 glassBody = mix(uSectionBgColor, vec3(0.45, 0.64, 0.92), 0.5);
  refracted = mix(glassBody, refracted, 0.5);

  vec3 lightDir = normalize(uLightPos - vWorldPos);
  float ndotl = max(dot(n, lightDir), 0.0);
  // Soft volume shade: lit side bright, opposite bottom-right darker
  float shade = mix(0.48, 1.05, ndotl);
  float opposite = 1.0 - ndotl;
  vec3 halfDir = normalize(lightDir + viewDir);
  float ndoth = max(dot(n, halfDir), 0.0);
  vec3 diffuse = ndotl * uLightColor * uDiffuseStrength;
  vec3 spec = pow(ndoth, uShininess) * uLightColor * uSpecularStrength;
  // Sharp upper crescent (Convex droplet highlight)
  vec3 specTight = pow(ndoth, uShininess * 4.2) * vec3(1.0) * (uSpecularStrength * 1.75);
  // Soft bloom under the hot spot — keep narrow so it does not become a white disk
  vec3 specBloom = pow(ndoth, uShininess * 1.05) * uLightColor * (uSpecularStrength * 0.22);

  // Soft rim from the unlit side (volume edge, not a second hot spot)
  float rimOpp = pow(max(dot(n, normalize(-lightDir + viewDir * 0.35)), 0.0), 1.65);
  vec3 rimTint = mix(vec3(0.72, 0.86, 1.0), uFresnelColor, 0.4);
  vec3 softRim = rimTint * rimOpp * max(opposite, 0.35) * 0.85;

  vec3 color = refracted * (vec3(uAmbientStrength) * shade + diffuse) + spec + specTight + specBloom;
  color += softRim;
  // Deeper shade on the opposite side
  color *= mix(1.0, 0.66, opposite * 0.65);
  color -= vec3(0.05, 0.07, 0.12) * opposite * 0.55;

  float fresnel = pow(1.0 - max(dot(viewDir, n), 0.0), uColorFresnelPower);
  float rimMix = mix(1.28, 0.92, smoothstep(0.0, max(uNoiseAmplitude * 2.5, 0.001), vDisplacement));
  color += rimTint * fresnel * rimMix * 0.82;
  // Thin luminous rim (Convex edge ring)
  color += vec3(0.96, 0.98, 1.0) * pow(fresnel, 4.2) * 0.55;
  color += vec3(0.85, 0.92, 1.0) * pow(fresnel, 2.2) * 0.22;
  // Soft inner glow so body reads as volume not outline
  color += glassBody * (1.0 - fresnel) * 0.14;
  color = clamp(color, 0.0, 1.4);

  if (vContentMix > 0.5) {
    vec2 contentUv = vUv * 0.82 + 0.09;
    vec3 content = texture2D(tContent, contentUv).rgb;
    color = mix(color, content, 0.14 * (1.0 - fresnel * 0.7));
  }

  float facing = max(dot(viewDir, n), 0.0);
  float alpha = (vAlpha * (0.55 + facing * 0.55) + fresnel * 0.34 + ndoth * 0.14) * uAlphaBoost;
  alpha = clamp(alpha, 0.16, 0.74);

  gl_FragColor = vec4(color, alpha);
}
`;
