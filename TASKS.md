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
> 目标：Convex「Where we are working」启发式 MVP；内容仍为五大洋；`#ocean-explore` 局部深底例外（`#0F172A → #1E3A8A`）。

### Phase A · 今日 MVP

- [ ] **A0** 前置：读取 AGENTS / DESIGN / ACCEPTANCE / 本计划；确认 serve.ps1 与 Vercel 一致
- [ ] **A1** 地球调亮：HemisphereLight、ACES exposure ~1.25、emissive、云/大气 opacity、初始 rotation y ~-25°
- [ ] **A2** 布局：Convex 深底渐变；左白字文案（非白岛卡片）；右大地球；大陆架 toggle UI；隐藏 CSS 气泡
- [ ] **A3** 模块拆分：`assets/js/globe/`（GlobeScene / earth / shelves / bubbles / markers / composer stub）；vendor 本地化 EffectComposer + GSAP
- [ ] **A4** 大陆架 toggle：placeholder `shelves-mask.png` + GSAP `uOffset` 0↔1；reduced-motion 即时切换
- [ ] **A5** WebGL 气泡双 pass：RenderTarget(earth+clouds) → InstancedMesh IOR shader；40/20 实例
- [ ] **A6** CSS2D 五大洋标记 + modal（Esc / 键盘 a11y）；对接 `LANCUN_DATA.fiveOceans`
- [ ] **A7** 性能：IntersectionObserver 启停 rAF；mobile 降级；`LANCUN_homeGlobe.applyMotion()`
- [ ] **A8** 文档 + 验收：DATA_SOURCES、设计例外说明、Vercel 无痕窗口 + Console 0 error

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
