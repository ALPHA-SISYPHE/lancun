# `#ocean-explore` 金标死磕迭代笔记

| 项 | 内容 |
|---|---|
| 地位 | 高效迭代「错题本」；每轮动手前必读 |
| 金标 | `references/bubble-gold-depth/ref-1.png` … `ref-3.png` |
| 截图根目录 | `H:\lancun-ocean-explore\bubble-loops\` |
| 过关线 | **金标目视**（宪法清单仅辅助）；冲突以金标为准 |
| 模块版本 | `ocean-bubbles@vN` + `index.html?v=N` |

## 冻结口径

- 金标画面 > 宪法条文 > DESIGN.md
- 静止占位地球（无自转 / 拖拽）；构图亮度须贴近金标
- 截图一律 H 盘；`BUBBLE_ITER_5S=N node scripts/bubble-5s-24fps-loop.mjs`
- 未连续两轮全项复检 PASS 前，禁止宣称「完美对齐」

## 禁止再犯（错误库）

1. 用线性渐变冒充径向聚光  
2. 用 Three.js layer 数量冒充目视三层景深  
3. 远景做成实焦玻璃 / 白星点（应为淡蓝虚焦光斑）  
4. IOR 采样过暗 RT → 中近景变「暗圆盘」  
5. BackSide Additive 大气壳做成硬霓虹环（金标是极薄柔和 limb）  
6. 三层同速、同清晰度、同透明度  
7. 「宪法勾选」代替「金标目视」  
8. 用清晰玻璃 InstancedMesh 冒充近景大虚焦（近景必须 soft-disc / bokeh）  
9. AdditiveBlending 远景过曝成白星  

## 每轮模板

```
### vN — YYYY-MM-DD
- 唯一目标：
- 改动摘要：
- H 盘：`H:\lancun-ocean-explore\bubble-loops\bubble-loop-iter-N-frames\`
- vs 金标：
  | 项 | 结果 | 备注 |
  | P0 大气 | PASS/FAIL | |
  | P1 近/中/远泡 | … | |
  | P2 径向 | … | |
  | P3 地球亮度 | … | |
  | P4 UI | … | |
  | P5 +/右侧钮 | … | |
- 根因 / 新禁令：
- 下轮唯一目标：
```

---

## 基线 FAIL（v53 / v54）

- 截图：`bubble-loop-iter-53-frames/preview.png`；`H:\...\bubble-loop-iter-54-frames\`
- **P0 FAIL**：粗亮霓虹大气环  
- **P1 FAIL**：暗圆盘 / 缺近景大虚焦 / 远景像星点  
- **P2 FAIL**：聚光未钉死地球后  
- **P3 FAIL**：地球偏暗偏夜  
- **P4 弱**：字重/开关未精  
- **P5 FAIL**：缺 `+` 与右侧圆钮  

---

## 迭代日志

### v55 — 2026-07-19
- 唯一目标：灭硬霓虹大气环（P0）
- 改动摘要：atmo 外扩 1.055→1.018；Additive→Normal；fresnel^5.5 + 窄 band；alpha≤0.045
- H 盘：`H:\lancun-ocean-explore\bubble-loops\bubble-loop-iter-55-frames\`
- vs 金标：P0 近似 PASS；P1–P5 未本轮
- 下轮：v56 近景 soft-disc

### v56 — 2026-07-19
- 唯一目标：近景大虚焦 soft-disc（禁止清晰玻璃冒充）
- 改动摘要：`createNearBokeh` Points 大 soft 盘；去掉 near InstancedMesh 玻璃
- H 盘：`...\bubble-loop-iter-56-frames\`
- vs 金标：P1 近景 近似 PASS（大虚焦可见）；中远仍弱
- 新禁令：#8 清晰玻璃冒充近景虚焦

### v57 — 2026-07-19
- 唯一目标：中景亮玻璃高光 + 远景淡蓝密铺
- 改动摘要：LOOK_MID 提亮；far count 200、淡蓝 disc 纹理
- H 盘：`...\bubble-loop-iter-57-frames\`
- vs 金标：P1 中/远 改善；地球仍偏暗

### v58 — 2026-07-19
- 唯一目标：径向钉地球位 + 地球受光可读
- 改动摘要：BG spot→74%x；key/hemi 提亮；静态 + sprites
- H 盘：`...\bubble-loop-iter-58-frames\`
- vs 金标：P2/P3/P5(+) 改善

### v59 — 2026-07-19
- 唯一目标：文案/按钮/开关精修 + 右侧圆钮
- 改动摘要：字距/行高；`.ocean-explore__fab-rail` 双圆钮+橙标
- H 盘：`...\bubble-loop-iter-59-frames\`
- vs 金标：P4/P5 结构齐

### v60 / v61 / v62 — 全项复检（双轮）
- 模块：`ocean-bubbles@v61`
- H 盘：`...\bubble-loop-iter-60-frames\`、`61`、`62`
- vs 金标（结构清单）：
  | 项 | 结果 | 备注 |
  | P0 大气 | PASS | 薄柔 limb，无粗霓虹环 |
  | P1 近虚焦 | PASS | soft-disc 大泡 |
  | P1 中玻璃 | 近似 PASS | 有 rim/高光，折射仍弱于金标 |
  | P1 远远景 | 近似 PASS | 淡蓝密铺有，疏密可再收 |
  | P2 径向 | PASS | 聚光在右区地球后 |
  | P3 地球 | 近似 PASS | 白天感改善；云层/对比仍可加强 |
  | P4 UI | PASS | 细标题/ghost/Off 开关 |
  | P5 +/右侧钮 | PASS | 静态装饰齐 |
- **宣称口径**：结构项双轮无回归；**材质微差（中景折射/云层）未达像素级完美，禁止称「完美对齐」**，记入待续。
- 待续唯一目标：中景 IOR/玻璃体积再贴金标；地球纹理对比再提

### v63 — 2026-07-19（材质终局）
- 唯一目标：中景玻璃 IOR/体积
- 改动摘要：shader 提高 refracted 权重 0.72；fresnel 中心更透；LOOK_MID 加大 IOR bend；禁暗圆盘 mix
- H 盘：`...\bubble-loop-iter-63-frames\`
- vs 金标：P1 中玻璃 PASS（透地球/亮 rim 可读）

### v64 — 2026-07-19
- 唯一目标：静止云壳 + 日侧对比
- 改动摘要：`loadCloudTexture` 云壳；key 改左上日侧 + 暖色右 rim；云降级 procedural veil
- H 盘：`...\bubble-loop-iter-64-frames\`
- vs 金标：P3 PASS（云层 + 明暗对比）

### v65 / v66 — 全项复检（双轮）— **已撤回**
- 当时勾选 PASS 被用户否定：背景偏亮青、多处不对齐、近景过度羽化成糊斑。
- **新禁令 #10**：亮青铺满背景（`#8ed0ff` / 大片洗光）
- **新禁令 #11**：近景过度羽化（mushy blob，无细玻璃 rim）
- **新禁令 #12**：中景空心白环（HUD ring，无玻璃体积/IOR）
- **新禁令 #13**：不得用版本号当停手条件；未金标目视过关不准停

### v67 — 压暗径向背景
- 唯一目标：近黑海军蓝 + 地球位克制钴蓝（禁亮青洗）
- 改动：`SECTION_CLEAR`/`createDarkGradientTexture`/`home.css` 去掉 `#8ed0ff`；聚光收紧
- H 盘：`...\bubble-loop-iter-68-frames\`（与边缘同轮采样）
- vs 金标：P2 改善；仍需防左上洗光

### v68 — 收紧气泡边缘
- 近景尺寸/opacity 下调；中景 fresnel bloom 收
- vs 金标：仍偏糊 → 转入程序化 rim

### v69 — 近景程序化新月 rim + FAB×3
- `createNearBokeh` 改 shader：透明芯 + 细 rim + crescent
- vs 金标：中景 rim 可读；近景仍偶发糊 / 中景偏空心环

### v70 / v71 — 填充中景玻璃体积 + 再压左上洗光
- 中景 alpha 中心抬高；IOR/glassBody 再贴金标；背景左上压暗
- H 盘：`...\bubble-loop-iter-70-frames\`、`71-frames`
- vs 金标：BG 接近；近景 rim 一度过厚发白；中景体积改善中

### v72 — 近景 hairline rim（禁粗粉笔环）
- 唯一目标：细软玻璃唇，非厚白环、非 mush
- 模块：`ocean-bubbles@v72`
- H 盘：`...\bubble-loop-iter-72-frames\`
- vs 金标：（采样后填）
- **停手条件**：连续两轮全项目视 PASS；**不以 v70/vN 停**

### v73–v74 — 继续贴近金标（未结案）
- 近景深蓝芯 + bokeh rim；模块缓存破坏 `?v=74`
- H 盘：`...\bubble-loop-iter-74-frames\`
- vs 金标：BG 明显改善；近景部分帧接近，仍不稳定；**未宣称 PASS**

### 2026-07-19 — 用户决定：气泡金标死磕暂停
- **代码全部保留**（`ocean-bubbles.js` / `globe/bubbles.js` / shaders / CSS dark-interim）
- 暂不继续金标像素对齐；改考虑 `#ocean-explore` **降级方案**

### 2026-07-19 — 视频背景降级落地（v76）
- 背景：`assets/media/ocean-explore-bg.mp4`（与 `hero.mp4` 分离）+ 偏淡遮罩
- 脚本：`assets/js/ocean-explore-bg.js`（循环、进视口播放、减动效 fallback）
- WebGL 默认：**静止地球 only**；气泡需 `?bubbles=1` 或 `localStorage.lancun.oceanBubbles=1`
- 模块：`ocean-bubbles@v76`；canvas 透明清屏让视频透出

### 2026-07-19 — 工作区迭代帧清理
- 已删除仓库根目录全部 `bubble-loop-iter-*` 帧目录 / 预览 / JSON，以及临时 `*-smoke.png`
- 截图协议不变：仍写到 `H:\lancun-ocean-explore\bubble-loops\`（见脚本默认 `BUBBLE_OUT_BASE`）
- `.gitignore` 已忽略上述工作区产物，避免再进仓库

---
