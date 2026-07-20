# 「海洋生物档案」页面宪法

## 文档状态

- 版本：1.0
- 状态：讨论中（产品结构、三节架构、mock 数据与 Phase A 识别已写入；实现轮视觉待用户确认）
- 最近更新：2026-07-18
- 适用范围：[`pages/species.html`](../pages/species.html) 及其脚本、样式、本页数据源
- 冲突优先级：用户当前对话明确要求 → `AGENTS.md` → **本文档** → `PAGE_STRUCTURE.md` → 其他专项文档

本文档是「海洋生物档案」板块的**唯一权威**计划兼实现宪法。未写入本文或仍标「待确认」的内容，不得当作最终决定去实现。

---

## 0. 用户需求摘要

以下为你在全局架构与生物档案细化讨论中已确认的要求；细则见 §2–§6 与附录 A–G。

| 需求 | 你的决定 |
|------|----------|
| 改版优先级 | 除**首页**与**「我的」**外，各板块需大改；生物档案在 ocean / rescue 之后推进 |
| 页面定位 | **海洋物种科普 + 保护等级科普 + AI 互动识别**；承接全站「认识生命 → 理解保护」主线 |
| 页面结构 | 单页纵向 **三节**：① 濒危物种检索 ② 生物数据看板 + 物种档案网格 ③ 海洋动物 AI 识别器 |
| 检索区 | 页面级独立大搜索框（圆角透明玻璃）+ 6 个快捷分类标签；搜索词与标签 **AND** 联动过滤 |
| 看板 | 4 张正面科普 metric 卡（120+ / 18 / 36 / 12）；**禁止**污染类指标 |
| 物种列表 | 响应式网格 + 统一卡片 + **详情弹窗**（不跳新页） |
| AI 识别 | **Phase B 已接入**：ECNU `ecnu-plus` + 本地代理；失败降级 mock | 附录 G.2 |
| 数据策略 | 当前全部来自 `mock-data.js`；真实检索与 AI 通过附录 G 接口契约后续替换 |
| 视觉 | 深海玻璃拟态 + 澜存通透蓝调；**服从根目录 `DESIGN.md`**；先框架稿，未经确认不做最终美化 |
| 仍待你确认 | 物种实景图最终素材；附录 A 统计数字正式出处（实现轮可先用占位 + source-note） |

---

## 1. 页面定位

- 主题线：让用户从**具体物种**理解海洋生命之美与保护紧迫性，并可通过 AI 识别器获得互动体验，服务叙事「欣赏生命 → 了解等级 → 参与保护」。
- **禁止**在本页出现：污染可视化看板、个人 localStorage 统计（积分/打卡等）、恐吓式堆叠文案。
- **禁止**伪造「实时 API」或「真实 AI 结论」标签；Phase A mock 须明确标注演示性质。
- 与 [`docs/OCEAN_PAGE.md`](OCEAN_PAGE.md) 边界：ocean 页讲宏观海洋之美与观测；本页讲**物种级**档案与识别。
- 与 [`docs/RESCUE_PAGE.md`](RESCUE_PAGE.md) 边界：rescue 页讲污染与监测；本页**禁止**塑料/污染榜类指标。
- 技术：原生 HTML5 / CSS3 / JavaScript ES6+；本页不新增后端服务；图片与识别 Phase A **不上传服务器**。
- 视觉：版心、玻璃、圆角、阴影、动效一律使用 `DESIGN.md` 已定义 token（`--page-width`、`--glass-*`、`--radius` 等）；用户方案中的「1280px / 12px」映射到现有 token，**禁止**自创未定义样式。
- **不改**：首页整体与「我的」界面（本宪法范围外）。复用全站顶栏与用户菜单组件。

---

## 2. 已锁定产品决定

| 项 | 决定 |
|----|------|
| 路由 | 单页 `pages/species.html`，不拆子路由 |
| 布局 | 主内容区 **纵向三节**（顺序固定，见 §3） |
| 删除项 | 现有 `two-column` 左右分栏（左列表 + 右识别器） |
| 删除项 | 现有 5 标签筛选（`爬行动物` / `无脊椎动物` 等旧枚举）→ 替换为附录 C 的 6 标签 |
| 删除项 | 现有 `app.js` 内联 `setupSpecies()` 大段 DOM 拼接逻辑 → 迁至独立模块（附录 F） |
| 检索 | 页面级 `#species-search`；不挤占全站 nav |
| 详情 | 原生 `<dialog>` 或等价 accessible modal；含完整档案字段（附录 D） |
| 识别 | ECNU ecnu-plus 真实识别 + mock 降级；拖放 / 点击 / 移动端 `capture="environment"` |
| 图片 | 优先 `assets/media/species/{id}.jpg`；缺失时用渐变占位 + 物种名 |

---

## 3. 三节信息架构（固定顺序）

### 3.1 第一节 — 濒危物种检索区

- DOM 锚点（实现时必须提供）：`id="species-search"`。
- 目的：顶栏式**页面内**检索体验（圆角透明玻璃），实时过滤下方物种网格。

**布局**：

- 居中通栏；搜索框宽度：桌面约 **70%** 版心、平板 **90%**、移动 **100%**。
- 搜索框下方一行 **6** 个快捷标签，居中排列；区块纵向间距遵循 §5。

**功能**：

- 输入物种**中文名**或**别名**（`aliases[]`）模糊匹配，实时过滤 `[data-species-list]`。
- `Enter` 或点击搜索图标触发检索（与 input 事件并存）；无匹配时显示空状态（附录 E.4）。
- 搜索框：左侧放大镜图标；右侧一键清空；可选联想下拉 `[data-species-suggest]`（Phase 1：mock 前缀匹配，≤8 条）。
- 6 标签与搜索词 **AND** 过滤：标签非「全部」时，仅显示 `category` 匹配项。

**DOM / 数据属性**：

- `input[data-species-search]`、`button[data-species-search-submit]`、`button[data-species-search-clear]`
- `[data-species-tag]`，`data-species-tag="all|mammal|reptile|coral|fish"`
- `[data-species-suggest]`（可选 ul）

**交互 / 视觉**：

- 搜索框大圆角（映射 `DESIGN.md` 最大圆角 token，建议 `--radius-lg` 或等价）；玻璃底 + focus 浅蓝外光晕。
- 标签：小号玻璃描边；选中态填充主色亮蓝、文字变白；切换 **200–300ms** 淡入（`prefers-reduced-motion` 时禁用位移）。

### 3.2 第二节 — 生物数据看板 + 物种档案网格

- DOM 锚点（实现时必须提供）：`id="species-archive"`。
- 目的：正面科普统计 + 可检索的物种卡片库。

#### 3.2.1 上层 — 生物数据看板

- 容器：`[data-species-metrics]`。
- **4** 张等宽玻璃 metric 卡，横向一字排开，间距 **24px**；移动 **2×2** 网格。
- 指标见附录 A（已收录 / 国家一级 / 濒危等级 / 特有物种）。
- 每卡：线性图标 → 大号数字 → 指标名 → 小字说明；数字带滚动入场计数（IntersectionObserver，reduced-motion 时直接显示终值）。
- 悬浮：轻微上浮 + 边框亮度提升（与全站卡片动效一致）。

#### 3.2.2 下层 — 物种档案网格

- 容器：`[data-species-list]`。
- 响应式网格：桌面 **4** 列、平板 **2** 列、移动 **1** 列；卡片间距 **20px**；卡片尺寸统一（竖向矩形）。
- 单卡内容（自上而下）：
  1. 物种图（或占位）；左上角保护等级角标（附录 B.2 色阶）
  2. 中文名 + 拉丁文名（小字浅灰）
  3. 一句话简介 + 「查看档案」文字按钮
- 点击卡片或「查看档案」→ 打开 `dialog[data-species-modal]`（附录 D）。
- 过滤结果切换：**200–300ms** 淡入；空状态见附录 E.4。

### 3.3 第三节 — 海洋动物 AI 识别器

- DOM 锚点（实现时必须提供）：`id="species-recognizer"`。
- 目的：演示「上传 → 识别 → 查看档案」闭环；Phase A 用 mock 保证作业展示稳定。

**布局**：

- 整块大玻璃容器 `[data-species-recognizer]`。
- 桌面：左上传区 **45%**、右结果区 **55%**；移动：上传在上、结果在下。

**左侧 — 上传交互区** `[data-species-upload-zone]`：

- 拖放：dragover 时边框高亮、背景透明度提升；drop 接受 `image/jpeg`、`image/png`。
- 点击：打开系统文件选择；`<input type="file" accept="image/jpeg,image/png" capture="environment">` 适配手机拍照。
- 上传成功：缩略图 + 文件名 + 大小；「重新上传」「取消」按钮。
- 识别中：加载动画 + 「识别中，请稍候...」（Phase A 固定 **1.5s**）。

**右侧 — 识别结果区** `[data-species-recognition-result]`：

| 状态 | 展示 |
|------|------|
| 未识别 | 占位图标 + 「上传图片，一键识别海洋生物」 |
| 成功 | 物种中文名 + 置信度 % + 保护等级 + 简短介绍 + 「查看完整档案」「重新识别」 |
| 失败 | 失败提示 + 引导更换清晰正面图 |

- 「查看完整档案」→ 打开同一 `dialog[data-species-modal]`，定位到 mock 匹配物种。
- Phase A 匹配策略：对文件做简单 hash 或随机，从 `LANCUN_DATA.speciesArchive` 中选取；**禁止**声称真实 AI。
- **禁止** Phase A 将图片上传至任何第三方或自建服务器。

**Phase B（后续）**：见附录 G；不在 v1.0 实现范围。

---

## 4. 数据策略（强制）

### 4.1 当前阶段（Phase 1 — mock）

| 数据 | 来源 | 说明 |
|------|------|------|
| 看板 4 指标 | `LANCUN_DATA.speciesMetrics` | 附录 A；页内须 `source-note` |
| 物种列表 | `LANCUN_DATA.speciesArchive[]` | 附录 B schema + 预设 12 种 |
| 检索 / 标签 | 前端 filter | 不请求网络 |
| AI 识别 | `recognizeSpecies()` / `recognizeSpeciesMock()` | 附录 G.2 |

- 现有 `LANCUN_DATA.species`（4 条旧数据）在实现轮**迁移合并**入 `speciesArchive`，避免双份数据源。
- 图片路径：`assets/media/species/{id}.jpg`（可选 png）；git 可后续按需加入 `.gitignore` 大文件策略。

### 4.2 来源与诚实标注

- 看板数字、保护等级表述须可在 [`docs/DATA_SOURCES.md`](DATA_SOURCES.md) 追溯；实现轮可先用「演示统计，待补正式出处」占位。
- 卡片与弹窗中的 IUCN / 国家一级等表述为**科普演示**，不得冒充实时政务 API。

### 4.3 禁止项

- 禁止在本页调用污染类 API 或展示 rescue/ocean 已占用 live 指标。
- 禁止在未接入 Phase B 时隐藏 mock 性质或展示虚假「百度 AI 已接入」。

---

## 5. 响应式与间距（锁定）

| 断点 | 规则 |
|------|------|
| ≥1200px | 物种网格 4 列；搜索框 70% 版心；识别区左右分栏 |
| 768–1199px | 物种网格 2 列；搜索框 90%；识别区左右分栏 |
| <768px | 物种网格 1 列；搜索框满宽；识别区上下堆叠；看板 2×2 |

- 页面最大内容宽度：`var(--page-width)`（DESIGN.md，当前 75rem）。
- 区块纵向间距：**80px**（映射 `--space-section` 或等价 section margin）；区块内边距 **24px**。
- 全页不得出现横向溢出；`dialog` 在移动端须可滚动且可关闭。

---

## 6. 开发执行顺序（实现轮必须遵循）

| 阶段 | 任务 |
|------|------|
| P0 | 三节 HTML 骨架 + DOM 锚点 + 复用 header；删除旧 `two-column` |
| P1 | `species-page.css` 玻璃检索框、看板、网格、识别区静态样式（DESIGN token） |
| P2 | `mock-data.js` 注入 `speciesMetrics` + `speciesArchive`（附录 A/B 预设） |
| P3 | 搜索 / 标签过滤、空状态、详情 `dialog` 打开关闭与焦点陷阱 |
| P4 | 上传 UI + Phase A mock 识别 + 链至 modal |
| P5 | 计数动画、过渡、响应式、a11y、`prefers-reduced-motion` 复查 |

---

## 附录 A — 生物数据看板指标（4 卡）

| 卡片名称 | 数值（演示） | 补充说明 | 建议 icon 语义 |
|----------|--------------|----------|----------------|
| 已收录海洋物种 | 120+ | 涵盖我国海域主要代表性生物 | 网格 / 档案 |
| 国家一级保护 | 18 种 | 如中华白海豚、绿海龟、玳瑁 | 盾牌 |
| 濒危等级物种 | 36 种 | IUCN 红色名录易危及以上 | 警示（非恐吓） |
| 特有海洋物种 | 12 种 | 我国海域特有珍稀物种 | 定位 pin |

**JSON 示例**（写入 `mock-data.js` → `speciesMetrics`）：

```javascript
speciesMetrics: [
  { id: 'catalogued', label: '已收录海洋物种', value: 120, suffix: '+', note: '涵盖我国海域主要代表性生物' },
  { id: 'national-l1', label: '国家一级保护', value: 18, suffix: ' 种', note: '如中华白海豚、绿海龟、玳瑁' },
  { id: 'iucn-threatened', label: '濒危等级物种', value: 36, suffix: ' 种', note: 'IUCN 红色名录易危及以上' },
  { id: 'endemic', label: '特有海洋物种', value: 12, suffix: ' 种', note: '我国海域特有珍稀物种' },
]
```

---

## 附录 B — 物种档案数据 schema

### B.1 字段（`speciesArchive[]` 每项）

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `id` | string | 是 | 唯一 slug，如 `chinese-white-dolphin` |
| `name` | string | 是 | 中文名 |
| `latinName` | string | 是 | 拉丁文名 |
| `aliases` | string[] | 否 | 别名，供检索 |
| `category` | string | 是 | 枚举见附录 C |
| `level` | string | 是 | 展示用保护等级文案，如「国家一级保护」 |
| `levelTone` | `'red'|'orange'|'yellow'|'blue'` | 是 | 角标色阶 |
| `summary` | string | 是 | 卡片一句话简介 |
| `image` | string | 否 | 相对路径，如 `assets/media/species/xxx.jpg` |
| `distribution` | string | 是 | 分布区域（弹窗） |
| `habitat` | string | 是 | 生活习性 |
| `status` | string | 是 | 生存现状 |
| `protection` | string | 是 | 保护措施 |
| `source` | string | 否 | 数据来源说明 |
| `sourceHref` | string | 否 | 来源链接 |

### B.2 保护等级角标色阶

| levelTone | 适用示例 | 视觉 |
|-----------|----------|------|
| `red` | 国家一级保护、极危 CR | 红底白字 |
| `orange` | 濒危 EN、国家二级 | 橙底白字 |
| `yellow` | 易危 VU、受威胁 | 黄底深字 |
| `blue` | 关注、数据 deficient | 蓝灰底 |

### B.3 预设物种清单（实现轮至少写入 mock）

| category | 物种 |
|----------|------|
| 哺乳动物 | 中华白海豚、蓝鲸、抹香鲸、斑海豹 |
| 海龟与爬行动物 | 绿海龟、玳瑁、棱皮龟 |
| 珊瑚与腔肠动物 | 鹿角珊瑚、脑珊瑚、红珊瑚 |
| 鱼类 | 中华鲟、大黄鱼 |

（共 **12** 种；可增不可减至低于 12，以保证网格演示效果。）

---

## 附录 C — 快捷标签与 category 映射

| UI 标签文案 | `data-species-tag` | `category` 字段值 |
|-------------|-------------------|-------------------|
| 全部 | `all` | （不过滤） |
| 哺乳动物 | `mammal` | `哺乳动物` |
| 海龟与爬行动物 | `reptile` | `海龟与爬行动物` |
| 珊瑚与腔肠动物 | `coral` | `珊瑚与腔肠动物` |
| 鱼类 | `fish` | `鱼类` |

---

## 附录 D — 物种详情弹窗

**容器**：`dialog[data-species-modal]`，`aria-labelledby` 指向物种中文名标题。

**结构（自上而下）**：

1. 关闭按钮（`aria-label="关闭"`）+ 物种大图（或占位）
2. 保护等级角标 + 中文名 + 拉丁文名
3. 分区小标题 + 段落：**分布区域**、**生活习性**、**生存现状**、**保护措施**
4. 可选 `source-note` + 外链
5. 底部 CTA：「前往行动中心」→ [`pages/action.html`](../pages/action.html)（可选）

**交互**：

- 打开时焦点移入 dialog；`Escape` 关闭；点击 backdrop 关闭（若使用 `<dialog>` 原生行为）。
- 从识别结果「查看完整档案」须传入同一 `id` 渲染弹窗内容。

---

## 附录 E — 视觉与动效

### E.1 玻璃容器（全节共用）

- 背景：`var(--glass-sea)` 或 DESIGN 等价半透明深蓝
- 模糊：`backdrop-filter: blur(var(--glass-blur))`（20px）
- 边框：`1px solid var(--glass-border)`
- 圆角：`var(--radius)`（禁止自造 12px 若与 token 冲突）

### E.2 检索框

- 大圆角 pill 形态；placeholder 浅灰白
- focus：浅蓝外光晕（`box-shadow` 使用 `--ocean-500` 低透明度）

### E.3 物种卡片

- 统一最小高度；图片区 `aspect-ratio: 4/3` 或固定高度
- hover：轻微 `translateY(-2px)` + 边框亮度（reduced-motion 仅改边框）

### E.4 空状态

- 无匹配：简约插画占位 + 「未找到相关物种，请尝试其他关键词或重置筛选」
- 提供「重置筛选」按钮：清空搜索 + 标签回 `全部`

### E.5 识别区

- 上传区默认虚线边框；dragover 实线主色边框
- 置信度：浅蓝进度条，宽度 = 百分比

**禁止（DESIGN.md）**：大面积 teal 主色、厚重阴影、夸张 spring/scale 弹跳、未定义色值。

---

## 附录 F — 技术实现映射

| 概念 | 本项目实现 |
|------|------------|
| 页面 | [`pages/species.html`](../pages/species.html) |
| 样式 | [`assets/css/species-page.css`](../assets/css/species-page.css)（新建，仅 `:root` 已有变量） |
| 脚本 | [`assets/js/species-page.js`](../assets/js/species-page.js)（新建）；`app.js` 仅 `initSpeciesPage()` 入口 |
| 数据 | `LANCUN_DATA.speciesMetrics`、`LANCUN_DATA.speciesArchive` |
| 旧逻辑 | 删除或废弃 `app.js` 内 `setupSpecies()` 大段实现 |

**HTML `data-page`**：保持 `body[data-page="species"]` 供全站脚本识别。

---

## 附录 G — 未来接口契约（Phase B，本轮不实现）

实现时 DOM 层与 mock 层之间插入适配器，便于后续替换而不改 UI。

### G.1 物种检索 `searchSpecies`

```javascript
/**
 * @param {{ query: string, category: string }} params — category 为附录 C 的 tag 或 'all'
 * @returns {Promise<SpeciesArchiveItem[]>}
 */
async function searchSpecies({ query, category }) { /* Phase A: 本地 filter；Phase B: 可选后端 */ }
```

### G.2 识别 mock / 真实 `recognizeSpecies`

```javascript
/**
 * Phase A — recognizeSpeciesMock(file: File): Promise<{ speciesId, name, confidence, level }>
 * 延迟 1500ms；confidence 60–98 随机；speciesId 从 speciesArchive 选取
 *
 * Phase B — recognizeSpecies(file: File): Promise<...>
 * 前端 Canvas 压缩 → POST http://127.0.0.1:8787/api/recognize-species
 * 后端转发 ECNU ecnu-plus（json_schema 结构化输出）；密钥在 .env
 * API/代理失败时 fallback mock，UI 标注 demoMode
 */
```

**Phase B 实现（2026-07-20）**

- 模型：`ecnu-plus` @ `https://chat.ecnu.edu.cn/open/api/v1/chat/completions`
- 代理：`server/ecnu-proxy.mjs`；物种目录：`server/species-catalog.json`
- 额度：`.quota-usage.json` 本地统计 + 页面进度条
- 出处：`docs/DATA_SOURCES.md`「AI 物种识别」节

### G.3 Phase B 参考（非承诺）

- ~~百度智能云 · 动物识别 API~~（已由 ECNU ecnu-plus 替代）
- 前端通过本地代理转发；失败时降级 Phase A mock 并提示

---

## 附录 H — 验收清单（实现轮）

- [ ] 三节顺序与锚点 `#species-search` / `#species-archive` / `#species-recognizer` 存在。
- [ ] 5 标签 + 搜索 AND 过滤；空状态与重置可用。
- [ ] 4 看板卡 + 滚动计数（reduced-motion 降级）。
- [ ] 网格 4/2/1 列响应式；12 物种 mock 数据。
- [ ] 详情 dialog 键盘可操作；含附录 D 全部字段。
- [ ] 识别：拖放/点击/拍照 UI；**Phase B ECNU 识别 + mock 降级**；额度进度条。
- [ ] 无横向溢出；样式 token 仅来自 DESIGN / base.css。
- [ ] 控制台无阻塞错误；导航与用户菜单正常。

---

## 附录 I — 修订记录

| 日期 | 版本 | 说明 |
|------|------|------|
| 2026-07-18 | 1.0 | 首版：三节架构、附录 A–G、Phase A mock 识别锁定、DESIGN 对齐 |
