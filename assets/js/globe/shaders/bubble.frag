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
