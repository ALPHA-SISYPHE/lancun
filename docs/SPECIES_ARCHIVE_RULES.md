# 海洋生命档案馆 · 协作规则

## 0. 文档状态

| 项 | 内容 |
|----|------|
| 版本 | 1.0 |
| 状态 | 生效中（后续物种页每一阶段优化前必读） |
| 最近更新 | 2026-07-21 |
| 适用范围 | [`pages/species.html`](../pages/species.html)、[`assets/css/species-page.css`](../assets/css/species-page.css)、[`assets/js/species/`](../assets/js/species/) |
| 角色 | 视觉气质、禁止项、页面 Token、排版、分阶段执行、Playwright 质检 |
| 功能架构 | 模块与数据契约见 [`SPECIES_PAGE.md`](SPECIES_PAGE.md)（v2） |
| 全站设计基准 | [`DESIGN.md`](../DESIGN.md)（品牌色 / glass / 版心上限） |

**冲突优先级（物种页相关）：** 用户当前对话明确要求 → `AGENTS.md` → **本文档**（气质/禁止/分阶段）→ `SPECIES_PAGE.md`（功能）→ `DESIGN.md`（全站 token）→ 其他专项文档。

---

## 1. 页面定位

英文名：**Ocean Life Archive**  
中文名：**海洋生命档案馆**

本页是高级、沉浸、克制、具有海洋纪录片气质与科研档案感的：

- 濒危物种检索
- 本地物种档案浏览
- AI 图片识别
- 未收录物种的「新档案线索」补充

**本页不是：**

- 普通数据后台
- 商品卡片列表
- SaaS Dashboard
- AI Landing Page
- Bootstrap 模板页

---

## 2. 气质关键词

| 关键词 | 含义 |
|--------|------|
| 生命 | 以具体物种为中心，强调生命之美与多样性 |
| 档案 | 科研档案卡、细线、半透明「档案舱」 |
| 检索 | 分类 + 精确/模糊双层检索 |
| 识别 | AI 识别实验舱，克制展示，非炫技 |
| 发现 | 未收录时引导「新的档案线索 / 观察记录」 |
| 保护 | 导向行动与保护意识，不恐吓堆叠 |

与前两页同属澜存网站，但**不得照抄**前两页结构：

- 第一页（我们的海洋）：宏观、平静、科研、探索
- 第二页（海在呼救）：监测、压力、溯源、行动
- **第三页（本页）**：生命、档案、检索、识别、发现、保护

---

## 3. 全站风格必须保持

修改本页时必须保持：

1. 深海背景视频  
2. 海洋纪录片气质  
3. National Geographic 式自然叙事  
4. Apple Environmental Report 式高级排版  
5. 科研档案感  
6. 半透明内容层  
7. 适当留白  
8. 清晰的文字层级  
9. 细线分割  
10. 少量蓝色高亮  
11. 高质量海洋摄影图（或诚实渐变占位，禁止廉价蓝块堆叠）  
12. 页面整体高级、冷静、克制  

---

## 4. 绝对禁止

1. 删除背景视频  
2. 用巨大纯白或灰白色面板盖住整个页面  
3. 做成普通后台 Dashboard  
4. 做成商品卡片列表  
5. 做成 Bootstrap 模板风  
6. 做成 SaaS Landing Page  
7. 使用紫蓝渐变 AI 风  
8. 使用大圆角卡片堆叠  
9. 使用强阴影  
10. 一次性铺满 100 张动物卡片  
11. 把搜索区、动物卡片、AI 识别区全部塞进一个大白盒子  
12. 生成一堆蓝色占位卡片破坏视觉  
13. 让桌面端出现像移动端一样的窄弹窗（桌面详情应为右侧抽屉）  
14. 产生横向滚动、文字溢出、图片遮挡、z-index 层叠错误  

---

## 5. 必须保留的视觉底层

页面必须有背景视频层 + 深海渐变遮罩。内容面板应像漂浮在深海上的「档案舱 / 观察站」，而不是实心后台面板。

### 5.1 参考实现（语义目标）

```css
.page-video-bg {
  position: fixed;
  inset: 0;
  z-index: -2;
  overflow: hidden;
}

.page-video-bg video {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.page-video-overlay {
  position: fixed;
  inset: 0;
  z-index: -1;
  pointer-events: none;
  background:
    linear-gradient(
      to bottom,
      rgba(3, 18, 34, 0.28) 0%,
      rgba(3, 18, 34, 0.56) 46%,
      rgba(3, 18, 34, 0.82) 100%
    );
}
```

### 5.2 项目当前等价实现

全站已采用 [`assets/css/base.css`](../assets/css/base.css) 中的：

- `.page-bg-video` + `.page-bg-video__media`
- 物种页遮罩：`.page-bg-video__shade--archive`

**语义等价即可**；改类名时不得削弱视频可见性或改成不透明白岛覆盖。

**禁止：** `page-island` 式大面积不透明白底盖住整页视频。

---

## 6. 设计 Token（物种页档案舱）

在 [`assets/css/species-page.css`](../assets/css/species-page.css) 的 `.life-archive-page` 作用域内统一语义变量：

| Token | 值 | 用途 |
|-------|-----|------|
| `--deep` | `#031426` | 深海底 |
| `--deep-soft` | `rgba(3, 20, 38, 0.68)` | 软深色叠层 |
| `--deep-panel` | `rgba(4, 22, 39, 0.74)` | 深色面板 |
| `--light-panel` | `rgba(234, 245, 247, 0.68)` | 浅色半透明舱 |
| `--frost-panel` | `rgba(242, 248, 250, 0.58)` | 霜面舱 |
| `--line-light` | `rgba(255, 255, 255, 0.14)` | 浅细线 |
| `--line-dark` | `rgba(7, 30, 48, 0.12)` | 深细线 |
| `--text-light` | `#F2F8FA` | 深底上的正文 |
| `--text-muted` | `rgba(242, 248, 250, 0.68)` | 深底次要字（仍须可读） |
| `--ink` | `#08233D` | 浅舱内正文 |
| `--blue` | `#4DA3FF` | 少量高亮 |
| `--cyan` | `#55D6C2` | 点缀（克制） |
| `--warning` | `#DFAE4D` | IUCN 中等警示 |
| `--critical` | `#D9783D` | IUCN 高危 |
| `--normal` | `#35AFA0` | IUCN 较低关注 |

**冲突时：**

- 全站品牌主色、glass 模糊基准、圆角上限 → 服从 [`DESIGN.md`](../DESIGN.md)
- 本页「档案舱」半透明与 IUCN 色阶语义 → 服从本文档 Token

不要滥用纯白；不要滥用纯深蓝实心大块。用 rgba 半透明、细线、摄影图、留白、文字层级建立高级感。

---

## 7. 全局排版规则

| 项 | 规则 |
|----|------|
| 最大内容宽度 | `max-width: 1180px`；`margin: 0 auto` |
| 桌面左右安全边距 | `padding-left/right: 48px`（可用 `clamp` 映射） |
| Section 间距 | `64px` – `88px` |
| Hero 高度 | `460px` – `520px`（可用 clamp） |
| Hero 标题 | `56px` – `64px`（可用 clamp） |
| Section 标题 | `34px` – `42px` |
| 正文 | `15px` – `16px`；`line-height: 1.65` – `1.75` |
| 辅助文字 | `12px` – `13px`；不能过淡，必须可读 |
| Search Dock padding | `24px` – `30px` |
| 物种卡片 | 宽 `220px` – `240px`；高约 `300px` – `340px` |

**图片比例：**

| 区域 | 比例 |
|------|------|
| SpeciesCard 图 | `aspect-ratio: 4 / 3` |
| AI preview 图 | `aspect-ratio: 4 / 3` |
| 详情大图 | `aspect-ratio: 16 / 10` 或 `4 / 3` |

---

## 8. 功能总目标

第三页最终必须具备（实现细节见 [`SPECIES_PAGE.md`](SPECIES_PAGE.md)）：

1. 本地 100 条海洋物种 mock 数据  
2. 分类检索  
3. 精确检索  
4. 模糊搜索  
5. 默认分组浏览（三栏档案工作台：左分类 / 中网格 / 右摘要；非纵向多组堆叠）  
6. 搜索后只显示搜索结果  
7. 点击物种卡打开详情抽屉  
8. AI 图片识别接口接入  
9. AI 识别结果匹配本地数据库  
10. 匹配到则打开本地物种档案  
11. 未匹配到则进入「新的档案线索」添加流程  
12. 新增记录保存到 localStorage  
13. 新增记录能被搜索到  
14. 新增记录出现在「用户新增档案」分组  
15. 用户新增记录可删除  
16. 移动端可用，不横向溢出  

---

## 9. 分阶段执行规则（强制）

1. **每次只完成用户当前要求的阶段**，不要顺手做下一阶段。  
2. **不要大规模重构无关文件。**  
3. **不要删除**已有背景视频、全站导航和 Footer。  
4. 完成后**停止**，并明确列出本阶段改了哪些文件。  
5. 未经用户确认，不得擅自「最终美化」整页。  
6. 分阶段推进时，优先修气质与布局问题，再扩展功能细节。

---

## 10. Playwright 质检（强制）

**每一轮**修改物种页（HTML / CSS / JS）后，必须运行 Playwright 质检，通过后再向用户汇报。

### 10.1 必跑命令

```bash
# 功能 smoke（必跑）
node scripts/verify-life-archive.mjs
```

### 10.2 涉及 AI 识别改动时追加

```bash
# 需先启动：npm run api 与 npm run serve
node scripts/verify-species-ai.mjs
```

### 10.3 必检项（通过标准）

| 检查项 | 标准 |
|--------|------|
| 背景视频 | `video` 元素存在；可见层未被全屏白底遮挡 |
| Hero / Dock | `#life-archive-hero`、`#species-search-dock` 可见 |
| 数据量 | `LANCUN_SPECIES_DB.length >= 100` |
| 默认模式 | Rail 有卡片；未搜索时不铺满 100 张网格 |
| 搜索模式 | 输入后进入结果模式；可清空回到默认 |
| 控制台 | 无阻塞性 `pageerror` |
| 视口 | 桌面 1440 与移动 375 无横向溢出（脚本可逐步补齐；人工/截图亦需核对） |

脚本入口：[`scripts/verify-life-archive.mjs`](../scripts/verify-life-archive.mjs)。后续阶段可扩展视口与截图断言，但**不得取消**本强制质检流程。

---

## 11. 与相关文档的分工

| 文档 | 管什么 |
|------|--------|
| **本文档** | 气质、禁止项、档案舱 Token、排版、分阶段执行、Playwright |
| [`SPECIES_PAGE.md`](SPECIES_PAGE.md) | 模块锚点、数据 schema、交互契约、AI 接口 |
| [`SPECIES_AI_LOCAL.md`](SPECIES_AI_LOCAL.md) | ECNU 代理本地运行说明 |
| [`DESIGN.md`](../DESIGN.md) | 全站品牌色、glass、圆角、阴影上限 |

---

## 12. 修订记录

| 日期 | 版本 | 说明 |
|------|------|------|
| 2026-07-21 | 1.0 | 首版：从用户协作规则沉淀为长期文档；强制 Playwright 质检 |
