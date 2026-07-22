# 「海在呼救」· Live Monitoring Console 局部精修规则

## 0. 文档状态

| 项 | 内容 |
|----|------|
| 版本 | 1.0 |
| 状态 | 生效中（修改 rescue 页「动态实时监测 + 图表 Tab」子树前必读） |
| 最近更新 | 2026-07-22 |
| 适用范围 | [`pages/rescue.html`](../pages/rescue.html) 内 `#live-monitoring`、`.monitor-window`、`.command-bottom`；[`assets/css/rescue-page.css`](../assets/css/rescue-page.css) 对应选择器；[`assets/js/rescue/live-watch.js`](../assets/js/rescue/live-watch.js)、[`assets/js/rescue/pollution-overview.js`](../assets/js/rescue/pollution-overview.js)、[`assets/js/rescue/command-deck.js`](../assets/js/rescue/command-deck.js)（仅样式相关 SVG 尺寸，不改 API） |
| 角色 | Live Console 气质、禁止项、局部 Token、问题 backlog、验收标准 |
| 全页精修 | 见 [`RESCUE_OBSERVATORY_RULES.md`](RESCUE_OBSERVATORY_RULES.md) |
| 功能与数据 | 见 [`RESCUE_PAGE.md`](RESCUE_PAGE.md) |
| 全站设计基准 | [`DESIGN.md`](../DESIGN.md) |
| 账户系统 | **不在本规则范围**，见 [`ACCOUNT_SYSTEM_RULES.md`](ACCOUNT_SYSTEM_RULES.md) |

**冲突优先级（Live Console 子树）：** 用户当前对话明确要求 → `AGENTS.md` → **本文档**（局部气质 / 禁止 / Token）→ [`RESCUE_OBSERVATORY_RULES.md`](RESCUE_OBSERVATORY_RULES.md) → [`RESCUE_PAGE.md`](RESCUE_PAGE.md) → `DESIGN.md` → 其他专项文档。

**协作角色：** 以深耕前端网页开发、UI 界面设计、数据可视化与交互体验设计 30 年以上的资深产品经理与视觉顾问标准执行——高级、克制，具有**实时海洋监测控制台**气质，而非后台 Dashboard 或 AI 数据大屏。

---

## 1. 模块定位

英文名：**Live Monitoring Console**  
中文名：**动态实时监测控制台**（位于 Pollution Command Deck 右侧 + 底部图表 Tab）

本模块应该是：

- 地图沉浸的监测窗口
- 站点详情与指标条联动的数据层
- 趋势 / 构成 / 数据来源的可读图表带

**气质关键词：**

| 关键词 | 含义 |
|--------|------|
| 深海蓝 | 叠层与地图同系深色半透明，保留 basemap 可见 |
| 半透明 | Console 叠层 + 轻 blur，禁止实心白卡 |
| 地图沉浸感 | overlay 轻、pin 清晰、叠层不抢地图 |
| 数据清晰 | 指标值、状态标签、图表轴可读 |
| 站点详情轻盈 | 右上详情卡像浮在地图上的监测窗，不是后台表单 |
| 状态色克制 | ok / watch / alert 三色 + 文字标签 |
| 图表完整显示 | 折线、圆点、X 轴年份不得被裁切 |

**不是：** 普通后台白卡、AI Landing、独立数据大屏、整页重构。

---

## 2. 本次只修 / 明确不改

### 2.1 只优化

| 区域 | DOM / 类名 |
|------|------------|
| 监测工具栏 | `.monitor-toolbar`、`[data-rescue-status-filter]` |
| 地图窗口 | `.monitor-window`、`.monitor-map`、`.monitor-map__*`、`[data-rescue-map-pins]` |
| 站点详情 | `.station-panel`、`[data-rescue-station-detail]` |
| 指标条 | `.monitor-metrics`、`[data-rescue-metric-strip]` |
| 图表 Tab 带 | `.command-bottom`、`.command-chart-tabs`、`.command-chart-panels`、`.chart-frame`、`.rescue-trend`、`.rescue-pie`、`.rescue-bar` |

### 2.2 不要修改

- Hero（`pollution-hero`）
- 污染压力左侧总览（`.pressure-summary-panel`、`[data-rescue-risk-matrix]`、`[data-rescue-pressure-axis]`）
- 污染源解决方案（`#source-solution`）
- Action Brief（`#action-brief`）
- Footer（`#rescue-footer`）
- 登录头像、账户菜单、导航结构
- 首页、海洋页、物种页、行动中心及其他页面

---

## 3. 当前问题（精修 backlog）

| # | 问题 | 现状锚点 | 目标 | 验收 |
|---|------|----------|------|------|
| 1 | 站点详情卡太白、突兀 | `.station-panel` 曾用 `--light-panel-strong` 或深色 Console 叠层 | **Phase 1 霜化浅色玻璃**（`rgba(234,245,247,0.64)` + blur）+ 深色 ink 字 | 1440 桌面：半透明监测窗，不再像后台白卡 |
| 2 | 指标条偏白、与地图融合差 | `.monitor-metrics` 曾用 `--console-overlay` 深色 HUD | **Phase 2 霜化 strip**（`rgba(234,245,247,0.58)` + blur）+ ink 字 | 左下 strip 半透明，不像硬贴白表格 |
| 3 | 图表区高度不足、折线被裁切 | `.command-chart-panels` max 180px + `overflow: hidden` | **Phase 3**：panel `min-height: 430px`，canvas `320px`，移除裁切 | 趋势图折线 + 圆点 + X 轴 + 年份完整可见 |
| 4 | 不要重构整页 | — | 仅 CSS + 可选 SVG 尺寸微调 | Hero / 左栏 / Source / Footer 视觉无变化 |

---

## 4. 视觉目标与 Console Token

在 [`.rescue-page`](../assets/css/rescue-page.css) 作用域内新增局部变量（不得污染全站）：

| Token | 值 | 用途 |
|-------|-----|------|
| `--console-overlay` | `rgba(3, 20, 38, 0.72)` | 保留 token；指标条 Phase 2 已改用 frost 局部变量 |
| `--console-overlay-soft` | `rgba(3, 20, 38, 0.58)` | 指标条非激活格 |
| `--console-glass-line` | `rgba(255, 255, 255, 0.14)` | 叠层边框 / 格线 |
| `--console-text` | `var(--text-light)` | 叠层正文 |
| `--console-text-muted` | `var(--text-muted)` | 坐标、meta、标签 |
| `--console-active-metric` | `rgba(77, 163, 255, 0.12)` | 当前站点主指标格 |

### 4.1 站点详情（`.station-panel`）— Phase 1 霜化监测卡

- **背景**：局部 `--station-frost-bg: rgba(234, 245, 247, 0.64)`；禁止纯白不透明底与 `--light-panel-strong`
- **文字**：`--station-frost-ink` / `--station-frost-muted`（深色 ink，非 Console 浅色字）
- **边框**：`1px solid rgba(255, 255, 255, 0.34)`；`backdrop-filter: blur(14px)`
- **定位**：桌面 `top/right: 36px`，宽 `300px`（280–320px）；禁止强外阴影
- **指标行**：细线分割；数值右对齐
- **移动端**：`position: relative`，堆叠于地图下方，不 absolute 遮挡
- `status-pill` 保留文字标签；在 `.station-panel` 内克制饱和度（如 `opacity: 0.85`）
- **备选**：若 basemap 过亮导致对比不足，可仅切换局部 token 为 `rgba(4, 22, 39, 0.76)` + `#F2F8FA`（不改指标条）

### 4.2 指标条（`.monitor-metrics`）— Phase 2 霜化 strip

- **背景**：局部 `--metric-frost-bg: rgba(234, 245, 247, 0.58)`；禁止纯白不透明底
- **文字**：`--metric-frost-ink` / `--metric-frost-muted`
- **边框**：`1px solid rgba(255, 255, 255, 0.30)`；`backdrop-filter: blur(12px)`
- **桌面定位**：`left: 36px; bottom: 30px`；`width: min(640px, calc(100% - 420px))`（不盖住右侧站点卡）
- **单元格**：`padding: 16px 18px`；格线 `--metric-frost-line`；激活格 `rgba(8, 35, 61, 0.06)`
- **状态色**：仅用于 `.monitor-metrics__status`（`#35AFA0` / `#DFAE4D` / `#D9783D`）
- **移动端**：`position: relative`，地图下方 2×2 网格，禁止横向滚动

### 4.3 地图窗口（`.monitor-window`）— Phase 2 监测舞台

- **尺寸**：桌面 `min-height: 500px`；平板约 `400px`；移动 grid 堆叠
- **背景**：`rgba(3, 18, 34, 0.72)` + `::after` 横向渐变遮罩（`pointer-events: none`）
- **底图**：SVG `preserveAspectRatio="xMidYMid slice"`（cover，不拉伸）；保留 SVG overlay（约 `0.18`）
- **叠层 z-index**：map `z0` → 渐变 `z1` → panel / metrics `z3`
- 不得遮挡 pin 点击热区

### 4.4 图表 Tab 区（`.command-bottom`）

- **外壳**：紧凑 padding；`background: var(--deep-soft)` + blur
- **Tab**：趋势 / 构成 / 数据来源（3 Tab）；单 panel 可见，panel 高度约 **110–130px**
- **构成 Tab**：饼 + 柱左右并排（`.command-chart-panel--composition`）
- **折线**：SVG `max-height: 110px`；viewBox 约 `640×140`
- **完整来源**：`data-rescue-data-sources-open` 弹窗

---

## 5. 绝对禁止

1. 纯白不透明卡片或大圆角后台白盒。
2. 紫蓝渐变、neon、强阴影、AI Landing 风。
3. 修改 Hero、左栏压力总览、Source、Footer、账户与导航。
4. 引入 Chart.js / ECharts 等第三方图表库（除非用户另行批准）。
5. 重构 HTML IA 或删除现有 hook。
6. 状态只靠颜色、无文字标签。
7. 为「完整图表」而显著拉长整页（超出 §4.4 增量上限）。

---

## 6. 功能与 DOM 契约

不得破坏 [`RESCUE_PAGE.md`](RESCUE_PAGE.md) 与现有 JS：

| 功能 | Hook |
|------|------|
| 地图 pin | `[data-rescue-map-pins]` |
| 站点详情 | `[data-rescue-station-detail]` |
| 指标条 | `[data-rescue-metric-strip]` |
| 状态筛选 | `[data-rescue-status-filter]` |
| 图表 Tab | `[data-chart-tab]`、`[data-rescue-chart-panel]` |
| 趋势 / 饼 / 柱 | `[data-rescue-line-chart]`、`[data-rescue-pie-chart]`、`[data-rescue-bar-chart]` |
| 刷新观测 | `[data-rescue-deck-refresh]` → `refreshLiveWatch` |

样式改动**不得**更改上述 selector 名称或破坏 `live-watch.js` / `command-deck.js` / `pollution-overview.js` 渲染结构。

---

## 7. 响应式（局部）

| 断点 | 规则 |
|------|------|
| 桌面 ≥64rem | 站点卡 absolute 右上；指标条 absolute 底；图表 panel **110–130px** |
| ≤56rem | 沿用 stack；Console 叠层气质一致；Tab/按钮分行 |

---

## 8. 分阶段执行

| 阶段 | 内容 | 主要文件 |
|------|------|----------|
| Phase 1 | 站点霜化详情卡 | [`rescue-page.css`](../assets/css/rescue-page.css) `.station-panel` |
| Phase 2 | 监测舞台 + 霜化指标 strip | 同上 `.monitor-window` / `.monitor-metrics` |
| Phase 3 | Chart Panel 高度与双栏布局 | [`pollution-overview.js`](../assets/js/rescue/pollution-overview.js) + `.command-bottom` |
| **Phase 4 最终验收** | pin 层级、tab layout sync、Playwright 断言 | [`command-deck.js`](../assets/js/rescue/command-deck.js)；[`verify-rescue-observatory.mjs`](../scripts/verify-rescue-observatory.mjs) |

**强制：**

1. 每次只完成本阶段，不顺手改 Hero / Source / Footer。
2. 修改前必读本文档 + `RESCUE_OBSERVATORY_RULES.md` + `RESCUE_PAGE.md` + `DESIGN.md`。
3. 完成后跑 verify 脚本，列出改动文件并停止。

---

## 9. 验收标准

### 9.1 目视

1. 站点详情不再像「后台白卡」，霜化半透明与地图自然融合。
2. 指标条为霜化 strip，与地图融合，四项指标仍可读。
3. 趋势图折线 + X 轴年份 + 数据点完整可见（1440×900）。
4. 左栏压力总览、Hero、Source、Footer 无视觉变化。
5. 无横向溢出；pin / 筛选 / tab / 刷新交互正常。

### 9.2 Phase 4 最终检查表（Live Console 四块）

| # | 检查项 | 通过条件 |
|---|--------|----------|
| 1 | 地图区域高级感 | 舞台深色底 + 渐变；非后台 dashboard 白盒 |
| 2 | 站点详情卡 | 霜化半透明；桌面 absolute 右上，移动 stack 于地图下 |
| 3 | 指标条融合 | 霜化 strip；桌面 absolute 左下，不盖住右侧站点卡 |
| 4 | 折线图可读 | SVG `max-height: 110px`；轴/年份/点可见 |
| 5 | Tab 单 panel | 切换 Tab 时仅一个 `[data-rescue-chart-panel]` 可见 |
| 6–8 | 三视口 | 桌面 / 平板 / 移动无横向溢出；移动 metrics 相对定位 |
| 9 | pin 清晰 | `.monitor-map` z-index 2，高于舞台渐变 |
| 10 | 底图不拉伸 | `preserveAspectRatio="xMidYMid slice"` |
| 11 | tab 切换 | 往返 trend 后 SVG 高度仍 ≥250px |
| 12–13 | 范围 | 不改登录头像；不改其他页面 |

### 9.3 脚本

每轮改动后须跑：

1. `node scripts/verify-rescue-compact.mjs` — 含 Console token / chart 高度断言
2. `node scripts/verify-rescue-observatory.mjs` — 三视口冒烟（需本地静态服务）

---

## 10. 关联文件

| 文件 | 用途 |
|------|------|
| [`docs/RESCUE_LIVE_CONSOLE_RULES.md`](RESCUE_LIVE_CONSOLE_RULES.md) | 本文档 |
| [`docs/RESCUE_OBSERVATORY_RULES.md`](RESCUE_OBSERVATORY_RULES.md) | 全页 Observatory 精修 |
| [`docs/RESCUE_PAGE.md`](RESCUE_PAGE.md) | 功能 / 数据宪法 |
| [`assets/css/rescue-page.css`](../assets/css/rescue-page.css) | Console Token 与样式 |
| [`assets/js/rescue/live-watch.js`](../assets/js/rescue/live-watch.js) | 站点详情 / 指标条 / pin |
| [`assets/js/rescue/pollution-overview.js`](../assets/js/rescue/pollution-overview.js) | 图表 SVG 渲染 |
| [`scripts/verify-rescue-compact.mjs`](../scripts/verify-rescue-compact.mjs) | 静态契约 |
| [`scripts/verify-rescue-observatory.mjs`](../scripts/verify-rescue-observatory.mjs) | Playwright 冒烟 |

---

## 11. 变更记录

| 日期 | 版本 | 说明 |
|------|------|------|
| 2026-07-22 | 1.0 | 首版：Live Monitoring Console 局部精修规则（监测地图 + 图表 Tab） |
