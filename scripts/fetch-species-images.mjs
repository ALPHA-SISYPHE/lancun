/**
 * 从 Wikimedia Commons 批量下载物种配图 → assets/media/species/{id}.jpg
 * 运行：node scripts/fetch-species-images.mjs [--force]
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = join(ROOT, 'assets/media/species');
const MANIFEST_PATH = join(ROOT, 'data/species-image-sources.json');
const FORCE = process.argv.includes('--force');
const THUMB_WIDTH = 1200;
const API = 'https://commons.wikimedia.org/w/api.php';
const USER_AGENT = 'LancunOceanProject/1.0 (species archive; educational)';

/** @type {Record<string, string|string[]>} */
const FLAGSHIP_SEARCH = {
  'chinese-white-dolphin': 'Sousa chinensis marine mammal',
  'blue-whale': 'Balaenoptera musculus',
  'humpback-whale': 'Megaptera novaeangliae breaching',
  'north-atlantic-right-whale': 'Eubalaena glacialis',
  orca: 'Orcinus orca killer whale',
  'sperm-whale': 'Physeter macrocephalus',
  'green-turtle': 'Chelonia mydas sea turtle',
  'hawksbill-turtle': 'Eretmochelys imbricata',
  'leatherback-turtle': 'Dermochelys coriacea',
  'whale-shark': 'Rhincodon typus',
  'basking-shark': 'Cetorhinus maximus',
  'manta-ray': 'Mobula birostris manta ray',
  'hammerhead-shark': 'Sphyrna lewini',
  dugong: 'Dugong dugon',
  manatee: 'Trichechus manatus',
  'sea-otter': 'Enhydra lutris',
  'hawaiian-monk-seal': 'Neomonachus schauinslandi',
  walrus: 'Odobenus rosmarus',
  'spotted-seal': 'Phoca largha',
  'red-coral': 'Corallium rubrum',
  'staghorn-coral': 'Acropora cervicornis',
  'brain-coral': 'Diploria labyrinthiformis',
  'sea-anemone': 'Actiniaria sea anemone',
  clownfish: 'Amphiprion ocellaris',
  'napoleon-wrasse': 'Cheilinus undulatus',
  'yellowfin-tuna': 'Thunnus albacares',
  'chinese-sturgeon': 'Acipenser sinensis',
  seahorse: 'Hippocampus kuda',
  'large-yellow-croaker': 'Larimichthys crocea fish',
  nautilus: 'Nautilus pompilius',
  'horseshoe-crab': 'Tachypleus tridentatus',
  starfish: 'Asteroidea starfish',
  'emperor-penguin': 'Aptenodytes forsteri',
  albatross: 'Diomedea exulans albatross',
  'black-footed-albatross': 'Phoebastria nigripes',
};

/** 演示种后缀 → Wikimedia 搜索词（可多候选） */
const SUFFIX_SEARCH = {
  银鲳: ['Pampus argenteus fish', 'Pampus chinensis'],
  带鱼: ['Trichiurus lepturus', 'cutlassfish'],
  鲷鱼: ['Pagrus major red seabream', 'Sparidae fish'],
  石斑: ['Epinephelus grouper', 'groupers coral reef'],
  比目鱼: ['Pleuronectiformes flatfish', 'flatfish ocean'],
  沙丁鱼: ['Sardina pilchardus shoal', 'sardine fish'],
  飞鱼: ['Exocoetus flying fish', 'flying fish ocean'],
  刺尾鱼: ['Acanthuridae surgeonfish', 'surgeonfish reef'],
  笛鲷: ['Lutjanus snapper fish', 'snappers coral reef'],
  鲻鱼: ['Mugil cephalus mullet fish', 'mullet fish sea'],
  章鱼: ['Octopus vulgaris', 'common octopus marine'],
  乌贼: ['Sepia officinalis cuttlefish', 'cuttlefish marine'],
  海龙: ['Syngnathidae seahorse pipefish', 'pipefish marine'],
  海胆: ['sea urchin Echinoidea', 'Diadema sea urchin'],
  海参: ['Holothuroidea sea cucumber', 'sea cucumber marine'],
  龙虾: ['Panulirus spiny lobster', 'spiny lobster reef'],
  扇贝: ['Pecten maximus scallop', 'scallop bivalve'],
  牡蛎: ['Ostrea oyster marine', 'oyster shellfish'],
  砗磲: ['Tridacna giant clam', 'giant clam coral'],
  藤壶: ['barnacle Cirripedia marine', 'gooseneck barnacle'],
  软珊瑚: ['Alcyonacea soft coral', 'soft coral reef'],
  柳珊瑚: ['Gorgonacea gorgonian', 'gorgonian coral'],
  灯笼鱼: ['Myctophidae lanternfish', 'lanternfish deep sea'],
  鮟鱇: ['Lophius anglerfish', 'anglerfish deep sea'],
  宽吻海豚: ['Tursiops truncatus bottlenose dolphin', 'bottlenose dolphin'],
  江豚: ['Neophocaena phocaenoides finless porpoise', 'finless porpoise'],
  小须鲸: ['Balaenoptera acutorostrata minke whale', 'minke whale'],
  蠵龟: ['Caretta caretta loggerhead turtle', 'loggerhead sea turtle'],
  丽龟: ['Lepidochelys olive ridley turtle', 'olive ridley turtle'],
  平背龟: ['Natator depressus flatback turtle', 'flatback sea turtle'],
};

const PREFIX_HINT = {
  太平洋: 'Pacific Ocean',
  大西洋: 'Atlantic Ocean',
  印度洋: 'Indian Ocean',
  深海: 'deep sea',
  珊瑚礁: 'coral reef',
  近岸: 'coastal marine',
  极地: 'polar marine',
  南大洋: 'Southern Ocean',
  北冰洋: 'Arctic Ocean',
  礁区: 'reef',
  远洋: 'pelagic ocean',
};

function loadDatabase() {
  const code = readFileSync(join(ROOT, 'assets/js/species/data/speciesDatabase.js'), 'utf8');
  const context = { window: {} };
  vm.runInContext(code, vm.createContext(context));
  return context.window.LANCUN_SPECIES_DB || [];
}

function extractSuffix(chineseName) {
  for (const prefix of Object.keys(PREFIX_HINT)) {
    if (chineseName.startsWith(prefix)) {
      return chineseName.slice(prefix.length);
    }
  }
  return chineseName;
}

function extractPrefix(chineseName) {
  for (const prefix of Object.keys(PREFIX_HINT)) {
    if (chineseName.startsWith(prefix)) return prefix;
  }
  return '';
}

function buildQueries(species) {
  if (FLAGSHIP_SEARCH[species.id]) {
    const raw = FLAGSHIP_SEARCH[species.id];
    return Array.isArray(raw) ? raw : [raw];
  }

  const suffix = extractSuffix(species.chineseName);
  const prefix = extractPrefix(species.chineseName);
  const baseList = SUFFIX_SEARCH[suffix] || [`${suffix} marine`, `${species.group} ocean`];
  const hint = PREFIX_HINT[prefix];
  const queries = [...baseList];
  if (hint) queries.push(`${baseList[0]} ${hint}`);
  queries.push(`${species.englishName} marine`);
  return [...new Set(queries.filter(Boolean))];
}

async function fetchWithRetry(url, label = 'fetch') {
  let lastError = null;
  for (let attempt = 0; attempt < 6; attempt += 1) {
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': USER_AGENT },
        signal: AbortSignal.timeout(45000),
      });
      if (res.status === 429) {
        const wait = 8000 * (attempt + 1);
        console.warn(`  rate limited (${label}), wait ${wait}ms`);
        await sleep(wait);
        continue;
      }
      if (!res.ok) throw new Error(`${label} ${res.status}`);
      return res;
    } catch (err) {
      lastError = err;
      await sleep(3000 * (attempt + 1));
    }
  }
  throw lastError || new Error(`${label} failed`);
}

async function commonsSearch(query) {
  const params = new URLSearchParams({
    action: 'query',
    format: 'json',
    origin: '*',
    generator: 'search',
    gsrsearch: query,
    gsrnamespace: '6',
    gsrlimit: '10',
    prop: 'imageinfo',
    iiprop: 'url|extmetadata|mime',
    iiurlwidth: String(THUMB_WIDTH),
  });
  const res = await fetchWithRetry(`${API}?${params}`, 'Commons API');
  const payload = await res.json();
  const pages = payload?.query?.pages;
  if (!pages) return null;

  const candidates = Object.values(pages)
    .filter((p) => p.imageinfo?.[0])
    .map((p) => {
      const info = p.imageinfo[0];
      const mime = info.mime || '';
      if (!/^image\//.test(mime)) return null;
      const meta = info.extmetadata || {};
      return {
        title: p.title,
        url: info.thumburl || info.url,
        author: meta.Artist?.value?.replace(/<[^>]+>/g, '') || 'Unknown',
        license: meta.LicenseShortName?.value || meta.UsageTerms?.value || 'See Commons',
        credit: meta.Credit?.value?.replace(/<[^>]+>/g, '') || '',
        pageUrl: `https://commons.wikimedia.org/wiki/${encodeURIComponent(p.title.replace(/ /g, '_'))}`,
      };
    })
    .filter(Boolean);

  return candidates[0] || null;
}

async function downloadImage(url, dest) {
  const res = await fetchWithRetry(url, 'Download');
  const buf = Buffer.from(await res.arrayBuffer());
  writeFileSync(dest, buf);
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function fetchSpeciesImage(species) {
  const dest = join(OUT_DIR, `${species.id}.jpg`);
  if (existsSync(dest) && !FORCE) {
    return { id: species.id, skipped: true, path: `assets/media/species/${species.id}.jpg` };
  }

  const queries = buildQueries(species);
  let lastError = null;

  for (const query of queries) {
    try {
      const hit = await commonsSearch(query);
      if (!hit?.url) {
        lastError = new Error(`No result for: ${query}`);
        await sleep(350);
        continue;
      }
      await downloadImage(hit.url, dest);
      return {
        id: species.id,
        chineseName: species.chineseName,
        scientificName: species.scientificName,
        query,
        file: `assets/media/species/${species.id}.jpg`,
        commonsTitle: hit.title,
        author: hit.author,
        license: hit.license,
        credit: hit.credit,
        sourceUrl: hit.pageUrl,
        imageUrl: hit.url,
      };
    } catch (err) {
      lastError = err;
      await sleep(500);
    }
  }

  throw lastError || new Error('No image found');
}

async function main() {
  mkdirSync(OUT_DIR, { recursive: true });
  const db = loadDatabase();
  let previousItems = [];
  if (existsSync(MANIFEST_PATH)) {
    try {
      previousItems = JSON.parse(readFileSync(MANIFEST_PATH, 'utf8')).items || [];
    } catch {
      previousItems = [];
    }
  }
  const previousById = new Map(previousItems.map((item) => [item.id, item]));

  const manifest = {
    generatedAt: new Date().toISOString(),
    source: 'Wikimedia Commons',
    licenseNote: 'Individual licenses recorded per entry; predominantly CC BY-SA / Public Domain',
    items: [],
    skipped: [],
    failed: [],
  };

  console.log(`Fetching images for ${db.length} species...`);

  for (let i = 0; i < db.length; i += 1) {
    const species = db[i];
    process.stdout.write(`[${i + 1}/${db.length}] ${species.id} ... `);
    try {
      const result = await fetchSpeciesImage(species);
      if (result.skipped) {
        manifest.skipped.push(result.id);
        const prev = previousById.get(result.id);
        if (prev) manifest.items.push(prev);
        console.log('skip (exists)');
      } else {
        manifest.items.push(result);
        console.log('ok');
      }
    } catch (err) {
      manifest.failed.push({ id: species.id, chineseName: species.chineseName, error: String(err.message || err) });
      console.log(`FAIL: ${err.message || err}`);
    }
    await sleep(2200);
  }

  writeFileSync(MANIFEST_PATH, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
  console.log(`\nManifest → ${MANIFEST_PATH}`);
  console.log(`Downloaded: ${manifest.items.length}, skipped: ${manifest.skipped.length}, failed: ${manifest.failed.length}`);

  if (manifest.failed.length) {
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
