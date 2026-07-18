# JavaScript vendor（第三方库）

## Three.js r170

- 文件：`three.module.min.js`、`OrbitControls.js`、`CSS2DRenderer.js`
- 许可：MIT
- 用途：仅首页 `#ocean-explore` 3D 地球与球面标记
- 来源：https://github.com/mrdoob/three.js （jsDelivr npm three@0.170.0）
- **导入方式**：`OrbitControls.js` / `CSS2DRenderer.js` 使用相对路径 `from './three.module.min.js'`；`home-globe.js` 使用 `from './vendor/three.module.min.js'`，**不依赖 import map**，以便 `file://` 双击打开首页时 ES module 可离线加载。
