# 澜存 `#ocean-explore` · Convex 复刻总任务书

## 文档状态

| 项 | 内容 |
|---|---|
| 版本 | 1.1 |
| 状态 | Phase A MVP 视觉已修复（2026-07-18）；Composer 全量后处理暂跳过，待 earth pass 稳定后接回 |
| 创建日期 | 2026-07-18 |
| 关联页面 | `index.html#ocean-explore` |
| 参考来源 | [Convex Seascape Survey](https://convexseascapesurvey.com/)「Where we are working」区块（只借交互结构与氛围，不复制品牌与文案） |
| 部署目标 | [Vercel 静态托管](https://lancun-wtqm.vercel.app/index.html#ocean-explore) + 本地 `serve.ps1` |

---

## 1. 项目目标

### 1.1 要做什么

在澜存首页 `#ocean-explore` 区块，交付一套 **Convex「Where we are working」启发式 MVP**：

- **内容**：继续使用 `LANCUN_DATA.fiveOceans`（太平洋、大西洋、印度洋、南大洋、北冰洋），不照搬 Convex 英文文案。
- **交互**：深底全宽 section、左侧文案、右侧大型可拖转 3D 地球、大陆架分布 toggle、WebGL 玻璃气泡、五大洋 `+` 标记与详情 modal。
- **技术**：原生 HTML5 / CSS3 / JavaScript ES 模块；Three.js 与 GSAP 等第三方库须本地化并记入 `docs/DATA_SOURCES.md`。
- **验收**：本地 `serve.ps1` 与 Vercel 无痕窗口均可演示，Console 无阻塞错误。

### 1.2 不做什么（明确 OUT OF SCOPE）

以下能力 **不在本复刻项目范围内**，除非用户另开需求：

| 排除项 | 说明 |
|---|---|
| 整页 WebGL 场景转场 | Convex 首页多 scene 滚动切换；澜存仅复刻 `#ocean-explore` 单区块 |
| 流体模拟（fluid sim） | 鼠标扰动、Navier-Stokes 等 GPU 流体 |
| Howler 音效 | 滚动/点击音效系统 |
| Convex 品牌资产与文案 | 只提炼可解释的设计原则 |

### 1.3 相似度目标（估）

| 阶段 | 时间 | 与 Convex 该区块相似度 |
|---|---|---|
| Phase A · 今日 MVP | 今天 8–10h | ~65–75% |
| Phase B · 续做 1 | +1–2 天 | ~80–85% |
| Phase C · 续做 2 | +1–2 天 | ~90%+ |

---

## 2. 设计对齐说明（无例外）

### 2.1 与 `DESIGN.md` v4 的关系

全站 v4 基准为 **大疆风通透海水蓝 + 白内容岛**（`--surface-elevated`、`page-island` 等）。  
**2026-07-18 起：`#ocean-explore` 不再做局部深色例外**，构图可借 Convex，色/质跟 v4：

| 维度 | 要求 |
|---|---|
| Section 背景 | 雾感浅蓝 / `--mist-from` → `--mist-to`（**禁止** `#0F172A → #1E3A8A` 作本区主底） |
| 左栏文案 | **白内容岛**（`.page-island` / `--surface-elevated`）+ `--ink` 深墨字 |
| 右栏 | 浮空交互地球（离散球体，非壁纸） |
| 气泡 | WebGL InstancedMesh 液体玻璃；全视口前后分层；强度克制 |
| Composer | vignette **默认 OFF** |
| 布局法 | 见 `docs/OCEAN_EXPLORE_CONSTITUTION.md`（38/62、Z 层、Y 轴自转、v1.5 白岛×1.12 尺度、**v1.6 桌面球心 Y 对齐**） |

### 2.2 文档同步要求

- `DESIGN.md` §7 / §9：已声明无例外  
- `docs/DESIGN_SYSTEM.md`：mirror `#ocean-explore` 跟 v4  
- `docs/OCEAN_EXPLORE_CONSTITUTION.md`：**v1.6** 绑定法（白岛×1.12 尺度 + 桌面球心 Y 对齐 + 球心 X 69%）  

**原则**：不得把深海军例外恢复为本 section 默认，也不得把深底扩散全站。

---

## 3. Phase A · 今日 MVP（A0–A8）

> **完成标准**：线上可演示「v4 浅海雾底 + 白岛文案 + 亮地球 + 大陆架开关 + 上升气泡 + 点五大洋」；不要求与 Convex 像素级一致。  
> **架构红线**：A3 模块拆分 + A5 气泡双 pass RenderTarget **今日必须落地**，否则 Phase B 成本翻倍。

---

### A0 · 前置确认（~15 min）

- [ ] 读取 `AGENTS.md`、`DESIGN.md`、`docs/ACCEPTANCE.md`
- [ ] 读取本文件与 `TASKS.md` 中「ocean-explore Convex 复刻」条目
- [ ] 确认 `index.html`、`assets/js/home-globe.js`、`assets/css/home.css` 现状
- [ ] 本地 `serve.ps1` 与 Vercel 分支/部署一致
- [ ] 在 `TASKS.md` 登记 Phase A/B/C backlog（本任务书创建时已完成文档侧）

**产出**：Agent 明确当前基线与验收 URL。

---

### A1 · 地球调亮（~30–45 min）

**目标文件**：迁移至 `assets/js/globe/earth.js`（自 `home-globe.js` 拆分）

| 改动 | 参数建议 |
|---|---|
| HemisphereLight | sky `0xa8d4ff`, ground `0x1a2840`, intensity `0.65` |
| AmbientLight | intensity `0.5 → 0.75` |
| toneMapping | `ACESFilmicToneMapping`, `toneMappingExposure: 1.25` |
| emissive | `0x0a1628`, `emissiveIntensity: 0.35` |
| 云层 opacity | `0.24 → 0.38` |
| 大气 opacity | `0.12 → 0.2` |
| 初始旋转 | `earthGroup.rotation.y = degToRad(-25)` |

**验收**：

- [ ] 背光面能看见海陆轮廓
- [ ] 纹理加载失败时 fallback 材质仍可读
- [ ] Vercel 上同样生效

---

### A2 · Section 布局对齐 Convex（~1–1.5 h）

**目标文件**：`index.html`、`assets/css/home.css`（可选新建 `assets/css/globe-section.css`）

| 任务 | 说明 |
|---|---|
| 深底全宽 | `linear-gradient(180deg, #0F172A 0%, #1E3A8A 100%)` |
| 左文案 | 白字标题「我们在守护哪一片海？」+ 说明 + pill「了解更多」→ `pages/ocean.html` |
| 去掉/隐藏 | `.ocean-explore__panel` 大白岛卡片；`.ocean-explore__bubbles` CSS 气泡层 |
| 右 Canvas | 区域铺满高度，地球偏右构图 |
| Toggle UI | 「大陆架分布 ON/OFF」按钮（对标 CONTINENTAL SHELVES） |
| 响应式 | 移动端单列、无横向溢出；桌面左右分栏 |
| a11y | 文案区、toggle、canvas 具备 label / aria |

**验收**：

- [ ] 截图布局与 Convex 参考结构一致（左文右球）
- [ ] 375px / 1280px 各测一次

---

### A3 · WebGL 模块拆分（~1.5–2 h）

**新建目录结构**（见 §6）：

- 入口 `assets/js/globe/index.js` 替换 `index.html` 中的 `home-globe.js`
- `GlobeScene.js`：renderer、camera、clock、`uTime` / `uResolution`
- `earth.js`、`shelves.js`、`bubbles.js`、`markers.js`
- `composer.js`：Phase B stub，export 空 pipeline
- `shaders/bubble.vert`、`shaders/bubble.frag`
- `utils/latlon.js`、`utils/textures.js`

**vendor 本地化**（记入 `docs/DATA_SOURCES.md`）：

- `EffectComposer.js`、`RenderPass.js`、`ShaderPass.js`（Three.js examples）
- `gsap.min.js`、`ScrollTrigger.min.js`（toggle 动画；Scroll 驱动留 Phase C）

**GlobeScene 必做**：

- [ ] `IntersectionObserver`：section 不可见 → `stop()` 停 rAF
- [ ] `ResizeObserver` + DPR cap `min(devicePixelRatio, 2)`
- [ ] 对接 `app.js` → `window.LANCUN_homeGlobe.applyMotion()`
- [ ] WebGL 失败 → 现有 `[data-globe-status]` 文案

**验收**：

- [ ] `index.html` 改引 `assets/js/globe/index.js`
- [ ] Console 无 module 404
- [ ] 旧 `home-globe.js` 保留 backup 或删除且 git 可回滚

---

### A4 · 地球 + 大陆架 Toggle（~1.5–2 h）

**素材**：

| 文件 | Phase A |
|---|---|
| `assets/media/earth.jpg` | 沿用 |
| `assets/media/earth-clouds.png` | 沿用 |
| `assets/media/globe/shelves-mask.png` | **占位**（对角渐变或简图），文档标待换 |

**实现**：

- 地球：`MeshStandardMaterial` 或轻量 custom shader
- 大陆架：overlay 采样 `shelves-mask`，uniform `uOffset` 控制扫入
- Toggle：GSAP `gsap.to(uOffset, { value: 0|1, duration: 1.2, ease: 'power2.inOut' })`
- 默认 OFF；ON 时大陆架色 `#3B82F6` 系（与澜存主色协调）

**验收**：

- [ ] Toggle 可重复 ON/OFF，动画流畅
- [ ] `prefers-reduced-motion` / `lancun.prefs.reduceMotion` 下直接切状态无 tween

---

### A5 · WebGL 玻璃气泡 MVP（~2–2.5 h）⚠️ 今日核心

**渲染顺序（双 pass，Phase B 扩展基础）**：

```text
1. RenderPass(earth + clouds) → renderTarget A
2. InstancedMesh bubbles，fragment 采样 tDiffuse = A
3. markers 层（CSS2D）最后 render
```

**气泡规格（Phase A 简化）**：

| 项 | Phase A 值 |
|---|---|
| 实例数 | 桌面 40 / 移动 20（FPS 低再降） |
| Geometry | `SphereGeometry` 或 `IcosahedronGeometry` |
| Vertex | Y 循环上升、`uBounds`、`uEarthOrigin` 推开、simplex 微动 |
| Fragment | `uv + normal.xy * ior` 假折射 + 简单 fresnel + specular |
| 混合 | transparent, `depthWrite: false`, 正确 `renderOrder` |

**验收**：

- [ ] 气泡持续上升循环
- [ ] 经过地球有背景弯曲感（采样 RT）
- [ ] 不穿地球、不闪屏
- [ ] 滚出 section 气泡停止更新

---

### A6 · 标记 + Modal（~1 h）

**Phase A 方案**：`CSS2DRenderer`（Phase C 升 CSS3D）

- 五大洋 `lat/lon` → `+` 按钮（`LANCUN_DATA.fiveOceans`）
- 点击：侧栏/底栏 modal，展示 title / text / 链接
- Esc 关闭、focus 管理、`aria-modal`
- 左栏 intro 文案保留静态；详情走 modal

**验收**：

- [ ] 5 个洋均可点、内容正确
- [ ] 键盘 Tab / Esc 可用

---

### A7 · 性能与降级（~30 min）

- [ ] `prefers-reduced-motion`：静态地球一帧、无气泡动画、toggle 无 tween
- [ ] 触摸设备 / 窄屏：实例数减半
- [ ] Intel 核显 / `deviceMemory` 低：DPR=1、关闭后续后处理预留

**对接**：`app.js` 设置变更时调用 `LANCUN_homeGlobe.applyMotion()`。

---

### A8 · 文档 + Vercel 验收（~30–45 min）

**更新文档**：

- `docs/DATA_SOURCES.md`：Three.js、GSAP、earth 贴图、shelves 占位说明
- `TASKS.md`：Phase A 勾选 + Phase B/C 待办
- `DESIGN.md` / `docs/DESIGN_SYSTEM.md` / 宪法：`#ocean-explore` **无深底例外**，跟 v4 浅海雾 + 白岛

**测试**：

- [ ] 本地 `serve.ps1` → `#ocean-explore`
- [ ] Push → Vercel 无痕窗口
- [ ] Console 0 error；Network 无 vendor/纹理 404

---

### Phase A 建议时间表

| 时段 | 任务块 |
|---|---|
| 第 1 小时 | A1 调亮 + A2 布局 HTML/CSS |
| 第 2–3 小时 | A3 模块拆分 + vendor |
| 第 4–5 小时 | A4 地球 + toggle |
| 第 6–8 小时 | A5 气泡 RT + shader |
| 第 9 小时 | A6 标记 modal + A7 降级 |
| 第 10 小时 | A8 文档 + Vercel 验收 |

---

## 4. Phase B · 后续补全（+1–2 天）

> **依赖**：Phase A 必须含 **气泡双 pass + globe 模块拆分**。

| ID | 任务 | 优先级 | 内容摘要 |
|---|---|---|---|
| **B1** | 真实大陆架 mask | ★★★★★ | Natural Earth / 自绘海岸线 → `shelves-mask.png`（R 通道）；`shelves.js` shader 混合 `uShelvesColor1/2` + 轻 noise |
| **B2** | 气泡 shader 精调 | ★★★★☆ | `uCamDistMin/Max` 调 IOR、jitter、orbit 参数、个别实例 content 贴图 |
| **B3** | Composer 后处理 | ★★★★☆ | `composer.js`：RenderPass → Vignette + 轻 grain + FXAA；移动端可开关 |
| **B4** | 地球 normal + env | ★★★☆☆ | `earth-normal.jpg`、`env.hdr`（Poly Haven 等）；PMREM env、简化 caustics chunk |

**建议顺序**：`B1 → B2 → B3 → B4`

**完成标准**：静态截图与 Convex 参考 **~80–85%** 相似。

---

## 5. Phase C · 后续补全（+1–2 天）

| ID | 任务 | 优先级 | 内容摘要 |
|---|---|---|---|
| **C1** | CSS3D 标记 | ★★★☆☆ | 引入 `CSS3DRenderer`；背对相机隐藏；替换 CSS2D |
| **C2** | ScrollTrigger 相机 | ★★☆☆☆ | Section 进入视口：相机 z / `earthGroup.rotation.y` 随 scroll scrub；可选 section pin |
| **C3** | God Rays（可选） | ★★☆☆☆ | `GodRayPass` 体积光；默认桌面 ON、移动 OFF |

**完成标准**：交互贴面 + 滚动叙事 + 氛围 **~90%+** 接近参考站。

---

## 6. 文件结构（`assets/js/globe/`）

```text
assets/
├── css/
│   ├── home.css                    # #ocean-explore 布局（v4 浅海雾 + 白岛）
│   └── globe-section.css           # 可选：globe 专用样式
├── js/
│   ├── globe/
│   │   ├── index.js                # 入口；export init → LANCUN_homeGlobe
│   │   ├── GlobeScene.js           # renderer, camera, IO, rAF 生命周期
│   │   ├── earth.js                # 地球 mesh、云、大气、A1 光照参数
│   │   ├── shelves.js              # toggle + uOffset + mask overlay
│   │   ├── bubbles.js              # RT 双 pass + InstancedMesh
│   │   ├── markers.js              # CSS2D 标记 + modal 逻辑
│   │   ├── composer.js             # Phase B stub → 后处理 pipeline
│   │   ├── shaders/
│   │   │   ├── bubble.vert
│   │   │   └── bubble.frag
│   │   └── utils/
│   │       ├── latlon.js           # latLonToVector3 等
│   │       └── textures.js         # 本地优先 + 远程 fallback
│   ├── home-globe.js               # 备份或删除（Phase A 迁移后）
│   └── vendor/
│       ├── three.module.min.js     # 已有
│       ├── OrbitControls.js        # 已有
│       ├── CSS2DRenderer.js        # 已有
│       ├── EffectComposer.js       # Phase A 新增
│       ├── RenderPass.js           # Phase A 新增
│       ├── ShaderPass.js           # Phase A 新增
│       ├── gsap.min.js             # Phase A 新增
│       └── ScrollTrigger.min.js    # Phase A 新增（Scroll 留 Phase C）
└── media/
    ├── earth.jpg
    ├── earth-clouds.png
    └── globe/
        └── shelves-mask.png        # Phase A 占位 → Phase B 真实 mask
```

**HTML 挂载点**（`index.html`，保持现有 data 属性）：

- `[data-ocean-explore]` section
- `[data-globe-canvas]` / `[data-globe-canvas-wrap]` / `[data-globe-scene]`
- `[data-globe-status]` WebGL 降级文案
- `[data-shelves-toggle]`（Phase A 新增）大陆架开关

---

## 7. Phase A 验收标准

### 7.1 功能

| # | 验收项 | 通过条件 |
|---|---|---|
| F1 | 五大洋标记 | 5 个 `+` 可点击，modal 展示正确 title/text/链接 |
| F2 | 大陆架 toggle | ON/OFF 可重复，扫入动画可见（reduced-motion 除外） |
| F3 | WebGL 气泡 | 上升循环、采样地球 RT、section 外停止更新 |
| F4 | 地球交互 | 可拖动旋转；未拖动时缓慢自转（reduced-motion 除外） |
| F5 | 布局 | v4 浅海雾底；左白岛右浮空球；38/62；Composer OFF |

### 7.2 技术

| # | 验收项 | 通过条件 |
|---|---|---|
| T1 | ES 模块 | `assets/js/globe/index.js` 相对 import；无 CDN 单点依赖 |
| T2 | vendor 本地化 | EffectComposer 套件 + GSAP 已入库并记入 DATA_SOURCES |
| T3 | 生命周期 | IntersectionObserver 启停 rAF；ResizeObserver 正确尺寸 |
| T4 | 无障碍 | toggle / modal / canvas 具备 aria；Esc 关闭 modal |
| T5 | 降级 | WebGL 失败显示 `[data-globe-status]`；reduced-motion 静态帧 |

### 7.3 部署

| # | 验收项 | 通过条件 |
|---|---|---|
| D1 | 本地 | `serve.ps1` → `http://127.0.0.1:8080/index.html#ocean-explore` 正常 |
| D2 | Vercel | 无痕窗口同 URL 无 404、地球可见 |
| D3 | Console | 0 阻塞 error；Network 无 vendor/纹理 404 |

### 7.4 文档

| # | 验收项 | 通过条件 |
|---|---|---|
| DOC1 | DATA_SOURCES | Three、GSAP、贴图、shelves 占位已记录 |
| DOC2 | TASKS.md | Phase A 勾选；B/C backlog 存在 |
| DOC3 | 设计对齐 | DESIGN / DESIGN_SYSTEM / 宪法注明 `#ocean-explore` **无深底例外**、跟 v4 |

---

## 8. 风险矩阵

| 风险 | 影响 | 概率 | 对策 |
|---|---|---|---|
| 今日时间不够 | Phase A 不完整 | 中 | **保 A5 气泡双 pass**；可砍 C 全部、B 全部；A6 modal 用最简 HTML |
| Vercel 模块 404 | 线上地球空白 | 中 | vendor 全部提交仓库；相对路径 import；部署后无痕验收 |
| 移动端 FPS 低 | 卡顿、发热 | 中 | 实例数↓、DPR=1；Phase B/C 后处理默认移动 OFF |
| 与 v4 配色冲突 | 全站视觉割裂 | 低 | 本 section **跟 v4**；禁止恢复深底例外 |
| Phase A 未拆模块 | Phase B 重写成本翻倍 | 中 | A3 + A5 架构今日必须落地 |
| 纹理远程 fallback 失败 | 地球不可读 | 低 | 本地 `assets/media/` 优先；占位材质 + status 提示 |
| GSAP / WebGL 内存泄漏 | 长时间滚动后卡顿 | 低 | section 不可见 `dispose` / `stop`；页面切换清理 listener |

---

## 9. Agent 交接说明

### 9.1 开始任务前必读（按优先级）

1. 用户在当前对话中的明确要求
2. `AGENTS.md`
3. **本文件** `docs/OCEAN_EXPLORE_CONVEX_PLAN.md`
4. `DESIGN.md` + `docs/OCEAN_EXPLORE_CONSTITUTION.md`（`#ocean-explore` 跟 v4，无深底例外）
5. `docs/ACCEPTANCE.md`、`docs/DATA_SOURCES.md`
6. `TASKS.md` 中「ocean-explore Convex 复刻」勾选状态

### 9.2 执行 Phase A 的标准口令

切换到 Agent 模式后，按 **A0→A8 顺序**执行，不得跳过 A3/A5 架构：

```text
执行 Phase A（今日 MVP）完整清单 A0–A8：
1. #ocean-explore v4 浅海雾底 + 左白岛 + 右浮空球（构图可借 Convex，色/质跟 DESIGN）
2. 调亮地球（A1 参数）
3. 拆分 assets/js/globe/ 模块，vendor 本地化 GSAP + EffectComposer 套件
4. 大陆架 toggle + placeholder mask + GSAP uOffset
5. WebGL 气泡：RenderTarget 双 pass + InstancedMesh 简化 IOR shader
6. CSS2D 五大洋标记 + modal；IO 启停 + reduced-motion
7. 更新 DATA_SOURCES / TASKS / 宪法与 DESIGN（无深底例外）
8. Vercel 验收
Phase B/C 今日不做，仅维护 TASKS.md backlog。
```

### 9.3 完成 Phase A 后须回报

Agent 结束时应提供：

- **变更文件列表**（HTML/CSS/JS/vendor/media/docs）
- **验收结果**：本地 + Vercel 截图或文字说明；Console / Network 结论
- **未完成项**：若有砍 scope，说明原因与后续 Phase
- **TASKS.md**：勾选已完成 A 项；B/C 保持 backlog

### 9.4 协作约束（来自 AGENTS.md）

- 一次集中完成一个可验收目标（Phase A 为一个目标）。
- 不得未经用户确认做全站「最终美化」；`#ocean-explore` **已取消深底例外**，跟 v4。
- 第三方库用途须在 `DATA_SOURCES.md` 说明；关键功能不依赖 CDN。
- 修改视觉前读取 `DESIGN.md` 与 lancun-design Skill（工具用法）。
- 保留用户已有成果；`home-globe.js` 迁移时保留可回滚 backup。

### 9.5 Phase B/C 启动条件

- Phase A 验收表 §7 全部通过
- 用户确认进入下一迭代
- 优先顺序：B1 → B2 → B3 → B4 → C1 → C2 → C3（可选）

---

## 10. 参考与引用

| 资源 | 路径 / URL |
|---|---|
| Convex 参考页 | https://convexseascapesurvey.com/ |
| 本地保存源码 | `references/otherwebsite/`（若存在） |
| 五大洋数据 | `assets/js/mock-data.js` → `LANCUN_DATA.fiveOceans` |
| 现有实现 | `assets/js/home-globe.js`、`assets/css/home.css` |
| Vercel 部署 | https://lancun-wtqm.vercel.app/index.html#ocean-explore |

---

## 修订记录

| 版本 | 日期 | 说明 |
|---|---|---|
| 1.0 | 2026-07-18 | 初版：Phase A/B/C 总任务书、验收标准、风险与 Agent 交接 |
