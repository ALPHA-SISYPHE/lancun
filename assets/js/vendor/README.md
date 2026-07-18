# JavaScript vendor（第三方库）

## Three.js r170

- 文件：`three.module.min.js`、`OrbitControls.js`、`CSS2DRenderer.js`
- 许可：MIT
- 用途：首页 `#ocean-explore` 3D 地球与球面标记
- 来源：https://github.com/mrdoob/three.js （jsDelivr npm three@0.170.0）
- **导入方式**：`OrbitControls.js` / `CSS2DRenderer.js` 使用相对路径 `from './three.module.min.js'`；globe 模块使用 `from '../vendor/three.module.min.js'`，**不依赖 import map**，以便 `file://` 双击打开首页时 ES module 可离线加载。

## Post-processing（three.js examples, r170）

- 文件：`EffectComposer.js`、`RenderPass.js`、`ShaderPass.js`、`Pass.js`、`CopyShader.js`
- 许可：MIT
- 用途：Phase B 后处理；Phase A 气泡 RT 管线架构预留
- 来源：https://github.com/mrdoob/three.js/tree/r170/examples/jsm/postprocessing

## GSAP 3.12.5

- 文件：`gsap.min.js`、`ScrollTrigger.min.js`
- 许可：Standard (free tier)
- 用途：大陆架分布 toggle 的 `uOffset` 动画
- 来源：https://gsap.com/ （jsDelivr npm gsap@3.12.5）

## 活跃入口

- **Globe 模块：** `assets/js/globe/index.js`（`index.html` 加载）
- **备份：** `assets/js/home-globe.js`（未加载）
