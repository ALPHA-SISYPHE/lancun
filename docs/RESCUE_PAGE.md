# 「海在呼救」页面宪法

## 文档状态

- 版本：1.9
- 状态：讨论中（**v2.0 Phase 3 工作台**：左压力 + 右地图 + 底 Tab 图表；筛选 / dialog / 刷新）
- 最近更新：2026-07-21
- 适用范围：[`pages/rescue.html`](../pages/rescue.html) 及其脚本、样式、本页数据源
- 数据参考清单：[`references/stastics_ref/rescue_sta.md`](../references/stastics_ref/rescue_sta.md)
- 视觉精修规则：[`RESCUE_OBSERVATORY_RULES.md`](RESCUE_OBSERVATORY_RULES.md) v1.0（气质 / Token / 排版 / 禁止项 / 分阶段执行）
- 冲突优先级：用户当前对话明确要求 → `AGENTS.md` → [`RESCUE_OBSERVATORY_RULES.md`](RESCUE_OBSERVATORY_RULES.md)（气质 / 紧凑 / 禁止 / 分阶段）→ **本文档**（功能 / API / 数据）→ `PAGE_STRUCTURE.md` → 其他专项文档

本文档是「海在呼救」板块的**功能与数据宪法**（信息架构、API 去重、mock schema、附录）。视觉气质、Token、排版压缩与分阶段精修以 [`RESCUE_OBSERVATORY_RULES.md`](RESCUE_OBSERVATORY_RULES.md) 为准。未写入本文或仍标「待确认」的内容，不得当作最终决定去实现。

---

## 0. 用户需求摘要

| 需求 | 你的决定 |
|------|----------|
| 页面身份 | **Ocean Pollution Observatory**（海洋污染观察与行动中心） |
| 背景 | **必须保留** `pages-bg.mp4`；内容用半透明壳，section 间隙让视频透出 |
| 禁止 | 浅灰后台 Dashboard；全宽实色盖视频；照搬 ocean 深蓝报告节奏；独立大表格；过重玻璃 |
| 结构 | **Phase 1 紧凑 IA（v1.9）**：Compact Hero + Command Deck（压力+监测双栏）→ Source Workspace → Action CTA + Footer |
| 污染源 | 5 类；左滚动卡 / 中图 / 右 Source·Impact·Solution·Personal Action |
| 气质 | 监测、污染压力、溯源、行动；与 ocean「宏观平静认知」同品牌不同版式 |

---

## 1. 页面定位

- 主题线：压力观察 → 实时监测窗口 → 污染源档案 → 行动 CTA。
- 视觉层级：`page-bg-video` → 深海 overlay → 透明 section → 半透明壳。
- Live 互斥与 API：见 §4 / 附录 B（不变）。
- 技术：经典 `defer` 脚本链，兼容 `file://`。
- Nav「海在呼救」；Hero 眉标 `02 / 海在呼吸`。

---

## 2. 视觉系统（v1.8 基线；精修以 OBSERVATORY_RULES 为准）

> **分工：** Token、透明度、间距压缩、禁止项与分阶段执行 → [`RESCUE_OBSERVATORY_RULES.md`](RESCUE_OBSERVATORY_RULES.md) §3–§7。本节保留 v1.8 实现基线；后续精修按 OBSERVATORY_RULES 对齐（如 section 间距 72–96px、Hero 560–640px、`--deep-soft: 0.68` 等）。

| 项 | 决定 |
|----|------|
| 视频 | 保留；shade 约 `rgba(3,18,34,0.36→0.82)` |
| Section | 默认透明；padding 约 96–120px 呼吸带（精修目标 72–96px，见 OBSERVATORY_RULES §7） |
| 深壳 | Overview `0.66` / Monitor `0.72` / Source `0.64` + blur 8–10px |
| 浅壳 | Hero / 站点 / 指标条 `rgba(234,245,247,0.58~0.72)` |
| 站点面板 | **禁止** `overflow: auto` 内部丑滚动条 |
| 禁止 | 全宽实色盖视频；浅灰后台；独立表格 |

---

## 3. 信息架构

> **Phase 1 紧凑化（v1.9，2026-07-21）：** 五段独立高 section 合并为四段。Overview + Live Monitor 并入 **`#command-deck`（Pollution Command Deck）**；Hero 增加状态摘要 ribbon；锚点主链 `#command-deck` / `#source-solution` / `#action-cta`；保留 `#pressure-overview` / `#live-monitor` 兼容锚点。API 与 mock 契约未变。

### 3.0 Compact Hero（Phase 2 观察入口）
- 视频透出；右半透明 Pressure Panel（`rgba(234,245,247,0.58)` + blur）；四行状态行
- 底部 **status ribbon** 5 项：Pressure / Active Stations / Critical Sources / Last Update / Data Mode；深半透明、`margin-top: -36px` 桥接 Command Deck
- Hero 锚点（平滑滚动）：`#pollution-command` / `#live-monitoring` / `#source-solution` / `#action-brief`
- 兼容锚点：`#action-cta`（Footer 内隐藏）、`#pressure-overview` / `#live-monitor`

### 3.1 Pollution Command Deck（Phase 3 工作台）
- **单 section** `#pollution-command.pollution-command-section`：header / `command-layout` / `command-bottom` 三行
- **左栏** `.pressure-summary-panel`（360px）：`data-rescue-pressure-axis` 指数 + 判断句；`data-rescue-risk-matrix` 6 项 **2×3 紧凑矩阵**（无大 card）
- **右栏** `#live-monitoring.live-monitor-stage`：顶部 **状态筛选** `data-rescue-status-filter`（All / Normal / Warning / Critical）；`.monitor-window` 地图 + station-panel + metric-strip
- **底栏** `.command-bottom`：图表 **Tab**（趋势 / 构成 / 数据来源）单面板 ~150–180px；`data-rescue-data-sources-open` 打开完整来源 `<dialog>`
- **刷新**：`data-rescue-deck-refresh` 调用 `refreshLiveWatch()` 并更新 `data-rescue-deck-refreshed-at`（不改 Hero ribbon）
- 兼容锚点：`#command-deck` / `#pressure-overview` / `#live-monitor`（section 内隐藏 span）

### 3.2 Source Solution Workspace（Phase 4 工作台）
- **三栏** `240px | 0.95fr | minmax(320px, 0.9fr)`；shell 紧凑高度 **420–480px**（桌面约 `460px`）；`max-width: 1180px`
- **左栏** `data-rescue-source-rail`：4 类污染源；缩略图 + 名称 + Critical/Warning + 短描述；卡片均分高度与 shell 对齐
- **中栏** `data-rescue-source-visual`：统一比例图片（`max-height: 320px`）+ 底部渐变标题；不溢出右栏
- **右栏** `data-rescue-source-detail`：标题 + 核心判断 + **Source / Impact 各 2 条 bullet**；Solution / Personal Action **仅在 drawer**
- **导航** `data-rescue-source-nav` 上一项/下一项；键盘 Arrow 切换
- **行动闭环**：「查看行动建议」平滑滚动至 `#action-brief`；「查看完整档案」打开 `data-rescue-source-drawer`（含完整 Solution / Personal）
- **禁止**独立大 `<table>`；表格信息已融合进块结构

### 3.3 Action Brief（Phase 5）
- **`#action-brief.action-brief`**：Source 与 Footer 之间的轻量横带；四步行动建议 + 三按钮（行动中心 / 海洋之美）
- Hero 锚点 `#action-brief` 指向本 section

### 3.4 Footer 继续探索（Phase 5）
- **`#rescue-footer`**：三链 — 加入保护行动 / 回到海洋之美 / 探索海洋生命（`species.html`）
- 底部 **查看数据来源** → 统一 `DataSourcesModal`（`data-rescue-data-sources-open`）
- 箭头 hover 轻微位移；保持视频透出

### 3.5 页面状态与刷新（Phase 5）
- **`LANCUN_RESCUE.pageState`**：`selectedStation` / `selectedSource` / `selectedChartTab` / `selectedRiskFilter` / `lastUpdatedAt` / `isSourceModalOpen` / `isDataSourcesOpen`
- Command Deck **刷新观测**：500ms loading + 更新 `lastUpdatedAt`（不改 Hero ribbon Last Update）

### 3.6 DataSourcesModal（Phase 5）
- 统一 `<dialog data-rescue-data-sources-dialog>`；内容来自 `rescueDataSourcesCatalog`（含图片来源说明）
- 入口：Hero 公开数据 / Command Deck / Source 详情 / Footer

---

## 4. 数据源策略（强制）

### 4.1 静态数据（§3.1 + §3.3）

| 字段 | 内容 |
|------|------|
| 清单 | [`references/stastics_ref/rescue_sta.md`](../references/stastics_ref/rescue_sta.md) 第一节 + 中国公报条目 |
| 实现 | 写入 [`mock-data.js`](../assets/js/mock-data.js)：`rescueStaticMetrics`、`rescueCharts`、`rescuePressureIndex`、`rescuePollutionPanels[]`（5 类，含 sources/impact/governance/personalAction） |
| 登记 | 所有数字与链接写入 [`DATA_SOURCES.md`](DATA_SOURCES.md) |
| 口径 | 页面须标注来源、年份/估算说明；禁止与 ocean 页正面指标混用同一卡片 |

### 4.0 与「我们的海洋」页去重边界

[`docs/OCEAN_PAGE.md`](OCEAN_PAGE.md) 附录 A.1 已占用以下 live 组合；**本页 §3.2 禁止复用**：

| Ocean 已锁定 | API | 站/参数 | 本页处理 |
|--------------|-----|---------|----------|
| 卡 1–3 珊瑚观测 | Coral Watch | `southeast_florida` — SST、DHW、白化 | **不采用** Coral Watch 任意站 |
| 卡 4 潮位 | NOAA datagetter | `8518750`, `product=water_level` | **不采用** 同站 + 潮位类 product |
| 卡 5 水温 | NOAA datagetter | `8518750`, `product=water_temperature` | **不采用** 同站 + 水温 |
| 卡 6 风与气压 | NOAA datagetter | `8518750`, `product=air_pressure` / `wind` | **不采用** 同站 + 风压类 product |

v1.0 草案中监测点 A–D（纽约水温、切萨皮克潮位、佛罗里达 DHW、大堡礁 CRW）因上表冲突**已废弃**。

**允许**：同族 NOAA datagetter，但须换 **站号 + product**（水质/污染压力向：溶解氧、pH、盐度等）。静态区引用 IPCC/NOAA 酸化、白化比例**不冲突**（ocean 页禁止污染类静态指标）。

### 4.2 动态 API 可行性排序（去重后取前 4）

依据 `rescue_sta.md` 第二节与本仓库技术约束（纯前端 `fetch`、无默认后端代理）；**先排除 §4.0 占用项**，再按可实现性取前 4。完整锁定见附录 B。

| 排名 | 数据源 | 可实现性 | 本轮 | 备注 |
|------|--------|----------|------|------|
| 1 | NOAA CO-OPS datagetter | 免密钥、JSON；`product=water_level` | **采用**（监测点 A：潮位） | 站 `8574680`；`date=today` + `datum=MLLW` |
| 2 | NOAA CO-OPS datagetter | 同 API，`product=air_pressure` | **采用**（监测点 B：气压） | 站 `9414290` |
| 3 | NOAA CO-OPS datagetter | 同 API，`product=water_temperature` | **采用**（监测点 C：水温） | 站 `8726520` |
| 4 | OpenAQ API v3 | 需 API Key；经同源代理 | **采用**（监测点 D：沿海 PM2.5） | `/api/rescue/openaq`；Vercel 环境变量 `OPENAQ_API_KEY` |
| — | NOAA datagetter 水温/潮位 @8518750 | 高 | **不采用** | ocean 页已占用 |
| — | Coral Watch `southeast_florida` | 高 | **不采用** | ocean 页已占用 |
| — | NOAA Coral Reef Watch 白化 | 中高 | **不采用** | 与 ocean 珊瑚 live 叙事重复 |
| 5 | EMODnet | 欧区、作业相关性低 | 不采用 | 备选 mock 参考 |
| 6 | 国家海洋预报中心 / CNEMC | 无稳定免跨域 REST | 不采用 | 静态或后续模拟，不纳入 §3.2 live |

### 4.3 NOAA CO-OPS 监测（监测点 A、B、C）

| 字段 | 内容 |
|------|------|
| 文档 | https://api.tidesandcurrents.noaa.gov/api/prod |
| 端点 | `https://api.tidesandcurrents.noaa.gov/api/prod/datagetter` |
| 密钥 | 免密钥 |
| CORS | 官方说明支持浏览器跨域；若环境失败则走降级 |
| 监测点 A | `…&date=today&station=8574680&product=water_level&datum=MLLW&units=metric&time_zone=gmt&format=json` |
| 监测点 B | `…&date=today&station=9414290&product=air_pressure&units=metric&time_zone=gmt&format=json` |
| 监测点 C | `…&date=today&station=8726520&product=water_temperature&units=metric&time_zone=gmt&format=json` |
| 核验说明 | `dissolved_oxygen` / `ph` **非** datagetter 合法 product（2026-07-22 实测）；已改用上表可通组合 |

### 4.4 OpenAQ API（监测点 D）

| 字段 | 内容 |
|------|------|
| 文档 | https://docs.openaq.org/ |
| 用途 | 洛杉矶沿海代表站 **PM2.5** 最新观测（陆海污染间接压力） |
| 密钥 | **需要** OpenAQ v3 API Key（免费注册）；存 Vercel `OPENAQ_API_KEY`，**不入库** |
| 代理 | 浏览器请求 `/api/rescue/openaq?lat=…&lon=…`（Vercel Serverless 转发 v3） |
| 降级 | 无 Key 或上游失败 → `rescueLiveMock` + 演示提示；A/B/C NOAA 仍可实时 |

### 4.5 不采用的 live 源（去重说明）

| 数据源 | 不采用原因 |
|--------|------------|
| Coral Watch API | ocean 页 §3.1 已锁定 `southeast_florida`（SST/DHW/白化） |
| NOAA datagetter @8518750 | ocean 页已锁定潮位、水温、风压 |
| NOAA Coral Reef Watch | 与 ocean 珊瑚/白化 live 叙事重复；白化统计保留在 §3.1 静态卡 |

### 4.6 技术强制条款

1. NOAA 监测点 A/B/C 仍用纯前端 `fetch` 直连 datagetter（`date=today`）。
2. **例外（2026-07-22）**：OpenAQ v3 仅允许 Vercel Serverless 代理 `/api/rescue/openaq`；Key 存环境变量，不入库。
3. 失败（网络、CORS、超时、非 JSON、当日无数据、无 OpenAQ Key）必须按监测点降级 `rescueLiveMock`，并显示「暂无实时数据」与 mock 时间戳。
4. 实时接口 **不得** 成为演示唯一数据来源；断网须完整可演示。
5. API Key 不得入库（含 `.gitignore` 忽略 `.env`）。
6. 所有正式数字登记到 [`DATA_SOURCES.md`](DATA_SOURCES.md)。
7. §3.2 四监测点 **不得** 与 [`OCEAN_PAGE.md`](OCEAN_PAGE.md) 附录 A.1 出现相同 API + 站号 + product 组合（本页使用 `8574680`/`9414290`/`8726520`，与 ocean `8518750` 不同）。

---

## 5. 与现状代码的关系

当前 [`pages/rescue.html`](../pages/rescue.html) 已按 **v1.9 Phase 1 Compact Observatory** 实现：

- 全页 `has-page-bg-video` + 本页 shade
- Compact Hero：`pressure-panel` + 底部 status ribbon
- **Command Deck**：左压力矩阵/图表 + 右 monitor-window（合并原 Overview + Monitor）
- Source Workspace：滚动卡 + 图 + `<details>` 折叠四块档案
- Footer：三链 CTA（含 DATA_SOURCES）
- 脚本：`constants.js` → overview / live / source → `rescue-dashboard.js`
- 结构 smoke：`node scripts/verify-rescue-compact.mjs`

样式见 [`assets/css/rescue-page.css`](../assets/css/rescue-page.css)；数据见 [`mock-data.js`](../assets/js/mock-data.js)。


---

## 6. 验收要点（实现轮对照）

- [ ] 三节顺序与锚点 `rescue-static` / `rescue-live` / `rescue-solutions` 符合 §3。
- [ ] 无个人积分/行动次数出现在本页。
- [ ] 上半区 6 卡 + 饼/柱/折线均有来源链接与口径说明。
- [ ] 折线图主题与 §0 用户锁定一致（或仍显示「待确认」占位文案）。
- [ ] 下半区 4 监测点 + 地图 pin + 卡片联动；每点有 live 或 mock 降级路径。
- [ ] 第三节：左右分栏 25%/75%、4 侧栏卡 + 主面板联动、**4 行** `<table>` + 链到行动中心（附录 E）。
- [ ] §3.3 键盘可操作（侧栏 tab/按钮）、`aria-selected` / 焦点可见；`prefers-reduced-motion` 关闭 autoplay 与入场位移。
- [ ] §3.3 样式仅使用 `DESIGN.md` / `base.css` token；选中态用边框光效，**禁止**夸张 scale 弹跳。
- [ ] 桌面端与移动端无横向溢出；尊重 `prefers-reduced-motion`。
- [ ] 与 ocean 页无污染/正面指标混用违规。
- [ ] §3.2 四监测点与 `OCEAN_PAGE.md` 附录 A.1 无相同 API + 站号 + product 重叠。

---

## 7. 下一步

**文档轮（v1.2，本轮）**：§3.3 锁定左右分栏 4 类 UI（附录 E）；附录 C 改为四类；同步 `PAGE_STRUCTURE` / `DATA_SOURCES`。

**文档轮（v1.1，已完成）**：§3.2 动态 4 项与 OCEAN_PAGE 去重重选。

**实现轮（待用户确认开 Agent）**：

1. 扩展 `mock-data.js`（`rescueStaticMetrics`、`rescueCharts`、`rescueLiveMock`、`rescuePollutionPanels`）。
2. 重写 `rescue.html` 三节骨架（§3.3 按附录 E）。
3. 新增 `rescue-dashboard.js` / `rescue-pollution.js`（fetch + 侧栏切换 + 降级）。
4. 框架 CSS → 用户确认视觉 → 对照 §6 / 附录 E.8 验收。

---

## 附录 A — 静态指标与图表（上半区）

### A.1 六张 metric 卡（已锁定）

| # | 看板标题 | 参考数值 | 单位/口径 | 来源 | 状态 |
|---|----------|----------|-----------|------|------|
| 1 | 年入海洋塑料 | ~800 万 | 吨/年 | UNEP《From Pollution to Solution》 | 已锁定 |
| 2 | 累计塑料碎片 | >5 万亿片；>25 万 | 片；吨 | UNEP（同上） | 已锁定 |
| 3 | 垃圾中塑料占比 | >85 | % | Ocean Conservancy ICC | 已锁定 |
| 4 | 海水酸化上升 | ~+30 | %（自工业革命） | NOAA Ocean Acidification | 已锁定 |
| 5 | 珊瑚礁严重白化 | ~50 | % | IPCC AR6 WGII | 已锁定 |
| 6 | 中国近岸优良水质 | 81.9（2023） | %（一、二类） | 生态环境部 2023 海洋公报 | 已锁定 |

### A.2 饼图与柱状图（已锁定）

**饼图 — 海洋垃圾组成**

| 切片 | 数值 | 来源 |
|------|------|------|
| 塑料 | 85% | Ocean Conservancy ICC |
| 其它 | 15% | 同上（推算余量，页面须标注） |

**柱状图 — 塑料来源结构**

| 类别 | 参考占比 | 来源 |
|------|----------|------|
| 一次性日用品 | ~60% | Ocean Conservancy 年度报告 |
| 幽灵渔具 | ~10% | 同上 |
| 陆源与其它 | 余量（实现轮可拆 2–3 柱） | ICC + 科普归纳 |

### A.3 折线图（已锁定）

| 选项 | 说明 | 状态 |
|------|------|------|
| **A** | 中国近岸海域优良水质比例，近 **5 个年份**静态点（生态环境部公报系列） | **已锁定** |
| B | 全球海洋酸化相关指标趋势（NOAA / IPCC 摘要点） | 不采用 |

**已锁定序列（`mock-data.js` → `rescueCharts.line`；2019–2022 框架占位，须与公报核对）**：

| 年份 | 优良水质比例 % | 备注 |
|------|----------------|------|
| 2019 | 待公报核对 | 生态环境部 |
| 2020 | 待公报核对 | 同上 |
| 2021 | 待公报核对 | 同上 |
| 2022 | 待公报核对 | 同上 |
| 2023 | 81.9 | 已锁定 |

### A.4 文字科普要点（已锁定提纲）

1. **塑料**：年入海量、占比、来源结构；链接 UNEP / ICC。
2. **酸化**：海洋吸收 CO₂ 与 pH 变化；链接 NOAA。
3. **珊瑚与白化**：全球比例与热应力关联；链接 IPCC。
4. **中国近岸**：优良水质比例、无机氮/活性磷酸盐、赤潮规模（自然资源部灾害公报）；链接生态环境部 / 自然资源部。

---

## 附录 B — 动态监测点（4 项，已锁定）

### B.1 可行性排序（完整列表）

见 §4.2；本轮锁定排名第 1–4 项。

### B.2 监测点登记表

| ID | 中文标签 | 地图位置（lat, lon） | 指标 | API | 站号/参数 | 叙事 | 状态 |
|----|----------|----------------------|------|-----|-----------|------|------|
| A | 切萨皮克湾 | 39.27, -76.58 | 潮位 | NOAA datagetter | `8574680`, `product=water_level`, `datum=MLLW`, `date=today` | 海湾水位/径流压力 | 已锁定 |
| B | 旧金山湾 | 37.81, -122.47 | 气压 | NOAA datagetter | `9414290`, `product=air_pressure`, `date=today` | 近岸大气与风暴关联 | 已锁定 |
| C | 墨西哥湾近岸 | 27.76, -82.63 | 水温 | NOAA datagetter | `8726520`, `product=water_temperature`, `date=today` | 近岸热异常 | 已锁定 |
| D | 洛杉矶沿海 | 33.94, -118.40 | PM2.5 | OpenAQ API v3（经 `/api/rescue/openaq`） | lat/lon 近 LA，`parameters_id=2` | 沿海颗粒物 | 已锁定 |

### B.3 降级 mock 字段（实现轮）

`rescueLiveMock.points[]` 每项至少含：`id`, `label`, `lat`, `lon`, `value`, `unit`, `metric`（如 `water_level` / `air_pressure` / `water_temperature` / `pm25`）, `status`, `updatedAt`, `sourceUrl`, `isDemo: true`。

示例 mock 量级（实现轮写入 `mock-data.js`，须标注演示）：

| id | label | value | unit |
|----|-------|-------|------|
| A | 切萨皮克湾 | 0.72 | m |
| B | 旧金山湾 | 1013.5 | hPa |
| C | 墨西哥湾近岸 | 29.4 | °C |
| D | 洛杉矶沿海 | 18 | µg/m³ |

---

## 附录 C — 污染源分类科普与解决方案（第三节）

### C.1 四类结构（已锁定）

侧栏导航、主内容面板与下方表格 **统一 4 类**（v1.1 五类方案已废弃；油污与化学物并入 #3）。

| # | id | 侧栏/表格分类 | 宪法要点 | 数据引用 | 状态 |
|---|-----|---------------|----------|----------|------|
| 1 | `plastic` | 塑料垃圾污染 | 85% 垃圾占比、~800 万吨/年量级 | ICC / UNEP | 已锁定 |
| 2 | `nutrient` | 营养盐污水污染 | 无机氮、活性磷酸盐、年均赤潮 30~60 次 | 生态环境部公报 | 已锁定 |
| 3 | `fishery-shipping` | 渔业航运污染 | 幽灵渔具 ~10 万吨/年级 + 船舶油污 | ICC / 科普归纳 | 已锁定 |
| 4 | `acidification` | 气候酸化危害 | 酸化 +30%、珊瑚白化 ~50% | NOAA / IPCC | 已锁定 |

### C.2 表格要求（已锁定）

- 位于 `#rescue-solutions` 分栏模块**下方**，全宽玻璃容器内。
- 至少 1 张 **HTML `<table>`**，须含 `<caption>` 与来源说明。
- 列：**污染源 | 主要来源 | 生态影响 | 个人可行动作**。
- 行数：**4 行**，与 C.1 四类一一对应。
- 移动端：允许横向滚动或行卡堆叠，**禁止** viewport 横向溢出。

### C.3 行动链接（已锁定）

主面板底部 CTA（或模块统一 CTA）链至 [`pages/action.html`](../pages/action.html) 打卡/报名区块。

### C.4 文案数据状态（占位）

| 字段 | 说明 |
|------|------|
| 存储 | `mock-data.js` → `rescuePollutionPanels[]`（及可选 `rescuePollutionTable[]`） |
| 默认文案 | 见附录 **E.5** |
| 状态 | **占位 — 非永久锁定**；用户后续可修改文案与数字，修改后须同步 [`DATA_SOURCES.md`](DATA_SOURCES.md) |
| 结构字段 | `id`, `title`, `summary`, `dataHighlight`, `solutions[]`（4 条）, `navImage`, `sourceRefs[]` |

---

## 附录 E — §3.3 污染源科普 UI 开发规格

本节为 `#rescue-solutions` 的**正式 UI 基准**；实现须对齐根目录 [`DESIGN.md`](../DESIGN.md) 与 [`assets/css/base.css`](../assets/css/base.css)。

### E.1 整体布局与 DESIGN 映射

| 参数 | 值 | Token / 说明 |
|------|-----|--------------|
| 板块容器 | 宽 100%；`min-height: 90vh`；`position: relative` | 背景：`linear-gradient(180deg, var(--bg-abyss), var(--bg-sea-lit))` |
| 版心 | `max-width: var(--page-width)`；水平居中 | 75rem / 1200px |
| 水平留白 | `max(6vw, 32px)` | 对齐 DESIGN §3 |
| 分栏（桌面） | 左 **25%** / 右 **75%**；间距 **24px** | `gap: var(--space-3)` |
| 交互区高度 | 侧栏与主面板均为 **70vh** | 板块内垂直居中 |
| 层级 | 背景 < 玻璃卡片 < 文字 < 选中边框光效 | 禁止厚重阴影 |

**玻璃卡片（侧栏 / 主面板）：**

- 背景：`var(--glass-sea)`（≈ 10–15% 主色透明）
- 模糊：`backdrop-filter: blur(var(--glass-blur)) saturate(130%)`（20px）
- 边框：`1px solid var(--glass-border)`
- 侧栏圆角：`var(--radius)`（12px）；主面板圆角：`var(--radius-shell)`（16px）
- 主面板外发光：`var(--shadow-soft)` + 轻蓝 `rgba(59,130,246,0.12)` 外晕

### E.2 左侧竖向滚动导航栏

**容器 `nav[data-rescue-sidebar]`：**

| 参数 | 值 |
|------|-----|
| 高度 | 70vh |
| 溢出 | `overflow-y: auto`；`overscroll-behavior: contain` |
| 内边距 | 16px（`var(--space-2)`） |
| 卡片间距 | 16px |

**单卡 `button.rescue-pollution-nav-card`：**

| 参数 | 值 |
|------|-----|
| 尺寸 | 宽 100% × 高 **120px** |
| 圆角 | 8px |
| 背景 | 污染源实景图 + 底部渐变遮罩 `linear-gradient(to top, rgba(15,23,42,0.85), transparent 60%)` |
| 标题 | 左下角；`color: var(--on-dark)`；0.875rem / 600 |
| 默认 | `opacity: 0.72` |
| 悬浮 | `opacity: 0.88`；`transition: var(--duration-ui) var(--ease-ui)` |
| **选中** | `opacity: 1`；`outline: 2px solid var(--brand-hover)`；`box-shadow: 0 0 12px var(--glow-blue)` — **禁止 scale 1.02** |
| 焦点 | `:focus-visible` 同选中边框 |

**交互：**

- 点击切换 `activeIndex`；右侧主面板同步更新；`aria-selected` / `aria-controls`。
- 键盘：↑↓ 切换；Enter/Space 确认；触摸区 ≥ 44×44px。
- 可选：加载后每 6s 自动轮播；鼠标进入侧栏或主区暂停；`prefers-reduced-motion` 时 **关闭** autoplay。

**导航图占位路径（实现轮）：**

| id | navImage 占位 |
|----|---------------|
| plastic | `assets/media/rescue/nav-plastic.jpg` |
| nutrient | `assets/media/rescue/nav-nutrient.jpg` |
| fishery-shipping | `assets/media/rescue/nav-fishery.jpg` |
| acidification | `assets/media/rescue/nav-acidification.jpg` |

### E.3 右侧主内容区

**容器 `section[data-rescue-panel]`：**

| 参数 | 值 |
|------|-----|
| 高度 | 70vh |
| 内边距 | 32px（`var(--space-4)` 量级） |
| 溢出 | 内容超出时内部 `overflow-y: auto` |

**内容结构（自上而下）：**

| # | 区块 | 排版 | 颜色 |
|---|------|------|------|
| 1 | 分类标题 + 线性图标 | `display-md` 1.5rem / 600 | `var(--on-dark)` |
| 2 | 概述（一句话） | `body-md` | `var(--on-dark-muted)` |
| 3 | 核心数据 | 数字 `clamp(1.75rem, 4vw, 2rem)` | 数字 `var(--brand-hover)` |
| 4 | 分隔线 | 1px | `var(--hairline-dark)` |
| 5 | 解决方案 | 小标题 + **4 条**措施；每条 ✓ 图标 | 图标点缀 `var(--accent-sparkle)` 小面积 |
| 6 | CTA | secondary 按钮 | 「前往保护行动」→ `pages/action.html` |

**动效：**

| 动效 | 参数 | reduced-motion |
|------|------|----------------|
| 分类切换 | 内容 `opacity` 300ms | instant |
| 数字切换 | 简易计数滚动 300–500ms | 直接替换 |
| 入场 | 侧栏 `translateX(-16px→0)`；主区 `translateX(16px→0)` 300ms | 跳过位移 |

### E.4 响应式（<768px）

- 布局改 **上下堆叠**：侧栏在上（`overflow-x: auto` 横向滚动）；卡片固定 **160×100px**。
- 主面板在下；`min-height: 60vh`。
- **禁止**整页横向溢出。

### E.5 占位文案数据（非永久锁定）

以下为实现轮默认 copy，写入 `rescuePollutionPanels[]`；**用户可后续修改**，修改后同步 `DATA_SOURCES.md`。

#### 1. 塑料垃圾污染 (`plastic`)

- **概述**：最广泛的海洋视觉污染，威胁海洋生物生存  
- **数据**：每年约800万吨塑料流入海洋，海洋垃圾中塑料占比超85%  
- **方案**：减少一次性塑料使用 · 开展海岸清洁行动 · 推广可降解材料替代 · 建立海洋塑料回收体系  

#### 2. 营养盐污水污染 (`nutrient`)

- **概述**：陆源输入为主，引发近岸富营养化与赤潮  
- **数据**：我国近岸首要污染物为无机氮与活性磷酸盐，年均赤潮30~60次  
- **方案**：入海排污口提标改造 · 建设生态缓冲带 · 修复滨海湿地净化系统 · 推广测土配方施肥  

#### 3. 渔业航运污染 (`fishery-shipping`)

- **概述**：生产活动附带污染，幽灵渔具持续杀伤海洋生物  
- **数据**：全球每年超10万吨废弃渔具遗留海洋，持续捕捞海洋生物  
- **方案**：推行渔具回收计划 · 管控船舶油污排放 · 建设海洋保护区禁渔 · 推广环保船用燃料  

#### 4. 气候酸化危害 (`acidification`)

- **概述**：碳排放衍生的全域海洋生态危机  
- **数据**：工业革命以来海水酸度已上升约30%，近50%珊瑚礁出现白化退化  
- **方案**：修复红树林海草床蓝碳生态 · 人工繁育珊瑚礁 · 推动温室气体减排 · 建设海洋气候保护区  

### E.6 技术实现映射

| 概念 | 本项目实现 |
|------|------------|
| PollutionSidebar | `nav[data-rescue-sidebar]` + 4× `<button type="button">` |
| PollutionContent | `section[data-rescue-panel]` |
| activeIndex | ES6 模块内 `let activeIndex = 0` |
| 数据源 | `LANCUN_DATA.rescuePollutionPanels` |
| 样式 | `assets/css/rescue.css` — **仅** `:root` 已有变量 |
| 脚本 | `rescue-pollution.js` 或 `rescue-dashboard.js` 内 `initPollutionModule()` |

**禁止（DESIGN.md）：** 大面积 teal 主色、厚重阴影、夸张 spring/scale 弹跳、未定义色值与圆角。

### E.7 开发优先级

| 阶段 | 任务 |
|------|------|
| P0 | `#rescue-solutions` HTML 骨架：左右分栏 + 表格占位 |
| P1 | CSS 玻璃侧栏/主面板 + 768px 断点 |
| P2 | `mock-data.js` 注入 4 类占位文案 |
| P3 | 点击/键盘切换 + aria |
| P4 | 300ms 淡入、可选计数与入场动效 |
| P5 | 4 行 table + action CTA + 来源链接 |

### E.8 验收清单（§3.3 专项）

- [ ] 桌面左 25% / 右 75%，gap 24px，板块 min-height ≥ 90vh。  
- [ ] 侧栏 4 卡与 C.1 id 一致；默认展示第 1 类。  
- [ ] 选中态：边框光效 + 亮度提升，无 scale 弹跳。  
- [ ] 切换 300ms；reduced-motion 无 autoplay/位移入场。  
- [ ] 键盘完整操作；焦点可见。  
- [ ] 移动 <768px：上横滚侧栏 + 下主内容，无横向溢出。  
- [ ] `<table>` **4 行** 4 列，含 caption 与来源。  
- [ ] CTA 链至 `pages/action.html`。  
- [ ] 样式 token 仅来自 DESIGN / base.css。  

---

## 附录 D — 修订记录

| 日期 | 版本 | 说明 |
|------|------|------|
| 2026-07-18 | 1.0 | 首版：三节结构、附录 A/B/C、动态 API 取前 4、折线图默认中国水质待用户锁定 |
| 2026-07-18 | 1.1 | §3.2 动态 4 项与 OCEAN_PAGE 去重重选：NOAA DO/pH/盐度 + OpenAQ PM2.5；新增 §4.0 边界表；废弃 v1.0 水温/潮位/Coral Watch/CRW 方案 |
| 2026-07-18 | 1.2 | §3.3 锁定左右分栏 4 类 UI（附录 E）；附录 C 五类改四类（油污并入渔业航运）；表格 4 行；文案 mock 占位非永久锁定 |
| 2026-07-18 | 1.2.1 | 实现轮：三节框架稿落地；折线图锁定中国近岸优良水质 5 年趋势 |
