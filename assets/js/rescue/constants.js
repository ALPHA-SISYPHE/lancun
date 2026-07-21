window.LANCUN_RESCUE = window.LANCUN_RESCUE || {};

const NOAA_BASE = 'https://api.tidesandcurrents.noaa.gov/api/prod/datagetter';
const NOAA_DOCS = 'https://api.tidesandcurrents.noaa.gov/api/prod';
const OPENAQ_DOCS = 'https://docs.openaq.org/';
const FETCH_TIMEOUT_MS = 8000;

const LIVE_CONFIG = [
  {
    id: 'A',
    label: '切萨皮克湾',
    lat: 38.33,
    lon: -76.45,
    metricLabel: '溶解氧 DO',
    metricKey: 'dissolvedOxygen',
    unit: 'mg/L',
    type: 'noaa',
    station: '8574680',
    product: 'dissolved_oxygen',
    evaluate: (v) => (v < 2 ? 'alert' : v < 5 ? 'watch' : 'ok'),
  },
  {
    id: 'B',
    label: '旧金山湾',
    lat: 37.81,
    lon: -122.47,
    metricLabel: 'pH',
    metricKey: 'ph',
    unit: '',
    type: 'noaa',
    station: '9414290',
    product: 'ph',
    evaluate: (v) => (v < 7.6 ? 'alert' : v < 7.8 ? 'watch' : 'ok'),
  },
  {
    id: 'C',
    label: '墨西哥湾近岸',
    lat: 27.76,
    lon: -82.63,
    metricLabel: '盐度',
    metricKey: 'salinity',
    unit: 'PSU',
    type: 'noaa',
    station: '8726520',
    product: 'salinity',
    evaluate: (v) => (v < 20 || v > 40 ? 'watch' : 'ok'),
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
  { key: 'ph', label: 'pH', unit: '', digits: 2 },
  { key: 'temperature', label: '温度', unit: '°C', digits: 1 },
  { key: 'salinity', label: '盐度', unit: 'PSU', digits: 1 },
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

const noaaStationUrl = (station, product) =>
  `${NOAA_BASE}?date=latest&station=${station}&product=${product}&units=metric&time_zone=gmt&format=json`;

Object.assign(window.LANCUN_RESCUE, {
  NOAA_BASE,
  NOAA_DOCS,
  OPENAQ_DOCS,
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
