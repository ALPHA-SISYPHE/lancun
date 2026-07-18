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
uniform float uColorFresnelPower;
uniform vec3 uFresnelColor;
uniform vec3 uLightPos;
uniform vec3 uLightColor;

varying vec3 vNormal;
varying vec3 vViewDir;
varying vec2 vScreenUv;
varying vec2 vUv;
varying float vAlpha;
varying float vCenterToCamera;
varying float vContentMix;

vec3 specularHighlight(vec3 lightColor, float shininess) {
  vec3 lightDir = normalize(uLightPos);
  vec3 viewDir = normalize(vViewDir);
  vec3 halfDir = normalize(lightDir + viewDir);
  float spec = pow(max(dot(normalize(vNormal), halfDir), 0.0), shininess);
  return lightColor * spec * uSpecularStrength;
}

void main() {
  vec2 uv = gl_FragCoord.xy / uResolution;

  float camT = smoothstep(uCamDistMax, uCamDistMin, vCenterToCamera);
  float iorScale = mix(uIorNormalsMax, uIorNormalsMin, camT);

  vec3 n = normalize(vNormal);
  vec2 refractOffset = n.xy * iorScale + n.yz * (iorScale * 0.45);
  vec3 refracted = texture2D(tDiffuse, uv + refractOffset).rgb;
  refracted = mix(refracted, refracted * uIorBg, 0.15);

  vec3 viewDir = normalize(vViewDir);
  float fresnel = pow(1.0 - max(dot(viewDir, n), 0.0), uColorFresnelPower);
  vec3 tint = mix(vec3(0.72, 0.92, 1.0), uFresnelColor, 0.35);
  vec3 color = mix(refracted, tint, fresnel * 0.48);
  color += specularHighlight(uLightColor, uShininess);
  color += uFresnelColor * fresnel * 0.22;

  if (vContentMix > 0.5) {
    vec2 contentUv = vUv * 0.85 + 0.075;
    vec3 content = texture2D(tContent, contentUv).rgb;
    color = mix(color, content, 0.38 * (1.0 - fresnel * 0.6));
  }

  float alpha = vAlpha + fresnel * 0.42;
  gl_FragColor = vec4(color * uDiffuseStrength, clamp(alpha, 0.0, 0.85));
}
