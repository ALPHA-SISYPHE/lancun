const CORAL_URL = 'https://api.coral.tsr.lol/stations/southeast_florida/current';
const NOAA_BASE = 'https://api.tidesandcurrents.noaa.gov/api/prod/datagetter';
const NOAA_STATION = '8518750';
const NOAA_DOCS = 'https://api.tidesandcurrents.noaa.gov/api/prod';
const CORAL_DOCS = 'https://api.coral.tsr.lol/';
const FETCH_TIMEOUT_MS = 8000;

function resolveMediaPath(path) {
  if (!path) return '';
  if (path.startsWith('http') || path.startsWith('../')) return path;
  return `../${path}`;
}

const STRESS_LABELS = {
  0: '无显著热应力',
  1: 'Watch',
  2: 'Warning',
  3: 'Alert Level 1',
  4: 'Alert Level 2',
};

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

const noaaUrl = (product, extra = '') =>
  `${NOAA_BASE}?date=today&station=${NOAA_STATION}&product=${product}&time_zone=gmt&units=metric&format=json${extra}`;

const setCardState = (card, mode, text) => {
  const status = card.querySelector('[data-status]');
  if (!status) return;
  status.textContent = text;
  status.classList.remove('is-live', 'is-demo');
  if (mode) status.classList.add(mode);
};

const formatNum = (value, digits = 1) => {
  const num = Number(value);
  if (Number.isNaN(num)) return String(value);
  return num.toFixed(digits);
};

const renderDashboardCards = () => {
  const coralHost = document.querySelector('[data-coral-dashboard]');
  const noaaHost = document.querySelector('[data-noaa-dashboard]');
  if (!coralHost || !noaaHost) return;

  const cards = [
    { id: 'sst', group: 'coral', title: '海表温度', sourceHref: CORAL_URL },
    { id: 'heat-stress', group: 'coral', title: '热应力', sourceHref: CORAL_URL },
    { id: 'bleaching', group: 'coral', title: '白化相关', sourceHref: CORAL_URL },
    { id: 'tide', group: 'noaa', title: '潮位', sourceHref: NOAA_DOCS },
    { id: 'water-temp', group: 'noaa', title: '水温', sourceHref: NOAA_DOCS },
    { id: 'wind-pressure', group: 'noaa', title: '风与气压', sourceHref: NOAA_DOCS },
  ];

  const template = (card) => `
    <article class="ocean-metric-card" data-metric-id="${card.id}" data-metric-group="${card.group}">
      <p class="ocean-metric-card__status" data-status aria-live="polite">加载中…</p>
      <h3 class="ocean-metric-card__title">${card.title}</h3>
      <p class="ocean-metric-card__value"><strong data-value>—</strong> <span data-unit></span></p>
      <p class="ocean-metric-card__sub" data-sub hidden></p>
      <a class="ocean-metric-card__source" data-source-link href="${card.sourceHref}" target="_blank" rel="noopener noreferrer">数据来源</a>
    </article>`;

  coralHost.innerHTML = cards.filter((c) => c.group === 'coral').map(template).join('');
  noaaHost.innerHTML = cards.filter((c) => c.group === 'noaa').map(template).join('');
};

const updateCard = (id, { value, unit, sub, live, statusText }) => {
  const card = document.querySelector(`[data-metric-id="${id}"]`);
  if (!card) return;
  const valueEl = card.querySelector('[data-value]');
  const unitEl = card.querySelector('[data-unit]');
  const subEl = card.querySelector('[data-sub]');
  if (valueEl) valueEl.textContent = value;
  if (unitEl) unitEl.textContent = unit || '';
  if (subEl) {
    if (sub) {
      subEl.textContent = sub;
      subEl.hidden = false;
    } else {
      subEl.hidden = true;
    }
  }
  setCardState(card, live ? 'is-live' : 'is-demo', statusText);
};

const loadCoralDashboard = async () => {
  const mock = window.LANCUN_DATA?.oceanDashboardMock?.coral;
  try {
    const data = await fetchJson(CORAL_URL);
    const current = data.current || {};
    updateCard('sst', {
      value: formatNum(current.sst_max ?? mock?.sst?.value, 2),
      unit: '°C',
      sub: current.date ? `观测日 ${current.date}` : '',
      live: true,
      statusText: '实时 · Coral Watch',
    });
    updateCard('heat-stress', {
      value: formatNum(current.dhw ?? mock?.heatStress?.dhw, 2),
      unit: '°C·周',
      sub: `stress_level ${STRESS_LABELS[current.stress_level] || current.stress_level || '—'}`,
      live: true,
      statusText: '实时 · Coral Watch',
    });
    updateCard('bleaching', {
      value: formatNum(current.baa_7day_max ?? mock?.bleaching?.baa, 2),
      unit: '指数',
      sub: `白化阈值 ${formatNum(data.bleaching_threshold ?? mock?.bleaching?.threshold, 1)} °C`,
      live: true,
      statusText: '实时 · Coral Watch',
    });
  } catch {
    if (!mock) return;
    updateCard('sst', {
      value: formatNum(mock.sst.value, 1),
      unit: mock.sst.unit,
      sub: '当前为演示数据',
      live: false,
      statusText: '演示数据 · Coral Watch',
    });
    updateCard('heat-stress', {
      value: formatNum(mock.heatStress.dhw, 1),
      unit: mock.heatStress.dhwUnit,
      sub: `${mock.heatStress.stressLabel}（演示）`,
      live: false,
      statusText: '演示数据 · Coral Watch',
    });
    updateCard('bleaching', {
      value: formatNum(mock.bleaching.baa, 2),
      unit: '指数',
      sub: `白化阈值 ${mock.bleaching.threshold} ${mock.bleaching.thresholdUnit}（演示）`,
      live: false,
      statusText: '演示数据 · Coral Watch',
    });
  }
};

const loadNoaaDashboard = async () => {
  const mock = window.LANCUN_DATA?.oceanDashboardMock?.noaa;
  const applyMockAll = () => {
    if (!mock) return;
    updateCard('tide', {
      value: formatNum(mock.tide.value, 2),
      unit: mock.tide.unit,
      sub: '当前为演示数据',
      live: false,
      statusText: '演示数据 · NOAA CO-OPS',
    });
    updateCard('water-temp', {
      value: formatNum(mock.waterTemp.value, 1),
      unit: mock.waterTemp.unit,
      sub: '当前为演示数据',
      live: false,
      statusText: '演示数据 · NOAA CO-OPS',
    });
    updateCard('wind-pressure', {
      value: formatNum(mock.windPressure.pressure, 1),
      unit: mock.windPressure.pressureUnit,
      sub: `风速 ${formatNum(mock.windPressure.wind, 1)} ${mock.windPressure.windUnit}（演示）`,
      live: false,
      statusText: '演示数据 · NOAA CO-OPS',
    });
  };

  try {
    const [tideRes, tempRes, pressureRes] = await Promise.all([
      fetchJson(`${noaaUrl('water_level')}&datum=MLLW`),
      fetchJson(noaaUrl('water_temperature')),
      fetchJson(noaaUrl('air_pressure')),
    ]);
    const tide = latestNoaaValue(tideRes);
    const temp = latestNoaaValue(tempRes);
    const pressure = latestNoaaValue(pressureRes);

    updateCard('tide', {
      value: formatNum(tide.value, 2),
      unit: 'm',
      sub: tide.time ? `更新 ${tide.time} UTC` : '',
      live: true,
      statusText: '实时 · NOAA · 8518750',
    });
    updateCard('water-temp', {
      value: formatNum(temp.value, 1),
      unit: '°C',
      sub: temp.time ? `更新 ${temp.time} UTC` : '',
      live: true,
      statusText: '实时 · NOAA · 8518750',
    });

    let windSub = '';
    try {
      const windRes = await fetchJson(noaaUrl('wind'));
      const wind = latestNoaaValue(windRes);
      windSub = `风速 ${formatNum(wind.value, 1)} m/s · ${wind.time} UTC`;
    } catch {
      windSub = mock
        ? `风速 ${formatNum(mock.windPressure.wind, 1)} ${mock.windPressure.windUnit}（该站 wind 暂无，演示副标）`
        : '风速数据暂不可用';
    }

    updateCard('wind-pressure', {
      value: formatNum(pressure.value, 1),
      unit: 'hPa',
      sub: windSub,
      live: true,
      statusText: '实时 · NOAA · 8518750',
    });
  } catch {
    applyMockAll();
  }
};

const renderOceanRole = () => {
  const cardsHost = document.querySelector('[data-ocean-role-cards]');
  const chartHost = document.querySelector('[data-co2-trend-chart]');
  const metrics = window.LANCUN_DATA?.oceanRoleMetrics;
  if (!cardsHost || !chartHost || !metrics) return;

  cardsHost.innerHTML = metrics.cards
    .map(
      (card) => `
    <article class="ocean-role-card">
      <h3>${card.title}</h3>
      <strong>${card.value}<span aria-hidden="true"> ${card.unit}</span></strong>
      <p>${card.note}</p>
      ${card.footnote ? `<small>${card.footnote}</small>` : ''}
      <a href="${card.sourceHref}" target="_blank" rel="noopener noreferrer">${card.source}</a>
    </article>`
    )
    .join('');

  const { co2Trend } = metrics;
  const points = co2Trend.points || [];
  if (!points.length) return;

  const width = 640;
  const height = 220;
  const pad = { top: 16, right: 16, bottom: 32, left: 44 };
  const innerW = width - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;
  const values = points.map((p) => p.value);
  const minV = Math.min(...values) * 0.95;
  const maxV = Math.max(...values) * 1.05;
  const xStep = points.length > 1 ? innerW / (points.length - 1) : 0;

  const toX = (index) => pad.left + index * xStep;
  const toY = (value) => pad.top + innerH - ((value - minV) / (maxV - minV)) * innerH;
  const polyline = points.map((p, i) => `${toX(i)},${toY(p.value)}`).join(' ');
  const dots = points
    .map(
      (p, i) =>
        `<circle class="ocean-trend__dot" cx="${toX(i)}" cy="${toY(p.value)}" r="4"><title>${p.year}: ${p.value} ${co2Trend.unit}</title></circle>`
    )
    .join('');
  const labels = points
    .map((p, i) => `<text class="ocean-trend__label" x="${toX(i)}" y="${height - 8}" text-anchor="middle">${p.year}</text>`)
    .join('');

  chartHost.innerHTML = `
    <div class="ocean-trend">
      <h3>${co2Trend.label}</h3>
      <p class="ocean-trend__meta">单位：${co2Trend.unit} · ${co2Trend.source}</p>
      <svg viewBox="0 0 ${width} ${height}" role="img" aria-label="${co2Trend.label}">
        <line class="ocean-trend__axis" x1="${pad.left}" y1="${pad.top + innerH}" x2="${width - pad.right}" y2="${pad.top + innerH}" />
        <polyline class="ocean-trend__line" points="${polyline}" />
        ${dots}
        ${labels}
      </svg>
      <a href="${co2Trend.sourceHref}" target="_blank" rel="noopener noreferrer">查看 ${co2Trend.source}</a>
    </div>`;
};

const renderFiveOceans = () => {
  const host = document.querySelector('[data-five-oceans-list]');
  const oceans = window.LANCUN_DATA?.fiveOceans;
  if (!host || !oceans?.length) return;

  host.innerHTML = oceans
    .map((ocean) => {
      const m = ocean.metrics || {};
      const metricBlock = (key) => {
        const item = m[key];
        if (!item) return '';
        const display = typeof item.value === 'number' ? item.value : item.value;
        const unit = item.unit ? ` ${item.unit}` : '';
        return `
        <div class="ocean-ocean-metric">
          <span>${item.label}</span>
          <strong>${display}${unit}</strong>
        </div>`;
      };
      const imagePath = resolveMediaPath(ocean.image);
      const visualClass = imagePath
        ? 'ocean-ocean-block__visual'
        : `ocean-ocean-block__visual ocean-ocean-block__visual--${ocean.id}`;
      const visualContent = imagePath
        ? `<img class="ocean-ocean-block__photo" src="${imagePath}" alt="" loading="lazy" />`
        : '';
      const visualLabel = imagePath ? `${ocean.name} 实景` : `${ocean.name} 占位视觉`;
      return `
      <article class="ocean-ocean-block" id="ocean-${ocean.id}">
        <div class="${visualClass}" role="img" aria-label="${visualLabel}">${visualContent}</div>
        <div class="ocean-ocean-block__body">
          <h3>${ocean.title}</h3>
          <p>${ocean.text}</p>
          <div class="ocean-ocean-metrics">
            ${metricBlock('areaShare')}
            ${metricBlock('avgDepth')}
            ${metricBlock('highlight')}
          </div>
        </div>
      </article>`;
    })
    .join('');
};

const finishDashboardLoad = () => {
  document.querySelectorAll('[data-coral-dashboard], [data-noaa-dashboard]').forEach((el) => {
    el.setAttribute('aria-busy', 'false');
  });
};

const highlightOceanFromQuery = () => {
  const oceanId = new URLSearchParams(window.location.search).get('ocean');
  if (!oceanId) return;
  const target = document.getElementById(`ocean-${oceanId}`);
  if (!target) return;
  target.classList.add('is-highlighted');
  const reduceMotion =
    document.documentElement.dataset.reducedMotion === 'true'
    || window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' });
};

const initOceanPage = () => {
  if (document.body.dataset.page !== 'ocean-draft2') return;
  renderDashboardCards();
  renderOceanRole();
  renderFiveOceans();
  highlightOceanFromQuery();
  Promise.all([loadCoralDashboard(), loadNoaaDashboard()]).finally(finishDashboardLoad);
};

document.addEventListener('DOMContentLoaded', initOceanPage);
