# `#ocean-explore` 视觉 / 布局宪法（Binding Law）

| 项 | 内容 |
|---|---|
| 版本 | **1.8** |
| 地位 | `#ocean-explore` **绑定视觉与布局法**；与本文件冲突时，以本文件为准（用户当场口头例外除外） |
| 创建 | 2026-07-18 |
| 修订 | 2026-07-18 — **v1.8**：**Containment First** — 以 `visualViewport ∩ section − header` 为 **Visible Safe Rect**；二分 + X 回退 + 强制 shrink 求解；**禁止** solver 失败仍出画；fit 优先级：不出画 > Y 同心 > 直径 1.12 |
| 前版 | v1.7 — 统一绑定锚点法 + bounds-fit；废止 dolly / rem MQ / 0.74 主 cap |
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
| **统一绑定锚点（硬性 · v1.7）** | 锚点：`[data-ocean-panel]` 相对 canvas-host 同帧 rect；比例常数 diameter:copyHeight=1.12（像素每帧实测，随 zoom 同步） |
| **双栏（几何判定 · v1.7）** | copy 与 stage 左右并排：球心 X=69%、Y=copyCenterY |
| **单列** | stacked：Y=canvas 50%；min(copyH×1.12, bounds-fit) |
| **Containment（硬性 · v1.8）** | 投影整球 bounds 在 **Visible Safe Rect** 内（`visualViewport ∩ canvas-host − fixed header`，≥2% 边距）；左缘 ≥ copy 右缘 + gap；**100% 浏览器 zoom 下整球必可见** |
| **Fit 优先级（v1.8）** | ① 不出画（强制）→ ② 双栏 Y 同心 → ③ 直径 copyH×1.12（尽力） |
| **X 回退（v1.8）** | 69% 放不下时，球心 X 可左移（最小：clear copy 右缘 + gap），Y 不变 |
| 实现 | `_getVisibleFramingRect` + `_resolveEarthFraming` 二分 / X-nudge / forced-shrink；visualViewport + RO + rAF + 进入视口/字体就绪重算 |
| 废止 v1.7 | 0.74 主 cap、matchMedia 59rem、ScrollTrigger dolly、solver 失败仍 apply |
| 决策 | 1.12 / 锚点 A / 双栏 Y / dolly off — 2026-07-18 |

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
| 尺度 | **比例律**：目标 `copyHeight × 1.12`；经 **bounds-fit 闭环** 求解 z + `setViewOffset`；可缩小至 containment，不可裁切 |
| 球心 X | 双栏：整屏 **69%**（v1.4）；单列：canvas 50% 或 fit 中心 |
| **球心 Y** | 双栏：白岛 **垂直中心**（±2%）；单列：canvas **50%** |
| 稳定性 | `resize` + `visualViewport.resize` + `ResizeObserver`（copy/layout/host）；rAF 合并；**禁止** scroll dolly 改 z |
| 形态 | 清晰球体轮廓；双栏时与白岛 **同一高度线**；**整球始终在 Visible Safe Rect 内**（非仅 canvas 数学框） |
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
[ ] 双栏：球心 screenY ≈ copyPanelCenterY ±0.02；containmentOk = true
[ ] 整球 bounds 在 Visible Safe Rect 内（≥2% 边距）；`clipRight/clipBottom ≤ 0`；未压住左白岛
[ ] 无 scroll dolly 改 z

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
[ ] 双栏：earthScreenFracY ≈ copyPanelCenterFracY ±0.02
[ ] containmentOk；ratioActual ≤ 1.12 + 0.03
[ ] 白岛锚点：`[data-ocean-panel]`（不含 footer）
[ ] 整球入画；窗口/browser zoom 后仍可见
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
| Framing solver | `_getVisibleFramingRect` + `_resolveEarthFraming`：measure anchor → binary maxD → X-nudge → forced-shrink → setViewOffset + z |
| Debug | `__globeDebug`：`visibleSafeRect`、`clipRight`、`clipBottom`、`solverMode` |
| 白岛锚 | `[data-ocean-panel]`；双栏 = copy/stage 几何并排 |
| 事件 | resize + visualViewport.resize + ResizeObserver；rAF debounce |
| 自转 | `earthGroup.rotation.y` 低速自转 + pointer 拖 yaw；**禁止** OrbitControls.autoRotate |
| Three.js layers | Earth = **0**；back bubbles = **1**；front bubbles = **2**；多 pass + shared depth |
| Bubbles | 全视口 frustum 采样；`uSectionBgColor` 对齐浅底；强度克制 |
| Clear | `0xe0f2fe`（`--mist-to`），alpha `1`（或与 section 实测一致的浅色） |
| Composer | **OFF** 直至用户要求 |

目视与截图优先于上表数字。
