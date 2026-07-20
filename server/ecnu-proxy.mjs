/**
 * ECNU ecnu-plus 物种识别本地代理
 * 启动：node server/ecnu-proxy.mjs 或 npm run api
 */
import { createServer } from 'node:http';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const QUOTA_FILE = join(ROOT, '.quota-usage.json');
const CATALOG_PATH = join(__dirname, 'species-catalog.json');

loadEnv(join(ROOT, '.env'));

const CONFIG = {
  apiKey: process.env.ECNU_API_KEY?.trim(),
  baseUrl: (process.env.ECNU_BASE_URL || 'https://chat.ecnu.edu.cn/open/api/v1').replace(/\/$/, ''),
  model: process.env.ECNU_MODEL || 'ecnu-plus',
  port: Number(process.env.PROXY_PORT) || 8787,
  quota5h: Number(process.env.ECNU_QUOTA_5H) || 2000,
  quotaDaily: Number(process.env.ECNU_QUOTA_DAILY_REQUESTS) || 5000,
  quotaMonthly: Number(process.env.ECNU_QUOTA_MONTHLY_CREDITS) || 50000,
};

const catalog = JSON.parse(readFileSync(CATALOG_PATH, 'utf8'));
const catalogById = new Map(catalog.map((item) => [item.id, item]));

const JSON_SCHEMA = {
  name: 'marine_species_recognition',
  strict: true,
  schema: {
    type: 'object',
    properties: {
      catalogId: { type: ['string', 'null'] },
      name: { type: 'string' },
      confidence: { type: 'integer', minimum: 0, maximum: 100 },
      brief: { type: 'string' },
      inCatalog: { type: 'boolean' },
    },
    required: ['name', 'confidence', 'brief', 'inCatalog'],
    additionalProperties: false,
  },
};

function loadEnv(filePath) {
  if (!existsSync(filePath)) return;
  const text = readFileSync(filePath, 'utf8');
  for (const line of text.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (!(key in process.env)) process.env[key] = value;
  }
}

function normalizeText(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/\s+/g, '');
}

function buildCatalogPrompt() {
  const lines = catalog.map(
    (item) => `- ${item.id}: ${item.name}（别名：${item.aliases.join('、')}）`
  );
  return lines.join('\n');
}

function buildSystemPrompt() {
  return [
    '你是澜存海洋保护网站的物种识别助手，只识别图片中的海洋或近海相关动物。',
    '若图中物种属于下列澜存档案库，请设置 inCatalog 为 true 并尽量填写正确的 catalogId：',
    buildCatalogPrompt(),
    '若不在档案库中，设置 inCatalog 为 false，catalogId 为 null，name 填写你判断的中文常用名。',
    'confidence 为 0-100 的整数；brief 为一到两句中文描述。',
    '只输出符合 schema 的 JSON，不要 markdown 或其它文字。',
  ].join('\n');
}

function computeCredits(usage) {
  const prompt = usage?.prompt_tokens ?? 0;
  const completion = usage?.completion_tokens ?? 0;
  return prompt * (100 / 1_000_000) + completion * (400 / 1_000_000);
}

function getMonthKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function getDateKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function loadQuotaState() {
  const now = Date.now();
  const defaults = {
    monthKey: getMonthKey(),
    monthCreditsUsed: 0,
    dailyDate: getDateKey(),
    dailyRequestCount: 0,
    window5hStart: now,
    window5hCreditsUsed: 0,
    lastUsage: null,
  };
  if (!existsSync(QUOTA_FILE)) return defaults;
  try {
    const parsed = JSON.parse(readFileSync(QUOTA_FILE, 'utf8'));
    return { ...defaults, ...parsed };
  } catch {
    return defaults;
  }
}

function saveQuotaState(state) {
  writeFileSync(QUOTA_FILE, JSON.stringify(state, null, 2), 'utf8');
}

function resetQuotaWindows(state) {
  const now = Date.now();
  const monthKey = getMonthKey();
  const dailyDate = getDateKey();
  if (state.monthKey !== monthKey) {
    state.monthKey = monthKey;
    state.monthCreditsUsed = 0;
  }
  if (state.dailyDate !== dailyDate) {
    state.dailyDate = dailyDate;
    state.dailyRequestCount = 0;
  }
  if (now - (state.window5hStart || 0) >= 5 * 60 * 60 * 1000) {
    state.window5hStart = now;
    state.window5hCreditsUsed = 0;
  }
  return state;
}

function buildQuotaPayload(state) {
  const monthPercent = CONFIG.quotaMonthly
    ? Math.min(100, Math.round((state.monthCreditsUsed / CONFIG.quotaMonthly) * 1000) / 10)
    : 0;
  const window5hPercent = CONFIG.quota5h
    ? Math.min(100, Math.round((state.window5hCreditsUsed / CONFIG.quota5h) * 1000) / 10)
    : 0;
  return {
    monthCreditsUsed: roundCredits(state.monthCreditsUsed),
    monthCreditsLimit: CONFIG.quotaMonthly,
    monthPercent,
    window5hCreditsUsed: roundCredits(state.window5hCreditsUsed),
    window5hCreditsLimit: CONFIG.quota5h,
    window5hPercent,
    dailyRequestCount: state.dailyRequestCount,
    dailyRequestLimit: CONFIG.quotaDaily,
    lastUsage: state.lastUsage,
  };
}

function roundCredits(value) {
  return Math.round(value * 10000) / 10000;
}

function recordUsage(state, usage) {
  resetQuotaWindows(state);
  const credits = computeCredits(usage);
  state.monthCreditsUsed += credits;
  state.window5hCreditsUsed += credits;
  state.dailyRequestCount += 1;
  state.lastUsage = {
    prompt: usage?.prompt_tokens ?? 0,
    completion: usage?.completion_tokens ?? 0,
    total: usage?.total_tokens ?? 0,
    credits: roundCredits(credits),
  };
  saveQuotaState(state);
  return buildQuotaPayload(state);
}

function matchSpecies(parsed) {
  if (parsed.catalogId && catalogById.has(parsed.catalogId)) {
    const item = catalogById.get(parsed.catalogId);
    return { speciesId: item.id, name: item.name, level: item.level, summary: item.summary };
  }

  const target = normalizeText(parsed.name);
  for (const item of catalog) {
    const names = [item.name, ...item.aliases];
    for (const alias of names) {
      const normalized = normalizeText(alias);
      if (target === normalized || target.includes(normalized) || normalized.includes(target)) {
        return { speciesId: item.id, name: item.name, level: item.level, summary: item.summary };
      }
    }
  }
  return null;
}

function parseJsonContent(content) {
  const trimmed = String(content || '').trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const raw = fenced ? fenced[1].trim() : trimmed;
  return JSON.parse(raw);
}

async function callEcnu(imageBase64, mimeType, useJsonSchema = true) {
  const dataUrl = `data:${mimeType};base64,${imageBase64}`;
  const body = {
    model: CONFIG.model,
    thinking: { type: 'disabled' },
    messages: [
      { role: 'system', content: buildSystemPrompt() },
      {
        role: 'user',
        content: [
          { type: 'text', text: '请识别这张图片中的海洋生物，并按 schema 返回 JSON。' },
          { type: 'image_url', image_url: { url: dataUrl } },
        ],
      },
    ],
    stream: false,
    temperature: 0.2,
  };

  if (useJsonSchema) {
    body.response_format = {
      type: 'json_schema',
      json_schema: JSON_SCHEMA,
    };
  } else {
    body.response_format = { type: 'json_object' };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 60000);

  try {
    const response = await fetch(`${CONFIG.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${CONFIG.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    clearTimeout(timer);
    return response;
  } catch (error) {
    clearTimeout(timer);
    throw error;
  }
}

function mapHttpError(status) {
  if (status === 401 || status === 403) return 'auth';
  if (status === 429) return 'rate_limit';
  return 'api_error';
}

async function recognizeImage(imageBase64, mimeType) {
  if (!CONFIG.apiKey) {
    return { ok: false, code: 'auth', message: '未配置 ECNU_API_KEY' };
  }

  let response = await callEcnu(imageBase64, mimeType, true);
  if (!response.ok) {
    const retryBody = await response.text();
    const shouldRetryPlainJson =
      response.status === 400 &&
      /response_format|json_schema|structured/i.test(retryBody);
    if (shouldRetryPlainJson) {
      response = await callEcnu(imageBase64, mimeType, false);
    } else {
      return {
        ok: false,
        code: mapHttpError(response.status),
        message: retryBody.slice(0, 200),
      };
    }
  }

  if (!response.ok) {
    return { ok: false, code: mapHttpError(response.status) };
  }

  const payload = await response.json();
  const content = payload?.choices?.[0]?.message?.content;
  let parsed;
  try {
    parsed = parseJsonContent(content);
  } catch {
    return { ok: false, code: 'parse_error', message: '模型返回无法解析为 JSON' };
  }

  const confidence = Math.max(0, Math.min(100, Math.round(Number(parsed.confidence) || 0)));
  const brief = String(parsed.brief || '').trim();
  const quotaState = loadQuotaState();
  const quota = recordUsage(quotaState, payload.usage);

  const matched = matchSpecies(parsed);
  if (matched) {
    return {
      ok: true,
      speciesId: matched.speciesId,
      name: matched.name,
      level: matched.level,
      summary: brief || matched.summary,
      confidence,
      quota,
    };
  }

  return {
    ok: true,
    unknown: true,
    guessedName: String(parsed.name || '未知物种'),
    brief,
    confidence,
    quota,
  };
}

function isAllowedOrigin(origin) {
  if (!origin) return true;
  try {
    const url = new URL(origin);
    return url.hostname === 'localhost' || url.hostname === '127.0.0.1';
  } catch {
    return false;
  }
}

function sendJson(res, status, data, origin) {
  const headers = {
    'Content-Type': 'application/json; charset=utf-8',
  };
  if (origin && isAllowedOrigin(origin)) {
    headers['Access-Control-Allow-Origin'] = origin;
    headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS';
    headers['Access-Control-Allow-Headers'] = 'Content-Type';
    headers.Vary = 'Origin';
  }
  res.writeHead(status, headers);
  res.end(JSON.stringify(data));
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => {
      try {
        const text = Buffer.concat(chunks).toString('utf8');
        resolve(text ? JSON.parse(text) : {});
      } catch (error) {
        reject(error);
      }
    });
    req.on('error', reject);
  });
}

const server = createServer(async (req, res) => {
  const origin = req.headers.origin;
  const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);

  if (req.method === 'OPTIONS') {
    sendJson(res, 204, {}, origin);
    return;
  }

  if (req.method === 'GET' && url.pathname === '/api/quota-status') {
    const state = resetQuotaWindows(loadQuotaState());
    saveQuotaState(state);
    sendJson(res, 200, { ok: true, quota: buildQuotaPayload(state) }, origin);
    return;
  }

  if (req.method === 'POST' && url.pathname === '/api/recognize-species') {
    try {
      const body = await readJsonBody(req);
      const mimeType = body.mimeType || 'image/jpeg';
      const imageBase64 = body.imageBase64;

      if (!imageBase64 || typeof imageBase64 !== 'string') {
        sendJson(res, 400, { ok: false, code: 'invalid_image', message: '缺少 imageBase64' }, origin);
        return;
      }

      if (!/^image\/(jpeg|png)$/i.test(mimeType)) {
        sendJson(res, 400, { ok: false, code: 'invalid_image', message: '仅支持 JPEG / PNG' }, origin);
        return;
      }

      const sizeBytes = Buffer.byteLength(imageBase64, 'base64');
      if (sizeBytes > 5 * 1024 * 1024) {
        sendJson(res, 400, { ok: false, code: 'invalid_image', message: '图片过大' }, origin);
        return;
      }

      const result = await recognizeImage(imageBase64, mimeType);
      sendJson(res, result.ok ? 200 : 502, result, origin);
    } catch (error) {
      sendJson(
        res,
        500,
        { ok: false, code: 'api_error', message: error instanceof Error ? error.message : 'server error' },
        origin
      );
    }
    return;
  }

  sendJson(res, 404, { ok: false, code: 'not_found' }, origin);
});

if (!CONFIG.apiKey) {
  console.warn('[ecnu-proxy] 警告：未找到 ECNU_API_KEY，识别请求将失败');
}

server.listen(CONFIG.port, '127.0.0.1', () => {
  console.log(`[ecnu-proxy] http://127.0.0.1:${CONFIG.port}`);
  console.log(`[ecnu-proxy] model=${CONFIG.model} catalog=${catalog.length} species`);
});
