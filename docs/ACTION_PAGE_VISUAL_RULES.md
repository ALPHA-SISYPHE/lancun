# 海洋行动中心 · 精修协作规则

> **协作角色：** 深耕前端网页开发、UI 界面设计、交互体验设计与网页美术设计 30 年以上的资深产品经理与视觉顾问视角。

## 0. 文档状态

| 项 | 内容 |
|----|------|
| 版本 | **2.0** |
| 状态 | 生效中（后续行动中心每一阶段精修前必读） |
| 最近更新 | 2026-07-21 |
| 适用范围 | [`pages/action.html`](../pages/action.html)、[`assets/css/action-page.css`](../assets/css/action-page.css)、[`assets/js/action/`](../assets/js/action/)、[`data/volunteerActivities.js`](../data/volunteerActivities.js)、[`data/donationProjects.js`](../data/donationProjects.js)、[`data/impactStories.js`](../data/impactStories.js) |
| 角色 | 视觉气质、禁止项、页面 Token、排版、功能总目标、分阶段执行 |
| 功能架构 | 模块、localStorage schema、DOM hook、smoke 脚本见 [`ACTION_PAGE.md`](ACTION_PAGE.md) 附录 G |
| 全站设计基准 | [`DESIGN.md`](../DESIGN.md)（品牌色 / glass / 版心上限） |
| 账户系统 | 右上角头像 / 登录相关 **不在本页精修范围**，见 [`ACCOUNT_SYSTEM_RULES.md`](ACCOUNT_SYSTEM_RULES.md) |

**冲突优先级（行动中心相关）：** 用户当前对话明确要求 → `AGENTS.md` → **本文档**（气质 / 禁止 / 排版 / 分阶段 / 功能总目标）→ `ACTION_PAGE.md`（存储 schema / DOM hook）→ `DESIGN.md`（全站 token）→ 其他专项文档。

**v2 说明：** 与 v1 冲突时，**以 2026-07-21 用户精修 brief 为准**。阶段 1–5 功能基座已完成；后续工作按 §10 阶段 6+ 精修 backlog 逐阶段推进，不得一次性全量重构。

---

## 1. 页面定位

英文名：**Ocean Action Center**  
中文名：**海洋行动中心**  
副标题气质：**把关心，变成一次可持续的行动。**

本页不是后台系统，不是普通表单页，不是公益捐款模板，不是志愿者报名后台，也不是 AI Landing Page。

它应该是：

**Ocean Action Center / 海洋行动中心**

页面气质关键词：

| 关键词 | 含义 |
|--------|------|
| 行动 | 把关心转化为可完成的个人行为 |
| 坚持 | 连续打卡、streak、勋章与证书 |
| 参与 | 志愿任务、名额、报名记录 |
| 公益 | 支持意向、资金去向、往期成果 |
| 反馈 | 证书、轮播、成功态，而非静默提交 |
| 荣誉 | 勋章体系、电子荣誉证书 |
| 长期影响 | 往期成果轮播，呈现持续保护叙事 |

用户进入页面后，应该可以高效完成：

1. 今天完成一次环保打卡。
2. 报名一个志愿活动。
3. 支持一个公益项目。
4. 查看自己的行动记录与成果反馈。

与前序页面同属澜存网站，但**不得照抄**前几页版式：

| 页序 | 页面 | 气质 |
|------|------|------|
| 第一页 | 我们的海洋 | 海洋系统认知、宏观、平静、科研、探索 |
| 第二页 | 海在呼救 | 污染观察与行动、监测、压力、溯源 |
| 第三页 | 海洋生命档案馆 | 生命、档案、检索、识别、发现、保护 |
| **第四页（本页）** | **海洋行动中心** | **行动、坚持、参与、公益、反馈、荣誉、长期影响** |

---

## 2. 本次只修「海洋行动中心」页面

**只优化当前页面：**

- 行动中心 / 把关心，变成一次可持续的行动。

**不要修改：**

- 首页
- 我们的海洋页（[`pages/ocean.html`](../pages/ocean.html)）
- 海在呼救页（[`pages/rescue.html`](../pages/rescue.html)）
- 生物档案页（[`pages/species.html`](../pages/species.html)）
- 登录头像
- 账户菜单
- 导航结构

右上角头像和登录功能不要动。账户相关边界见 [`ACCOUNT_SYSTEM_RULES.md`](ACCOUNT_SYSTEM_RULES.md)。

---

## 3. 全站风格必须保持

修改本页时必须保持：

1. 深海背景视频
2. 海洋纪录片质感
3. National Geographic 式自然叙事
4. Apple Environmental Report 式高级排版
5. 科研与公益结合的设计语言
6. 半透明内容层
7. 适当留白，但不能稀疏
8. 清晰文字层级
9. 细线分割
10. 少量蓝色、青绿色、琥珀色点缀
11. 高级摄影图（或诚实渐变占位，禁止廉价色块堆叠）
12. 页面整体高级、冷静、克制

### 3.1 必须保留的视觉底层

页面必须保留背景视频层；内容面板应像漂浮在海面上的「**行动舱 / 公益任务站**」，不是实心后台面板。

全站已采用 [`assets/css/base.css`](../assets/css/base.css) 中的：

- `.page-bg-video` + `.page-bg-video__media`
- 行动页专用遮罩：`.page-bg-video__shade--action`

**禁止：** `page-island` 式大面积不透明白底盖住整页视频；禁止删除背景视频。

**验收参考：** 滚动过程中背景视频可见面积 ≥ 40%。

---

## 4. 当前页面主要问题（精修 backlog）

当前页面已经有基本功能，但还存在以下问题——后续精修须优先解决：

1. 整体面板太灰，像后台表单
2. Daily Check-in 区域表单感太重
3. 打卡行为没有足够仪式感
4. 志愿任务板还像普通活动卡
5. 公益支持区和志愿区区分度不够
6. 往期成果轮播视觉影响力不足
7. 个人行动档案区域太淡，几乎不可见
8. 页面仍然偏长，滚动成本略高
9. 按钮、输入框、卡片的美术细节还不够高级
10. 功能生态可以更完整：历史记录、证书、勋章、报名记录、捐款记录、成果反馈

> 注：阶段 5 已解决「巨大浅色打卡面板遮挡视频」等问题；§4 为阶段 6+ 的视觉与体验精修方向。

---

## 5. 绝对禁止

1. 删除背景视频
2. 改成纯白后台页面
3. 做成普通 Dashboard
4. 大量使用不透明灰色大面板
5. 大量使用普通表单输入框堆叠
6. 使用紫蓝渐变 AI 风
7. 使用强阴影
8. **让页面变得更长**
9. 日历重新成为主视觉
10. 志愿活动和捐款模块长得一模一样
11. 往期成果一次性铺满很多卡
12. **修改登录头像或账户菜单**
13. **破坏导航**
14. 出现横向滚动、文字遮挡、图片拉伸、z-index 错误

---

## 6. 设计 Token

在 [`assets/css/action-page.css`](../assets/css/action-page.css) 的 `body.action-page` 作用域内统一使用：

| Token | 值 |
|-------|-----|
| `--deep` | `#031426` |
| `--deep-soft` | `rgba(3, 20, 38, 0.68)` |
| `--deep-panel` | `rgba(4, 22, 39, 0.74)` |
| `--light-panel` | `rgba(234, 245, 247, 0.68)` |
| `--frost-panel` | `rgba(242, 248, 250, 0.58)` |
| `--line-light` | `rgba(255, 255, 255, 0.14)` |
| `--line-dark` | `rgba(7, 30, 48, 0.12)` |
| `--text-light` | `#F2F8FA` |
| `--text-muted` | `rgba(242, 248, 250, 0.68)` |
| `--ink` | `#08233D` |
| `--blue` | `#4DA3FF` |
| `--cyan` | `#55D6C2` |
| `--warning` | `#DFAE4D` |
| `--critical` | `#D9783D` |
| `--normal` | `#35AFA0` |
| `--medal-bronze` | `#B98345` |
| `--medal-silver` | `#B9C3CC` |
| `--medal-gold` | `#DFAE4D` |

**模块顶栏色带区分（强制）：**

| 区块 | 色带语义 |
|------|----------|
| 每日打卡（DailyActionDock） | 青绿 streak 线（`--cyan` / `--normal`） |
| 志愿任务板（VolunteerMissionBoard） | 琥珀任务线（`--warning`） |
| 公益支持（SupportHarbor） | 蓝色支持线（`--blue`） |

**Token 使用约束：**

- 主功能面板（打卡 dock、志愿区、捐款区）统一 `--deep-panel` + `blur(14px)` + 细线边框
- `--light-panel` **仅**用于局部高光（如电子证书白底），**禁止**大块打卡 dock 使用浅色面板

**冲突时：** 全站品牌主色、glass 模糊基准、圆角上限 → 服从 [`DESIGN.md`](../DESIGN.md)；本页行动舱半透明与模块色差 → 服从本文档。

---

## 7. 全局排版规则

| 项 | 规则 |
|----|------|
| 最大内容宽度 | `max-width: 1180px`；`margin: 0 auto` |
| 桌面左右安全边距 | `padding-left/right: 48px`（可用 `clamp` 映射） |
| Section 间距 | **72px – 96px** |
| Hero 高度 | **520px – 620px** |
| 主功能面板 | **不要超过 1 屏高度**；尽量让用户在较少滚动中完成行动 |
| 正文 | **15px – 16px**；`line-height: 1.65 – 1.75` |
| 辅助文字 | **12px – 13px**；不能过淡，必须可读 |

**响应式断点（强制）：** 375px / 768px / 1180px；不得横向溢出。

---

## 8. 功能总目标

页面最终需要具备以下能力。标注 **✓** 为阶段 2–5 已实现；**△** 为功能已有但视觉/体验待精修。

| # | 功能 | 状态 |
|---|------|------|
| 1 | 每日环保打卡 | ✓ |
| 2 | 打卡表单 | ✓ △ 表单感待减 |
| 3 | 打卡历史记录 | ✓ |
| 4 | localStorage 保存打卡数据 | ✓ `ocean-action-checkins.{username}` |
| 5 | 连续打卡 streak 计算 | ✓ |
| 6 | 3 / 5 / 7 / 14 / 30 天勋章奖励 | ✓ `ocean-action-badges.{username}` |
| 7 | 每次打卡后弹出电子荣誉证书 | ✓ △ 仪式感待加强 |
| 8 | 志愿活动数据库，至少 30 条 mock 活动 | ✓ `data/volunteerActivities.js` |
| 9 | 每次展示 3 条志愿活动 | ✓ |
| 10 | 手动换一批 | ✓ |
| 11 | 定时刷新活动 | ✓ 12s，页面不可见时暂停 |
| 12 | 活动详情弹窗 | ✓ |
| 13 | 志愿活动报名表单 | ✓ |
| 14 | 报名记录 localStorage 保存 | ✓ `ocean-action-volunteer-registrations` |
| 15 | 公益捐款项目 | ✓ `data/donationProjects.js` |
| 16 | 捐款表单 | ✓ |
| 17 | 捐款记录 localStorage 保存 | ✓ `ocean-action-donations` |
| 18 | 捐款成功感谢卡 | ✓ |
| 19 | 往期成果 9 条 | ✓ `data/impactStories.js` |
| 20 | 往期成果一次只展示 1 条，循环播放 | ✓ `ImpactStoryCarousel` 8s 自动 |
| 21 | 个人行动档案入口 | ✓ △ 可见性待加强 |
| 22 | 响应式完整 | ✓ |
| 23 | 无横向溢出 | ✓ smoke 验收 |

**当前七模块架构（已实现，不得擅自拆回三节）：**

1. ActionHero  
2. DailyActionDock  
3. VolunteerMissionBoard  
4. SupportHarbor  
5. ImpactStoryCarousel（全页唯一成果轮播，9 条单卡）  
6. PersonalActionArchive  

**脚本模块（已实现，[`assets/js/action-page.js`](../assets/js/action-page.js) 未加载）：**

- `checkinStorage.js` / `checkinBadges.js` / `checkinUI.js`
- `volunteerStorage.js` / `volunteerUI.js`
- `donationStorage.js` / `donationUI.js`
- `impactCarousel.js`

---

## 9. 分阶段执行规则（强制）

1. **每次只完成用户当前要求的阶段**，不要顺手做下一阶段。
2. **不要大规模重构无关页面**（首页、ocean、rescue、species、账户系统）。
3. **不要修改**登录头像、账户菜单、全站导航结构。
4. **不要删除**已有背景视频、全站导航和 Footer。
5. 完成后**停止**，并明确列出本阶段改了哪些文件。
6. 未经用户确认，不得擅自「最终美化」整页。

---

## 10. 路线图

### 阶段 1–5 — 已完成 ✓

| 阶段 | 目标 | 状态 |
|------|------|------|
| 1 | 七模块 HTML/CSS 骨架、action-hero、暗色行动舱 | ✓ |
| 2 | 打卡表单、streak、徽章、证书/历史 dialog | ✓ |
| 3 | 30 志愿活动、3 卡轮换、报名/记录 | ✓ |
| 4 | 捐款叙事面板、感谢卡、ImpactStoryCarousel | ✓ |
| 5 | 暗色 glass 精修、响应式、smoke、a11y、文档 | ✓ |

**验收脚本：**

- `node scripts/verify-action-checkin.mjs`
- `node scripts/verify-action-volunteer.mjs`
- `node scripts/verify-action-donation.mjs`
- `node scripts/verify-action-page.mjs`

---

### 阶段 6+ — 精修 backlog（待用户指定子阶段）

对应 §4 十条问题，**每次只做一个子方向**，示例拆分（最终子阶段编号以用户对话为准）：

| 方向 | 对应 §4 | 精修要点（不写死视觉方案） |
|------|---------|---------------------------|
| 6A 打卡仪式感 | #2 #3 | 减表单堆叠感；强化 streak / 勋章 / 证书 moment |
| 6B 志愿任务站 | #4 | 任务卡层级、摄影封面、进度条气质；区别于普通活动 listing |
| 6C 公益支持舱 | #5 | 左栏资金叙事 vs 右栏 pill 表单；与志愿模块色差 |
| 6D 成果轮播 | #6 | 单卡影响力、摄影比例、counter 叙事 |
| 6E 个人档案 | #7 | `#personal-action-archive` 入口可见性与 hover |
| 6F 紧凑排版 | #8 #9 | section 间距、Hero 高度、主面板 ≤1 屏；按钮/输入/卡片细节 |
| 6G 功能生态 polish | #10 | 历史/证书/勋章/记录入口一致性（不改 schema） |

**阶段 6+ 禁止：** 加长页面、恢复大日历主视觉、志愿/捐款双轮播、加载旧 `action-page.js`、改 localStorage schema（除非用户明确要求）。

---

## 11. 与相关文档的分工

| 文档 | 管什么 |
|------|--------|
| **本文档** | 气质、禁止项、行动舱 Token、排版、功能总目标、分阶段执行 |
| [`ACTION_PAGE.md`](ACTION_PAGE.md) | DOM hook、localStorage schema、积分规则、附录 G 实现清单 |
| [`ACCOUNT_SYSTEM_RULES.md`](ACCOUNT_SYSTEM_RULES.md) | 头像、登录、账户菜单（本页不改） |
| [`PAGE_STRUCTURE.md`](PAGE_STRUCTURE.md) | 全站页面结构与路由 |
| [`DESIGN.md`](../DESIGN.md) | 全站品牌色、glass、圆角、阴影上限 |

---

## 12. 修订记录

| 日期 | 版本 | 说明 |
|------|------|------|
| 2026-07-21 | 1.0 | 首版：五阶段路线图与行动舱 Token |
| 2026-07-21 | **2.0** | 用户精修 brief 完整沉淀：§2 范围锁定、§4 新 backlog、排版 72–96px / Hero 520–620px、禁止项扩充、七模块与 `ocean-action-*` 对齐、阶段 1–5 完成 + 阶段 6+ backlog |
