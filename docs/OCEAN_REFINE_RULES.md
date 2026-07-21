# 「我们的海洋」· 精修协作规则

## 0. 文档状态

| 项 | 内容 |
|----|------|
| 版本 | 1.0 |
| 状态 | 生效中（后续「我们的海洋」每一阶段精修前必读） |
| 最近更新 | 2026-07-21 |
| 适用范围 | [`pages/ocean.html`](../pages/ocean.html)、[`assets/css/ocean-page.css`](../assets/css/ocean-page.css)、[`assets/js/ocean-dashboard.js`](../assets/js/ocean-dashboard.js)、[`assets/js/mock-data.js`](../assets/js/mock-data.js)（本页五大洋数据） |
| 角色 | 视觉气质、禁止项、页面 Token、排版、功能目标、分阶段执行 |
| 功能与数据契约 | 模块、A.1–A.3 指标见 [`OCEAN_PAGE.md`](OCEAN_PAGE.md) |
| 全站设计基准 | [`DESIGN.md`](../DESIGN.md)（品牌色 / glass / 版心上限） |
| 账户系统 | 右上角头像 / 登录相关 **不在本页精修范围**，见 [`ACCOUNT_SYSTEM_RULES.md`](ACCOUNT_SYSTEM_RULES.md) |

**冲突优先级（海洋页相关）：** 用户当前对话明确要求 → `AGENTS.md` → **本文档**（气质 / 紧凑 / 禁止 / 分阶段）→ `OCEAN_PAGE.md`（功能与 A.1–A.3）→ `DESIGN.md`（全站 token）→ 其他专项文档。

**协作角色：** 优化本页时，以深耕前端网页开发、UI 界面设计、交互体验设计和网页美术设计 30 年以上的资深产品经理与视觉顾问标准执行——高级、克制，具有海洋纪录片气质与科研报告感。

---

## 1. 页面定位

英文名：**Ocean System Overview**  
中文名：**我们的海洋 / 海洋系统认知页**

本页不是后台 Dashboard，不是普通科普长文页，不是 AI Landing Page。  
它应该是一个**高级、克制、具有海洋纪录片气质和科研报告感**的海洋系统总览页面。

用户进入页面后应快速理解：

1. 海洋为什么是地球生命系统的核心。
2. 海洋如何调节气候、碳循环、氧气与热量。
3. 当前有哪些关键观测数据。
4. 五大洋分别有什么生态与地理特征。
5. 可以继续进入污染、生命、行动等页面。

---

## 2. 本次只修「我们的海洋」页面

**只优化当前页面以下区块：**

| 区块 | 说明 |
|------|------|
| Hero | 地球的蓝色系统，始终在呼吸。 |
| 深蓝数据区 | 一片海，如何调节一颗星球的呼吸？ |
| Ocean Explorer | 五大洋档案切换。 |
| Footer | 继续探索入口。 |

**不要修改：**

- 登录头像
- 账户菜单
- 其他页面
- 生物档案页（[`pages/species.html`](../pages/species.html)）
- 海在呼救页（[`pages/rescue.html`](../pages/rescue.html)）
- 行动中心页（[`pages/action.html`](../pages/action.html)）

右上角头像 / 登录相关功能不要动。

---

## 3. 气质关键词

| 关键词 | 含义 |
|--------|------|
| 深海蓝 | 页面主色调，冷静、深邃 |
| 海浪背景视频 | 全页固定背景，不可删除 |
| 科研报告感 | Apple Environmental Report 式高级排版 |
| 海洋纪录片感 | National Geographic 式自然叙事 |
| 高级自然叙事 | 克制、有呼吸感，非营销堆叠 |
| 五大洋探索 | Explorer 为核心交互，应靠前、易达 |
| 数据克制 | 指标清晰但不堆砌 Dashboard |
| 图文比例舒适 | 左文右图 / 双栏比例协调 |
| 滚动成本低 | 压缩无效纵向高度与间距 |

---

## 4. 当前问题（精修 backlog）

当前页面已有一定高级感，但存在以下问题，后续阶段按需逐项解决：

1. Hero 高度偏大，首屏信息密度偏低。
2. 深蓝数据区太高，用户滚动成本高。
3. 数据区像长报告，缺少一屏内完成理解的效率。
4. Ocean Explorer 位置太靠后，用户要滚很久才能进入核心交互。
5. Section 之间纵向间距偏大。
6. 数据区内部有些信息重复，可以合并。
7. Ocean Explorer 虽然好看，但图文卡可以更像「探索工作台」。
8. Footer 可以更紧凑，减少页面结尾的拖沓。
9. 页面功能生态还可以补充：锚点跳转、数据来源说明、五大洋切换、详情弹层、继续探索路径等。

---

## 5. 绝对禁止

1. 删除或破坏海浪背景视频。
2. 改成普通白底网页。
3. 改成后台 Dashboard。
4. 大量使用白色圆角卡片。
5. 使用 AI Landing Page 式紫蓝渐变。
6. 大面积强阴影。
7. 让页面变得更长。
8. 把 Ocean Explorer 往后推。
9. 复制其他页面版式。
10. 修改登录头像与账户逻辑。
11. 破坏现有导航和 Footer。
12. 出现文字遮挡、图片溢出、z-index 层叠错误。
13. 产生横向滚动条。

---

## 6. 必须保留的网站风格

修改本页时必须保持：

- 深海蓝色系
- 海浪视频背景
- 半透明遮罩
- 科研报告感
- Apple Environmental Report 式高级排版
- National Geographic 式自然叙事
- 克制的蓝色高亮
- 细线分割
- 高质量海洋图片
- 清晰的数据层级
- 留白，但不能稀疏

### 6.1 推荐视觉变量

本页精修优先使用以下 token（与 `ocean-page.css` 对齐；全站冲突时 `DESIGN.md` 为准）：

```css
--deep: #031426;
--deep-soft: rgba(3, 20, 38, 0.72);
--deep-panel: rgba(4, 22, 39, 0.78);
--light-bg: #EAF5F7;
--light-panel: rgba(234, 245, 247, 0.72);
--ink: #08233D;
--text-light: #F2F8FA;
--text-muted: rgba(242, 248, 250, 0.68);
--blue: #4DA3FF;
--cyan: #55D6C2;
--warning: #DFAE4D;
--line-light: rgba(255, 255, 255, 0.12);
--line-dark: rgba(7, 30, 48, 0.12);
```

---

## 7. 全局排版要求

| 项 | 要求 |
|----|------|
| 内容最大宽度 | `max-width: 1180px; margin: 0 auto;` |
| 桌面端左右安全边距 | `padding-left/right: 48px` |
| Hero 高度 | 不要超过 `78vh`；建议 `68vh`–`74vh` |
| Section 间距 | 从偏大的 `110px+` 压缩到 `72px`–`96px` |
| Hero title | `56px`–`64px` |
| Section title | `34px`–`44px` |
| 正文 | `15px`–`16px`；`line-height: 1.65`–`1.75` |
| 辅助说明 | `12px`–`13px`；必须可读，不能太淡 |

---

## 8. 最终功能目标

本页最终需要具备：

### 8.1 Hero 锚点跳转

- 海洋数据
- 五大洋档案
- 继续探索

### 8.2 深蓝数据区

- 核心指标展示
- 趋势图
- 公开观测网格
- 数据来源说明
- 刷新时间 / 模拟刷新

### 8.3 Ocean Explorer

- 五大洋 tab 切换
- 图片和文字联动
- 查看完整档案
- 数据来源说明
- 上一项 / 下一项切换
- 键盘可访问性

### 8.4 继续探索入口

- 海在呼救
- 生物档案
- 行动中心

### 8.5 响应式

- 桌面端视觉高级
- 平板端不拥挤
- 移动端可读、可点、无横向溢出

---

## 9. 执行规则

1. **每次只完成用户当前要求的阶段。**
2. **不要顺手做下一阶段。**
3. **不要大规模重构无关文件。**
4. **不要修改登录头像与账户功能。**
5. 修改 [`pages/ocean.html`](../pages/ocean.html) 或 `assets/css/ocean-page.css` / `assets/js/ocean-dashboard.js` 前，必须先读 **本文档** + [`OCEAN_PAGE.md`](OCEAN_PAGE.md) + [`DESIGN.md`](../DESIGN.md)。
6. 修改页面视觉或 `assets/css/**` 前必须先读 lancun-design Skill（工具用法）。
7. 完成后停止，并说明本阶段改了哪些文件。
8. 涉及布局 / Explorer / Footer 改动后，建议跑 `node scripts/verify-ocean-compact.mjs`（若可用）再汇报。

---

## 10. 与 OCEAN_PAGE 边界

精修不得破坏 [`OCEAN_PAGE.md`](OCEAN_PAGE.md) 已锁定内容：

| 项 | 边界 |
|----|------|
| A.1–A.3 数据契约 | 6 张 metric 卡、4 卡 + CO₂ 折线、五大洋小看板 **不得删除或偷换指标** |
| 污染数据 | **禁止**出现在本页；归 [`pages/rescue.html`](../pages/rescue.html) |
| 可拖动地球 / 三节点 | **已删除**，精修不得恢复 |
| 账户系统 | 归 [`ACCOUNT_SYSTEM_RULES.md`](ACCOUNT_SYSTEM_RULES.md) |
| 信息架构锚点 | `#ocean-brief`、`#five-oceans`、`#next-reading` 保持可链 |

精修可以在 **不改变数据契约** 的前提下调整：布局紧凑度、间距、Explorer 工作台感、Footer 紧凑度、锚点与交互补充。

---

## 11. 关联文件

| 文件 | 用途 |
|------|------|
| [`pages/ocean.html`](../pages/ocean.html) | 页面结构 |
| [`assets/css/ocean-page.css`](../assets/css/ocean-page.css) | 页面样式 |
| [`assets/js/ocean-dashboard.js`](../assets/js/ocean-dashboard.js) | KPI、Explorer、视频速率 |
| [`assets/js/mock-data.js`](../assets/js/mock-data.js) | 五大洋与静态数据 |
| [`scripts/verify-ocean-compact.mjs`](../scripts/verify-ocean-compact.mjs) | 布局 / Footer / 溢出回归 |
| [`docs/OCEAN_PAGE.md`](OCEAN_PAGE.md) | 功能宪法与附录 A |
| [`refines/我们的海UI-连续叙事验收.md`](../refines/我们的海UI-连续叙事验收.md) | 连续叙事版验收基准 |

---

## 变更记录

| 日期 | 版本 | 说明 |
|------|------|------|
| 2026-07-21 | 1.0 | 初版：沉淀「我们的海洋」精修提示词为协作规则 |
