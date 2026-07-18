import * as THREE from '../vendor/three.module.min.js';
import { EffectComposer } from '../vendor/EffectComposer.js';
import { ShaderPass } from '../vendor/ShaderPass.js';
import { CopyShader } from '../vendor/CopyShader.js';
import { FXAAShader } from '../vendor/FXAAShader.js';
import { Pass, FullScreenQuad } from '../vendor/Pass.js';

const VignetteShader = {
  name: 'VignetteShader',
  uniforms: {
    tDiffuse: { value: null },
    uStrength: { value: 0.38 },
    uSoftness: { value: 0.55 },
  },
  vertexShader: CopyShader.vertexShader,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform float uStrength;
    uniform float uSoftness;
    varying vec2 vUv;

    void main() {
      vec4 color = texture2D(tDiffuse, vUv);
      vec2 centered = vUv - 0.5;
      float dist = length(centered);
      float vignette = smoothstep(uSoftness, 0.95, dist);
      color.rgb *= 1.0 - vignette * uStrength;
      gl_FragColor = color;
    }`,
};

const FilmGrainShader = {
  name: 'FilmGrainShader',
  uniforms: {
    tDiffuse: { value: null },
    uTime: { value: 0 },
    uAmount: { value: 0.035 },
  },
  vertexShader: CopyShader.vertexShader,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform float uTime;
    uniform float uAmount;
    varying vec2 vUv;

    float hash(vec2 p) {
      return fract(sin(dot(p, vec2(127.1, 311.7)) + uTime) * 43758.5453);
    }

    void main() {
      vec4 color = texture2D(tDiffuse, vUv);
      float grain = hash(vUv * vec2(1920.0, 1080.0)) - 0.5;
      color.rgb += grain * uAmount;
      gl_FragColor = color;
    }`,
};

class TextureInputPass extends Pass {
  constructor() {
    super();
    this.needsSwap = false;
    this.texture = null;
    this.material = new THREE.ShaderMaterial({
      uniforms: THREE.UniformsUtils.clone(CopyShader.uniforms),
      vertexShader: CopyShader.vertexShader,
      fragmentShader: CopyShader.fragmentShader,
      depthWrite: false,
      depthTest: false,
    });
    this.fsQuad = new FullScreenQuad(this.material);
  }

  render(renderer, _writeBuffer, readBuffer) {
    this.material.uniforms.tDiffuse.value = this.texture;
    renderer.setRenderTarget(readBuffer);
    renderer.clear();
    this.fsQuad.render(renderer);
  }

  dispose() {
    this.material.dispose();
    this.fsQuad.dispose();
  }
}

/**
 * Desktop: vignette + grain + FXAA. Mobile / low-tier: direct render (no post FX).
 */
export function detectGlobePostFxTier() {
  const narrow = window.matchMedia('(max-width: 58rem)').matches;
  const coarse = window.matchMedia('(pointer: coarse)').matches;
  const lowMemory = typeof navigator.deviceMemory === 'number' && navigator.deviceMemory <= 4;
  const lowCores = typeof navigator.hardwareConcurrency === 'number' && navigator.hardwareConcurrency <= 4;

  if (narrow || coarse || lowMemory || lowCores) return 'lite';
  return 'full';
}

/**
 * @param {THREE.WebGLRenderer} renderer
 * @param {{ tier?: 'full' | 'lite' }} [options]
 */
export function createGlobeComposer(renderer, options = {}) {
  const tier = options.tier ?? detectGlobePostFxTier();

  if (tier === 'lite' || !renderer) {
    return {
      enabled: false,
      tier,
      inputPass: null,
      composer: null,
      grainPass: null,
      fxaaPass: null,
      setInputTexture() {},
      render() {},
      setSize() {},
      dispose() {},
    };
  }

  const composer = new EffectComposer(renderer);
  const inputPass = new TextureInputPass();
  const vignettePass = new ShaderPass(VignetteShader);
  const grainPass = new ShaderPass(FilmGrainShader);
  const fxaaPass = new ShaderPass(FXAAShader);

  composer.addPass(inputPass);
  composer.addPass(vignettePass);
  composer.addPass(grainPass);
  composer.addPass(fxaaPass);

  return {
    enabled: true,
    tier,
    inputPass,
    composer,
    grainPass,
    fxaaPass,
    setInputTexture(texture) {
      inputPass.texture = texture;
    },
    render(deltaTime) {
      if (grainPass?.uniforms?.uTime) {
        grainPass.uniforms.uTime.value = performance.now() * 0.001;
      }
      composer.render(deltaTime);
    },
    setSize(width, height) {
      composer.setSize(width, height);
      const dpr = renderer.getPixelRatio();
      if (fxaaPass?.uniforms?.resolution) {
        fxaaPass.uniforms.resolution.value.set(1 / (width * dpr), 1 / (height * dpr));
      }
    },
    setPixelRatio(pixelRatio) {
      composer.setPixelRatio(pixelRatio);
    },
    dispose() {
      inputPass.dispose();
      composer.passes.forEach((pass) => pass.dispose?.());
      composer.dispose();
    },
  };
}
