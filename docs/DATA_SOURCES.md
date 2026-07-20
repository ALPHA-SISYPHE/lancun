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
| 污染对比图片 | 呼救页 §3.3 污染源侧栏 | Pexels（见下表） | 使用中 |
| 五大洋区块图片 | 海洋页 §3.3 五大洋左侧视觉 | Pexels（见下表） | 使用中 |
| 海洋生物图片 | 档案页物种卡片与详情弹窗 | Pexels（见下表） | 使用中 |
| 保护行动封面 | 行动页志愿项目与往期成果卡片 | Pexels（见下表） | 使用中 |
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

## 澜存导航海豚标志

| 字段 | 内容 |
|---|---|
| 用途 | 所有页面顶栏品牌图标 |
| 本地文件 | `assets/media/lancun-dolphin-logo.png` |
| 来源 | 本对话中由 OpenAI 图像生成工具生成后抠除黑色背景，2026-07-19 |
| 使用说明 | 纯白海豚与海浪扁平标志；透明 PNG，不作为外部品牌标志使用。 |

## `#ocean-explore` 背景视频（与 Hero 分离）

| 字段 | 内容 |
|---|---|
| 用途 | 首页 `#ocean-explore` 区块循环背景（静音、进视口播放）；**不**用于 Hero |
| 原始文件 | `Downloads/4611894-uhd_3840_2160_30fps.mp4`（用户提供） |
| 运行文件 | `assets/media/ocean-explore-bg.mp4`（原样拷贝，约 27.8MB，3840×2160） |
| 来源 | Pexels 视频 id `4611894`（需保留出处） |
| 页面链接 | https://www.pexels.com/video/4611894/ |
| 脚本 | `assets/js/ocean-explore-bg.js`（与 `hero.js` / `hero.mp4` 完全分离） |
| 获取日期 | 2026-07-19 |

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

## 生物档案页物种图片（Pexels）

| 本地文件 | 物种 | 摄影师 | Pexels 页面 | 使用位置 | 备注 |
|---|---|---|---|---|---|
| `chinese-white-dolphin.jpg` | 中华白海豚 | Daniel Torobekov | https://www.pexels.com/photo/dolphins-swimming-5679552/ | `pages/species.html` 卡片/弹窗 | 海洋海豚展示图 |
| `blue-whale.jpg` | 蓝鲸 | Arthouse Studio | https://www.pexels.com/photo/beautiful-large-whale-swimming-on-sea-surface-4338161/ | 同上 | 原图标注为座头鲸，作大型鲸类展示 |
| `sperm-whale.jpg` | 抹香鲸 | Gerard Whelan | https://www.pexels.com/photo/humpback-whale-tail-swimming-underwater-of-sea-4609907/ | 同上 | 原图标注为座头鲸，作大型鲸类展示 |
| `spotted-seal.jpg` | 斑海豹 | Chris Spain | https://www.pexels.com/photo/harbor-seal-28224568/ | 同上 | 原图为港海豹，作鳍足类展示 |
| `green-turtle.jpg` | 绿海龟 | David Willis | https://www.pexels.com/photo/turtle-swimming-underwater-4767915/ | 同上 | — |
| `hawksbill-turtle.jpg` | 玳瑁 | Zack Gilbert | https://www.pexels.com/photo/hawksbill-sea-turtle-swimming-in-caribbean-waters-36132584/ | 同上 | — |
| `leatherback-turtle.jpg` | 棱皮龟 | Marcus Lange | https://www.pexels.com/photo/close-up-of-a-leatherback-sea-turtle-on-sandy-beach-35686479/ | 同上 | — |
| `staghorn-coral.jpg` | 鹿角珊瑚 | Francesco Ungaro | https://www.pexels.com/photo/view-of-coral-reef-underwater-17984373/ | 同上 | 热带珊瑚礁展示图 |
| `brain-coral.jpg` | 脑珊瑚 | Jonathan Borba | https://www.pexels.com/photo/close-up-of-vibrant-coral-reef-in-bahia-36367642/ | 同上 | 礁区纹理展示图 |
| `red-coral.jpg` | 红珊瑚 | Rachel Claire | https://www.pexels.com/photo/a-close-up-shot-of-a-coral-underwater-6123091/ | 同上 | 原图为橙色珊瑚，作红珊瑚色系展示 |
| `chinese-sturgeon.jpg` | 中华鲟 | Parviz Hajizada | https://www.pexels.com/photo/close-up-of-a-sturgeon-swimming-underwater-29452932/ | 同上 | 鲟科鱼类展示图 |
| `large-yellow-croaker.jpg` | 大黄鱼 | Magda Ehlers | https://www.pexels.com/photo/close-up-of-fish-in-underwater-ocean-scene-32693336/ | 同上 | 条纹海水鱼，作近海鱼类展示 |

- 授权：Pexels License — 免费使用，需保留摄影师与 Pexels 出处。
- 获取日期：2026-07-19
- 本地路径：`assets/media/species/`（宽 1600px 压缩 JPEG）

## 呼救页污染源侧栏图（Pexels）

| 本地文件 | 主题 | 摄影师 | Pexels 页面 | 使用位置 |
|---|---|---|---|---|
| `pollution-plastic.jpg` | 塑料垃圾污染 | 志愿者海岸清洁 | https://www.pexels.com/photo/people-collecting-plastic-trash-on-a-sandy-beach-9034660/ | `pages/rescue.html` §3.3 侧栏 tab |
| `pollution-nutrient.jpg` | 营养盐污水污染 | Elina Volkova | https://www.pexels.com/photo/polluted-river-in-summer-scenery-16558792/ | 同上 |
| `pollution-fishery-shipping.jpg` | 渔业航运污染 | Pok Rie | https://www.pexels.com/photo/aerial-view-of-fishing-boat-with-large-net-at-sea-37290258/ | 同上 |
| `pollution-acidification.jpg` | 气候酸化危害 | Oscar Trisley | https://www.pexels.com/photo/bleached-coral-reefs-at-byron-bay-australia-33496012/ | 同上 |

- 授权：Pexels License — 免费使用，需保留摄影师与 Pexels 出处。
- 获取日期：2026-07-19
- 本地路径：`assets/media/rescue/`（宽 1600px 压缩 JPEG）

## 五大洋区块图（Pexels）

| 本地文件 | 大洋 | 摄影师 | Pexels 页面 | 使用位置 |
|---|---|---|---|---|
| `pacific.jpg` | 太平洋 | Josh Withers | https://www.pexels.com/photo/top-view-of-clear-turquoise-water-16598750/ | `pages/ocean.html` §3.3 左侧视觉 |
| `atlantic.jpg` | 大西洋 | ArtHouse Studio | https://www.pexels.com/photo/humpback-whale-tail-above-surface-of-sea-4347287/ | 同上 |
| `indian.jpg` | 印度洋 | J Kainth | https://www.pexels.com/photo/breathtaking-aerial-view-of-seychelles-coastline-29420016/ | 同上 |
| `southern.jpg` | 南大洋 | Nacho Canepa | https://www.pexels.com/photo/a-penguin-diving-over-the-sea-4637339/ | 同上 |
| `arctic.jpg` | 北冰洋 | Francesco Ungaro | https://www.pexels.com/photo/majestic-arctic-iceberg-landscape-at-sea-30429917/ | 同上 |

- 授权：Pexels License — 免费使用，需保留摄影师与 Pexels 出处。
- 获取日期：2026-07-19
- 本地路径：`assets/media/ocean/`（宽 1600px 压缩 JPEG）
- 备注：大西洋原图为座头鲸，作大型鲸类展示；太平洋为夏威夷珊瑚礁俯拍；印度洋为塞舌尔海岸线浅海航拍。

## 保护行动中心 · 志愿项目封面（Pexels）

| 本地文件 | 项目 | 摄影师 | Pexels 页面 | 使用位置 |
|---|---|---|---|---|
| `volunteer-coast-clean.jpg` | 海岸垃圾清洁行动 | 志愿者海滩清洁 | https://www.pexels.com/photo/people-collecting-plastic-trash-on-a-sandy-beach-9034660/ | `pages/action.html` §3.2 志愿卡封面 |
| `volunteer-mangrove.jpg` | 红树林种植志愿活动 | one second before sunset | https://www.pexels.com/photo/scenic-mangrove-trees-at-low-tide-in-indonesia-31996018/ | 同上 |
| `volunteer-school-outreach.jpg` | 海洋科普进校园志愿 | Thang Nguyen | https://www.pexels.com/photo/teacher-engaging-with-students-in-classroom-setting-36859101/ | 同上 |
| `volunteer-coral-monitor.jpg` | 珊瑚礁监测辅助项目 | Mido Makasardi | https://www.pexels.com/photo/scuba-diver-exploring-coral-reef-underwater-35159455/ | 同上 |

- 授权：Pexels License — 免费使用，需保留摄影师与 Pexels 出处。
- 获取日期：2026-07-20
- 本地路径：`assets/media/action/`
- 备注：进校园为通用课堂科普展示图，非专门海洋课程实拍。

## 保护行动中心 · 往期成果封面（Pexels）

| 本地文件 | 项目 | 摄影师 | Pexels 页面 | 使用位置 |
|---|---|---|---|---|
| `past-xisha-coral.jpg` | 西沙珊瑚礁修复计划 | Francesco Ungaro | https://www.pexels.com/photo/view-of-coral-reef-underwater-17984373/ | `pages/action.html` §3.3 往期成果卡封面 |
| `past-bohai-clean.jpg` | 渤海湾海岸线清洁 | Karola G | https://www.pexels.com/photo/plastic-waste-on-beach-sand-4996765/ | 同上 |
| `past-guangxi-mangrove.jpg` | 广西红树林种植行动 | Sachin Shettigar | https://www.pexels.com/photo/dense-mangrove-forest-in-honnavar-india-36584782/ | 同上 |
| `past-dolphin-watch.jpg` | 中华白海豚观测保护 | Daniel Torobekov | https://www.pexels.com/photo/dolphins-swimming-5679552/ | 同上 |

- 授权：Pexels License — 免费使用，需保留摄影师与 Pexels 出处。
- 获取日期：2026-07-20
- 本地路径：`assets/media/action/`
- 备注：红树林为印度红树林生态展示图；白海豚为海洋海豚通用展示图。

## 生物档案页 · AI 物种识别（ECNU ecnu-plus）

| 项目 | 说明 |
|---|---|
| 服务 | [华东师范大学开发者平台 · 大模型能力](https://developer.ecnu.edu.cn/vitepress/llm/model.html) |
| Base URL | `https://chat.ecnu.edu.cn/open/api/v1` |
| 模型 | `ecnu-plus`（多模态图片理解；结构化 JSON 输出） |
| 本地代理 | `server/ecnu-proxy.mjs`（密钥仅存 `.env`，禁止入库） |
| 前端页面 | `pages/species.html` §3.3 识别器 |
| 识别范围 | 优先匹配 `speciesArchive` 12 种；档案外显示「未收录」 |
| 额度显示 | 本地 `.quota-usage.json` 统计 credits / 次数；精确余额见平台令牌管理 |
| 失败降级 | API 或代理不可用时 fallback 前端 mock，UI 标注「演示模式」 |
| 接入日期 | 2026-07-20 |

**本地演示步骤：**

1. 复制 `.env.example` 为 `.env` 并填入 `ECNU_API_KEY`
2. 终端 A：`npm run api`
3. 终端 B：`npm run serve` → 打开 `http://localhost:5500/pages/species.html`

完整架构与作业说明见 [`docs/SPECIES_AI_LOCAL.md`](SPECIES_AI_LOCAL.md)。

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
