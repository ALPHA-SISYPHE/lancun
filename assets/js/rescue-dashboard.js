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
    unit: 'µg/m³',
    type: 'openaq',
    evaluate: (v) => (v > 35 ? 'alert' : v > 12 ? 'watch' : 'ok'),
  },
];

const STATUS_LABELS = { ok: '正常', watch: '关注', alert: '异常' };

const prefersReducedMotion = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

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

const formatNum = (value, digits = 1) => {
  const num = Number(value);
  if (Number.isNaN(num)) return String(value);
  return num.toFixed(digits);
};

const lonLatToSvg = (lon, lat, width = 800, height = 400) => ({
  x: ((lon + 180) / 360) * width,
  y: ((90 - lat) / 180) * height,
});

const renderLineChart = (host, trend) => {
  if (!host || !trend?.points?.length) return;
  const points = trend.points;
  const width = 640;
  const height = 220;
  const pad = { top: 16, right: 16, bottom: 32, left: 44 };
  const innerW = width - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;
  const values = points.map((p) => p.value);
  const minV = Math.min(...values) * 0.95;
  const maxV = Math.max(...values) * 1.05;
  const xStep = points.length > 1 ? innerW / (points.length - 1) : 0;
  const toX = (i) => pad.left + i * xStep;
  const toY = (v) => pad.top + innerH - ((v - minV) / (maxV - minV)) * innerH;
  const polyline = points.map((p, i) => `${toX(i)},${toY(p.value)}`).join(' ');
  const dots = points
    .map(
      (p, i) =>
        `<circle class="rescue-trend__dot" cx="${toX(i)}" cy="${toY(p.value)}" r="4"><title>${p.year}: ${p.value}${trend.unit}</title></circle>`
    )
    .join('');
  const labels = points
    .map((p, i) => `<text class="rescue-trend__label" x="${toX(i)}" y="${height - 8}" text-anchor="middle">${p.year}</text>`)
    .join('');

  host.innerHTML = `
    <div class="rescue-trend">
      <h3>${trend.label}</h3>
      <p class="rescue-chart-card__meta">单位：${trend.unit} · ${trend.source}${trend.footnote ? ` · ${trend.footnote}` : ''}</p>
      <svg viewBox="0 0 ${width} ${height}" role="img" aria-label="${trend.label}">
        <line class="rescue-trend__axis" x1="${pad.left}" y1="${pad.top + innerH}" x2="${width - pad.right}" y2="${pad.top + innerH}" />
        <polyline class="rescue-trend__line" points="${polyline}" />
        ${dots}
        ${labels}
      </svg>
      <a href="${trend.sourceHref}" target="_blank" rel="noopener noreferrer">查看 ${trend.source}</a>
    </div>`;
};

const renderRescueStatic = () => {
  const data = window.LANCUN_DATA;
  if (!data) return;

  const metricsHost = document.querySelector('[data-rescue-metrics]');
  if (metricsHost && data.rescueStaticMetrics) {
    metricsHost.innerHTML = data.rescueStaticMetrics
      .map(
        (m) => `
      <article class="rescue-metric-card">
        <h3 class="rescue-metric-card__title">${m.title}</h3>
        <p class="rescue-metric-card__value">${m.value}${m.unit ? `<span aria-hidden="true"> ${m.unit}</span>` : ''}</p>
        <p class="rescue-metric-card__note">${m.note}</p>
        <a class="rescue-metric-card__source" href="${m.sourceHref}" target="_blank" rel="noopener noreferrer">${m.source}</a>
      </article>`
      )
      .join('');
    metricsHost.setAttribute('aria-busy', 'false');
  }

  const pieHost = document.querySelector('[data-rescue-pie-chart]');
  const pie = data.rescueCharts?.pie;
  if (pieHost && pie?.slices?.length) {
    const plastic = pie.slices.find((s) => s.label === '塑料')?.value ?? 85;
    pieHost.innerHTML = `
      <h3>${pie.label}</h3>
      <div class="rescue-pie">
        <div class="rescue-pie__ring" style="background: conic-gradient(var(--brand-primary) 0 ${plastic}%, var(--hairline) ${plastic}% 100%)" role="img" aria-label="塑料 ${plastic}%，其它 ${100 - plastic}%"></div>
        <ul class="rescue-pie__legend">
          ${pie.slices
            .map(
              (s, i) => `
            <li><span class="rescue-pie__swatch" style="background:${i === 0 ? 'var(--brand-primary)' : 'var(--hairline)'}"></span>${s.label} ${s.value}%</li>`
            )
            .join('')}
        </ul>
      </div>
      <a href="${pie.sourceHref}" target="_blank" rel="noopener noreferrer">${pie.source}</a>`;
  }

  const barHost = document.querySelector('[data-rescue-bar-chart]');
  const bar = data.rescueCharts?.bar;
  if (barHost && bar?.rows?.length) {
    barHost.innerHTML = `
      <h3>${bar.label}</h3>
      <div class="rescue-bar">
        ${bar.rows
          .map(
            (row) => `
          <div class="chart-row">
            <span>${row.label}</span>
            <div class="chart-track"><div class="chart-fill" style="width:${row.value}%"></div></div>
            <strong>${row.value}%</strong>
          </div>`
          )
          .join('')}
      </div>
      <a href="${bar.sourceHref}" target="_blank" rel="noopener noreferrer">${bar.source}</a>`;
  }

  renderLineChart(document.querySelector('[data-rescue-line-chart]'), data.rescueCharts?.line);

  const eduHost = document.querySelector('[data-rescue-education]');
  const edu = data.rescueEducation;
  if (eduHost && edu) {
    eduHost.innerHTML = `
      <p class="rescue-education__intro">${edu.intro}</p>
      <ul class="rescue-education__list">
        ${edu.topics
          .map(
            (t) => `
          <li>
            <h3>${t.title}</h3>
            <p>${t.text}</p>
            <a href="${t.sourceHref}" target="_blank" rel="noopener noreferrer">${t.sourceLabel}</a>
          </li>`
          )
          .join('')}
      </ul>
      <p class="source-note">以上数字均来自公开统计；正式提交前请与 DATA_SOURCES.md 核对口径。</p>`;
  }
};

const getMockPoint = (id) =>
  window.LANCUN_DATA?.rescueLiveMock?.points?.find((p) => p.id === id);

const buildLiveCardHtml = (point, config, live) => {
  const level = point.statusLevel || 'ok';
  return `
    <article class="rescue-live-card" data-point-id="${config.id}" id="rescue-live-${config.id}" tabindex="0">
      <p class="rescue-live-card__status ${live ? 'is-live' : 'is-demo'}">${live ? '实时' : '演示数据'} · ${config.label}</p>
      <h3 class="rescue-live-card__title">${config.metricLabel}</h3>
      <p class="rescue-live-card__value">${formatNum(point.value, config.product === 'ph' ? 2 : 1)}${point.unit ? ` ${point.unit}` : ''}</p>
      <p class="rescue-live-card__meta">${point.updatedAt ? `更新 ${point.updatedAt}` : ''}</p>
      <span class="rescue-live-card__badge rescue-live-card__badge--${level}">${STATUS_LABELS[level] || point.status}</span>
      <a class="rescue-live-card__source" href="${point.sourceUrl || NOAA_DOCS}" target="_blank" rel="noopener noreferrer">数据来源</a>
    </article>`;
};

let activeLiveId = 'A';

const setActiveLivePoint = (id) => {
  activeLiveId = id;
  document.querySelectorAll('[data-point-id]').forEach((el) => {
    el.classList.toggle('is-active', el.dataset.pointId === id);
  });
  document.querySelectorAll('[data-rescue-map-pins] .rescue-live__pin').forEach((pin) => {
    pin.classList.toggle('is-active', pin.dataset.pointId === id);
  });
  const card = document.getElementById(`rescue-live-${id}`);
  card?.scrollIntoView({ block: 'nearest', behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
};

const renderLiveShell = () => {
  const cardsHost = document.querySelector('[data-rescue-live-cards]');
  const pinsHost = document.querySelector('[data-rescue-map-pins]');
  const mapSvg = document.querySelector('[data-rescue-map]');
  if (!cardsHost || !pinsHost || !mapSvg) return;

  if (!mapSvg.querySelector('#rescueOceanGrad')) {
    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    defs.innerHTML = `
      <linearGradient id="rescueOceanGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#e0f2fe"/>
        <stop offset="100%" stop-color="#1e3a8a"/>
      </linearGradient>`;
    mapSvg.insertBefore(defs, mapSvg.firstChild);
  }

  cardsHost.innerHTML = LIVE_CONFIG.map((cfg) => {
    const mock = getMockPoint(cfg.id);
    return buildLiveCardHtml(mock || { value: '—', statusLevel: 'ok' }, cfg, false);
  }).join('');

  pinsHost.innerHTML = LIVE_CONFIG.map((cfg) => {
    const { x, y } = lonLatToSvg(cfg.lon, cfg.lat);
    return `
      <g class="rescue-live__pin" data-point-id="${cfg.id}" role="button" tabindex="0" aria-label="${cfg.label} 监测点">
        <circle cx="${x}" cy="${y}" r="8"/>
        <text class="rescue-live__pin-label" x="${x + 10}" y="${y + 4}">${cfg.id}</text>
      </g>`;
  }).join('');

  const bindPin = (el) => {
    el.addEventListener('click', () => setActiveLivePoint(el.dataset.pointId));
    el.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        setActiveLivePoint(el.dataset.pointId);
      }
    });
  };

  document.querySelectorAll('[data-rescue-map-pins] .rescue-live__pin').forEach(bindPin);
  document.querySelectorAll('[data-rescue-live-cards] .rescue-live-card').forEach((card) => {
    card.addEventListener('click', () => setActiveLivePoint(card.dataset.pointId));
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        setActiveLivePoint(card.dataset.pointId);
      }
    });
  });

  setActiveLivePoint('A');
};

const updateLiveCard = (id, point, config, live) => {
  const cardsHost = document.querySelector('[data-rescue-live-cards]');
  if (!cardsHost) return;
  const existing = document.getElementById(`rescue-live-${id}`);
  const html = buildLiveCardHtml(point, config, live);
  if (existing) {
    existing.outerHTML = html;
    const card = document.getElementById(`rescue-live-${id}`);
    card?.addEventListener('click', () => setActiveLivePoint(id));
    card?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        setActiveLivePoint(id);
      }
    });
    if (activeLiveId === id) card?.classList.add('is-active');
  }
};

const fetchNoaaPoint = async (config) => {
  const mock = getMockPoint(config.id);
  try {
    const payload = await fetchJson(noaaStationUrl(config.station, config.product));
    const latest = latestNoaaValue(payload);
    const level = config.evaluate(latest.value);
    return {
      value: latest.value,
      unit: config.unit,
      statusLevel: level,
      status: STATUS_LABELS[level],
      updatedAt: `${latest.time} UTC`,
      sourceUrl: NOAA_DOCS,
      isDemo: false,
      live: true,
    };
  } catch {
    if (!mock) throw new Error('no mock');
    return { ...mock, live: false };
  }
};

const fetchOpenAqPoint = async (config) => {
  const mock = getMockPoint(config.id);
  try {
    const url = `https://api.openaq.org/v2/latest?coordinates=${config.lat},${config.lon}&radius=50000&limit=1&parameter=pm25`;
    const payload = await fetchJson(url);
    const result = payload?.results?.[0];
    const measurement = result?.measurements?.find((m) => m.parameter === 'pm25');
    if (!measurement) throw new Error('OpenAQ empty');
    const value = Number(measurement.value);
    const level = config.evaluate(value);
    return {
      value,
      unit: config.unit,
      statusLevel: level,
      status: STATUS_LABELS[level],
      updatedAt: measurement.lastUpdated || result.lastUpdated || '—',
      sourceUrl: OPENAQ_DOCS,
      isDemo: false,
      live: true,
    };
  } catch {
    if (!mock) throw new Error('no mock');
    return { ...mock, live: false };
  }
};

const fetchRescueLive = async () => {
  renderLiveShell();
  const cardsHost = document.querySelector('[data-rescue-live-cards]');
  await Promise.all(
    LIVE_CONFIG.map(async (config) => {
      try {
        const point =
          config.type === 'openaq' ? await fetchOpenAqPoint(config) : await fetchNoaaPoint(config);
        updateLiveCard(config.id, point, config, point.live);
      } catch {
        const mock = getMockPoint(config.id);
        if (mock) updateLiveCard(config.id, mock, config, false);
      }
    })
  );
  cardsHost?.setAttribute('aria-busy', 'false');
};

const renderPollutionTable = () => {
  const host = document.querySelector('[data-rescue-pollution-table]');
  const tableData = window.LANCUN_DATA?.rescuePollutionTable;
  if (!host || !tableData) return;

  host.innerHTML = `
    <table>
      <caption>${tableData.caption}</caption>
      <thead>
        <tr>
          <th scope="col">污染源</th>
          <th scope="col">主要来源</th>
          <th scope="col">生态影响</th>
          <th scope="col">个人可行动作</th>
        </tr>
      </thead>
      <tbody>
        ${tableData.rows
          .map(
            (row) => `
          <tr>
            <td>${row.category}</td>
            <td>${row.sources}</td>
            <td>${row.impact}</td>
            <td>${row.action}</td>
          </tr>`
          )
          .join('')}
      </tbody>
    </table>
    <p class="source-note">${tableData.sourceNote}</p>`;
};

const initPollutionModule = () => {
  const panels = window.LANCUN_DATA?.rescuePollutionPanels;
  const sidebar = document.querySelector('[data-rescue-sidebar]');
  const panelHost = document.querySelector('[data-rescue-panel]');
  const split = document.querySelector('.rescue-solutions__split');
  if (!panels?.length || !sidebar || !panelHost) return;

  let activeIndex = 0;
  let autoplayTimer = null;

  sidebar.innerHTML = panels
    .map(
      (p, i) => `
    <button type="button" class="rescue-pollution-nav-card" role="tab" id="rescue-tab-${p.id}"
      aria-selected="${i === 0}" aria-controls="rescue-panel-content" data-index="${i}">
      <span class="rescue-pollution-nav-card__bg ${p.gradientClass}" aria-hidden="true"></span>
      <span class="rescue-pollution-nav-card__overlay" aria-hidden="true"></span>
      <span class="rescue-pollution-nav-card__label">${p.title}</span>
    </button>`
    )
    .join('');

  panelHost.id = 'rescue-panel-content';

  const renderPanel = (index, animate = true) => {
    const p = panels[index];
    if (!p) return;

    const applyContent = () => {
      panelHost.innerHTML = `
        <h2 class="rescue-pollution-panel__title">
          <svg class="rescue-pollution-panel__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
          </svg>
          ${p.title}
        </h2>
        <p class="rescue-pollution-panel__summary">${p.summary}</p>
        <p class="rescue-pollution-panel__data">${p.dataHighlight}</p>
        <hr class="rescue-pollution-panel__divider" />
        <div class="rescue-pollution-panel__solutions">
          <h3>可执行方案</h3>
          <ul>
            ${p.solutions.map((s) => `<li><span class="rescue-pollution-panel__check" aria-hidden="true">✓</span>${s}</li>`).join('')}
          </ul>
        </div>
        <a class="rescue-pollution-panel__cta" href="action.html">前往保护行动</a>`;
      panelHost.classList.remove('is-fading');
    };

    if (animate && !prefersReducedMotion()) {
      panelHost.classList.add('is-fading');
      window.setTimeout(applyContent, 150);
    } else {
      applyContent();
    }

    sidebar.querySelectorAll('.rescue-pollution-nav-card').forEach((btn, i) => {
      btn.setAttribute('aria-selected', i === index ? 'true' : 'false');
    });
    activeIndex = index;
  };

  const selectIndex = (index) => {
    const next = (index + panels.length) % panels.length;
    renderPanel(next);
  };

  sidebar.addEventListener('click', (e) => {
    const btn = e.target.closest('.rescue-pollution-nav-card');
    if (!btn) return;
    selectIndex(Number(btn.dataset.index));
    stopAutoplay();
  });

  sidebar.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      selectIndex(activeIndex + 1);
      stopAutoplay();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      selectIndex(activeIndex - 1);
      stopAutoplay();
    }
  });

  const stopAutoplay = () => {
    if (autoplayTimer) {
      window.clearInterval(autoplayTimer);
      autoplayTimer = null;
    }
  };

  const startAutoplay = () => {
    if (prefersReducedMotion()) return;
    stopAutoplay();
    autoplayTimer = window.setInterval(() => selectIndex(activeIndex + 1), 6000);
  };

  sidebar.addEventListener('mouseenter', stopAutoplay);
  panelHost.addEventListener('mouseenter', stopAutoplay);
  sidebar.addEventListener('mouseleave', startAutoplay);
  panelHost.addEventListener('mouseleave', startAutoplay);

  renderPanel(0, false);
  renderPollutionTable();

  if (split && !prefersReducedMotion()) {
    split.classList.add('is-entered');
  }

  startAutoplay();
};

const initRescuePage = () => {
  if (document.body.dataset.page !== 'rescue') return;
  renderRescueStatic();
  fetchRescueLive();
  initPollutionModule();
};

document.addEventListener('DOMContentLoaded', initRescuePage);
