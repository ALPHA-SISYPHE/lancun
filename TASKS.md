# 项目任务与进度

## 当前阶段

阶段 C–D：设计系统 v2.0（Convex 深色沉浸）与全站视觉落地。

## 已完成

- [x] 阅读并提取期末作业要求。
- [x] 比较老年人服务和海洋保护两个选题。
- [x] 初步选择海洋保护方向。
- [x] 建立长期项目文档骨架。
- [x] 根据 `ideas.md` 更新长期文档：展示 + 互动双主线、海洋美感优先、用户视觉决策权、图片方向稿和截图修复流程。
- [x] 选择方案 A：五页平衡型。
- [x] 选择重点海域地图。
- [x] 选择匿名表单 + localStorage 作为行动记录方式。

## 正在进行

- [ ] 首页背景视频（0.6 倍速循环）的用户目视验收。
- [ ] 「我们的海洋」页面视觉框架稿用户确认（结构已实现，见 `pages/ocean.html`）。

## 「我们的海洋」页面宪法（2026-07-18）

> 权威：`docs/OCEAN_PAGE.md` v1.3（计划兼宪法）

- [x] 锁定三节结构：海洋数据看板 → 海的作用 → 五大洋竖排
- [x] 锁定删除本页可拖地球与三节点；污染数据不进本页
- [x] 锁定第一节 **6 看板**（Coral Watch×3 + NOAA×3）；Protected Planet 移出第一节
- [x] 第一节 6 指标写入 `OCEAN_PAGE.md` 附录 A.1
- [x] 附录 A.2「海的作用」4 卡 + CO₂ 折线已锁定（v1.3）
- [x] 附录 A.3 五大洋小看板（地理+生态）已锁定（v1.3）
- [x] `OCEAN_PAGE.md` §0 用户需求摘要（v1.2）
- [x] 锁定方案 B：Coral Watch + NOAA + mock 降级（第一节）
- [x] 同步 `PAGE_STRUCTURE.md`、`DATA_SOURCES.md`、`mock-data.js` 占位
- [x] 实现轮重写 `pages/ocean.html`（三节骨架 + 数据渲染，v1.3）

## Phase A — `#ocean-explore` Convex 风格 Globe MVP（2026-07-18）

- [x] A1 地球提亮：HemisphereLight、ACESFilmic exposure ~1.25、emissive、云层 ~0.38、大气 ~0.2、初始 rotation Y ~-25°
- [x] A2 Convex 布局：深底渐变左文右球、移除 CSS 气泡层、大陆架 toggle UI、响应式与 a11y
- [x] A3 模块架构：`assets/js/globe/*` + vendor EffectComposer/RenderPass/ShaderPass + GSAP
- [x] A4 大陆架 toggle：程序化 shelves-mask、`uOffset` GSAP 1.2s、reduced-motion 即时切换
- [x] A5 WebGL 气泡双 pass：earth RT + InstancedMesh 折射（40/20 实例）
- [x] A6 五大洋 CSS2D 标记 + modal（Esc、键盘 a11y、`LANCUN_DATA.fiveOceans`）
- [x] A7 性能：IntersectionObserver rAF、DPR cap、mobile 实例、`applyMotion` 集成
- [x] A8 文档：`DATA_SOURCES.md`、vendor README；`home-globe.js` 保留为备份
- [ ] Phase A 浏览器目视验收（桌面 + 移动、WebGL 降级提示）

## 「海洋生物档案」页面宪法（2026-07-18）

> 权威：`docs/SPECIES_PAGE.md` v1.0（计划兼宪法）

- [x] 锁定三节结构：濒危物种检索 → 看板+物种网格 → AI 识别器
- [x] 锁定 Phase A mock 识别（1.5s）；真实 API 写入附录 G，首轮不实现
- [x] **Phase B（2026-07-20）**：ECNU `ecnu-plus` 识别 + 本地代理 + 额度进度条 + mock 降级
- [x] 锁定 6 快捷标签、4 看板指标、15 种预设物种 schema
- [x] 同步 `PAGE_STRUCTURE.md`、`AGENTS.md` 文档优先级
- [x] 用户确认宪法后实现 `pages/species.html` 框架稿（P0–P5，见 SPECIES_PAGE §6）
- [ ] 生物档案 v1 框架稿目视确认（桌面 + 移动，附录 H 自检已通过脚本 smoke test，待用户确认视觉）

## 「保护行动中心」页面宪法（2026-07-18）

> 权威：`docs/ACTION_PAGE.md` v1.0（计划兼宪法）

- [x] 锁定三节结构：每日打卡 → 志愿者报名 → 捐款与往期成果
- [x] 锁定前端 mock + localStorage（附录 B/C/D）；禁止真实支付/报名
- [x] 锁定打卡积分规则（+10 / 7 天 +30 / 30 天 +150）与 ISO 日期 schema
- [x] 同步 `PAGE_STRUCTURE.md`、`AGENTS.md` 文档优先级
- [x] 用户确认宪法后实现 `pages/action.html` 框架稿（Phase 0–4，见 ACTION_PAGE §8）

## 接下来

- [ ] 确认最终网站名称与主题范围。
- [ ] 锁定页面结构与必做功能。
- [ ] 决定是否加入音视频、行动打卡和勋章系统。
- [ ] 生成并选择首页美术参考方向。
- [ ] 根据选定方向绘制首页框架。
- [ ] 收集并验证数据来源。
- [ ] 编写设计 Brief。
- [ ] 生成并比较 2～3 个视觉方向。
- [ ] 用户选择最终视觉方向。
- [ ] 锁定设计系统。
- [ ] 规划开发顺序和中期提交范围。
- [ ] 开始页面实现。

## 已完成的页面草稿

- [x] 首页导航与信息结构框架：`index.html`。
- [x] 预留海底动物世界视频开场区域；尚未放入真实视频或美术资源。
- [x] 建立移动端导航与无障碍基础结构；尚未进行最终视觉设计。
- [x] 将首页改为全屏视频主视觉框架、居中主题文字与顶部覆盖式导航。
- [x] 将导航改为独立页面地址，并建立 `map.html`、`data.html`、`species.html`、`action.html` 占位页。
- [x] 在右上角建立本地演示用“登录 / 我的记录”入口；真实登录功能不在范围内。
- [x] 整理工程仓库：页面、样式、脚本、课程资料、视频参考、人工笔记与外部 Skill 已分区。
- [x] 将项目名称和首页文案更新为“澜存 / 同守澜海，生机永续”。
- [x] 首页 3D 地球（Three.js r170）与大气泡视觉升级。
- [x] 根据最终组织图搭建五个业务模块与个人中心的前端底层框架。
- [x] 建立本地资料、积分、打卡、志愿者报名、公益项目意向与识别上传的前端交互入口。
- [x] 实现 localStorage 模拟登录/注册、登录会话、头像入口、退出登录与账户表单验证。
- [x] 锁定视觉方向：暖白+天青、无衬线、Hero 摄影+透明 UI、混合方向 1+3。
- [x] 写入 `DESIGN_BRIEF.md` v1.0 与 `DESIGN_SYSTEM.md` v1.0。
- [x] **根目录 `DESIGN.md` v1.0**（大疆摄影风·通透海水蓝）+ `.codexrules` + `DESIGN_SYSTEM` v4 + CSS token 同步（移除 v2.3 全站光池/caustics）。
- [ ] 用户目视验收 v4（`DESIGN.md` 通透感、玻璃 blur 20px、主色 #3B82F6、`file://` 与 `serve.ps1`）。
- [x] ui-ux-pro-max 设计系统检索对照（ocean climate immersive dark cyan）。
- [x] 首页 Hero 临时摄影来源记入 `DATA_SOURCES.md`。
- [x] 首页 Hero 已接入用户提供的视频背景：静音、循环、固定 0.6 倍速。

- [ ] 创建项目定制 Skill：至少完成一个代表性页面和一次视觉修复循环后再开始。

## ocean-explore Convex 复刻

> 总任务书：`docs/OCEAN_EXPLORE_CONVEX_PLAN.md`  
> **视觉/布局绑定法：** `docs/OCEAN_EXPLORE_CONSTITUTION.md`（黄金比 38/62、Z 层、地球铅垂轴、液体玻璃气泡前后分层；改前/改后强制截图自检）  
> 目标：Convex「Where we are working」**构图**启发式 MVP；内容仍为五大洋；**色/质跟 v4（无深底例外）**：浅海雾底 + 白内容岛 + 浮空地球。绑定法：`OCEAN_EXPLORE_CONSTITUTION.md` **v1.9**（单文件 `ocean-globe.js` + world-position framing）。

### Constitution 落地（2026-07-18）

- [x] 写入 `OCEAN_EXPLORE_CONSTITUTION.md` + 本条 TASKS 索引
- [x] 黄金比布局 38/62 + 地球右区尺度 / Y 轴自转（polar 窄带锁定）
- [x] 气泡前后分层 + 液体玻璃；Composer vignette 保持 OFF
- [x] Playwright 自检截图 `constitution-check-before.png` / `constitution-check-after.png`
- [x] **v1.1** 撤销深色例外：浅海雾底 + 白岛文案 + 地球完整浮空（viewOffset 右区）+ 海洋提亮 + 气泡克制
- [x] Composer vignette 仍 OFF（用户未要求开启）
- [x] **v1.3** 右区几何中心 + 整球安全边；`earthGroup.rotation.y` 独立自转/拖拽（移除 OrbitControls.autoRotate）；scroll 仅 dolly
- [x] **v1.4** 球心整屏 69%（Q1=C）；`min(右区宽,高)×0.74` 禁止裁切（Q2=A）；废止 stage 内栏锚点
- [x] **v1.5** 美术匹配尺度：白岛 `[data-ocean-panel]` 高度 × **1.12** 定地球直径（Q1=A / Q2=1.12）；`min(右区宽,高)×0.74` 降为 cap；`ResizeObserver` 重测
- [x] **v1.6** 桌面垂直对齐：球心 Y = 白岛垂直中心（锚点 A，仅 ≥59rem）；`setViewOffset` Y + debug `earthScreenFracY`
- [x] **v1.7** 统一绑定锚点法：比例 1.12 实测驱动 + 双栏几何 Y 同心 + bounds-fit 整球 containment；废止 dolly / rem MQ / 0.74 主 cap；`visualViewport` + rAF
- [x] **v1.8** Containment First：Visible Safe Rect + 二分/X-nudge/forced-shrink；100% zoom 整球必可见；`constitution-v18-verify.mjs`
- [x] **v1.9** 单文件重写：删除 `assets/js/globe/**`；新建 `assets/js/ocean-globe.js`（earthGroup.position + camera.z，无 setViewOffset）；`constitution-v19-verify.mjs`
- [x] **v1.9.1 interim**：删除地球（`ocean-globe.js`）；气泡回滚原版 `globe/bubbles.js`；入口 `ocean-bubbles.js?v=20`；地球待重做
- [x] **v1.9.2 interim**：临时深底 + 玻璃水滴气泡（上浮 + 弹性形变）；`ocean-bubbles.js?v=21`；视觉 loop 待用户验收后再 push

### Phase A · 今日 MVP

- [x] **A0** 前置：读取 AGENTS / DESIGN / ACCEPTANCE / 本计划；确认 serve.ps1 与 Vercel 一致
- [x] **A1** 地球调亮：HemisphereLight、ACES exposure ~1.25、emissive、云/大气 opacity、初始 rotation y ~-25°
- [x] **A2** 布局：Convex 深底渐变；左白字文案（非白岛卡片）；右大地球；大陆架 toggle UI；隐藏 CSS 气泡
- [x] **A3** 模块拆分：`assets/js/globe/`（GlobeScene / earth / shelves / bubbles / markers / composer stub）；vendor 本地化 EffectComposer + GSAP
- [x] **A4** 大陆架 toggle：placeholder `shelves-mask.png` + GSAP `uOffset` 0↔1；reduced-motion 即时切换
- [x] **A5** WebGL 气泡双 pass：RenderTarget(earth+clouds) → InstancedMesh IOR shader；40/20 实例
- [x] **A6** CSS3D 五大洋标记 + modal（Esc / 键盘 a11y）；对接 `LANCUN_DATA.fiveOceans`
- [x] **A7** 性能：IntersectionObserver 启停 rAF；mobile 降级；`LANCUN_homeGlobe.applyMotion()`
- [ ] **A8** 文档 + 验收：DATA_SOURCES、设计例外说明、Vercel 无痕窗口 + Console 0 error

### ocean-explore 视觉修复（2026-07-18）

- [x] 白屏回归：WebGL 透明清屏 + 浏览器合成 → 改用 `#0F172A` 不透明清屏 + section/canvas-host 深底渐变兜底
- [x] 地球不可见：`camera.layers.disableAll()` 双 pass 与 composer RT 路径导致 mesh 未写入帧缓冲；改为 bubble `visible` 切换 + 直接 screen pass
- [x] 布局：`::before` 深底、`overlay` 左栏渐变可读、地球偏右 framing（`EARTH_OFFSET` / `CAMERA_HOME`）
- [x] 本地 `#ocean-explore` 桌面/窄屏截图 + Console 0 blocking error

### ocean-explore 视频背景降级（2026-07-19）

- [x] 入库 `assets/media/ocean-explore-bg.mp4`（与 `hero.mp4` 分离）；`DATA_SOURCES.md` 登记
- [x] `#ocean-explore` 循环背景视频 + 偏淡遮罩；`ocean-explore-bg.js` 进视口播放 / 减动效 fallback
- [x] WebGL 默认静止地球 only；气泡 opt-in（`?bubbles=1` / `localStorage.lancun.oceanBubbles=1`）；代码保留
- [ ] 用户目视验收：hero 与 explore 视频不串源；默认无气泡；字可读

### ocean-explore 地球座位宪法 v1.9.6（2026-07-20）

- [x] 用户确认 **1B / 2B**：世界坐标钉死；桌面球心 (0.69, 0.50)；窄屏 (0.50, 0.50)
- [x] `docs/OCEAN_EXPLORE_CONSTITUTION.md` → **v1.9.6**：废止 copyH×1.12 / 文案 Y 同心 / Fit 左移缩小主路径
- [x] **MVP 1A/2A**（`ocean-bubbles.js?v=78`）：v1.9.6 座位 unproject；`earthGroup.rotation.y` 自转 + canvas 拖拽；可见时 rAF（无气泡也转）；减动效停自转仍可拖

### ocean-explore 可拖拽地球 MVP（2026-07-20）

- [x] 座位：桌面 (0.69,0.50) / 窄屏 (0.50,0.50)；mesh 局部原点 + `earthGroup.position`
- [x] yaw 自转 + pointer 拖拽；松手 ~1.4s 恢复自转
- [x] 气泡默认关；`+` 装饰；货架 toggle UI-only
- [ ] 用户目视：座位/拖拽/减动效 — **已取消**（整模块推倒）

### ocean-explore 推倒 3D（2026-07-20）

- [x] 用户确认：不做地球、不做气泡；先推倒再考虑是否重开
- [x] 页面 A：`#ocean-explore` 仅背景视频 + 文案 CTA（去掉 canvas / shelves / FAB）
- [x] 代码 B：删除 `ocean-bubbles.js`、`home-globe.js`、`assets/js/globe/`、Three vendor、`assets/media/globe/`
- [x] 清理 `home.css` / `app.js`；宪法与 CONVEX 任务书标注已废止
- [ ] 是否重开 3D：**已完成 globe v2**（2026-07-20）

### ocean-explore 3D 地球 v2 重做（2026-07-20）

- [x] 恢复 Three.js r170 + OrbitControls + CSS2DRenderer（vendor 本地化）
- [x] 地球贴图入库 `assets/media/globe/`
- [x] 新建 `assets/js/globe/` 模块（earth / markers / controls / utils）
- [x] `index.html` canvas 移入 `.ocean-explore__stage`（右 0.618 列）+ 左文右球 layout + 降级脚本
- [x] `home.css` globe-pin / stage canvas / hint 样式（移除全屏 canvas-host）
- [x] 标记点击 → `pages/ocean.html?ocean=id#five-oceans` + 目标页高亮
- [x] OrbitControls：滚轮缩放；**自转轴修正** — `earthGroup.rotation.y` 铅垂 Y 轴自转 + 水平 yaw 拖拽（OrbitControls 禁用 rotate/autoRotate）
- [x] **球心 canvas 中心** — canvas 限右黄金区 0.618 列；`earthGroup` 固定原点 (0,0,0)，投影 ≈ (0.5, 0.5)；移除全屏投影二分求解
- [x] 文档：`DATA_SOURCES.md`、`TASKS.md`、`PAGE_STRUCTURE.md`
- [x] 本地 HTTP 验收：关键资源 200；import map 配置
- [ ] 用户目视验收（桌面 / 移动 / reduced-motion）
- [ ] 气泡 Phase B（可选，未纳入 v2）

### Phase D — Convex 分阶段修复（2026-07-18）

- [x] **D0** 不透明 `setClearColor(0x0f172a, 1)`；禁用 alpha=0 清屏；气泡默认关直至地球验收
- [x] **D0** 地球为右侧离散交互球体（非全屏背景）；`EARTH_OFFSET (0.72,-0.02,0)` / `CAMERA_HOME (-0.22,0.06,2.45)` / fov 36
- [x] **D0→D1** CSS3D `+` 标记 scale `0.0015`（根因：默认 scale=1 → ~32000px 白雾覆盖）
- [x] **D1** 大陆架 toggle 改底部左侧（Convex）；hint 右下；overlay `pointer-events: none`；标记点击开详情
- [x] **D2** 气泡减速：`uBounds~(1.2,1.6,1.0)`、`uSpeed 0.12`、boundsFade 按 bounds 缩放；折射 RT 清屏用海军蓝
- [ ] **D3** Composer vignette `uStrength~0.18`（参数已备，未接回渲染环——待目视确认气泡稳定后启用）
- [x] **D4** 布局：去掉顶栏 toolbar；footer 左 toggle / 右 hint；左栏文案 scrim 不盖死地球
- [ ] **D-验收** 用户目视：亚太朝向、气泡可见度、是否启用 Composer

### Phase B · 续做 backlog（+1–2 天）

- [x] **B1** 真实大陆架 mask（Natural Earth → `assets/media/globe/shelves-mask.png`）
- [x] **B2** 气泡 shader 精调（IOR 随距离、jitter、orbit、个别 content 贴图）
- [x] **B3** Composer 后处理：vignette + grain + FXAA（`composer.js` + `GlobeScene` compositeRT；lite tier 跳过）
- [x] **B4** 地球 normal map + PMREM env（`earth.js` + `textures.js`；保留 A1 调亮参数）

### Phase C · 续做 backlog（+1–2 天）

- [x] **C1** CSS3DRenderer 标记（背对相机隐藏；五大洋 modal a11y 保留）
- [x] **C2** ScrollTrigger scrub：`earthGroup.rotation.y` + 相机距离微距；`prefers-reduced-motion` 跳过
- [ ] **C3** God Rays 体积光（可选；移动默认 OFF）

### 明确不做（除非另开需求）

- 整页 WebGL 场景转场
- 流体模拟（fluid sim）
- Howler 音效
