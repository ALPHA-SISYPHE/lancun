# 正式媒体资源

将自有素材按下列命名放入此目录（优先于临时在线摄影）：

- `hero-poster.jpg` — 首页 Hero 静帧（建议 1920×1080，水面天光）
- `hero.mp4` — 首页背景视频（静音循环，H.264）
- `ocean-bg.jpg` — 全站深色海纹底（1920 级；缺失时用 CSS 渐变）
- `earth.jpg` — 首页 3D 地球表面纹理（等距圆柱，2048 级；当前为 Three.js 示例同源文件）
- `earth-clouds.png` — 首页地球云层透明贴图（1024 级）
- `rescue/world-satellite.jpg` — 呼救页 §3.2 监测地图卫星底图（2560×1280 等距圆柱，NASA Blue Marble 2002）
- `ocean/pacific.jpg` — 登录/注册弹窗左侧品牌面板背景（与五大洋摄影同源）
- `account/auth-brand-ocean.jpg` — 守护者账户弹窗左侧品牌背景（Unsplash 蓝色海洋俯拍，见 `DATA_SOURCES.md`）
- `species/{id}.jpg` — 生物档案 100 条物种卡片/详情配图（由 `scripts/fetch-species-images.mjs` 从 Wikimedia Commons 下载；出处见 `data/species-image-sources.json`）

来源与授权请同步写入 `docs/DATA_SOURCES.md`。
