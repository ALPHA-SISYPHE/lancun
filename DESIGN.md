# 澜存设计规范 · 大疆摄影风·通透海水蓝

## 文档状态

- **版本：** v1.0（2026-07-17）
- **地位：** 项目根目录 **最终设计基准**；实现 mirror 见 `docs/DESIGN_SYSTEM.md` v4.0
- **骨架来源：** Vercel 设计分析（间距阶梯、组件状态机、外松内紧）— 仅结构，不抄 Vercel 黑白/mesh 色
- **字体：** Inter + Noto Sans SC

---

## 1. 色彩体系

| 角色 | Token / 值 | 说明 |
|------|------------|------|
| 主色 | `#3B82F6` | `--brand-primary` 清透远洋蓝（雾感取向，相对标准蓝降饱和约 15%） |
| 主色 hover | `#60A5FA` | `--brand-hover` |
| 主色 pressed | `#2563EB` | `--brand-strong` |
| 浅雾渐变起 | `#F0F9FF` | `--mist-from` 薄雾浅蓝 |
| 浅雾渐变止 | `#E0F2FE` | `--mist-to` 深海雾蓝 |
| 深底渐变起 | `#0F172A` | `--bg-abyss` |
| 深底渐变止 | `#1E3A8A` | `--bg-sea-lit` |
| 点缀 | `#5EEAD4` | `--accent-sparkle` **仅**小面积（badge、pin 微光） |
| 正文墨 | `#0F172A` | `--ink`（白岛内） |
| 次要字 | `#334155` | `--ink-muted` |
| 深底上的字 | `#FFFFFF` | `--on-dark` |
| 原则 | — | 禁止高饱和浓艳；统一雾感通透 |

**禁止作主叙事 UI 的色：** `#0EA5E9`、`#4CCEE0`、`#0B4151`、`#22E2D4` 等大面积/teal 主按钮。

---

## 2. 质感规范

### 玻璃卡片

- 背景透明度：**10%–15%**（深色底上 `rgba(59, 130, 246, 0.10–0.15)`）
- 模糊：**20px** — `backdrop-filter: blur(20px) saturate(130%)`
- 边框：**1px** 浅蓝白 — `rgba(255, 255, 255, 0.25)` 或 `rgba(191, 219, 254, 0.5)`
- **无**厚重阴影

### 阴影（柔光弥散）

- 卡片/白岛：`0 4px 24px rgba(15, 23, 42, 0.08), 0 1px 2px rgba(15, 23, 42, 0.04)`
- 叠加 inset：`box-shadow: inset 0 0 0 1px rgba(15, 23, 42, 0.06)`（可选）

### 圆角

| 用途 | 值 | Token |
|------|-----|--------|
| 全局控件/卡片 | **12px** | `--radius` |
| 大卡片/白岛 | **16px** | `--radius-shell` |
| Pill 按钮 | 999px | `--radius-pill`（克制使用） |

---

## 3. 排版规范

基于 Vercel 字号阶梯，**行高加大**（body `line-height: 1.65`）。

| 层级 | 尺寸 | 字重 | 行高 | 用途 |
|------|------|------|------|------|
| display-xl | clamp(2.5rem, 8vw, 3rem) | 600 | 1.05 | Hero 主标题 |
| display-lg | clamp(1.75rem, 4vw, 2rem) | 600 | 1.15 | 区块标题 |
| display-md | 1.5rem | 600 | 1.25 | 卡片标题 |
| body-lg | 1.125rem | 400 | 1.65 | 导语 |
| body-md | 1rem | 400 | 1.65 | 正文 |
| body-sm | 0.875rem | 400 | 1.5 | 导航/次要 |
| caption | 0.75rem | 600 | 1.4 | eyebrow |

- **字重对比：** 标题粗、正文细；符合大疆极简科技感。
- **版心：** 最大宽度 **1200px**（`--page-width: 75rem`）；桌面左右留白 ≥ **32px**。

---

## 4. 间距体系（Vercel 4px 基准）

| Token | px | rem 参考 |
|-------|-----|----------|
| xs | 8 | 0.5 |
| sm | 12 | 0.75 |
| md | 16 | 1 |
| lg | 24 | 1.5 |
| xl | 32 | 2 |
| 4xl | 64 | 4 |
| 5xl | 96 | 6 |

**外松内紧：** 区块间距 64–96px；卡片内 24–32px；标题与正文 8px；标题与 CTA 24px+。

---

## 5. 动效规范

- 过渡：**200–300ms**，`ease` 或 `cubic-bezier(0.4, 0, 0.2, 1)`
- Hover：**translateY(-2px)** + 透明度略变（如 `opacity: 0.92`）
- **禁止：** 夸张 scale 弹跳、heavy spring
- `prefers-reduced-motion` / profile 减动效：关闭装饰动画与长过渡

---

## 6. 组件与交互（保留 Vercel 逻辑）

- **导航：** 左品牌 / 中链接 / 右账户；overlay 深底上白字
- **按钮：** primary / secondary / ghost；触摸区 ≥ **44×44px**
- **卡片：** inset hairline + 轻 stack 阴影，不堆玻璃

---

## 7. 澜存页面模式

- **默认：** 深底渐变 `#0F172A → #1E3A8A` + 透明顶栏 + **白圆角内容岛**（`--radius-shell`）
- 浅雾渐变 `#F0F9FF → #E0F2FE` 用于岛内浅底、标签、`.tag`，**不把全站改成暖白内页**
- **`#ocean-explore`：** **无视觉例外**。对齐全站 v4——通透海水蓝浅底（`--mist-from` → `--mist-to`）+ 左栏白内容岛（`--surface-elevated` / `.page-island`）+ 右栏浮空交互地球。禁止再使用深海军 `#0F172A → #1E3A8A` 作为该 section 主背景或白字落深底文案模式。构图仍可参考 Convex（左文右球），色/质以本文件为准。

---

## 8. CSS 变量映射（`:root`）

```text
--brand-primary:     #3B82F6
--brand-hover:       #60A5FA
--brand-strong:      #2563EB
--brand-secondary:   #1E3A8A
--mist-from:         #F0F9FF
--mist-to:           #E0F2FE
--surface-mist:      #E0F2FE
--bg-abyss:          #0F172A
--bg-sea-mid:        #1E293B
--bg-sea-lit:        #1E3A8A
--accent-sparkle:    #5EEAD4
--glass-sea:         rgba(59, 130, 246, 0.12)
--glass-blur:        20px
--glass-border:      rgba(255, 255, 255, 0.25)
--ink:               #0F172A
--ink-muted:         #334155
--shadow-soft:       0 4px 24px rgba(15,23,42,0.08), 0 1px 2px rgba(15,23,42,0.04)
--radius:            12px
--radius-shell:      16px
--radius-pill:       999px
--page-width:        75rem
--ease-ui:           cubic-bezier(0.4, 0, 0.2, 1)
--duration-ui:       250ms
```

---

## 9. 废弃与不再扩展

- v2.3 **全站慢动光池**（`body::after`）已移除
- `#ocean-explore` **caustics** 动画已关闭（少装饰原则）
- `#ocean-explore` **深色 Convex 沉浸例外**已撤销（见 §7）；不得恢复深底例外而不改宪法
- 不新增无叙事意义的装饰动画

---

## 10. ui-ux-pro-max 参考摘录（实施时检索）

- **Glassmorphism：** backdrop blur 10–20px；澜存采用 **20px** + 主色 10–15% 透明度（非艳底 + 30% 白）
- **Minimalism：** 大留白、网格清晰、仅必要元素
- **色彩检索：** low saturation blue mist — 映射上表，不抄 Neon 色

完整调用命令见 `.cursor/skills/lancun-design/reference-ui-ux-pro-max.md`。

---

## 11. 开发调用方式

**写页面前（一句即可）：**

> 基于项目 DESIGN.md 规范，实现首页主视觉 Banner 区域，保持大疆海水蓝通透质感。

（将「首页主视觉 Banner」替换为当前任务。）

**质感不对时：**

> 检查当前页面样式，不符合 DESIGN.md 规范的地方全部修正，强化通透玻璃感和留白呼吸感。

---

## 12. 相关文件

| 文件 | 作用 |
|------|------|
| `.codexrules` | Codex 强制规则（与本文一致） |
| `AGENTS.md` | Cursor/Codex 协作优先级 |
| `docs/DESIGN_SYSTEM.md` | v4 实现 mirror |
| `assets/css/base.css` | token 落地 |
