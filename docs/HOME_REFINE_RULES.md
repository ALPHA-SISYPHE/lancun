# 澜存首页 · 精修协作规则

## 0. 文档状态

| 项 | 内容 |
|----|------|
| 版本 | 1.0 |
| 状态 | 生效中（后续首页每一阶段精修前必读） |
| 最近更新 | 2026-07-21 |
| 英文名 | Lancun Ocean Protection |
| 中文名 | 澜存海洋保护首页 |
| 适用范围 | [`index.html`](../index.html)、[`assets/css/home.css`](../assets/css/home.css)、[`assets/js/hero.js`](../assets/js/hero.js)、[`assets/js/ocean-explore-bg.js`](../assets/js/ocean-explore-bg.js)、[`assets/js/globe/**`](../assets/js/globe/)；[`assets/js/mock-data.js`](../assets/js/mock-data.js) 仅当首页五大洋数据需要时 |
| 角色 | 视觉气质、禁止项、页面 Token、排版、功能目标、分阶段执行 |
| 全站设计基准 | [`DESIGN.md`](../DESIGN.md)（品牌色 / glass / 版心上限） |
| 账户系统 | 右上角头像 / 登录相关 **不在首页精修范围**，见 [`ACCOUNT_SYSTEM_RULES.md`](ACCOUNT_SYSTEM_RULES.md) |
| 历史文档 | [`OCEAN_EXPLORE_CONSTITUTION.md`](OCEAN_EXPLORE_CONSTITUTION.md) 已废止；首页现行以 **本文档** 为准 |

**冲突优先级（首页相关）：** 用户当前对话明确要求 → `AGENTS.md` → **本文档**（气质 / 禁止 / Token / 分阶段）→ `DESIGN.md`（全站 token）→ `PAGE_STRUCTURE.md` → 其他专项文档。

**协作角色：** 优化首页时，以深耕前端网页开发、UI 界面设计、交互体验设计和网页美术设计 30 年以上的资深产品经理与视觉顾问标准执行——高级、克制、自然、沉浸，具有海洋纪录片气质，**不是 AI Landing Page**。

---

## 1. 页面定位

首页不是后台页面，不是普通宣传页，不是 AI Landing Page。

首页是整个网站的**沉浸式入口**，承担「进入网站世界观」的作用：

1. **第一屏** — 海面视频建立情绪和品牌记忆。
2. **第二屏** — 可交互地球引导用户探索五大洋。
3. 用户点击五大洋热点后，看到对应简介（后续阶段）。
4. 用户可跳转到「我们的海洋」页面对应五大洋 tab。
5. 首页连接 Hero → 探索 → 子页，而非堆叠信息 Dashboard。

### 1.1 气质关键词

| 关键词 | 含义 |
|--------|------|
| 沉浸 | 双视频全屏/近全屏，少打断 |
| 海浪 | Hero 与 explore 区海水质感 |
| 地球 | 第二屏核心交互物体 |
| 五大洋 | 标记与后续简介卡主题 |
| 探索 | 拖动、点击、进入子页 |
| 守护 | 文案与品牌叙事 |
| 高级 | Apple Environmental Report 式排版 |
| 克制 | 无 AI 紫蓝、无强阴影堆叠 |
| 自然 | National Geographic 式纪录片叙事 |
| 交互入口 | 地球 + CTA，非静态海报 |

---

## 2. 本次只修首页

**白名单（可改）：**

| 文件 / 区域 | 说明 |
|-------------|------|
| [`index.html`](../index.html) | HeroOceanIntro + OceanGlobeExplorer（双视频满屏，无 footer） |
| [`assets/css/home.css`](../assets/css/home.css) | 首页专用样式与 Token |
| [`assets/js/hero.js`](../assets/js/hero.js) | Hero 视频与滚动引导 |
| [`assets/js/ocean-explore-bg.js`](../assets/js/ocean-explore-bg.js) | 第二屏背景视频 |
| [`assets/js/globe/**`](../assets/js/globe/) | 地球渲染、标记、控制（不破坏自转/拖拽契约） |

**不要修改：**

- 我们的海洋页（[`pages/ocean.html`](../pages/ocean.html)）
- 海在呼救页（[`pages/rescue.html`](../pages/rescue.html)）
- 生物档案页（[`pages/species.html`](../pages/species.html)）
- 行动中心页（[`pages/action.html`](../pages/action.html)）
- 登录头像、账户菜单、[`user-menu-html.js`](../assets/js/user-menu-html.js) 及 `app.js` 账户逻辑
- 其他页面业务逻辑

右上角头像 / 登录相关功能**不要动**。

---

## 3. 当前结构（目标骨架）

保留两个全屏 section，无 footer；站点导航由顶栏 + 第二屏 `home-continue` 承担：

```html
<main class="home-page">
  <section class="hero-ocean-intro"></section>
  <section class="ocean-globe-explorer"></section>
</main>
```

**实现映射（现行 DOM，精修时可逐步对齐类名）：**

| 逻辑区块 | 现行选择器 / id | 内容 |
|----------|-----------------|------|
| HeroOceanIntro | `.video-hero` | 全屏海面视频；LANCUN OCEAN PROTECTION / 同守澜海 / 生机永续 |
| OceanGlobeExplorer | `#ocean-explore` / `[data-ocean-explore]` | 第二屏视频 + 左文案 + 右 WebGL 地球 + `home-continue` 探索链接 |

**Section 1 — HeroOceanIntro**

- 高度：`var(--home-screen)`（JS 同步 `window.innerHeight`，fallback `100svh`；两屏物理高度与可滚视口一致）
- 中间文案：`.hero-content--framed` 左上/右下 L 形框（2px、`clamp(3.75rem, 10vw, 5.75rem)` 臂长）；标题与描述用 **LXGW WenKai Screen**（jsDelivr CDN，SIL OFL；仅 Hero 展示层例外；全站基准仍为 Inter + Noto Sans SC）
- 引导：「探索海洋世界 ↓」→ 滚至 `max(section.offsetTop, scrollHeight - clientHeight)` 并 snap；Hero pin/unpin 由 `scrollY` 控制（非 IO）；首页 `scroll-margin-top: 0`

**Section 2 — OceanGlobeExplorer**

- 高度：`min-height: 100vh`
- 布局：左 0.42 / 右 0.58（推荐 `max-width: 1180px`，`gap: 72px`）
- 左侧：默认总介绍文案 + **预留**海洋简介卡片区域
- 右侧：保留现有地球模型、铅垂轴自转与拖动

**背景拼接**

- 页面背景仅由 Hero 视频与第二屏海洋视频上下拼接组成
- 不保留底部 footer 深色条；`body.home-page` 屏蔽全局深色渐变，避免视频边缘露出细条
- Hero 与第二屏之间不使用底部过渡暗带（已移除 `hero-ocean-intro::after`）

---

## 4. 必须保留的视觉风格

1. 第一屏全屏海面视频（[`hero.mp4`](../assets/media/hero.mp4)）。
2. 第二屏海水 / 海面视频背景（[`ocean-explore-bg.mp4`](../assets/media/ocean-explore-bg.mp4)）。
3. 深海蓝与青绿色海水质感。
4. 海洋纪录片气质 + National Geographic 式自然叙事。
5. Apple Environmental Report 式高级排版。
6. 半透明内容层（遮罩克制，非实色大块）。
7. 克制的白色文字。
8. 细线和轻边框。
9. 高级、冷静、沉浸、**不 AI**。

Hero 遮罩参考（精修时优先）：

```css
.hero-overlay {
  background: linear-gradient(
    to bottom,
    rgba(3, 18, 34, 0.18) 0%,
    rgba(3, 18, 34, 0.28) 45%,
    rgba(3, 18, 34, 0.56) 100%
  );
}
```

标题字距要高级，不能像普通大字报；主标题视觉中心略高于几何中心，避免压到海浪区域。

---

## 5. 绝对禁止

1. 删除两个背景视频（Hero + explore）。
2. 把首页改成普通白底页面。
3. 把首页改成后台 Dashboard。
4. 使用大面积白色圆角卡片。
5. 使用紫蓝渐变 AI 风。
6. 使用强阴影。
7. 破坏地球自转和拖动功能。
8. 让 `+` 号热点固定在屏幕上而不跟着地球运动。
9. 点击 `+` 后没有任何反馈（后续阶段须补齐）。
10. 修改登录头像和账户系统。
11. 让页面变得更长、更拖沓。
12. 出现横向滚动、文字遮挡、图片拉伸、z-index 错误。

---

## 6. 设计 Token（首页优先）

本页精修优先使用以下 token（写入 [`home.css`](../assets/css/home.css) 或 `:root` 首页作用域；与全站冲突时 **本文档 Token 优先于 mirror**，但不得违背 `DESIGN.md` 品牌底线）：

```css
--deep: #031426;
--deep-soft: rgba(3, 20, 38, 0.68);
--deep-panel: rgba(4, 22, 39, 0.72);
--light-panel: rgba(234, 245, 247, 0.62);
--frost-panel: rgba(242, 248, 250, 0.56);
--line-light: rgba(255, 255, 255, 0.16);
--text-light: #F2F8FA;
--text-muted: rgba(242, 248, 250, 0.72);
--ink: #08233D;
--blue: #4DA3FF;
--cyan: #55D6C2;
```

---

## 7. 功能总目标（Binding · 分阶段落地）

首页**最终**须具备以下能力；未完成项在 §9 分阶段 backlog 中标注，**不得**在文档中假装已实现。

| # | 能力 | 状态 |
|---|------|------|
| 1 | 第一屏沉浸式全屏视频 Hero | 已有 |
| 2 | 第二屏互动地球 | 已有（globe v2） |
| 3 | 地球自动绕铅垂轴缓慢自转 | 已有 |
| 4 | 用户可拖动地球旋转（yaw） | 已有 |
| 5 | 五大洋位置有 `+` 号热点 | 已有 |
| 6 | 热点跟随地球旋转 | 已有 |
| 7 | 热点在地球背面时隐藏或弱化 | 待办 |
| 8 | hover 热点显示海洋名称 | 部分（现有 pin label） |
| 9 | 点击热点 → 左侧弹出对应海洋简介卡片 | **待办** |
| 10 | 当前热点高亮 | 待办 |
| 11 | 简介卡片可切换五大洋内容 | **待办** |
| 12 | 简介卡片「查看完整档案」→ 我们的海洋对应 tab | **待办** |
| 13 | 键盘可访问性 | 部分 |
| 14 | 移动端可用 | 待验收 |
| 15 | 无横向溢出 | 须每阶段自检 |
| 16 | 单一 CTA：探索海洋世界 ↓ | **已完成** |

---

## 8. 数据与深链契约

| 项 | 约定 |
|----|------|
| 五大洋数据 | `window.LANCUN_DATA.fiveOceans`（[`assets/js/mock-data.js`](../assets/js/mock-data.js)） |
| 字段 | `id`, `name`, `title`, `text`, `lat`, `lon`, `learnMoreHref`, `image`, `metrics` 等 |
| 子页 tab 深链 | `pages/ocean.html#ocean-{id}`（例：`#ocean-pacific`）— 与 [`ocean-dashboard.js`](../assets/js/ocean-dashboard.js) hash 逻辑一致 |
| Explorer 区块锚点 | `#ocean-explorer` |
| Globe 脚本入口 | [`assets/js/globe/index.js`](../assets/js/globe/index.js)；须保留 `data-globe-canvas`、`data-globe-canvas-wrap`、`data-ocean-explore` 等 boot 选择器 |

**禁止**在首页精修中擅自修改子页 tab 路由逻辑；仅消费既有深链格式。

---

## 9. 分阶段执行规则

1. **每次只完成用户指定的当前阶段**；不顺手做下一阶段。
2. **不要大规模重构无关页面**。
3. **不要修改登录头像与账户系统**。
4. 完成后**列出改动文件并停止**。
5. 修改 [`index.html`](../index.html) / [`home.css`](../assets/css/home.css) / [`globe/**`](../assets/js/globe/) 前**必须先读本文件**。

### 9.1 建议阶段划分（用户确认后执行）

| 阶段 | 范围 | 不做 |
|------|------|------|
| **P1 结构 / 视觉节奏** | section 高度、双视频层、Hero 遮罩与字距、42/58 布局、左侧卡片区预留、轻 footer、单一 CTA 完整滚动 | 五大洋点击简介卡 |
| **P2 地球交互** | 热点背面隐藏、点击高亮、hover 名称统一 | 子页跳转文案 |
| **P3 简介卡片** | 左侧卡片切换、查看完整档案、深链 `#ocean-{id}` | 气泡 / 大陆架 |
| **P4 验收** | 桌面 / 窄屏 / reduced-motion、Playwright 或目视清单 | — |

---

## 10. 自检清单（每阶段完成后）

- [ ] 两个背景视频均可见（或减动效降级合理）
- [ ] Hero `100vh`，第二屏 `min-height: 100vh`，页面未无故变长
- [ ] 左文案可读，右地球位置舒适，无横向溢出
- [ ] 地球可见、可拖、可慢速自转；Console 无阻塞错误
- [ ] `+` 标记随球转（非屏幕固定）
- [ ] 未改动账户头像 / 菜单 / 其他子页
- [ ] 本阶段目标项可勾选；**未做项仍标为待办**

---

## 11. 与废止文档的关系

[`OCEAN_EXPLORE_CONSTITUTION.md`](OCEAN_EXPLORE_CONSTITUTION.md) 与 [`OCEAN_EXPLORE_CONVEX_PLAN.md`](OCEAN_EXPLORE_CONVEX_PLAN.md) 中关于气泡金标、copyH×1.12 座位等条文**已废止**，仅作历史参考。  
现行首页地球为 **globe v2**（[`assets/js/globe/`](../assets/js/globe/)），座位与交互以本文档 + 当前实现为准。
