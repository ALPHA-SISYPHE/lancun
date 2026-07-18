# Globe media assets

## shelves-mask.png

| 字段 | 内容 |
|---|---|
| **用途** | `#ocean-explore` 大陆架分布 shader overlay（R 通道 mask） |
| **尺寸** | 1024×1024 equirectangular |
| **来源** | Phase B 程序化占位：简化大陆轮廓 + 近岸架带（`scripts/generate-shelves-mask.mjs`） |
| **重新生成** | `node scripts/generate-shelves-mask.mjs` |
| **替换** | 待 Natural Earth / bathymetry 数据验证后可换真实遮罩 |
| **运行时回退** | 若 PNG 404，`assets/js/globe/utils/textures.js` 使用相同算法的 Canvas 版本 |

## bubble-content（运行时）

个别气泡实例（约 15%）在 fragment shader 中采样 `createBubbleContentTexture()` 生成的 Canvas 贴图，非独立文件。
