# `#ocean-explore` 视觉 / 布局宪法（Binding Law）

| 项 | 内容 |
|---|---|
| 版本 | **1.6** |
| 地位 | `#ocean-explore` **绑定视觉与布局法**；与本文件冲突时，以本文件为准（用户当场口头例外除外） |
| 创建 | 2026-07-18 |
| 修订 | 2026-07-18 — **v1.6**：**桌面垂直对齐** — 球心屏幕 Y = 白岛 `[data-ocean-panel]` **垂直中心**（±2% canvas 高）；锚点 A、**仅桌面 ≥59rem**；移动端 Y 回退 canvas 50%。保留 v1.5 直径 ×1.12、v1.4 球心 X 69%、v1.3 自转 |
| 参考 | Convex「Where we are working」**仅借构图**（左文右球、浮空球、前后气泡）；色/质跟 `DESIGN.md` v4 |
| 本地验收 | `http://127.0.0.1:8080/index.html#ocean-explore` |
| 关联 | `docs/OCEAN_EXPLORE_CONVEX_PLAN.md`（任务书）、根目录 `DESIGN.md`（全站色/质，**本 section 无例外**） |

---

## 0. 何时生效

任何对 `#ocean-explore` 的 HTML / CSS / `assets/js/globe/**` 改动，**必须先读本文件**，再按 §6 自检仪式执行。  
未通过自检，不得进入下一阶段。

---

## 1. Layout law（黄金比例水平分割）

| 规则 | 要求 |
|---|---|
| 分割比 | 桌面端水平 **左 ≈ 38% / 右 ≈ 62%**（φ 近似：`1 : 1.618` → `38.2% : 61.8%`） |
| 左栏（小） | **白内容岛**承载文案 + CTA；不抢地球主体 |
| 右栏（大） | **地球作为可交互浮空物体的取景区**；不得把地球当全屏壁纸 |
| **右区中央（硬性 · v1.4）** | 「右半区」= **整屏 / section canvas 全宽** 上 `x ∈ [0.38, 1.0]`；球心投影目标 **`x = 0.69`**（`0.38 + 0.62/2`）。**禁止**以 `.ocean-explore__stage` / `page-width` 内栏中心作为球心锚点（stage 仅 CSS 占位） |
| **美术匹配尺度（硬性 · v1.5）** | 主锚：左白内容岛 `.ocean-explore__copy` / `[data-ocean-panel]` 的 `getBoundingClientRect().height`（**不含** footer toggle）；目标直径 **`copyHeight × 1.12`**；随 resize / 字体 / intro-detail 切换 **实时重测** |
| **垂直对齐（硬性 · v1.6 · 桌面）** | 桌面 `≥59rem`：球心屏幕 **Y = 白岛 `[data-ocean-panel]` 垂直中心**（与 v1.5 同锚，**不含** footer）；容差 **±2% canvas 高**；`setViewOffset` Y 偏移 |
| **垂直对齐（移动端）** | `<59rem` stacked：**不强制** Y 对齐；球心 Y 保持 canvas **50%** |
| **完整球体 / 安全 cap（硬性 · v1.4→v1.5）** | `diameter_px ≤ min(artTarget, min(rightZoneW, rightZoneH) × 0.74)`；右区宽≈`0.62×canvasW`，高≈`canvasH`；留约 8–12% 安全边；**宁可略小，禁止裁切、禁止压住左白岛** |
| 实现 | CSS 列比可仍约 38/62；球心 X/Y 以 **整屏分数** + 白岛 rect 计算；直径以 **白岛高度 × 1.12** 为主；`ResizeObserver` 监听白岛 |
| 禁止 | 球心贴右缘裁切、球心 Y 固定 canvas 50% 而白岛已偏移（桌面）、只按右区高度放大导致压左岛、用内栏 stage 中心代替整屏 69% |
| 决策记录 | **球心 X 2026-07-18：Q1=C，Q2=A**；**尺度 2026-07-18：Q1=A，Q2=1.12**；**垂直 Y 2026-07-18：锚点 A，仅桌面 ≥59rem** |

**Earth is NOT background wallpaper; it is a discrete floating interactive 3D object inserted into the page.**

---

## 2. Z-layer law（深度分层 · 语义层 + Three.js 独立 render layers）

### 2.1 页面语义层（从底到顶）

| 语义层 | 内容 | 说明 |
|---|---|---|
| L0 | **通透海水蓝**背景 | Section CSS：`mist` / 浅海雾渐变（`--mist-from` → `--mist-to` 等 v4 token）；WebGL **不透明** `setClearColor` 须与该浅底一致（建议 `0xe0f2fe` / `--mist-to`）— **禁止**透明清屏导致 Chromium 白屏 |
| L1 | 部分玻璃气泡 **在地球后方** | 须能被地球遮挡或明显处于球后景深 |
| L2 | 地球（交互主体） | 离散球体；含云层、大气 rim、大陆架 overlay、`+` 标记 |
| L3 | 部分玻璃气泡 **在地球前方** | 叠在球前，液体玻璃可读（浅底上仍可见、不刺眼） |
| L4 | UI overlay | 白岛文案、大陆架 toggle、hint；`pointer-events` 见 §5 |

禁止把全部气泡画在同一层且永远盖住地球，却声称「有前后景深」。  
**禁止**再使用 `#0F172A → #1E3A8A` 深海军例外底作为本 section 主背景。  
**禁止**「深色例外」：本 section **无**深底白字例外；始终 v4 mist + 白内容岛。

### 2.2 Three.js `mesh.layers` 法（硬性 · v1.2）

地球与气泡 **不得** 共享同一个 Three.js `layers` mask。它们是 **独立 render layers**；遮挡靠 **多 pass + 共享 depth buffer**（或等价正确遮挡方案），**不是**把球后气泡和地球塞进同一 `layers` 位。

| Three.js layer | 内容 | 禁止 |
|---|---|---|
| **Layer 0** | **仅**地球组：球体、大气、云层、大陆架 shelves、挂在地球上的相关 mesh | **禁止**任何气泡 mesh 使用 layer 0 |
| **Layer 1** | **仅**球后气泡（back bubbles） | 不得与地球同 mask |
| **Layer 2** | **仅**球前气泡（front bubbles） | 不得与地球同 mask |

**合法渲染示意（绑定实现意图）：**

1. Pass A（可选 refraction）：camera 只开 layer 0 → 地球写入 RT（气泡不参与）  
2. Pass B：清屏（opaque mist）→ camera 只开 **layer 1** → 画球后气泡（可写/测 depth，按材质）  
3. Pass C：`autoClear = false` → camera 只开 **layer 0** → 画地球；**depth test** 遮挡球后气泡（视觉遮挡正确）  
4. Pass D：camera 只开 **layer 2** → 画球前气泡  

等价顺序（先地球写 depth，再画 layer 1 depth-tested 气泡）亦可，只要满足：

- 球后气泡被地球 **视觉遮挡正确**  
- 气泡 mesh **从不** `layers.set(0)` / 与地球同 mask  
- 球前气泡叠在地球之上可读  

若实现上「独立 layers + 正确遮挡」无法同时满足 → **STOP 并询问用户**（给出 2 个清晰选项），禁止硬拧。

**废止（v1.2）：** 旧法「Bubbles: back（layer 0 + depthTest）/ front（layer 1）」以及「Layer 0: earth + back bubbles 同 mask」——已废止。

---

## 3. Earth law（地球 · v1.3 独立自转）

| 规则 | 要求 |
|---|---|
| 尺度 | 投影直径 = **`min(copyPanelHeight × 1.12, min(右区宽, 右区高) × 0.74)`**（白岛美术匹配 + 安全 cap）；同时满足 §1 v1.5 |
| 球心 X | 整屏 **69%** 宽（v1.4）；`setViewOffset` X |
| **球心 Y（桌面 · v1.6）** | 球心屏幕 Y = 白岛 `[data-ocean-panel]` **垂直中心**；±2% canvas 高；`setViewOffset` Y |
| **球心 Y（移动）** | `<59rem`：canvas 垂直 **50%**（不强制跟白岛） |
| 形态 | 清晰球体轮廓；浮在 **整屏 69% 宽** 处；桌面与白岛 **同一高度线**；**完整轮廓可见** |
| **独立自转（硬性）** | 自动旋转 = 每帧递增 **`earthGroup.rotation.y`**（绕世界 / 铅垂 Y）；拖动 = 绕同一轴改 `rotation.y` |
| 自转轴 | **仅绕竖直 / 铅垂轴（世界 Y）**；**禁止**翻滚（tumble / 乱极角） |
| 相机 | 相机 **固定正对球心**（可微调 z）；**禁止**用 `OrbitControls.autoRotate` 或绕球转相机伪装自转 |
| 拖拽 | 自定义 pointer 拖 yaw（真正拖地球）；松手后延迟恢复自转；`prefers-reduced-motion` 时停自转，仍可拖 |
| 允许 | `+` 标记、云层、大气 rim、大陆架 mask（挂在 earthGroup，随球转） |
| 亮度 | 海洋/陆地在浅底上可读；适度提高曝光/灯光，**禁止**洗成死白 |
| 清屏 | 始终不透明浅海雾色（与语义 L0 一致），alpha `1` |

**废止（v1.3）：** 用 `OrbitControls.autoRotate` / polar lock 绕目标转相机充当「地球自转」。

---

## 4. Bubble law（气泡）

| 规则 | 要求 |
|---|---|
| 分布 | **全视口**（左文案区 + 右地球区），不是只挤在球旁一圈 |
| 材质 | 明显 **液体玻璃**（Apple 气质）：rim / 折射 / 通透 — **禁止**细线框空心环 |
| 强度 | 可见但克制；不压过地球与白岛（浅底上可略调 tint，仍禁过曝） |
| 动效 | 缓慢上浮 + 极轻漂移；**禁止**夸张 scale 呼吸 / 弹跳 |
| 分层 | 必须同时存在「球后」与「球前」实例；且遵守 §2.2 **独立 layers** |
| 降级 | `prefers-reduced-motion` 时停漂或静态摆放，仍须可见 |

---

## 5. UI law

| 规则 | 要求 |
|---|---|
| Toggle | **左下**；文案固定为「**大陆架分布**」 |
| Hint | **右下**（如「拖动旋转 · 点击 + 查看介绍」） |
| Overlay | 默认 `pointer-events: none`；仅 copy / toggle / 标记等可点区域 `pointer-events: auto` |
| Composer vignette | **默认 OFF**，直到用户明确要求后再开 |
| 文案 | 左栏 **白内容岛**（`page-island` / `--surface-elevated`）：深墨字（`--ink` / `--ink-muted`）；**禁止**白字落深底的例外样式 |

---

## 6. Self-check ritual（强制自检）

### 6.1 改之前（BEFORE）

1. 阅读本宪法全文  
2. 打开本地 `#ocean-explore`，截图（建议：`constitution-check-before.png`）  
3. 对照参考构图 + 下方清单，记下当前失败项  

### 6.2 改之后（AFTER）

1. 截图 `#ocean-explore`（建议：`constitution-check-after.png`）  
2. **逐条**勾选 §7 清单  
3. 任一项 FAIL → **先修**，再进入下一阶段  

---

## 7. Agent executable checklist（必须逐项打勾）

复制到回复 / 笔记中勾选：

```
BEFORE
[ ] 已读 OCEAN_EXPLORE_CONSTITUTION.md
[ ] 已保存 constitution-check-before.png
[ ] 已对照参考，记下失败项

AFTER — Layout
[ ] 桌面约 38/62，左文右球
[ ] 左栏为白内容岛（深墨字）
[ ] 地球是离散球体，非全屏壁纸
[ ] 球心屏幕 x ≈ 整屏 69% ±2%（非内栏 stage 中心）
[ ] 桌面：球心 screenY ≈ 白岛垂直中心 ±2% canvas 高（v1.6）
[ ] 整球入画：无右缘/顶底裁切；未压住左白岛

AFTER — Z-layer / Three.js layers
[ ] 通透海水蓝浅底可见且无白屏
[ ] 可见球后气泡
[ ] 地球在中层（视觉）
[ ] 可见球前气泡
[ ] 地球 mesh 仅 layer 0；球后气泡仅 layer 1；球前气泡仅 layer 2（互不共享 mask）
[ ] 球后气泡被地球遮挡视觉正确（多 pass / depth，非同层糊弄）
[ ] UI 在最上层且可点区域正确

AFTER — Earth
[ ] 球心 ≈ 视口宽 0.69（整屏右黄金区中心）
[ ] 桌面：earthScreenFracY ≈ copyPanelCenterFracY ±0.02
[ ] 白岛锚点：`[data-ocean-panel]` 高度（不含 footer toggle）
[ ] earthDiameter / copyPanelHeight ≈ 1.12 ± 0.03（或受 zoneCap 压下仍 ≤ cap）
[ ] diameter ≤ min(copyH×1.12, min(0.62×W, H) × 0.74)
[ ] 整球入画 + 约 8–12% 安全边；无需浏览器 zoom out 即可见整球
[ ] 球体轮廓清晰、浮空、离散
[ ] 可拖拽改 earthGroup.rotation.y（非绕球转相机）
[ ] 低速绕竖直轴自转（earthGroup.rotation.y；无 tumble）
[ ] 海洋亮度可读、未洗白

AFTER — Bubbles
[ ] 全视口分布
[ ] 液体玻璃（rim/折射），非细线框；强度克制
[ ] 漂浮缓慢，无夸张呼吸

AFTER — UI
[ ] Toggle 左下，「大陆架分布」
[ ] Hint 右下
[ ] Composer vignette 仍为 OFF

AFTER — Safety
[ ] Console 无阻塞错误
[ ] setClearColor 为不透明浅海雾色（与 section 一致）
```

---

## 8. Out of scope / freeze（未经询问不得改）

| 冻结项 | 说明 |
|---|---|
| Hero 视频区 | `#ocean-explore` 以外首页 Hero |
| 全站 `DESIGN.md` token 色板本体 | 可不扩新全局色；本 section **使用已有 mist / surface 等 v4 token** |
| Composer vignette / grain | 保持 OFF，待用户明确要求 |
| 文案内容大改 | 五大洋叙事与「大陆架分布」标签文案 |
| 第三方框架 | 禁止引入 React/Vue 等掩盖课程技术 |
| 整页 WebGL 转场 / 流体 sim / Howler | 见 Convex 计划 OUT OF SCOPE |
| 无关页面 | `pages/*` 业务页除非任务点名 |

若实现与宪法冲突且无法在不破坏冻结项的前提下修复 → **STOP 并询问用户**，禁止硬拧。

---

## 9. 参数锚点（实现提示，非替代目视）

| 锚点 | 建议起点（可微调，须过目视） |
|---|---|
| CSS 列比 | `grid-template-columns: minmax(0, 0.382fr) minmax(0, 0.618fr)` |
| Section 底 | `linear-gradient` 用 `--mist-from` / `--mist-to`（或等价浅海雾） |
| 左栏 | `.page-island` 或同 token 白岛：`--surface-elevated` + `--shadow-island` + `--ink` |
| 球心屏幕位 | X：`EARTH_VIEW_CENTER_X = 0.69`；Y（桌面）：白岛垂直中心分数 → `setViewOffset(x, y)`；project 校验 `earthScreenFracX/Y` |
| 白岛锚 | `[data-ocean-panel]` / `.ocean-explore__copy`；`ResizeObserver` 重测 height + centerY |
| Camera / FOV | 固定 lookAt 球心；`artTarget = copyHeight × 1.12`；`targetDiameter = min(artTarget, min(0.62×W, H) × 0.74)` 反算 z；**禁止**过紧 z 下限导致放大裁切 |
| 自转 | `earthGroup.rotation.y` 低速自转 + pointer 拖 yaw；**禁止** OrbitControls.autoRotate |
| Three.js layers | Earth = **0**；back bubbles = **1**；front bubbles = **2**；多 pass + shared depth |
| Bubbles | 全视口 frustum 采样；`uSectionBgColor` 对齐浅底；强度克制 |
| Clear | `0xe0f2fe`（`--mist-to`），alpha `1`（或与 section 实测一致的浅色） |
| Composer | **OFF** 直至用户要求 |

目视与截图优先于上表数字。
