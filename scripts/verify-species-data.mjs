/**
 * 物种数据层验收（无 UI）
 * 运行：node scripts/verify-species-data.mjs
 */
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

const REQUIRED_NAMES = [
  '中华白海豚',
  '蓝鲸',
  '座头鲸',
  '北大西洋露脊鲸',
  '玳瑁',
  '绿海龟',
  '棱皮龟',
  '鲸鲨',
  '姥鲨',
  '蝠鲼',
  '儒艮',
  '海獭',
  '夏威夷僧海豹',
  '红珊瑚',
  '鹿角珊瑚',
  '脑珊瑚',
  '小丑鱼',
  '拿破仑鱼',
  '黄鳍金枪鱼',
  '中华鲟',
  '锤头鲨',
  '海马',
  '鹦鹉螺',
  '海牛',
  '皇帝企鹅',
  '信天翁',
  '虎鲸',
  '海象',
  '鲎',
  '海葵',
  '海星',
];

const IUCN = new Set(['CR', 'EN', 'VU', 'NT', 'LC']);

function loadScript(context, relativePath) {
  const code = readFileSync(join(ROOT, relativePath), 'utf8');
  vm.runInContext(code, context, { filename: relativePath });
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const store = new Map();
const localStorageMock = {
  getItem(key) {
    return store.has(key) ? store.get(key) : null;
  },
  setItem(key, value) {
    store.set(key, String(value));
  },
  removeItem(key) {
    store.delete(key);
  },
};

const context = {
  window: {},
  localStorage: localStorageMock,
  console,
};
context.window = context;
vm.createContext(context);

loadScript(context, 'assets/js/species/data/speciesCategories.js');
loadScript(context, 'assets/js/species/data/speciesDatabase.js');
loadScript(context, 'assets/js/species/utils/generateSpeciesId.js');
loadScript(context, 'assets/js/species/utils/localSpeciesStorage.js');
loadScript(context, 'assets/js/species/utils/filterSpecies.js');
loadScript(context, 'assets/js/species/utils/searchSpecies.js');

const db = context.window.LANCUN_SPECIES_DB;
const cats = context.window.LANCUN_SPECIES_CATEGORIES;

assert(Array.isArray(db) && db.length >= 100, `expected >=100 species, got ${db?.length}`);
assert(cats?.GROUPS?.length === 9, 'GROUPS must be 9');
assert(cats?.IUCN_STATUSES?.length === 5, 'IUCN_STATUSES must be 5');
assert(cats?.HABITATS?.length === 9, 'HABITATS must be 9');
assert(cats?.THREATS?.length === 7, 'THREATS must be 7');
assert(cats.OCEANS === cats.HABITATS || cats.OCEANS?.length === 9, 'OCEANS alias missing');

const names = new Set(db.map((s) => s.chineseName));
for (const name of REQUIRED_NAMES) {
  assert(names.has(name), `missing required species: ${name}`);
}

for (const item of db) {
  assert(item.id && item.chineseName && item.englishName && item.scientificName, `incomplete names: ${item.id}`);
  assert(item.group && IUCN.has(item.iucnStatus), `bad group/iucn: ${item.id}`);
  assert(Array.isArray(item.habitat) && item.habitat.length >= 1, `habitat: ${item.id}`);
  assert(Array.isArray(item.ocean) && item.ocean.length >= 1, `ocean: ${item.id}`);
  assert(typeof item.description === 'string' && item.description.length > 0, `description: ${item.id}`);
  assert(Array.isArray(item.threats) && item.threats.length >= 2, `threats: ${item.id}`);
  assert(Array.isArray(item.protection) && item.protection.length >= 2, `protection: ${item.id}`);
  assert(item.isUserAdded === false, `isUserAdded: ${item.id}`);
  assert(typeof item.image === 'string' && typeof item.thumbnail === 'string', `image fields: ${item.id}`);
  assert(item.image.length > 0 && item.thumbnail.length > 0, `missing image path: ${item.id}`);
  assert(
    existsSync(join(ROOT, ...item.image.split('/'))),
    `missing image file: ${item.image}`,
  );
}

const emptySearch = context.window.LancunSearchSpecies({ speciesList: db, query: '   ' });
assert(Array.isArray(emptySearch) && emptySearch.length === 0, 'empty query should return []');

const fuzzy = context.window.LancunSearchSpecies({ speciesList: db, query: '白海豚' });
assert(fuzzy.some((s) => s.id === 'chinese-white-dolphin'), 'fuzzy search 白海豚');

const exactMiss = context.window.LancunSearchSpecies({
  speciesList: db,
  query: '白海豚',
  exactSearchEnabled: true,
});
assert(exactMiss.length === 0, 'exact search should miss partial alias');

const exactHit = context.window.LancunSearchSpecies({
  speciesList: db,
  query: '中华白海豚',
  exactSearchEnabled: true,
});
assert(exactHit.length === 1 && exactHit[0].id === 'chinese-white-dolphin', 'exact chinese name');

const filtered = context.window.LancunFilterSpecies({
  speciesList: db,
  selectedGroups: ['cetacean'],
  selectedStatuses: ['CR', 'EN'],
  selectedHabitats: [],
  selectedThreats: [],
});
assert(
  filtered.every((s) => s.group === 'cetacean' && ['CR', 'EN'].includes(s.iucnStatus)),
  'filter AND/OR groups+status'
);

const idA = context.window.LancunGenerateSpeciesId();
const idB = context.window.LancunGenerateSpeciesId('custom');
assert(idA.startsWith('user-species-'), `default prefix: ${idA}`);
assert(idB.startsWith('custom-'), `custom prefix: ${idB}`);
assert(idA !== idB, 'ids should differ');

const storage = context.window.LancunLocalSpeciesStorage;
assert(storage.KEY === 'ocean-life-user-species', 'storage key');

const userSpecies = {
  id: 'user-test-1',
  chineseName: '测试物种',
  englishName: 'Test Species',
  scientificName: 'Testus species',
  group: 'fish',
  iucnStatus: 'LC',
  habitat: ['浅海', '礁坡'],
  ocean: ['coastal'],
  image: '',
  thumbnail: '',
  description: '用户新增测试',
  threats: ['plastic', 'bycatch'],
  protection: ['监测', '科普'],
  source: 'test',
  isUserAdded: true,
};

storage.saveUserAddedSpecies(userSpecies);
assert(storage.getUserAddedSpecies().some((s) => s.id === 'user-test-1'), 'save/get user species');

const merged = storage.mergeSpeciesDatabase(db, storage.getUserAddedSpecies());
assert(merged.length === db.length + 1, 'merge adds user species');
assert(merged.filter((s) => s.id === 'user-test-1').length === 1, 'no duplicate id');

storage.deleteUserAddedSpecies('user-test-1');
assert(!storage.getUserAddedSpecies().some((s) => s.id === 'user-test-1'), 'delete user species');

console.log(
  JSON.stringify(
    {
      ok: true,
      count: db.length,
      flagshipChecked: REQUIRED_NAMES.length,
      groups: cats.GROUPS.length,
      habitats: cats.HABITATS.length,
      threats: cats.THREATS.length,
    },
    null,
    2
  )
);
