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
  vec2 bendUvOuter = uv + n.xy * iorScale * 1.42 + n.yz * (iorScale * 0.28);
  vec4 bgCenter = texture2D(tDiffuse, bendUv);
  vec4 bgOuter = texture2D(tDiffuse, bendUvOuter);
  vec3 refracted = mix(bgCenter.rgb, bgOuter.rgb, 0.35);
  refracted = mix(refracted, refracted * uIorBg, 0.12);
  refracted = mix(uSectionBgColor, refracted, max(bgCenter.a, bgOuter.a));

  vec3 lighting = specularHighlight(uLightColor, uShininess);
  vec3 color = refracted * (vec3(uAmbientStrength) + lighting);

  float fresnel = pow(1.0 - max(dot(viewDir, n), 0.0), uColorFresnelPower);
  float rimMix = mix(1.35, 1.0, smoothstep(0.0, uNoiseAmplitude * 2.0, vDisplacement));
  vec3 rimTint = mix(vec3(0.78, 0.93, 1.0), uFresnelColor, 0.42);
  color += rimTint * fresnel * rimMix * 0.32;

  if (vContentMix > 0.5) {
    vec2 contentUv = vUv * 0.82 + 0.09;
    vec3 content = texture2D(tContent, contentUv).rgb;
    color = mix(color, content, 0.32 * (1.0 - fresnel * 0.72));
  }

  float specMask = lighting.g * 0.5 + 0.5;
  float alpha = vAlpha + fresnel * 0.28 + specMask * 0.05;
  alpha = clamp(alpha, 0.04, 0.42);

  gl_FragColor = vec4(color, alpha);
}
