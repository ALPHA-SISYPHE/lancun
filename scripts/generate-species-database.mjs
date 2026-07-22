/**
 * 生成 ≥100 条 LANCUN_SPECIES_DB → assets/js/species/data/speciesDatabase.js
 * 运行：node scripts/generate-species-database.mjs
 */
import { writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'assets/js/species/data/speciesDatabase.js');
const SPECIES_MEDIA_DIR = join(ROOT, 'assets/media/species');

function img(id) {
  const file = join(SPECIES_MEDIA_DIR, `${id}.jpg`);
  return existsSync(file) ? `assets/media/species/${id}.jpg` : '';
}

function ensureTwo(list, fallbackA, fallbackB) {
  const next = [...(list || [])].filter(Boolean);
  if (next.length < 1) next.push(fallbackA);
  if (next.length < 2) next.push(fallbackB);
  return next;
}

function entry(partial) {
  const id = partial.id;
  const image = partial.image ?? img(id);
  return {
    id,
    chineseName: partial.chineseName,
    englishName: partial.englishName,
    scientificName: partial.scientificName,
    group: partial.group,
    iucnStatus: partial.iucnStatus,
    habitat: ensureTwo(partial.habitat, '近海', '开阔水域'),
    ocean: partial.ocean?.length ? partial.ocean : ['pacific'],
    image,
    thumbnail: image,
    description: partial.description,
    threats: ensureTwo(partial.threats, 'habitat-loss', 'climate'),
    protection: ensureTwo(partial.protection, '栖息地保护', '持续监测'),
    source: partial.source || '演示数据 · 澜存海洋生命档案库',
    isUserAdded: false,
  };
}

const FLAGSHIP = [
  entry({
    id: 'chinese-white-dolphin',
    chineseName: '中华白海豚',
    englishName: 'Chinese White Dolphin',
    scientificName: 'Sousa chinensis',
    group: 'cetacean',
    iucnStatus: 'VU',
    habitat: ['河口', '浅海'],
    ocean: ['pacific', 'coastal'],
    description: '近岸河口旗舰物种，对水质与航运噪声极为敏感。',
    threats: ['habitat-loss', 'noise'],
    protection: ['建立保护区', '限速航行'],
  }),
  entry({
    id: 'blue-whale',
    chineseName: '蓝鲸',
    englishName: 'Blue Whale',
    scientificName: 'Balaenoptera musculus',
    group: 'cetacean',
    iucnStatus: 'EN',
    habitat: ['开阔深海', '远洋'],
    ocean: ['pacific', 'atlantic', 'indian', 'southern'],
    description: '地球上体型最大的动物，远洋生态系统的重要指示种。',
    threats: ['climate', 'noise'],
    protection: ['国际捕鲸禁令', '迁徙通道监测'],
  }),
  entry({
    id: 'humpback-whale',
    chineseName: '座头鲸',
    englishName: 'Humpback Whale',
    scientificName: 'Megaptera novaeangliae',
    group: 'cetacean',
    iucnStatus: 'LC',
    habitat: ['近海', '珊瑚礁边缘'],
    ocean: ['pacific', 'atlantic', 'indian'],
    description: '以复杂歌声与跃水行为著称的大型须鲸。',
    threats: ['bycatch', 'noise'],
    protection: ['迁徙通道保护', '观鲸规范管理'],
  }),
  entry({
    id: 'north-atlantic-right-whale',
    chineseName: '北大西洋露脊鲸',
    englishName: 'North Atlantic Right Whale',
    scientificName: 'Eubalaena glacialis',
    group: 'cetacean',
    iucnStatus: 'CR',
    habitat: ['温带近海', '海湾'],
    ocean: ['atlantic'],
    description: '极度濒危的露脊鲸，船撞与渔具缠绕为主要威胁。',
    threats: ['bycatch', 'noise'],
    protection: ['限速区', '改进渔具'],
  }),
  entry({
    id: 'orca',
    chineseName: '虎鲸',
    englishName: 'Orca',
    scientificName: 'Orcinus orca',
    group: 'cetacean',
    iucnStatus: 'DD',
    habitat: ['近海', '外海'],
    ocean: ['pacific', 'atlantic', 'arctic', 'southern'],
    description: '顶级海洋捕食者，种群结构复杂，部分地方种群受威胁。',
    threats: ['noise', 'bycatch'],
    protection: ['减少航运噪声', '猎物资源管理'],
  }),
  entry({
    id: 'sperm-whale',
    chineseName: '抹香鲸',
    englishName: 'Sperm Whale',
    scientificName: 'Physeter macrocephalus',
    group: 'cetacean',
    iucnStatus: 'VU',
    habitat: ['深海', '大陆坡'],
    ocean: ['pacific', 'atlantic', 'indian'],
    description: '深潜能力突出的齿鲸，对海洋食物网有重要调节作用。',
    threats: ['bycatch', 'noise'],
    protection: ['减少深海噪声', '幽灵渔具清理'],
  }),
  entry({
    id: 'green-turtle',
    chineseName: '绿海龟',
    englishName: 'Green Sea Turtle',
    scientificName: 'Chelonia mydas',
    group: 'turtle',
    iucnStatus: 'EN',
    habitat: ['海草床', '珊瑚礁'],
    ocean: ['pacific', 'indian', 'coral-reef'],
    description: '以海草床为重要觅食地的海龟，是近岸生态健康的标志。',
    threats: ['plastic', 'habitat-loss'],
    protection: ['产卵海滩保护', '减少误捕'],
  }),
  entry({
    id: 'hawksbill-turtle',
    chineseName: '玳瑁',
    englishName: 'Hawksbill Turtle',
    scientificName: 'Eretmochelys imbricata',
    group: 'turtle',
    iucnStatus: 'CR',
    habitat: ['珊瑚礁', '岩礁'],
    ocean: ['pacific', 'indian', 'coral-reef'],
    description: '与珊瑚礁关系密切的海龟，对礁体健康有生态贡献。',
    threats: ['overfishing', 'habitat-loss'],
    protection: ['礁区保护', '打击非法贸易'],
  }),
  entry({
    id: 'leatherback-turtle',
    chineseName: '棱皮龟',
    englishName: 'Leatherback Turtle',
    scientificName: 'Dermochelys coriacea',
    group: 'turtle',
    iucnStatus: 'VU',
    habitat: ['远洋', '近岸'],
    ocean: ['pacific', 'atlantic', 'indian'],
    description: '体型最大的海龟，广域洄游，以水母为主要食物。',
    threats: ['plastic', 'bycatch'],
    protection: ['减少塑料丢弃', '可持续渔业'],
  }),
  entry({
    id: 'whale-shark',
    chineseName: '鲸鲨',
    englishName: 'Whale Shark',
    scientificName: 'Rhincodon typus',
    group: 'shark-ray',
    iucnStatus: 'EN',
    habitat: ['暖水表层', '外海'],
    ocean: ['pacific', 'indian', 'coral-reef'],
    description: '世界上最大的鱼类，滤食性温和巨兽。',
    threats: ['overfishing', 'bycatch'],
    protection: ['禁捕与生态旅游规范', '迁徙监测'],
  }),
  entry({
    id: 'basking-shark',
    chineseName: '姥鲨',
    englishName: 'Basking Shark',
    scientificName: 'Cetorhinus maximus',
    group: 'shark-ray',
    iucnStatus: 'EN',
    habitat: ['温带近海', '表层'],
    ocean: ['atlantic', 'pacific'],
    description: '第二大鲨鱼，温和滤食，种群恢复缓慢。',
    threats: ['bycatch', 'overfishing'],
    protection: ['禁捕与监测', '渔具改进'],
  }),
  entry({
    id: 'manta-ray',
    chineseName: '蝠鲼',
    englishName: 'Giant Manta Ray',
    scientificName: 'Mobula birostris',
    group: 'shark-ray',
    iucnStatus: 'EN',
    habitat: ['珊瑚礁', '外海'],
    ocean: ['pacific', 'indian', 'coral-reef'],
    description: '大型滤食性鳐鱼，清洁站行为极具生态魅力。',
    threats: ['overfishing', 'bycatch'],
    protection: ['禁捕与贸易监管', '清洁站保护'],
  }),
  entry({
    id: 'hammerhead-shark',
    chineseName: '锤头鲨',
    englishName: 'Hammerhead Shark',
    scientificName: 'Sphyrna lewini',
    group: 'shark-ray',
    iucnStatus: 'CR',
    habitat: ['近海', '外海'],
    ocean: ['pacific', 'atlantic', 'indian'],
    description: '头型独特的鲨鱼，常集群活动，对过度捕捞敏感。',
    threats: ['overfishing', 'bycatch'],
    protection: ['禁捕与鳍贸易监管', '保护区网络'],
  }),
  entry({
    id: 'dugong',
    chineseName: '儒艮',
    englishName: 'Dugong',
    scientificName: 'Dugong dugon',
    group: 'marine-mammal',
    iucnStatus: 'VU',
    habitat: ['海草床', '浅湾'],
    ocean: ['pacific', 'indian', 'coastal'],
    description: '以海草为食的温和海兽，海草床健康指示种。',
    threats: ['habitat-loss', 'bycatch'],
    protection: ['海草床修复', '禁渔协同'],
  }),
  entry({
    id: 'manatee',
    chineseName: '海牛',
    englishName: 'West Indian Manatee',
    scientificName: 'Trichechus manatus',
    group: 'marine-mammal',
    iucnStatus: 'VU',
    habitat: ['河口', '浅湾'],
    ocean: ['atlantic', 'coastal'],
    description: '行动缓慢的草食性海兽，易受船只撞击与栖息地退化影响。',
    threats: ['habitat-loss', 'noise'],
    protection: ['航道限速', '湿地修复'],
  }),
  entry({
    id: 'sea-otter',
    chineseName: '海獭',
    englishName: 'Sea Otter',
    scientificName: 'Enhydra lutris',
    group: 'marine-mammal',
    iucnStatus: 'EN',
    habitat: ['近岸海藻林', '岩礁'],
    ocean: ['pacific', 'coastal'],
    description: '维持近岸海藻林生态系统平衡的关键捕食者。',
    threats: ['climate', 'habitat-loss'],
    protection: ['油污防控', '近岸保护'],
  }),
  entry({
    id: 'hawaiian-monk-seal',
    chineseName: '夏威夷僧海豹',
    englishName: 'Hawaiian Monk Seal',
    scientificName: 'Neomonachus schauinslandi',
    group: 'marine-mammal',
    iucnStatus: 'EN',
    habitat: ['热带岛屿沙滩', '近岸'],
    ocean: ['pacific', 'coastal'],
    description: '全球最为稀有的鳍足类之一，依赖孤立岛链繁殖。',
    threats: ['habitat-loss', 'bycatch'],
    protection: ['繁殖地封闭管理', '渔具改进'],
  }),
  entry({
    id: 'walrus',
    chineseName: '海象',
    englishName: 'Walrus',
    scientificName: 'Odobenus rosmarus',
    group: 'marine-mammal',
    iucnStatus: 'VU',
    habitat: ['海冰', '浅滩'],
    ocean: ['arctic', 'polar'],
    description: '依赖海冰与浅滩觅食的北极鳍足类，对气候变化敏感。',
    threats: ['climate', 'habitat-loss'],
    protection: ['极地栖息地保护', '干扰管控'],
  }),
  entry({
    id: 'spotted-seal',
    chineseName: '斑海豹',
    englishName: 'Spotted Seal',
    scientificName: 'Phoca largha',
    group: 'marine-mammal',
    iucnStatus: 'VU',
    habitat: ['寒温带近海', '滩涂'],
    ocean: ['pacific', 'polar', 'coastal'],
    description: '我国渤海黄海代表性鳍足类，依赖海冰与滩涂。',
    threats: ['climate', 'habitat-loss'],
    protection: ['繁殖地保护', '人为干扰管控'],
  }),
  entry({
    id: 'red-coral',
    chineseName: '红珊瑚',
    englishName: 'Red Coral',
    scientificName: 'Corallium rubrum',
    group: 'coral',
    iucnStatus: 'EN',
    habitat: ['较深水层', '弱光区'],
    ocean: ['deep-sea'],
    description: '生长极慢的树状珊瑚，对过度采集敏感。',
    threats: ['overfishing', 'habitat-loss'],
    protection: ['采捕限额', '贸易监管'],
  }),
  entry({
    id: 'staghorn-coral',
    chineseName: '鹿角珊瑚',
    englishName: 'Staghorn Coral',
    scientificName: 'Acropora cervicornis',
    group: 'coral',
    iucnStatus: 'CR',
    habitat: ['浅海强光区', '礁坪'],
    ocean: ['coral-reef', 'atlantic'],
    description: '礁体建造者，对海温上升与酸化极为敏感。',
    threats: ['climate', 'acidification'],
    protection: ['人工繁育辅助', '减排与礁区保护'],
  }),
  entry({
    id: 'brain-coral',
    chineseName: '脑珊瑚',
    englishName: 'Brain Coral',
    scientificName: 'Diploria labyrinthiformis',
    group: 'coral',
    iucnStatus: 'NT',
    habitat: ['礁坡', '中浅水'],
    ocean: ['coral-reef', 'atlantic'],
    description: '生长缓慢的大型石珊瑚，记录长期环境变化。',
    threats: ['climate', 'acidification'],
    protection: ['减少近岸污染', '锚损防控'],
  }),
  entry({
    id: 'sea-anemone',
    chineseName: '海葵',
    englishName: 'Sea Anemone',
    scientificName: 'Actiniaria spp.',
    group: 'coral',
    iucnStatus: 'LC',
    habitat: ['潮间带', '珊瑚礁'],
    ocean: ['coastal', 'coral-reef'],
    description: '常见刺胞动物，与小丑鱼等形成著名共生关系。',
    threats: ['habitat-loss', 'acidification'],
    protection: ['近岸水质管理', '礁区整体保护'],
  }),
  entry({
    id: 'clownfish',
    chineseName: '小丑鱼',
    englishName: 'Clownfish',
    scientificName: 'Amphiprion ocellaris',
    group: 'fish',
    iucnStatus: 'LC',
    habitat: ['海葵共生', '珊瑚礁'],
    ocean: ['coral-reef', 'pacific'],
    description: '与海葵共生的珊瑚礁明星物种，依赖健康礁体。',
    threats: ['habitat-loss', 'acidification'],
    protection: ['礁区整体保护', '负责任观赏贸易'],
  }),
  entry({
    id: 'napoleon-wrasse',
    chineseName: '拿破仑鱼',
    englishName: 'Napoleon Wrasse',
    scientificName: 'Cheilinus undulatus',
    group: 'fish',
    iucnStatus: 'EN',
    habitat: ['珊瑚礁', '礁坡'],
    ocean: ['coral-reef', 'pacific', 'indian'],
    description: '大型隆头鱼，珊瑚礁顶级捕食者之一。',
    threats: ['overfishing', 'habitat-loss'],
    protection: ['禁捕与贸易监管', '礁区禁渔'],
  }),
  entry({
    id: 'yellowfin-tuna',
    chineseName: '黄鳍金枪鱼',
    englishName: 'Yellowfin Tuna',
    scientificName: 'Thunnus albacares',
    group: 'fish',
    iucnStatus: 'NT',
    habitat: ['外海', '表层'],
    ocean: ['pacific', 'atlantic', 'indian'],
    description: '高速远洋鱼类，全球渔业重要目标种。',
    threats: ['overfishing', 'bycatch'],
    protection: ['配额与可持续渔业', '减少副渔获'],
  }),
  entry({
    id: 'chinese-sturgeon',
    chineseName: '中华鲟',
    englishName: 'Chinese Sturgeon',
    scientificName: 'Acipenser sinensis',
    group: 'fish',
    iucnStatus: 'CR',
    habitat: ['江河', '近海'],
    ocean: ['pacific', 'coastal'],
    description: '长江与近海洄游性古老鱼类，河流连通性至关重要。',
    threats: ['habitat-loss', 'overfishing'],
    protection: ['人工繁育与放流', '生态连通修复'],
  }),
  entry({
    id: 'seahorse',
    chineseName: '海马',
    englishName: 'Seahorse',
    scientificName: 'Hippocampus kuda',
    group: 'fish',
    iucnStatus: 'VU',
    habitat: ['海草床', '珊瑚礁'],
    ocean: ['coastal', 'coral-reef'],
    description: '独特的卵生由雄性育幼，对栖息地质量敏感。',
    threats: ['habitat-loss', 'overfishing'],
    protection: ['栖息地修复', '贸易监管'],
  }),
  entry({
    id: 'large-yellow-croaker',
    chineseName: '大黄鱼',
    englishName: 'Large Yellow Croaker',
    scientificName: 'Larimichthys crocea',
    group: 'fish',
    iucnStatus: 'EN',
    habitat: ['近海大陆架', '海湾'],
    ocean: ['pacific', 'coastal'],
    description: '我国传统重要经济鱼类，近海种群曾大幅波动。',
    threats: ['overfishing', 'habitat-loss'],
    protection: ['休渔与增殖', '配额管理'],
  }),
  entry({
    id: 'nautilus',
    chineseName: '鹦鹉螺',
    englishName: 'Chambered Nautilus',
    scientificName: 'Nautilus pompilius',
    group: 'deep-sea',
    iucnStatus: 'VU',
    habitat: ['深海斜坡', '弱光层'],
    ocean: ['deep-sea', 'pacific'],
    description: '活化石头足类，生长缓慢，壳体贸易威胁显著。',
    threats: ['overfishing', 'habitat-loss'],
    protection: ['禁采与贸易监管', '深海栖息地保护'],
  }),
  entry({
    id: 'horseshoe-crab',
    chineseName: '鲎',
    englishName: 'Horseshoe Crab',
    scientificName: 'Tachypleus tridentatus',
    group: 'shell-crustacean',
    iucnStatus: 'EN',
    habitat: ['潮间带', '浅滩'],
    ocean: ['pacific', 'coastal'],
    description: '古老节肢动物，繁殖依赖完整潮间带栖息地。',
    threats: ['habitat-loss', 'overfishing'],
    protection: ['滩涂保护', '禁捕与监测'],
  }),
  entry({
    id: 'starfish',
    chineseName: '海星',
    englishName: 'Starfish',
    scientificName: 'Asteroidea spp.',
    group: 'shell-crustacean',
    iucnStatus: 'LC',
    habitat: ['潮间带', '礁坪'],
    ocean: ['coastal', 'coral-reef'],
    description: '常见棘皮动物，部分种类对珊瑚礁生态有重要影响。',
    threats: ['habitat-loss', 'climate'],
    protection: ['近岸生态监测', '减少人为采集'],
  }),
  entry({
    id: 'emperor-penguin',
    chineseName: '皇帝企鹅',
    englishName: 'Emperor Penguin',
    scientificName: 'Aptenodytes forsteri',
    group: 'seabird',
    iucnStatus: 'NT',
    habitat: ['南极冰架', '海冰'],
    ocean: ['southern', 'polar'],
    description: '南极标志性海鸟，依赖稳定海冰繁殖。',
    threats: ['climate', 'habitat-loss'],
    protection: ['南极保护机制', '气候行动'],
  }),
  entry({
    id: 'albatross',
    chineseName: '信天翁',
    englishName: 'Wandering Albatross',
    scientificName: 'Diomedea exulans',
    group: 'seabird',
    iucnStatus: 'VU',
    habitat: ['开阔洋面', '岛屿繁殖地'],
    ocean: ['southern', 'pacific'],
    description: '翼展极大的远洋海鸟，易受延绳钓副渔获与塑料影响。',
    threats: ['bycatch', 'plastic'],
    protection: ['改进延绳钓', '减少海洋塑料'],
  }),
  entry({
    id: 'black-footed-albatross',
    chineseName: '黑脚信天翁',
    englishName: 'Black-footed Albatross',
    scientificName: 'Phoebastria nigripes',
    group: 'seabird',
    iucnStatus: 'NT',
    habitat: ['开阔洋面', '岛屿'],
    ocean: ['pacific'],
    description: '北太平洋远洋海鸟，对塑料误吞与副渔获敏感。',
    threats: ['plastic', 'bycatch'],
    protection: ['改进延绳钓', '岛屿繁殖地保护'],
  }),
];

// Fix invalid IUCN: orca used DD — map to NT for schema compliance
FLAGSHIP.find((s) => s.id === 'orca').iucnStatus = 'NT';

const TEMPLATES = [
  { prefix: '太平洋', group: 'fish', iucn: ['VU', 'EN', 'NT', 'LC'], ocean: ['pacific'] },
  { prefix: '大西洋', group: 'fish', iucn: ['VU', 'EN', 'NT'], ocean: ['atlantic'] },
  { prefix: '印度洋', group: 'fish', iucn: ['VU', 'EN', 'LC'], ocean: ['indian'] },
  { prefix: '深海', group: 'deep-sea', iucn: ['VU', 'EN', 'NT'], ocean: ['deep-sea'] },
  { prefix: '珊瑚礁', group: 'coral', iucn: ['CR', 'EN', 'VU', 'NT'], ocean: ['coral-reef'] },
  { prefix: '近岸', group: 'shell-crustacean', iucn: ['VU', 'NT', 'LC'], ocean: ['coastal'] },
  { prefix: '极地', group: 'marine-mammal', iucn: ['VU', 'EN', 'NT'], ocean: ['polar'] },
  { prefix: '南大洋', group: 'seabird', iucn: ['NT', 'VU', 'LC'], ocean: ['southern'] },
  { prefix: '北冰洋', group: 'cetacean', iucn: ['VU', 'EN', 'CR'], ocean: ['arctic'] },
  { prefix: '礁区', group: 'turtle', iucn: ['EN', 'VU', 'NT'], ocean: ['coral-reef', 'coastal'] },
  { prefix: '远洋', group: 'shark-ray', iucn: ['EN', 'VU', 'CR'], ocean: ['pacific', 'atlantic'] },
];

const SPECIES_SUFFIX = [
  '银鲳', '带鱼', '鲷鱼', '石斑', '比目鱼', '沙丁鱼', '飞鱼', '刺尾鱼', '笛鲷', '鲻鱼',
  '章鱼', '乌贼', '海龙', '海胆', '海参', '龙虾', '扇贝', '牡蛎', '砗磲', '藤壶',
  '软珊瑚', '柳珊瑚', '灯笼鱼', '鮟鱇', '宽吻海豚', '江豚', '小须鲸', '蠵龟', '丽龟', '平背龟',
];

const THREAT_POOL = ['plastic', 'bycatch', 'habitat-loss', 'climate', 'acidification', 'overfishing', 'noise'];
const HABITAT_POOL = ['浅海', '外海', '礁坡', '海草床', '河口', '深海', '极地', '珊瑚礁'];
const PROTECTION_POOL = ['加强栖息地监测', '减少人为干扰', '参与公众科普', '可持续资源管理'];

function slugify(text, index) {
  return `species-${String(index).padStart(3, '0')}-${text
    .replace(/\s+/g, '-')
    .replace(/[^\w-]/g, '')
    .toLowerCase()
    .slice(0, 24)}`;
}

function buildGenerated(count) {
  const items = [];
  let i = 0;
  while (items.length < count) {
    const suffix = SPECIES_SUFFIX[i % SPECIES_SUFFIX.length];
    const tpl = TEMPLATES[i % TEMPLATES.length];
    const iucn = tpl.iucn[i % tpl.iucn.length];
    const index = FLAGSHIP.length + items.length + 1;
    const id = slugify(`${tpl.prefix}-${suffix}`, index);
    const cn = `${tpl.prefix}${suffix}`;
    items.push(
      entry({
        id,
        chineseName: cn,
        englishName: `${tpl.prefix} ${suffix}`,
        scientificName: `Demo ${tpl.group} ${index}`,
        group: tpl.group,
        iucnStatus: iucn,
        habitat: [HABITAT_POOL[i % HABITAT_POOL.length], HABITAT_POOL[(i + 2) % HABITAT_POOL.length]],
        ocean: tpl.ocean,
        description: `${cn}是${tpl.prefix}海域代表性档案物种，用于检索与分组展示演示。`,
        threats: [THREAT_POOL[i % THREAT_POOL.length], THREAT_POOL[(i + 3) % THREAT_POOL.length]],
        protection: [PROTECTION_POOL[i % PROTECTION_POOL.length], PROTECTION_POOL[(i + 1) % PROTECTION_POOL.length]],
      })
    );
    i += 1;
  }
  return items;
}

const TARGET = 100;
const database = [...FLAGSHIP, ...buildGenerated(Math.max(0, TARGET - FLAGSHIP.length))];

const content = `/**
 * 海洋生命档案馆 · 本地物种数据库（${database.length} 条）
 * 由 scripts/generate-species-database.mjs 生成，请勿手改
 */
window.LANCUN_SPECIES_DB = ${JSON.stringify(database, null, 2)};
`;

writeFileSync(OUT, content, 'utf8');
console.log(`Wrote ${database.length} species (${FLAGSHIP.length} flagship) to ${OUT}`);
