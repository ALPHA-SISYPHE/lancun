# 数据与素材来源

## 文档状态

- 版本：0.8
- 状态：待收集与验证（「我们的海洋」见 `OCEAN_PAGE.md` v1.3 附录 A；「海在呼救」见 `RESCUE_PAGE.md` v1.2 附录 A/B/E）

## 来源记录原则

每条正式数据至少记录：

- 数据名称。
- 数值和单位。
- 覆盖年份或发布日期。
- 发布机构或作者。
- 原始页面链接。
- 获取日期。
- 网站中使用的位置。
- 是否经过换算或简化。

如果使用程序实时抓取数据，还需记录请求地址、抓取时间、字段映射、异常处理和本地降级数据。实时抓取属于增强项，不得成为最终作品唯一的数据来源。

每张正式图片至少记录：

- 文件名。
- 作者或机构。
- 原始链接。
- 授权或使用条件。
- 网站中使用的位置。

## 数据清单

| 数据主题 | 计划用途 | 来源 | 状态 |
|---|---|---|---|
| 海洋之美或生态基础数据 | 首页核心数据 | 待验证 | 待收集 |
| 第一节看板 1–3：SST / 热应力 / 白化 | `ocean.html` §3.1 卡 1–3 | Coral Watch `…/stations/southeast_florida/current` | 已锁定，见 `OCEAN_PAGE.md` 附录 A.1 |
| 第一节看板 4–6：潮位 / 水温 / 风压 | `ocean.html` §3.1 卡 4–6 | NOAA datagetter，站 `8518750` | 已锁定，见 `OCEAN_PAGE.md` 附录 A.1 |
| 第二节：碳汇 / 热量 / 氧气 / 蓝碳 + CO₂ 趋势 | `ocean.html` §3.2 | IPCC / NOAA / UNEP；折线 NOAA GCB 摘要 | 已锁定，见附录 A.2；数据在 `mock-data.js` |
| 第三节：五大洋面积 / 深度 / 生态亮点 | `ocean.html` §3.3 每洋小看板 | NOAA / FAO / IUCN / NSIDC 等 | 已锁定，见附录 A.3；数据在 `mock-data.js` |
| 海洋保护区总览 | **非第一节 MVP**；后续扩展 | Protected Planet API（需 Key） | 已登记，暂不接入第一节 |
| 海洋塑料污染规模 | `rescue.html` §3.1 卡 1–2 | UNEP《From Pollution to Solution》 | 已锁定，见 `RESCUE_PAGE.md` A.1 |
| 海洋垃圾塑料占比 / 来源 | `rescue.html` 卡 3 + 饼/柱图 | Ocean Conservancy ICC | 已锁定，见 A.2 |
| 海水酸化 / 珊瑚白化 | `rescue.html` 卡 4–5 + 科普 | NOAA；IPCC AR6 | 已锁定，见 A.1 |
| 中国近岸优良水质 | `rescue.html` 卡 6 + 折线（默认） | 生态环境部 2023 海洋公报 | 已锁定；折线 2019–2022 待核对 |
| 动态监测 A | `rescue.html` §3.2 | NOAA datagetter `8574680`, `product=dissolved_oxygen` | 已锁定，见 `RESCUE_PAGE.md` B.2 v1.1 |
| 动态监测 B | `rescue.html` §3.2 | NOAA datagetter `9414290`, `product=ph` | 已锁定 |
| 动态监测 C | `rescue.html` §3.2 | NOAA datagetter `8726520`, `product=salinity` | 已锁定 |
| 动态监测 D | `rescue.html` §3.2 | OpenAQ API v3，洛杉矶沿海 PM2.5 | 已锁定 |
| 污染源四类科普 + 4 行表格 | `rescue.html` §3.3 | ICC / 生态环境部 / NOAA / IPCC；文案占位见 `mock-data.js` → `rescuePollutionPanels` | 已锁定 UI（附录 E）；文案占位非永久锁定 |
| 历年变化趋势 | 折线图（rescue 页） | 中国近岸优良水质 5 年点（2019–2023） | 已锁定，见 RESCUE A.3 |
| 受影响物种 | 生物档案 | 待验证 | 待收集 |
| 个人减塑行动 | 行动建议 | 待验证 | 待收集 |

## 素材清单

| 素材类型 | 计划用途 | 来源 | 状态 |
|---|---|---|---|
| 海洋主视觉 | 首页 Hero poster | Pexels（见下表） | 临时使用中 |
| 海洋主视觉视频 | 首页 Hero（0.6 倍速静音循环） | 用户提供的本地视频 | 使用中 |
| 全站深色海纹底图 | body 固定背景 | Pexels（见下表） | 本地 `assets/media/ocean-bg.jpg` 可选 |
| 污染对比图片 | 科普页 | 待选择 | 待收集 |
| 海洋生物图片 | 档案页 | 待选择 | 待收集 |
| 图标 | 导航与功能 | 待选择 | 待收集 |
| 环境音/海洋视频 | 首页氛围或科普 | 待选择 | 待收集 |

## 临时 Hero 素材（可替换）

| 字段 | 内容 |
|---|---|
| 用途 | 首页 `.hero-poster` / video poster |
| 描述 | 水面天光、平静海洋摄影 |
| 来源 | Pexels — 免费使用，需保留出处 |
| 页面链接 | https://www.pexels.com/photo/aerial-view-of-ocean-waves-1001682/ |
| 直接 URL（实现用） | `https://images.pexels.com/photos/1001682/pexels-photo-1001682.jpeg?auto=compress&cs=tinysrgb&w=1920` |
| 替换方式 | 将自有文件放入 `assets/media/hero-poster.jpg` 与 `assets/media/hero.mp4`，并在 `hero.js` 中优先本地路径 |
| 替换方式 | 将自有文件放入 `assets/media/hero-poster.jpg` 与 `assets/media/hero.mp4`，并在 `hero.js` 中优先本地路径 |
| 获取日期 | 2026-07-17 |

## 首页背景视频（当前使用）

| 字段 | 内容 |
|---|---|
| 用途 | 首页 Hero 背景视频，静音、循环、0.6 倍速播放 |
| 原始文件 | `references/video/workspace/15558437_3840_2160_30fps.mp4` |
| 运行文件 | `assets/media/hero.mp4` |
| 来源 | 用户提供，2026-07-17 |

## 首页蓝调日出装饰图

| 字段 | 内容 |
|---|---|
| 用途 | 首页 Hero poster（无视频时的默认视觉） |
| 本地文件 | `assets/media/hero-sunrise-v1.png` |
| 来源 | 本对话中由 OpenAI 图像生成工具生成，2026-07-17 |
| 使用说明 | 仅作为课程网站装饰主视觉；不作为真实海洋纪录照片、科学数据或新闻证据使用。 |

## 首页水下主视觉图（当前使用）

| 字段 | 内容 |
|---|---|
| 用途 | 首页 Hero 主视觉（海龟、鱼群、海面光束） |
| 本地文件 | `assets/media/hero-underwater-v2.png` |
| 来源 | 本对话中由 OpenAI 图像生成工具生成，2026-07-17 |
| 使用说明 | 仅作为课程网站装饰主视觉；不作为真实海洋纪录照片、科学数据或新闻证据使用。 |

## 地球纹理（首页 Three.js 3D 地球）

| 字段 | 内容 |
|---|---|
| 用途 | 首页 `#ocean-explore` WebGL 地球与云层 |
| 描述 | 等距圆柱投影地球影像 + 云层透明贴图 |
| 本地文件 | `assets/media/earth.jpg`、`assets/media/earth-clouds.png` |
| 来源 | Three.js 官方示例纹理（与 mrdoob/three.js examples 同源） |
| 页面链接 | https://threejs.org/examples/#webgl_geometry_earth |
| 直接 URL（备份） | `earth_atmos_2048.jpg`、`earth_clouds_1024.png`（threejs.org/examples/textures/planets/） |
| 许可 | 随 Three.js 示例分发，课程项目注明出处；可替换为 NASA Visible Earth 等自有授权素材 |
| 获取日期 | 2026-07-17 |

## 全站海纹背景（v2.0）

| 字段 | 内容 |
|---|---|
| 用途 | 全站 `body` 固定背景（渐变遮罩之上） |
| 描述 | 深色海浪/深水摄影 |
| 本地文件 | `assets/media/ocean-bg.jpg`（可选；缺失时仅 CSS 渐变） |
| 建议来源 | Pexels — 免费使用，需保留出处 |
| 页面链接 | https://www.pexels.com/photo/photo-of-ocean-892824/ |
| 直接 URL（自行下载入库） | `https://images.pexels.com/photos/892824/pexels-photo-892824.jpeg?auto=compress&cs=tinysrgb&w=1920` |
| 获取日期 | 2026-07-17 |

## 澜存自定海洋蓝色板（v4.0 / 根目录 DESIGN.md）

项目 UI 主色来源；完整规范见根目录 **`DESIGN.md`**，CSS mirror 见 `docs/DESIGN_SYSTEM.md` v4。

| 分组 | 颜色名称 | HEX | 用途摘要 |
|---|---|---|---|
| 主色 | 清透远洋蓝 | #3B82F6 | 主按钮、品牌 |
| 主色 | 悬停 | #60A5FA | hover |
| 浅雾 | 薄雾浅蓝 → 深海雾蓝 | #F0F9FF → #E0F2FE | 岛内浅底、标签 |
| 深底 | 渐变 | #0F172A → #1E3A8A | 全站默认深底 |
| 点缀 | 荧光海浅青 | #5EEAD4 | 仅小面积高亮 |

v2.3 光池/caustics 已废弃，不再作为装饰规范。

## 第三方库（首页 3D 地球）

| 库 | 版本 | 许可 | 用途 |
|---|---|---|---|
| Three.js | r170 (npm) | MIT | WebGL 球体、光照、CSS2D 标记、RenderTarget 气泡折射 |
| GSAP | 3.12.5 | Standard (free) | 大陆架 `uOffset` 切换动画（1.2s） |
| ScrollTrigger | 3.12.5 | Standard (free) | GSAP 插件；Phase A 注册备用，Phase B+ 滚动驱动 |
| EffectComposer / RenderPass / ShaderPass / FXAAShader | three@0.170 examples | MIT | 本地 vendor；Phase B 后处理（暗角 + 轻 grain + FXAA） |
| 文件位置 | `assets/js/vendor/` | 见 `assets/js/vendor/README.md` | 首页 `#ocean-explore` 模块化 globe |

## 大陆架占位遮罩（Phase A）

| 字段 | 内容 |
|---|---|
| 用途 | `#ocean-explore` 大陆架分布 shader overlay（`uMask` / `uOffset`） |
| 本地文件 | `assets/media/globe/shelves-mask.png` |
| 当前实现 | Phase B：程序化海岸线架带占位（`scripts/generate-shelves-mask.mjs` + `textures.js` 同算法回退） |
| 替换说明 | 待 bathymetry / Natural Earth 数据验证后可换真实 equirectangular 遮罩 |
| 获取日期 | 2026-07-18 |

## Globe 模块（Phase A）

| 模块 | 路径 | 说明 |
|---|---|---|
| 入口 | `assets/js/globe/index.js` | 替换 `home-globe.js`；暴露 `window.LANCUN_homeGlobe` |
| 场景 | `GlobeScene.js` | IntersectionObserver rAF、ResizeObserver、DPR cap、WebGL 降级 |
| 地球 | `earth.js` | HemisphereLight、ACESFilmic exposure 1.25、emissive、云层/大气 |
| 大陆架 | `shelves.js` | GSAP `uOffset` 0↔1 |
| 气泡 | `bubbles.js` + `shaders/` | 双 pass：earth RT + InstancedMesh 折射 |
| 标记 | `markers.js` | CSS2DRenderer + 五大洋 modal |
| 后处理 | `composer.js` | Phase B：TextureInput → Vignette → Grain → FXAA；移动/低 tier 直出 |
| 地球贴图 | `assets/media/earth.jpg` | 本地优先；远程 fallback three.js examples |
| 地球法线 | `assets/media/earth-normal.jpg`（可选） | 本地 → three.js `earth_normal_2048.jpg` → 程序化噪声 |
| 环境反射 | `earth.js` PMREM | Canvas 海洋渐变 equirect → PMREM envMap（无 HDR 依赖） |
| 备份 | `assets/js/home-globe.js` | 未加载；仅作 Phase A 前参考 |

## 设计参考记录

| 参考对象 | 借鉴内容 | 不借鉴内容 | 链接 |
|---|---|---|---|
| Convex Seascape Survey | 首页深海地球区布局、气泡氛围、左文右球交互结构 | 品牌、文案、WebGL 实现与资产 | https://convexseascapesurvey.com/ |
| 华东师范大学官网首页 | 顶部导航、全屏主视觉视频、居中主题文字的层级关系 | 学校品牌、文案、彩色菜单、图形资产 | https://www.ecnu.edu.cn/ |

## 禁止事项

- 不使用无法追溯来源的统计数字。
- 不把不同年份、地区或统计口径的数据直接拼接比较。
- 不用 AI 生成图冒充真实纪录照片或数据证据。
- 不删除图片水印后使用。
- 自动播放音视频必须考虑浏览器限制、默认静音、用户控制和版权来源。
- AI 生成图片可以作为视觉方向稿或装饰素材，但不得伪装成真实环境纪录证据。

## 「我们的海洋」公开接口策略（摘要）

权威细则见 [`OCEAN_PAGE.md`](OCEAN_PAGE.md) v1.3。第一节须满足：前端 `fetch`、失败降级本地 mock、密钥不入库、污染类数据不进入本页。第二、三节使用 `mock-data.js` 静态统计并展示来源链接。

### A.2 静态统计来源（摘要）

| 指标 | 数值量级 | 参考来源 |
|------|----------|----------|
| 海洋吸收人为 CO₂ | ~26% | [IPCC AR6](https://www.ipcc.ch/)；NOAA Ocean & Climate |
| 海洋储存多余热量 | ~90% | NOAA；IPCC 气候报告摘要 |
| 浮游植物氧气贡献 | ~50%（估算） | NOAA Ocean Facts；页面须标注估算口径 |
| 蓝碳年固碳 | ~0.8–1 Gt CO₂/年 | UNEP；Blue Carbon Initiative |
| CO₂ 吸收趋势折线 | 1990–2023 摘要点 | NOAA Global Carbon Budget |

### A.3 五大洋小看板来源（摘要）

| 大洋 | 字段 | 参考来源 |
|------|------|----------|
| 太平洋 | 46% / 4280 m / 600+ 珊瑚种 | NOAA；CTI-CFF 珊瑚三角区资料 |
| 大西洋 | 23% / 3646 m / ~500 头露脊鲸 | NOAA Fisheries；IUCN |
| 印度洋 | 20% / 3963 m / 20% 红树林 | FAO 红树林评估 |
| 南大洋 | 20% / 4000 m / 3.79 亿吨磷虾 | CCAMLR；文献常用估算 |
| 北冰洋 | 4% / 1205 m / 400–500 万 km² 夏季海冰 | NSIDC |

| 接口 | 密钥 | 第一节用途 | 备注 |
|---|---|---|---|
| Protected Planet API v4 | 需要 | **非第一节 MVP** | 后续扩展；非商业用途声明 |
| NOAA CO-OPS Data API | 通常不需要 | 看板 4–6：潮位、水温、风/气压 | 站 `8518750`；官方文档称支持 CORS |
| Coral Watch API | 不需要 | 看板 1–3：SST、热应力、白化相关 | 站 `southeast_florida`；禁止伪造修复面积为实时字段 |

## 「海在呼救」数据策略（摘要）

权威细则见 [`RESCUE_PAGE.md`](RESCUE_PAGE.md) v1.2。上半区与第三节使用 `mock-data.js` 静态统计；§3.3 文案存于 `rescuePollutionPanels[]`（**占位，非永久锁定**，见附录 E.5 / C.4）；下半区 4 监测点须 `fetch` + `rescueLiveMock` 降级；本页禁止个人 localStorage 统计；§3.2 live 与 `OCEAN_PAGE.md` 附录 A.1 去重（见 RESCUE §4.0）。

### 静态指标来源（附录 A 摘要）

| 指标 | 数值量级 | 参考来源 |
|------|----------|----------|
| 年入海洋塑料 | ~800 万吨/年 | [UNEP 海洋塑料评估](https://www.unep.org/resources/report/from-pollution-solution-global-assessment-marine-litter-and-plastic-pollution) |
| 垃圾中塑料占比 | >85% | [Ocean Conservancy ICC](https://oceanconservancy.org/trash-free-seas/international-coastal-cleanup/) |
| 一次性塑料来源 | ~60% | ICC 年度报告 |
| 海水酸化 | ~+30% | [NOAA Ocean Acidification](https://oceanservice.noaa.gov/facts/ocean-acidification.html) |
| 珊瑚严重白化 | ~50% | [IPCC AR6 WGII](https://www.ipcc.ch/report/ar6/wg2/) |
| 中国近岸优良水质 | 81.9%（2023） | [生态环境部 2023 海洋公报](https://www.mee.gov.cn/hjzl/sthjzk/hysthjzk/202405/t20240529_1036230.shtml) |

### 动态监测点（附录 B 摘要）

| 点 | 指标 | API |
|----|------|-----|
| A 切萨皮克湾 | 溶解氧 DO | NOAA datagetter，站 `8574680`, `product=dissolved_oxygen` |
| B 旧金山湾 | pH | NOAA datagetter，站 `9414290`, `product=ph` |
| C 墨西哥湾近岸 | 盐度 | NOAA datagetter，站 `8726520`, `product=salinity` |
| D 洛杉矶沿海 | PM2.5 | OpenAQ API v3（lat/lon 或 location id） |

### §3.3 污染源科普（附录 C/E 摘要）

| 类 | id | 侧栏标题 | 文案来源 |
|----|-----|----------|----------|
| 1 | plastic | 塑料垃圾污染 | `rescuePollutionPanels[]` 占位（E.5） |
| 2 | nutrient | 营养盐污水污染 | 同上 |
| 3 | fishery-shipping | 渔业航运污染 | 同上 |
| 4 | acidification | 气候酸化危害 | 同上 |

表格 4 行 × 4 列；UI 细则见 `RESCUE_PAGE.md` 附录 E。
