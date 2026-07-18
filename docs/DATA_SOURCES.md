# 数据与素材来源

## 文档状态

- 版本：0.2
- 状态：待收集与验证

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
| 海洋塑料污染规模 | 污染现状 | 待验证 | 待收集 |
| 海洋垃圾组成 | 分类图表 | 待验证 | 待收集 |
| 历年变化趋势 | 折线图 | 待验证 | 待收集 |
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
| Three.js | r170 (npm) | MIT | WebGL 球体、光照、CSS2D 标记 |
| 文件位置 | `assets/js/vendor/` | 见 `assets/js/vendor/README.md` | 仅 `index.html` 探索区 |

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
