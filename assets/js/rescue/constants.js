window.LANCUN_RESCUE = window.LANCUN_RESCUE || {};

const NOAA_BASE = 'https://api.tidesandcurrents.noaa.gov/api/prod/datagetter';
const NOAA_DOCS = 'https://api.tidesandcurrents.noaa.gov/api/prod';
const OPENAQ_DOCS = 'https://docs.openaq.org/';
const DEV_API_PORT = 8788;

const openaqProxyUrl = () => {
  const host = window.location.hostname;
  if (host === 'localhost' || host === '127.0.0.1') {
    return `http://${host}:${DEV_API_PORT}/api/rescue/openaq`;
  }
  return '/api/rescue/openaq';
};
const FETCH_TIMEOUT_MS = 8000;

const LIVE_CONFIG = [
  {
    id: 'A',
    label: '切萨皮克湾',
    lat: 39.27,
    lon: -76.58,
    metricLabel: '潮位',
    metricKey: 'waterLevel',
    unit: 'm',
    type: 'noaa',
    station: '8574680',
    product: 'water_level',
    evaluate: (v) => (v > 2 ? 'alert' : v > 1.2 ? 'watch' : 'ok'),
  },
  {
    id: 'B',
    label: '旧金山湾',
    lat: 37.81,
    lon: -122.47,
    metricLabel: '气压',
    metricKey: 'airPressure',
    unit: 'hPa',
    type: 'noaa',
    station: '9414290',
    product: 'air_pressure',
    evaluate: (v) => (v < 1000 || v > 1035 ? 'alert' : v < 1010 ? 'watch' : 'ok'),
  },
  {
    id: 'C',
    label: '墨西哥湾近岸',
    lat: 27.76,
    lon: -82.63,
    metricLabel: '水温',
    metricKey: 'temperature',
    unit: '°C',
    type: 'noaa',
    station: '8726520',
    product: 'water_temperature',
    evaluate: (v) => (v > 32 ? 'alert' : v > 30 ? 'watch' : 'ok'),
  },
  {
    id: 'D',
    label: '洛杉矶沿海',
    lat: 33.94,
    lon: -118.4,
    metricLabel: 'PM2.5',
    metricKey: 'pm25',
    unit: 'µg/m³',
    type: 'openaq',
    evaluate: (v) => (v > 35 ? 'alert' : v > 12 ? 'watch' : 'ok'),
  },
];

const STRIP_METRICS = [
  { key: 'waterLevel', label: '潮位', unit: 'm', digits: 2 },
  { key: 'airPressure', label: '气压', unit: 'hPa', digits: 1 },
  { key: 'temperature', label: '水温', unit: '°C', digits: 1 },
  { key: 'pm25', label: 'PM2.5', unit: 'µg/m³', digits: 1 },
];

const STATUS_LABELS = { ok: '正常', watch: '预警', alert: '异常' };

const prefersReducedMotion = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const resolveMediaPath = (path) => {
  if (!path) return '';
  if (path.startsWith('http') || path.startsWith('../')) return path;
  return `../${path}`;
};

const formatNum = (value, digits = 1) => {
  const num = Number(value);
  if (Number.isNaN(num)) return String(value);
  return num.toFixed(digits);
};

const lonLatToSvg = (lon, lat, width = 800, height = 400) => ({
  x: ((lon + 180) / 360) * width,
  y: ((90 - lat) / 180) * height,
});

const fetchJson = (url) => {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  return fetch(url, { signal: controller.signal })
    .then((response) => {
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response.json();
    })
    .finally(() => window.clearTimeout(timer));
};

const latestNoaaValue = (payload) => {
  const rows = payload?.data;
  if (!Array.isArray(rows) || !rows.length) throw new Error('NOAA empty');
  const last = rows[rows.length - 1];
  return { value: Number(last.v), time: last.t };
};

const noaaStationUrl = (station, product) => {
  const datum = product === 'water_level' ? '&datum=MLLW' : '';
  return `${NOAA_BASE}?date=today&station=${station}&product=${product}&units=metric&time_zone=gmt&format=json${datum}`;
};

Object.assign(window.LANCUN_RESCUE, {
  NOAA_BASE,
  NOAA_DOCS,
  OPENAQ_DOCS,
  openaqProxyUrl,
  FETCH_TIMEOUT_MS,
  LIVE_CONFIG,
  STRIP_METRICS,
  STATUS_LABELS,
  prefersReducedMotion,
  resolveMediaPath,
  formatNum,
  lonLatToSvg,
  fetchJson,
  latestNoaaValue,
  noaaStationUrl,
});
