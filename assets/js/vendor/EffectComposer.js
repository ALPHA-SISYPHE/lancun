import {
  Clock,
  HalfFloatType,
  NoBlending,
  Vector2,
  WebGLRenderTarget,
} from './three.module.min.js';
import { CopyShader } from './CopyShader.js';
import { ShaderPass } from './ShaderPass.js';

class EffectComposer {
  constructor(renderer, renderTarget) {
    this.renderer = renderer;
    this._pixelRatio = renderer.getPixelRatio();

    if (renderTarget === undefined) {
      const size = renderer.getSize(new Vector2());
      this._width = size.width;
      this._height = size.height;
      renderTarget = new WebGLRenderTarget(this._width * this._pixelRatio, this._height * this._pixelRatio, {
        type: HalfFloatType,
      });
      renderTarget.texture.name = 'EffectComposer.rt1';
    } else {
      this._width = renderTarget.width;
      this._height = renderTarget.height;
    }

    this.renderTarget1 = renderTarget;
    this.renderTarget2 = renderTarget.clone();
    this.renderTarget2.texture.name = 'EffectComposer.rt2';
    this.writeBuffer = this.renderTarget1;
    this.readBuffer = this.renderTarget2;
    this.renderToScreen = true;
    this.passes = [];
    this.copyPass = new ShaderPass(CopyShader);
    this.copyPass.material.blending = NoBlending;
    this.clock = new Clock();
  }

  swapBuffers() {
    const tmp = this.readBuffer;
    this.readBuffer = this.writeBuffer;
    this.writeBuffer = tmp;
  }

  addPass(pass) {
    this.passes.push(pass);
    pass.setSize(this._width * this._pixelRatio, this._height * this._pixelRatio);
  }

  isLastEnabledPass(passIndex) {
    for (let i = passIndex + 1; i < this.passes.length; i += 1) {
      if (this.passes[i].enabled) return false;
    }
    return true;
  }

  render(deltaTime) {
    const dt = deltaTime === undefined ? this.clock.getDelta() : deltaTime;
    const currentRenderTarget = this.renderer.getRenderTarget();

    for (let i = 0, il = this.passes.length; i < il; i += 1) {
      const pass = this.passes[i];
      if (pass.enabled === false) continue;
      pass.renderToScreen = this.renderToScreen && this.isLastEnabledPass(i);
      pass.render(this.renderer, this.writeBuffer, this.readBuffer, dt, false);
      if (pass.needsSwap) this.swapBuffers();
    }

    this.renderer.setRenderTarget(currentRenderTarget);
  }

  setSize(width, height) {
    this._width = width;
    this._height = height;
    const effectiveWidth = this._width * this._pixelRatio;
    const effectiveHeight = this._height * this._pixelRatio;
    this.renderTarget1.setSize(effectiveWidth, effectiveHeight);
    this.renderTarget2.setSize(effectiveWidth, effectiveHeight);
    for (let i = 0; i < this.passes.length; i += 1) {
      this.passes[i].setSize(effectiveWidth, effectiveHeight);
    }
  }

  setPixelRatio(pixelRatio) {
    this._pixelRatio = pixelRatio;
    this.setSize(this._width, this._height);
  }

  dispose() {
    this.renderTarget1.dispose();
    this.renderTarget2.dispose();
    this.copyPass.dispose();
  }
}

export { EffectComposer };
