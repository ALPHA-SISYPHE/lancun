# 「海在呼救」· Ocean Pollution Observatory 精修协作规则

## 0. 文档状态

| 项 | 内容 |
|----|------|
| 版本 | 1.0 |
| 状态 | 生效中（后续「海在呼救 / Observatory」每一阶段精修前必读） |
| 最近更新 | 2026-07-21 |
| 适用范围 | [`pages/rescue.html`](../pages/rescue.html)、[`assets/css/rescue-page.css`](../assets/css/rescue-page.css)、[`assets/js/rescue/`](../assets/js/rescue/)、[`assets/js/rescue-dashboard.js`](../assets/js/rescue-dashboard.js)、本页相关 [`assets/js/mock-data.js`](../assets/js/mock-data.js) 字段 |
| 角色 | 视觉气质、禁止项、页面 Token、排版压缩、精修 backlog、功能总目标、分阶段执行 |
| 功能与数据契约 | 信息架构、API 去重、mock schema 见 [`RESCUE_PAGE.md`](RESCUE_PAGE.md) |
| 全站设计基准 | [`DESIGN.md`](../DESIGN.md)（品牌色 / glass / 版心上限） |
| 账户系统 | 右上角头像 / 登录相关 **不在本页精修范围**，见 [`ACCOUNT_SYSTEM_RULES.md`](ACCOUNT_SYSTEM_RULES.md) |

**冲突优先级（rescue 页相关）：** 用户当前对话明确要求 → `AGENTS.md` → **本文档**（气质 / 紧凑 / 禁止 / 分阶段）→ [`RESCUE_PAGE.md`](RESCUE_PAGE.md)（功能 / API / 数据）→ `DESIGN.md`（全站 token）→ 其他专项文档。

**协作角色：** 优化本页时，以深耕前端网页开发、UI 界面设计、交互体验设计和网页美术设计 30 年以上的资深产品经理与视觉顾问标准执行——高级、克制，具有海洋纪录片气质、监测预警感与行动导向。

---

## 1. 页面定位

英文名：**Ocean Pollution Observatory**  
中文名：**海洋污染观察与行动页**（Nav 仍可为「海在呼救」）

Hero 眉标：`02 / 海在呼吸`  
主句：**用数据理解压力，用行动回应海洋。**

本页不是后台 Dashboard，不是普通数据大屏，不是 AI Landing Page，也不是首页或「我们的海洋」的复制版。

它应该是：

- 污染压力观察
- 实时监测窗口
- 风险判断
- 污染源溯源
- 解决方案档案
- 行动建议闭环

**气质关键词：**

| 关键词 | 含义 |
|--------|------|
| 污染压力 | 以指标与趋势呈现系统性风险，不恐吓堆叠 |
| 实时监测 | 地图 pin、站点详情、指标条联动 |
| 风险判断 | 状态标签 + 克制色阶，不靠纯颜色表达 |
| 污染源溯源 | 五类污染源档案，Source / Impact / Solution / Action |
| 解决方案 | 治理路径与个人可行动作 |
| 行动建议 | Footer 与详情链到行动中心 |

与前页同属澜存网站，但**不得照抄**其他页结构：

- 第一页（我们的海洋）：宏观、平静、科研、系统认知
- **第二页（本页）**：监测、压力、预警、溯源、行动导向
- 第三页（生物档案）：生命、档案、检索、识别
- 第四页（行动中心）：打卡、志愿、捐赠

---

## 2. 本次只修本页 · 明确不改

**只优化当前页面以下区块：**

| 区块 | 锚点 / 说明 |
|------|-------------|
| Hero | `pollution-hero`；Pressure Panel + 四锚点 |
| 污染压力总览 | `#pressure-overview` |
| 动态实时监测 | `#live-monitor` |
| 污染源解决方案 | `#source-solution` |
| 行动闭环 + Footer | `#action-cta` |

**不要修改：**

- 首页（[`pages/index.html`](../index.html)）
- 我们的海洋页（[`pages/ocean.html`](../pages/ocean.html)）
- 生物档案页（[`pages/species.html`](../pages/species.html)）
- 行动中心页（[`pages/action.html`](../pages/action.html)）
- 登录头像
- 账户菜单
- 导航结构

右上角头像 / 登录相关功能不要动。

---

## 3. 全站风格必须保留

修改本页时必须保持：

1. 深海背景视频（`pages-bg.mp4`）
2. 海洋纪录片质感
3. National Geographic 式自然叙事
4. Apple Environmental Report 式高级排版
5. 半透明内容层
6. 深海蓝主色
7. 克制的蓝色、青色、琥珀色状态色
8. 细线分割
9. 高级摄影图
10. 背景视频透出感
11. 适当留白，但不能稀疏
12. 页面整体高级、冷静、克制

### 3.1 必须保留的视觉底层

页面必须有背景视频层 + 深海渐变遮罩。内容面板应像漂浮在深海上的「观察站 / 监测窗」，而不是实心后台面板。

**项目当前等价实现：**

- 全站：[`assets/css/base.css`](../assets/css/base.css) 中的 `.page-bg-video` + `.page-bg-video__media`
- 本页遮罩：`.page-bg-video__shade--rescue`

**语义等价即可**；改类名时不得削弱视频可见性或改成不透明白 / 深蓝大块覆盖整页。

---

## 4. 当前问题（精修 backlog）

**阶段 6（2026-07-21）已解决** — 下列项在 v2.0 Final Polish 中已处理；若回归发现新问题，在此追加。

| # | 问题 | 状态 |
|---|------|------|
| 1 | 页面纵向滚动成本偏高 | ✅ section padding 52/56、Hero/Command/Source 高度压缩 |
| 2 | 每个模块都像独立大 section | ✅ Command Deck 合并；间距统一收紧 |
| 3 | 静态污染压力总览太黑 | ✅ `--deep-soft` 0.58、monitor 观察窗轻量化 |
| 4 | 动态监测应更早成为核心 | ✅ Command Deck 第二节即含地图；平板地图优先堆叠 |
| 5 | 压力与监测联动不足 | ✅ 同 Deck 内左摘要右地图 + 共享刷新 |
| 6 | 污染源信息块层级 | ✅ Phase 4 bullet 四块 + 紧凑 shell |
| 7 | 底部行动闭环 | ✅ Action Brief + Footer 三链 + 数据来源 |
| 8 | 背景视频透出不够 | ✅ shade 中段 0.48、面板 alpha 下调 |
| 9 | 功能生态 | ✅ 筛选 / 弹层 / 刷新 / page-state（Phase 5） |

---

## 5. 绝对禁止

1. 删除背景视频。
2. 改成纯浅色后台页面。
3. 改成普通 Dashboard。
4. 改成首页复制版。
5. 大面积使用纯白圆角卡片。
6. 大面积使用不透明深蓝实心盒子。
7. 使用紫蓝渐变 AI 风。
8. 强阴影。
9. 让页面变得更长。
10. 让每个模块都独占很高的 section。
11. 保留割裂的大表格。
12. 修改登录头像或账户菜单。
13. 破坏导航。
14. 出现横向滚动、文字遮挡、图片拉伸、z-index 错误。

---

## 6. 设计 Token（Observatory 页内统一）

在 [`assets/css/rescue-page.css`](../assets/css/rescue-page.css) 的 `.rescue-page` / `.pollution-page` 作用域内统一语义变量：

| Token | 值 | 用途 |
|-------|-----|------|
| `--deep` | `#031426` | 深海底 |
| `--deep-soft` | `rgba(3, 20, 38, 0.58)` | 软深色叠层 |
| `--deep-panel` | `rgba(4, 22, 39, 0.62)` | 深色面板 |
| `--light-panel` | `rgba(234, 245, 247, 0.68)` | 浅色半透明舱 |
| `--frost-panel` | `rgba(242, 248, 250, 0.58)` | 霜面舱 |
| `--line-light` | `rgba(255, 255, 255, 0.14)` | 浅细线 |
| `--line-dark` | `rgba(7, 30, 48, 0.12)` | 深细线 |
| `--text-light` | `#F2F8FA` | 深底上的正文 |
| `--text-muted` | `rgba(242, 248, 250, 0.68)` | 深底次要字（仍须可读） |
| `--ink` | `#08233D` | 浅舱内正文 |
| `--blue` | `#4DA3FF` | 少量高亮 |
| `--cyan` | `#55D6C2` | 点缀（克制） |
| `--warning` | `#DFAE4D` | 预警 |
| `--critical` | `#D9783D` | 异常 / 高风险 |
| `--normal` | `#35AFA0` | 正常 / 活跃 |

### 6.1 状态色规则

| 状态 | 色 | 规则 |
|------|-----|------|
| Normal 正常 | 青绿色 `--normal` | 须配文字标签 |
| Warning 预警 | 琥珀色 `--warning` | 须配文字标签 |
| Critical 异常 | 克制橙色 `--critical` | 须配文字标签 |
| High 高风险 | 琥珀 / 橙色 | 须配文字标签 |
| Active 活跃 | 青绿色 `--normal` / `--cyan` | 须配文字标签 |

**状态不能只靠颜色表达，必须有文字标签。**

**冲突时：**

- 全站品牌主色、glass 模糊基准、圆角上限 → 服从 [`DESIGN.md`](../DESIGN.md)
- 本页「观察站」半透明与状态色语义 → 服从本文档 Token

不要滥用纯白；不要滥用纯深蓝实心大块。用 rgba 半透明、细线、摄影图、留白、文字层级建立高级感。

---

## 7. 全局排版规则

| 项 | 规则 |
|----|------|
| 最大内容宽度 | `max-width: 1180px`；`margin: 0 auto` |
| 桌面左右安全边距 | `padding-left/right: 48px`（可用 `clamp` 映射） |
| Section 间距 | **`44px` – `48px`**（section 外 padding） |
| Hero 高度 | **`440px` – `520px`**（`clamp(440px, 46vh, 520px)`） |
| 大模块高度 | 不要每个模块都超过一屏；尽量让用户在较少滚动内完成理解 |
| 正文 | `15px` – `16px`；`line-height: 1.65` – `1.75` |
| 辅助文字 | `12px` – `13px`；不能过淡，必须可读 |

---

## 8. 最终功能目标

本页最终需要具备（实现细节与 API 契约见 [`RESCUE_PAGE.md`](RESCUE_PAGE.md)）：

### 8.1 Hero 快速锚点

- [x] 污染压力 → `#pressure-overview`
- [x] 实时监测 → `#live-monitor`
- [x] 污染源 → `#source-solution`
- [x] 行动建议 → `#action-cta`

DOM：`pollution-hero__anchors`；Pressure Panel：`data-rescue-pressure-panel`

### 8.2 Pressure Status Summary

Hero 右侧面板须展示：

- Ocean Pressure Index
- Active Stations
- Critical Sources
- Last Update

### 8.3 污染压力数据（Overview）

- [x] 6 个核心风险指标（`data-rescue-risk-matrix`）
- [x] 风险状态 + 趋势方向
- [x] 数据来源
- [x] 图表切换（折线 / 饼 / 柱：`data-rescue-line-chart` 等）
- [ ] **数据说明弹层**（待实现）
- 左摘要：`data-rescue-pressure-axis`

### 8.4 动态监测（Live Monitor）

- [x] 地图监测点（`data-rescue-map` / `data-rescue-map-pins`）
- [x] 点击点位更新站点详情（`data-rescue-station-detail`）
- [x] 指标条更新（`data-rescue-metric-strip`）
- [ ] **状态筛选**（待实现）
- [ ] hover 显示站点名称（待加强）
- [x] 缺失数据 / mock 降级态

### 8.5 污染源解决方案（Source Solution）

- [x] 污染源切换（`data-rescue-source-rail`）
- [x] 图片联动（`data-rescue-source-visual`）
- [x] Source / Impact / Solution / Action 四块融合（`data-rescue-source-detail`）
- [x] 不保留独立大表格
- [x] 查看行动建议链 → `#action-brief`（`data-rescue-source-action`）
- [x] 完整档案 drawer（`data-rescue-source-drawer`）
- [x] 上一项 / 下一项（`data-rescue-source-nav`）

### 8.6 行动闭环（Footer + Action Brief）

- [x] Action Brief 横带（`#action-brief`）
- [x] 进入行动中心
- [x] 回到海洋之美
- [x] 探索海洋生命（species.html）
- [x] **查看数据来源** — 统一 DataSourcesModal

### 8.7 响应式

- 桌面端高级
- 平板端不拥挤
- 移动端可读、可点
- 无横向溢出

### 8.8 DOM 模块关系

```
Hero (anchors + pressure-panel)
  → Pressure Overview (axis + matrix + charts)
  → Live Monitor (map + station-panel + metric-strip)
  → Source Solution (rail + visual + detail)
  → Action CTA + Footer
```

---

## 9. 分阶段执行规则（强制）

1. **每次只完成用户当前要求的阶段**，不要顺手做下一阶段。
2. **不要大规模重构无关文件。**
3. **不要修改**登录头像、账户菜单与导航结构。
4. 修改 [`pages/rescue.html`](../pages/rescue.html) 或 `assets/css/rescue-page.css` / `assets/js/rescue/**` 前，必须先读 **本文档** + [`RESCUE_PAGE.md`](RESCUE_PAGE.md) + [`DESIGN.md`](../DESIGN.md)。
5. 修改页面视觉或 `assets/css/**` 前必须先读 lancun-design Skill（工具用法）。
6. 完成后**停止**，并明确列出本阶段改了哪些文件。
7. 未经用户确认，不得擅自「最终美化」整页。
8. 分阶段推进时，优先修气质与布局问题（间距、透明度、滚动成本），再扩展功能细节（筛选、弹层、行动闭环）。

### 9.1 验收建议

每轮改动后须跑：

1. `node scripts/verify-rescue-compact.mjs` — DOM / CSS / JS 静态契约
2. `node scripts/verify-rescue-observatory.mjs` — Playwright 三视口高度预算、溢出与交互冒烟（需本地静态服务，默认 `http://127.0.0.1:8080`）

另须人工核对桌面 + 平板 + 移动视口视觉气质。

---

## 10. 与 RESCUE_PAGE 边界

精修**不得破坏** [`RESCUE_PAGE.md`](RESCUE_PAGE.md) 已锁定内容：

| 项 | 边界 |
|----|------|
| §4 API 去重 | 四监测点与 `OCEAN_PAGE.md` 附录 A.1 不得重叠 |
| §3 五段 IA | Hero → Overview → Monitor → Source → Footer 顺序保持 |
| mock 字段 | `rescueStaticMetrics`、`rescueCharts`、`rescuePressureIndex`、`rescuePollutionPanels` 等不得偷换口径 |
| 数据来源 | 所有正式数字登记 [`DATA_SOURCES.md`](DATA_SOURCES.md) |
| 表格 | **禁止**独立大表格；Source 四块档案模型保持 |
| 账户系统 | 归 [`ACCOUNT_SYSTEM_RULES.md`](ACCOUNT_SYSTEM_RULES.md) |

精修**允许**在数据契约不变前提下调整：间距压缩、壳透明度、Overview / Monitor 联动、状态筛选与数据弹层、Footer 行动闭环、文案层级与信息密度。

---

## 11. 关联文件

| 文件 | 用途 |
|------|------|
| [`pages/rescue.html`](../pages/rescue.html) | DOM / 锚点 |
| [`assets/css/rescue-page.css`](../assets/css/rescue-page.css) | Token 与布局 |
| [`assets/js/rescue/constants.js`](../assets/js/rescue/constants.js) | 常量 |
| [`assets/js/rescue/pollution-overview.js`](../assets/js/rescue/pollution-overview.js) | Overview 渲染 |
| [`assets/js/rescue/live-watch.js`](../assets/js/rescue/live-watch.js) | Live 监测 |
| [`assets/js/rescue/source-matrix.js`](../assets/js/rescue/source-matrix.js) | 污染源档案 |
| [`assets/js/rescue-dashboard.js`](../assets/js/rescue-dashboard.js) | 页面初始化 |
| [`assets/js/mock-data.js`](../assets/js/mock-data.js) | 静态与 live mock |
| [`docs/RESCUE_PAGE.md`](RESCUE_PAGE.md) | 功能宪法 |
| [`docs/DATA_SOURCES.md`](DATA_SOURCES.md) | 数据来源登记 |
| [`references/stastics_ref/rescue_sta.md`](../references/stastics_ref/rescue_sta.md) | 统计参考清单 |

---

## 12. 变更记录

| 日期 | 版本 | 说明 |
|------|------|------|
| 2026-07-21 | 1.1 | 阶段 6 最终精修：紧凑高度、Token 0.58、三档响应式、verify-rescue-observatory |
