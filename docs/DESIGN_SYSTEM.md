# 设计系统

## 文档状态

- 版本：**4.0**
- 状态：已同步根目录 [`DESIGN.md`](../DESIGN.md)（大疆摄影风·通透海水蓝）
- 变更：v4 取代 v2.3 token；移除全站光池/caustics 装饰（2026-07-17）

**权威规范：** 项目根目录 **`DESIGN.md`**。本文档为 CSS 实现 mirror。

## 1. 色彩 token

| Token | 值 |
|---|---|
| `--brand-primary` | `#3B82F6` |
| `--brand-hover` | `#60A5FA` |
| `--brand-strong` | `#2563EB` |
| `--brand-secondary` | `#1E3A8A` |
| `--mist-from` / `--mist-to` | `#F0F9FF` / `#E0F2FE` |
| `--bg-abyss` → `--bg-sea-lit` | `#0F172A` → `#1E3A8A`（深底渐变） |
| `--accent-sparkle` | `#5EEAD4`（仅小面积） |
| `--ink` / `--ink-muted` | `#0F172A` / `#334155` |
| `--glass-sea` | `rgba(59, 130, 246, 0.12)` |
| `--glass-blur` | `20px` |

主 UI 仍禁止 `#0EA5E9`、`#4CCEE0` 等 teal 大面积叙事。

## 2. 质感

- 圆角：`--radius` 12px，`--radius-shell` 16px
- 阴影：`--shadow-soft` 柔光弥散（见 `DESIGN.md` §2）
- 玻璃：blur 20px + 10–15% 主色透明 + 浅蓝白 border

## 3. 布局

- `--page-width`: `75rem`（1200px）
- body 行高：`1.65`

## 4. 动效

- `--duration-ui`: `250ms`；hover `translateY(-2px)`

## 5. 废弃（v2.3）

- `body::after` 全站光池、`ocean-caustics` 展示已关闭
- `#ocean-explore` 深色 Convex 沉浸例外已撤销（2026-07-18）

## 5.1 `#ocean-explore`（v4 对齐，无例外）

| 项 | 实现 |
|---|---|
| Section 底 | `--mist-from` → `--mist-to` 浅海雾渐变 |
| 左栏 | `.page-island` / `--surface-elevated` + `--ink` |
| WebGL clear | 不透明 `0xe0f2fe`（`--mist-to`），禁止 alpha=0 白屏 |
| 布局 | 见 `docs/OCEAN_EXPLORE_CONSTITUTION.md` |

## 6. 相关

- [`DESIGN.md`](../DESIGN.md) · [`.codexrules`](../.codexrules) · [`DATA_SOURCES.md`](DATA_SOURCES.md) · [`OCEAN_EXPLORE_CONSTITUTION.md`](OCEAN_EXPLORE_CONSTITUTION.md)
