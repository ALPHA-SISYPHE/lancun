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
| 第一节看板 1–3：SST / 热应力 / 白化 | `ocean.html` §3.1 卡 1–3 | Coral Watch `…/stations/southeast_florida/current`（Vercel 经 `/api/ocean/coral`；本地需 `npm run dev:apis` :8788 + `serve` :8080） | 已锁定，见 `OCEAN_PAGE.md` 附录 A.1 |
| 第一节看板 4–6：潮位 / 水温 / 风压 | `ocean.html` §3.1 卡 4–6 | NOAA datagetter，站 `8518750` | 已锁定，见 `OCEAN_PAGE.md` 附录 A.1 |
| 第二节：碳汇 / 热量 / 氧气 / 蓝碳 + CO₂ 趋势 | `ocean.html` §3.2 | IPCC / NOAA / UNEP；折线 NOAA GCB 摘要 | 已锁定，见附录 A.2；数据在 `mock-data.js` |
| 第三节：五大洋面积 / 深度 / 生态亮点 | `ocean.html` §3.3 每洋小看板 | NOAA / FAO / IUCN / NSIDC 等 | 已锁定，见附录 A.3；数据在 `mock-data.js` |
| 海洋保护区总览 | **非第一节 MVP**；后续扩展 | Protected Planet API（需 Key） | 已登记，暂不接入第一节 |
| 海洋塑料污染规模 | `rescue.html` §3.1 卡 1–2 | UNEP《From Pollution to Solution》 | 已锁定，见 `RESCUE_PAGE.md` A.1 |
| 海洋垃圾塑料占比 / 来源 | `rescue.html` 卡 3 + 饼/柱图 | Ocean Conservancy ICC | 已锁定，见 A.2 |
| 海水酸化 / 珊瑚白化 | `rescue.html` 卡 4–5 + 科普 | NOAA；IPCC AR6 | 已锁定，见 A.1 |
| 中国近岸优良水质 | `rescue.html` §3.1 次级指标 | 生态环境部 2023 海洋公报 | 已锁定，见 A.1 |
| 海洋塑料污染指数趋势 | `rescue.html` §3.1 折线 | UNEP / ICC 综合估算（占位） | v1.3；2019–2023 待核对 |
| 动态监测 A | `rescue.html` §3.2 | NOAA datagetter `8574680`, `product=water_level`, `date=today` | 已锁定，见 `RESCUE_PAGE.md` B.2 |
| 动态监测 B | `rescue.html` §3.2 | NOAA datagetter `9414290`, `product=air_pressure` | 已锁定 |
| 动态监测 C | `rescue.html` §3.2 | NOAA datagetter `8726520`, `product=water_temperature` | 已锁定 |
| 动态监测 D | `rescue.html` §3.2 | OpenAQ v3 经 `/api/rescue/openaq`；Vercel `OPENAQ_API_KEY` | 已锁定 |
| 污染源四类科普 + 4 行表格 | `rescue.html` §3.3 | ICC / 生态环境部 / NOAA / IPCC；文案占位见 `mock-data.js` → `rescuePollutionPanels` | 已锁定 UI（附录 E）；文案占位非永久锁定 |
| 历年变化趋势 | 折线图（rescue 页） | 海洋塑料污染指数 5 年点（2019–2023 占位） | v1.3，见 RESCUE A.3 |
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
| 小海龟自定义光标 SVG | 全站桌面端 DOM 跟随光标（6 正式页） | **项目原创 v3.1**；俯视海绿 2D 卡通；无五官；固定左上 45°；2.25rem；`assets/media/cursor/turtle.svg` + `turtle-cursor.js` | 使用中 |
| 图标 | 导航与功能 | 待选择 | 待收集 |
| 环境音/海洋视频 | 全站背景海浪循环音 | Mixkit（见下表） | 已收集 |

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

## 全站背景海浪音（当前使用）

| 字段 | 内容 |
|---|---|
| 用途 | 全站循环背景环境音；个人中心「显示与播放 → 背景海浪音」可关闭 |
| 原始素材 | Mixkit — Sea waves loop（SFX #1196） |
| 页面链接 | https://mixkit.co/free-sound-effects/sea/ |
| 运行文件 | `assets/media/ocean-ambient.mp3`（约 1.5 MB，48 s 循环） |
| 授权 | Mixkit License（免费用于视频/音频项目） |
| 实现 | `assets/js/ambient-audio.js`；偏好字段 `backgroundAudio`（`lancun.prefs` / `ocean-user-preferences`） |
| 获取日期 | 2026-07-23 |

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

## 地球纹理（首页 Three.js 3D 地球 · globe v2）

| 字段 | 内容 |
|---|---|
| 状态 | **2026-07-20 恢复**（globe v2 从头重做） |
| 用途 | 首页 `#ocean-explore` WebGL 地球与云层 |
| 描述 | 等距圆柱投影地球影像 + 云层透明贴图 |
| 本地文件 | `assets/media/globe/earth.jpg`、`assets/media/globe/earth-clouds.png` |
| 来源 | Three.js 官方示例纹理（与 mrdoob/three.js examples 同源） |
| 页面链接 | https://threejs.org/examples/#webgl_geometry_earth |
| 直接 URL（备份） | `earth_atmos_2048.jpg`、`earth_clouds_1024.png`（threejs.org/examples/textures/planets/） |
| 许可 | 随 Three.js 示例分发，课程项目注明出处；可替换为 NASA Visible Earth 等自有授权素材 |
| 获取日期 | 2026-07-17（初）；2026-07-20（v2 重新入库） |

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
- **2026-07-22 扩充：** 档案库已扩展至 100 条物种；除上表 12 张早期 Pexels 图外，其余 `{id}.jpg` 由 [`scripts/fetch-species-images.mjs`](../scripts/fetch-species-images.mjs) 从 **Wikimedia Commons** 批量下载（旗舰种优先学名匹配，演示种按类别/后缀匹配相近物种摄影）。逐条出处、作者、许可见 [`data/species-image-sources.json`](../data/species-image-sources.json)。许可以 **CC BY-SA / Public Domain** 为主；页面展示为课程演示用途。

## 登录/注册弹窗 · 品牌面板海洋摄影

| 本地文件 | 用途 | 来源 | 使用位置 |
|---|---|---|---|
| `assets/media/account/auth-brand-ocean.jpg` | 守护者账户弹窗左侧背景 | Unsplash — Shifaaz sulaiman, [aerial ocean](https://unsplash.com/photos/aerial-photography-of-body-of-water-1505142468610) | `assets/css/base.css` `.auth-modal__brand` |

- 授权：Unsplash License — 免费使用，需保留摄影师与 Unsplash 出处。
- 实现：深色渐变遮罩 + `background-size: cover`，保证文案可读。
- 获取日期：2026-07-23
- 备注：替换原 `ocean/pacific.jpg` 引用，选用更明亮蓝色俯拍海洋摄影。

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

## 呼救页 §3.2 监测地图底图（NASA Blue Marble）

| 本地文件 | 主题 | 来源 | 使用位置 |
|---|---|---|---|
| `world-satellite.jpg` | 全球卫星等距圆柱底图 | NASA Blue Marble 2002（MODIS 真彩色，公有领域） | `pages/rescue.html` §3.2 左侧监测地图 SVG `<image>` |

- 原始素材：Wikimedia Commons [Blue Marble 2002](https://commons.wikimedia.org/wiki/File:Blue_Marble_2002.jpg)（5400×2700）或 NASA Earth Observatory [1 km 真彩色全球影像](https://science.nasa.gov/earth/earth-observatory/the-blue-marble-true-color-global-imagery-at-1km-resolution/)
- 本地优化：宽 2560px（2:1）、JPEG q≈85，目标 1–3 MB
- 获取日期：2026-07-20
- 本地路径：`assets/media/rescue/world-satellite.jpg`

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

## 第三方库（首页 · 现行）

| 库 | 版本 | 许可 | 用途 |
|---|---|---|---|
| GSAP | 3.12.5 | Standard (free) | 滚动 / 动效 |
| ScrollTrigger | 3.12.5 | Standard (free) | GSAP 插件 |
| Three.js | r170 (0.170.0) | MIT | `#ocean-explore` WebGL 地球 |
| OrbitControls / CSS2DRenderer | r170 examples/jsm | MIT | 地球交互与五大洋标记 |
| 文件位置 | `assets/js/vendor/` | 见 `assets/js/vendor/README.md` | GSAP + Three.js 本地化 |

## Globe 模块（globe v2 · 2026-07-20）

| 字段 | 内容 |
|---|---|
| 入口 | `assets/js/globe/index.js` |
| 模块 | `earth.js`、`markers.js`、`controls.js`、`utils/latlon.js`、`utils/textures.js` |
| 全局 API | `window.LANCUN_homeGlobe.applyMotion()`、`window.LANCUN_globeInitState` |
| 数据 | `LANCUN_DATA.fiveOceans`（`assets/js/mock-data.js`） |
| 标记跳转 | `pages/ocean.html?ocean={id}#five-oceans` |

## 第三方库（首页 3D 地球 · 历史气泡管线，未接入 v2）

| 库 | 版本 | 许可 | 用途 |
|---|---|---|---|
| EffectComposer / RenderPass / ShaderPass / FXAAShader | three@0.170 examples | MIT | 历史 vendor；气泡/后处理未接入 globe v2 |
| 状态 | 2026-07-20 | — | 文件仍可能在 vendor；globe v2 未引用 |

## 大陆架占位遮罩（Phase A · 已推倒）

| 字段 | 内容 |
|---|---|
| 状态 | **已推倒**：`assets/media/globe/` 已删除 |
| 用途 | ~~`#ocean-explore` 大陆架分布 shader overlay~~ |
| 本地文件 | ~~`assets/media/globe/shelves-mask.png`~~ |
| 获取日期 | 2026-07-18 |

## Globe 模块（Phase A · 已推倒）

| 模块 | 路径 | 说明 |
|---|---|---|
| 状态 | 2026-07-20 v2 | 入口 `assets/js/globe/index.js`；见上节「Globe 模块（globe v2）」 |
| 历史入口 | ~~`ocean-bubbles.js` / 旧 `home-globe.js`~~ | v1 已推倒 |

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
| Coral Watch API | 不需要 | 看板 1–3：SST、热应力、白化相关 | 站 `southeast_florida`；浏览器无 CORS；Vercel `/api/ocean/coral`；本地 `server/dev-apis.mjs` :8788 |

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
| A 切萨皮克湾 | 潮位 | NOAA datagetter，站 `8574680`, `product=water_level`, `datum=MLLW` |
| B 旧金山湾 | 气压 | NOAA datagetter，站 `9414290`, `product=air_pressure` |
| C 墨西哥湾近岸 | 水温 | NOAA datagetter，站 `8726520`, `product=water_temperature` |
| D 洛杉矶沿海 | PM2.5 | OpenAQ v3 经 `/api/rescue/openaq`；Key 存 Vercel 环境变量 |

### §3.3 污染源科普（附录 C/E 摘要）

| 类 | id | 侧栏标题 | 文案来源 |
|----|-----|----------|----------|
| 1 | plastic | 塑料垃圾污染 | `rescuePollutionPanels[]` 占位（E.5） |
| 2 | nutrient | 营养盐污水污染 | 同上 |
| 3 | fishery-shipping | 渔业航运污染 | 同上 |
| 4 | acidification | 气候酸化危害 | 同上 |

表格 4 行 × 4 列；UI 细则见 `RESCUE_PAGE.md` 附录 E。

---

## 本地模拟账户（课程 demo）

| Key | 用途 | 实现 |
|-----|------|------|
| `ocean-auth-users` | 注册用户列表（含明文 password，**仅演示**） | [`assets/js/utils/authStorage.js`](../assets/js/utils/authStorage.js) |
| `ocean-auth-current-user` | 当前登录用户快照（不含 password） | 同上 |
| `lancun.account` / `lancun.session` | 行动中心登录 gating 兼容桥接 | `authStorage.js` 内 `syncLegacyAuthBridge` |

说明：密码明文存于 `localStorage` 仅为 Web 编程期末大作业前端演示，不适用于真实生产环境。
