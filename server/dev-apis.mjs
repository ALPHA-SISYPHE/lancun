/**
 * 本地开发 API 网关（Coral Watch + OpenAQ）
 * 启动：node server/dev-apis.mjs 或 npm run dev:apis
 * 默认端口 8788；与 Vercel api/ 路径一致，供 npx serve :8080 跨端口 fetch
 */
import { createServer } from 'node:http';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

const CORAL_UPSTREAM = 'https://api.coral.tsr.lol/stations/southeast_florida/current';
const OPENAQ_BASE = 'https://api.openaq.org/v3';
const OPENAQ_DOCS = 'https://docs.openaq.org/';
const PM25_PARAM_ID = 2;
const PORT = Number(process.env.DEV_APIS_PORT) || 8788;

loadEnv(join(ROOT, '.env'));

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

function sendJson(res, status, body, cacheControl) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Accept',
    ...(cacheControl ? { 'Cache-Control': cacheControl } : {}),
  });
  res.end(JSON.stringify(body));
}

async function handleCoral(_req, res) {
  try {
    const upstream = await fetch(CORAL_UPSTREAM, { headers: { Accept: 'application/json' } });
    if (!upstream.ok) {
      sendJson(res, 502, { error: 'Upstream Coral Watch request failed' });
      return;
    }
    const data = await upstream.json();
    sendJson(res, 200, data, 'public, max-age=43200, stale-while-revalidate=86400');
  } catch {
    sendJson(res, 502, { error: 'Coral Watch proxy unavailable' });
  }
}

async function handleOpenAq(url, res) {
  const apiKey = process.env.OPENAQ_API_KEY?.trim();
  if (!apiKey) {
    sendJson(res, 502, { error: 'OpenAQ API key not configured' });
    return;
  }

  const lat = Number(url.searchParams.get('lat'));
  const lon = Number(url.searchParams.get('lon'));
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    sendJson(res, 400, { error: 'lat and lon query parameters required' });
    return;
  }

  const radius = Number(url.searchParams.get('radius')) || 25000;
  const headers = { Accept: 'application/json', 'X-API-Key': apiKey };

  try {
    const locationsUrl = `${OPENAQ_BASE}/locations?coordinates=${lat},${lon}&radius=${radius}&parameters_id=${PM25_PARAM_ID}&limit=5`;
    const locationsRes = await fetch(locationsUrl, { headers });
    if (!locationsRes.ok) {
      sendJson(res, 502, { error: 'OpenAQ locations request failed' });
      return;
    }

    const locationsPayload = await locationsRes.json();
    const location = locationsPayload?.results?.[0];
    if (!location?.id) {
      sendJson(res, 502, { error: 'No OpenAQ location near coordinates' });
      return;
    }

    const latestRes = await fetch(`${OPENAQ_BASE}/locations/${location.id}/latest`, { headers });
    if (!latestRes.ok) {
      sendJson(res, 502, { error: 'OpenAQ latest request failed' });
      return;
    }

    const latestPayload = await latestRes.json();
    const measurement = latestPayload?.results?.find((row) => row?.parameter?.name === 'pm25')
      || latestPayload?.results?.[0];
    if (!measurement || measurement.value == null) {
      sendJson(res, 502, { error: 'OpenAQ PM2.5 measurement empty' });
      return;
    }

    sendJson(res, 200, {
      value: Number(measurement.value),
      updatedAt: measurement.datetime?.utc || measurement.datetime?.local || '—',
      locationName: location.name || location.locality || 'OpenAQ',
      sourceUrl: OPENAQ_DOCS,
    }, 'public, max-age=300, stale-while-revalidate=600');
  } catch {
    sendJson(res, 502, { error: 'OpenAQ proxy unavailable' });
  }
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);

  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Accept',
    });
    res.end();
    return;
  }

  if (req.method !== 'GET') {
    sendJson(res, 405, { error: 'Method not allowed' });
    return;
  }

  if (url.pathname === '/api/ocean/coral') {
    await handleCoral(req, res);
    return;
  }

  if (url.pathname === '/api/rescue/openaq') {
    await handleOpenAq(url, res);
    return;
  }

  sendJson(res, 404, { error: 'Not found' });
});

server.listen(PORT, () => {
  console.log(`澜存 dev-apis: http://127.0.0.1:${PORT}`);
  console.log('  GET /api/ocean/coral');
  console.log('  GET /api/rescue/openaq?lat=&lon=');
  if (!process.env.OPENAQ_API_KEY?.trim()) {
    console.log('  (提示: 未配置 OPENAQ_API_KEY，rescue OpenAQ 代理将返回 502)');
  }
});
