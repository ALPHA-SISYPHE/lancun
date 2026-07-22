# 页面与功能架构

## 文档状态

- 版本：0.8
- 状态：讨论中（「我们的海洋」以 `docs/OCEAN_PAGE.md` v1.3 为准；「海在呼救」以 `docs/RESCUE_PAGE.md` v1.8 为准）

## 产品结构原则

网站分为两条互相连接的主线：展示线（海洋之美、生命力、物种和污染现状）与互动线（地图、数据、保护行动和反馈）。

## 页面备选方案

### 方案 A：五页平衡型（推荐）

1. 海洋之美首页
2. 我们的海洋：单页纵向三节——**第一节 6 张看板**（Coral Watch×3 + NOAA×3）、**第二节 4 卡 + CO₂ 折线**、**第三节 五大洋**竖排（美图 + 介绍 + 3 项小看板）。**不使用**本页可拖地球与三节点；**不含** Protected Planet；污染数据不进本页。权威细则见 `docs/OCEAN_PAGE.md` v1.3。
3. 海在呼救（海洋污染观察与行动中心）：单页——**Compact Hero + status ribbon**、**Pollution Command Deck（压力+监测双栏）**、**Source Solution Workspace**、**Action CTA + Footer（三链）**。v1.9 Phase 1 紧凑 IA。功能细则见 `docs/RESCUE_PAGE.md` v1.9；视觉精修规则见 `docs/RESCUE_OBSERVATORY_RULES.md` v1.0。
4. 海洋生物档案：濒危物种检索与海洋动物识别器入口
5. 保护行动中心：打卡积分、志愿者报名、公益项目与捐款意向
6. 我的界面：注册表单与本地行动记录

优点：展示和互动均衡，容易覆盖作业要求；缺点是内容准备量较大。

### 方案 B：三页课程稳妥型

1. 首页与海洋美景展示
2. 地图、物种和污染数据综合探索页
3. 保护行动与表单页

优点：开发风险较低；缺点是单页内容密度较高。

### 方案 C：沉浸探索型

1. 海洋入口
2. 下潜式互动地图
3. 生物与生态系统
4. 污染现状数据
5. 行动、打卡与勋章

优点：视觉表现和互动潜力最大；缺点是动画、地图和内容制作风险最高。

已确认采用方案 A 作为当前开发目标；若时间不足，才缩减为方案 B。

## 暂定信息架构

### 1. 海洋之美首页

目的：展示海洋生命之美和活力，建立情绪入口，引导用户开始探索。

候选内容：沉浸式主视觉、自动播放或交互式音视频、少量核心数据、探索入口、行动号召。首页避免大段文字。

**精修规则：** [`docs/HOME_REFINE_RULES.md`](HOME_REFINE_RULES.md) v1.0 — 两屏结构（HeroOceanIntro + OceanGlobeExplorer）、双背景视频、右侧 WebGL 地球；分阶段执行，不改账户系统与其他子页。

**现行实现（`index.html`）：**

- Section 1：全屏 Hero 视频（`hero.mp4`）+ 品牌文案 + 进入海洋世界 CTA
- Section 2：`#ocean-explore` — 背景视频 + 左栏文案 + 右栏 [`assets/js/globe/`](../assets/js/globe/) 3D 地球（自转 / 拖动 / 五大洋 `+` 标记）
- 五大洋简介卡片切换、查看完整档案深链 — **待 P2–P3**（见 HOME_REFINE_RULES §7–§9）

### 2. 我们的海洋（已锁定方向，见 OCEAN_PAGE.md）

目的：以正面数据与五大洋叙事展示海洋之美与作用；首页可链入 `#ocean-brief`。

已锁定：连续叙事杂志布局；`#ocean-brief` 合并观测与海的作用；`#five-oceans` 五洋档案；A.1–A.3 见 `OCEAN_PAGE.md` 附录。

正式版：`pages/ocean.html` + `ocean-page.css` + `ocean-dashboard.js`（2026-07-20 由 draft2 升格）。

框架稿备份：`pages/ocean-draft2.html`（v1.3 独立三节 UI）。

首页 `#ocean-explore` 细则见 [`HOME_REFINE_RULES.md`](HOME_REFINE_RULES.md)；子页五大洋 tab 深链格式：`pages/ocean.html#ocean-{id}`。

### 3. 海在呼救（已锁定方向，见 RESCUE_PAGE.md + RESCUE_OBSERVATORY_RULES.md）

目的：用权威统计与近实时监测说明污染与生态压力，并给出分类科普与可执行方案。

已锁定：v1.8 Observatory（视频 + 更透半透明壳）；Overview / Monitor Window / Source Scroll；站点面板无内部滚动；无独立表格；禁止浅灰后台与全宽实色盖视频。后续精修气质、Token、间距与分阶段执行见 `docs/RESCUE_OBSERVATORY_RULES.md` v1.0。

当前实现：[`pages/rescue.html`](../pages/rescue.html) + [`assets/js/rescue/`](../assets/js/rescue/) + [`rescue-dashboard.js`](../assets/js/rescue-dashboard.js) + [`rescue-page.css`](../assets/css/rescue-page.css)。

### 4. 海洋生物档案页（已锁定方向，见 SPECIES_PAGE.md）

目的：把环境问题与具体生物联系起来；物种科普 + 保护等级科普 + AI 互动识别（Phase A mock）。

已锁定：单页纵向 **三节** — ① 濒危物种检索（大搜索框 + 6 标签）② 4 卡正面看板 + 物种网格 + 详情弹窗 ③ 海洋动物 AI 识别器（拖放/拍照 + mock 识别）。

细则、数据 schema、响应式与接口契约见 [`docs/SPECIES_PAGE.md`](SPECIES_PAGE.md) 附录 A–G。

当前实现：[`pages/species.html`](../pages/species.html) 仍为旧占位框架，待按宪法改版。

### 5. 保护行动中心（海洋行动中心）

目的：把理解转化为个人行动，并满足表单要求。

**当前结构（v3，2026-07-22）**：单页纵向模块 — ① ActionHero ② DailyActionDock（打卡 + streak/徽章）③ **ParticipationHub**（志愿报名 / 公益支持 **Tab 切换**；各 Tab 主区 3 卡轮播 + 侧栏往期成果轮播；详情/报名/捐款均在 dialog）④ PersonalActionArchive strip + Footer。前端 mock + localStorage，无真实支付/报名。

细则、DOM hook、localStorage schema 与 smoke 见 [`docs/ACTION_PAGE.md`](ACTION_PAGE.md) 附录 G、[`docs/ACTION_PAGE_VISUAL_RULES.md`](ACTION_PAGE_VISUAL_RULES.md)。

当前实现：[`pages/action.html`](../pages/action.html) + [`assets/css/action-page.css`](../assets/css/action-page.css) + [`assets/js/action/`](../assets/js/action/)。

## 全站功能

- 导航与当前页面提示；首页为 `index.html`，其余模块分别为 `pages/ocean.html`、`pages/rescue.html`、`pages/species.html`、`pages/action.html`、`pages/profile.html`，不使用页内跳转替代页面路由。
- 桌面端和移动端响应式布局。
- 数据和媒体来源入口。
- 音视频播放控制、静音默认值和加载失败降级。
- 互动反馈、行动进度和勋章状态。
- 必要的加载、空状态、错误和成功反馈。
- 登录/注册在任意页面右上角浮层完成；已登录显示头像悬停摘要，「进入我的」跳转 `pages/profile.html` 侧栏仪表盘；未登录直接打开该页时显示空状态引导。账户 UI/交互细则见 [`docs/ACCOUNT_SYSTEM_RULES.md`](ACCOUNT_SYSTEM_RULES.md)。

## 待确认问题

- [ ] 是否保留全部 5 个页面。
- [ ] 科普页覆盖一种污染还是多种问题。
- [ ] 数据页需要哪些图表和筛选维度。
- [ ] 生物档案页是否为独立页面。
- [ ] 行动表单提交后产生什么结果。
- [ ] 是否需要中英文切换、主题切换或搜索。
- [x] 已选择方案 A：五页平衡型。
- [x] 地图采用重点海域地图，而非全球实时地图。（首页保留 3D 地球探索区；`ocean.html` 本页可拖地球按 `OCEAN_PAGE.md` 移除）
- [x] 行动页采用匿名表单 + localStorage，不制作真实账号注册。
- [x] 「我们的海洋」三节结构与附录 A.1–A.3 已写入 `docs/OCEAN_PAGE.md` v1.3。
- [x] 「我们的海洋」§0 用户需求摘要（v1.2）。
- [x] 「我们的海洋」连续叙事版升格为正式 `pages/ocean.html`（v1.4）。
- [x] v1.3 框架稿备份：`pages/ocean-draft2.html`。
- [x] 「海在呼救」三节结构与附录 A/B/C/E 已写入 `docs/RESCUE_PAGE.md` v1.2（§3.2 去重 + §3.3 四类 UI）。
- [x] 「海在呼救」§3.3 UI 已锁定（附录 E）；文案占位待用户后续改。
- [x] 「海在呼救」静态折线图主题已锁定：中国近岸优良水质 5 年趋势。
- [x] 「海在呼救」三节框架稿已实现（`rescue.html` + `rescue-dashboard.js`）。
