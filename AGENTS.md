# 项目长期协作规则

本文件是 Codex 在本项目中的首要项目级工作约束。开始任务前应先读取本文件，并按任务需要继续读取 `docs/` 中的对应文档和 `TASKS.md`。

## 1. 项目目标

- 为 Web 编程期末大作业制作一个原创、稳定、美观、可交互的海洋保护展示与互动网站。
- 项目以海洋生命的美丽、活力和深邃感吸引用户，再用数据、地图和行动互动加深保护意识；不得主要依靠恐吓或堆叠污染灾难来推动主题。
- 当前选题方向为“海洋保护”，暂定核心议题为“海洋之美、污染现状与公众行动”；最终定位以 `docs/PROJECT_BRIEF.md` 为准。
- 项目必须覆盖老师要求的 HTML、CSS、JavaScript、至少 3 个页面、图片、表格、文字、链接、表单和数据显示。
- 在满足基准要求后，再争取数据可视化、JavaScript 特效、HTML5、音视频、互动地图、性能优化等加分项。

## 2. 文档优先级

发生冲突时按以下优先级执行：

1. 用户在当前对话中的明确要求
2. `AGENTS.md`
3. 根目录 **`DESIGN.md`** 与 **`.codexrules`**（大疆风海水蓝最终设计基准；Codex/Cursor 做 UI 前必读）
4. `docs/PROJECT_BRIEF.md` 和 `docs/ACCEPTANCE.md`
5. `docs/OCEAN_REFINE_RULES.md`（「我们的海洋」视觉气质、紧凑排版、禁止项、分阶段执行）
6. `docs/OCEAN_PAGE.md`（「我们的海洋」页面功能与数据宪法）
7. `docs/RESCUE_OBSERVATORY_RULES.md`（「海在呼救 / Observatory」视觉气质、紧凑排版、禁止项、分阶段执行）
8. `docs/RESCUE_PAGE.md`（「海在呼救」页面功能与数据宪法）
9. `docs/SPECIES_PAGE.md`（「海洋生物档案」页面功能宪法）
10. `docs/SPECIES_ARCHIVE_RULES.md`（「海洋生命档案馆」视觉气质、禁止项、分阶段执行与 Playwright 强制质检）
11. `docs/ACTION_PAGE_VISUAL_RULES.md`（「海洋行动中心」视觉气质、禁止项、排版、分阶段执行）
12. `docs/ACTION_PAGE.md`（「保护行动中心」页面宪法）
13. `docs/ACCOUNT_SYSTEM_RULES.md`（右上角账户入口、头像菜单、登录注册弹窗、用户状态）
14. `.cursor/skills/lancun-design/SKILL.md`（外部工具用法：Vercel 摘表、ui-ux-pro-max 三模块）
15. `docs/DESIGN_SYSTEM.md`、`docs/PAGE_STRUCTURE.md` 等专项文档（**CSS 实现 mirror**）
16. `TASKS.md`

## 3. 工作方式

- 先讨论并记录决定，再开始相应阶段的实现。
- 不得将“待确认”的内容当作最终决定；必须保留标记或向用户确认。
- 每次确认项目范围、页面、设计、数据或验收标准后，同步更新对应文档和 `TASKS.md`。
- 开发新页面前读取根目录 **`DESIGN.md`**、`.codexrules`、`PROJECT_BRIEF.md`、`PAGE_STRUCTURE.md`、`docs/DESIGN_SYSTEM.md` 和 `ACCEPTANCE.md`；开发或修改 [`pages/ocean.html`](pages/ocean.html) 时另读 **`docs/OCEAN_REFINE_RULES.md`** 与 **`docs/OCEAN_PAGE.md`**；开发或修改 [`pages/rescue.html`](pages/rescue.html) 时另读 **`docs/RESCUE_OBSERVATORY_RULES.md`** 与 **`docs/RESCUE_PAGE.md`**；开发或修改 [`pages/species.html`](pages/species.html) 时另读 **`docs/SPECIES_PAGE.md`** 与 **`docs/SPECIES_ARCHIVE_RULES.md`**；开发或修改 [`pages/action.html`](pages/action.html) 时另读 **`docs/ACTION_PAGE_VISUAL_RULES.md`** 与 **`docs/ACTION_PAGE.md`**。
- 修改 [`pages/ocean.html`](pages/ocean.html) 或 `assets/css/ocean-page.css` / `assets/js/ocean-dashboard.js` 前必须先读 **`docs/OCEAN_REFINE_RULES.md`**（气质、禁止项、紧凑排版、分阶段执行）与 **`docs/OCEAN_PAGE.md`**（A.1–A.3 数据契约）；每次只完成用户指定的当前阶段，完成后列出改动文件并停止；布局 / Explorer / Footer 改动后建议跑 `node scripts/verify-ocean-compact.mjs`。
- 修改 [`pages/rescue.html`](pages/rescue.html) 或 `assets/css/rescue-page.css` / `assets/js/rescue/**` 前必须先读 **`docs/RESCUE_OBSERVATORY_RULES.md`**（气质、禁止项、紧凑排版、分阶段执行）与 **`docs/RESCUE_PAGE.md`**（API / 数据契约）；每次只完成用户指定的当前阶段，完成后列出改动文件并停止。
- 修改 [`pages/species.html`](pages/species.html) 或 `assets/css/species-page.css` / `assets/js/species/**` 前必须先读 **`docs/SPECIES_ARCHIVE_RULES.md`**（气质、禁止项、分阶段执行）；每一轮改动后**必跑** `node scripts/verify-life-archive.mjs`，通过后再汇报；涉及 AI 识别时追加 `node scripts/verify-species-ai.mjs`。
- 修改 [`pages/action.html`](pages/action.html) 或 `assets/css/action-page.css` / `assets/js/action/**` 前必须先读 **`docs/ACTION_PAGE_VISUAL_RULES.md`**（气质、禁止项、排版、分阶段执行）与 **`docs/ACTION_PAGE.md`**（附录 G schema / DOM / smoke）；每次只完成用户指定的当前阶段，完成后列出改动文件并停止；布局改动后建议跑 `node scripts/verify-action-page.mjs`（及模块 smoke）。
- 修改 `user-menu-html.js`、`app.js` 账户逻辑、`.user-menu` / `.auth-modal` 样式或账户弹窗前必须先读 **`docs/ACCOUNT_SYSTEM_RULES.md`**；每次只完成用户指定的当前阶段，完成后列出改动文件并停止。
- 修改页面视觉或 `assets/css/**` 前必须先读取 **`DESIGN.md`** 与 lancun-design Skill（工具用法）。
- 修改已有页面时保留用户已有成果，避免无关重写。
- 一次集中完成一个可验收目标，完成后测试并说明结果；「我们的海洋」页须遵守 `OCEAN_REFINE_RULES.md`：只做当前阶段、不顺手做下一阶段、完成后列出改动文件并停止；「海在呼救 / Observatory」页须遵守 `RESCUE_OBSERVATORY_RULES.md`：只做当前阶段、不顺手做下一阶段、完成后列出改动文件并停止；物种页须遵守 `SPECIES_ARCHIVE_RULES.md`：只做当前阶段、不顺手做下一阶段、完成后列出改动文件并停止；行动中心页须遵守 `ACTION_PAGE_VISUAL_RULES.md`：只做当前阶段、不顺手做下一阶段、完成后列出改动文件并停止。
- 所有重要视觉决定必须先征询用户意见，包括主视觉、配色、排版、动效强度、图片风格和页面构图。
- 不得未经用户确认擅自完成“最终美化”。可以先制作结构清晰的框架稿，再让用户逐步选择和调整。
- 需要探索视觉时，优先先生成或整理图片方向稿，再依据用户选定的方向实现页面。
- 用户的审美和解释优先于 AI 的默认设计偏好；如发现实现限制，应说明限制并提供可比较的替代方案。

## 4. 技术与质量约束

- 基础技术必须使用原生 HTML5、CSS3 和 JavaScript ES6+。
- 是否加入第三方前端库必须先说明用途；不得用框架掩盖对基础课程技术的掌握。
- 页面必须具备响应式布局，不得出现移动端横向溢出。
- 交互必须支持键盘操作、清晰焦点和必要的无障碍标签。
- 尊重 `prefers-reduced-motion`，动画不得妨碍阅读和操作。
- 表单必须包含标签、验证、错误提示和提交反馈。
- 数据、图片、图标和参考代码必须记录来源，不得伪造数据或出处。
- 关键功能不得只依赖网络 CDN；若使用外部资源，应考虑加载失败时的降级方案。

## 5. 设计约束

- 视觉效果必须服务于“欣赏海洋之美—产生好奇—理解现状—参与保护”的内容路径。
- 不直接照搬下载的设计案例或现有品牌网站，只提炼可解释的设计原则。
- **双轨依据：**
  - **颜色、字号、间距、圆角、阴影、动效、玻璃参数** → 根目录 **`DESIGN.md`**（与 `.codexrules` 一致；禁止自创未定义样式）
  - **工具用法与禁止风格清单** → `.cursor/skills/lancun-design/SKILL.md`
  - **实现索引** → `docs/DESIGN_SYSTEM.md` v4（mirror `DESIGN.md` + `assets/css/base.css`）
- 正式开发前应由用户选择视觉方向；未选择前不得把探索方案写成最终规范。
- 避免无意义的玻璃卡片堆叠、过量霓虹、滥用动画和每页风格不一致。
- 视觉方向探索必须参考用户提供并选定的方向稿；ui-ux-pro-max **仅按 Skill 内三模块**调用，不能替代用户选择，且不得全开 `--design-system` 扫入 Bento/新拟态等风格。

## 6. 验证与交付

- 每个页面至少检查桌面端和移动端。
- 每次功能实现后检查导航、链接、控制台错误、表单、数据加载和状态反馈。
- 视觉实现采用“浏览器截图—对照规范—修复—复查”的循环。
- 若存在可复用的设计稿或方向图，优先使用 Playwright 截图与方向图进行对照；差异报告用于修复，不替代用户的最终视觉判断。
- 最终交付前按 `docs/ACCEPTANCE.md` 完整验收，并补齐引用来源和项目说明。
