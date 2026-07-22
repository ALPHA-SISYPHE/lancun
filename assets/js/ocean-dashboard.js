const OCEAN2_CORAL_URL = 'https://api.coral.tsr.lol/stations/southeast_florida/current';
const OCEAN2_NOAA_BASE = 'https://api.tidesandcurrents.noaa.gov/api/prod/datagetter';
const OCEAN2_STATION = '8518750';
const OCEAN2_COVER_LABELS = {
  'co2-sink': 'Ocean Coverage',
  'heat-buffer': 'Marine Heat Buffer',
  oxygen: 'Marine Oxygen',
};

let ocean2ActiveId = 'pacific';

const OCEAN2_TAB_IDS = ['pacific', 'atlantic', 'indian', 'southern', 'arctic'];

const ocean2NormalizeOceanId = (raw) => {
  if (!raw || typeof raw !== 'string') return null;
  const id = raw.trim().toLowerCase();
  return OCEAN2_TAB_IDS.includes(id) ? id : null;
};

const ocean2ResolveOceanIdFromLocation = () => {
  const hash = window.location.hash.replace('#', '');
  if (hash.startsWith('ocean-')) {
    const fromHash = ocean2NormalizeOceanId(hash.slice('ocean-'.length));
    if (fromHash) return fromHash;
  }

  const fromBareHash = ocean2NormalizeOceanId(hash);
  if (fromBareHash) return fromBareHash;

  const params = new URLSearchParams(window.location.search);
  return ocean2NormalizeOceanId(params.get('ocean'));
};

const ocean2DefaultOceanId = () => {
  const oceans = window.LANCUN_DATA?.fiveOceans || [];
  return oceans[0]?.id || 'pacific';
};

const ocean2ApplyOceanDeepLink = ({ scroll = false } = {}) => {
  const oceans = window.LANCUN_DATA?.fiveOceans || [];
  const resolved = ocean2ResolveOceanIdFromLocation();
  const fallback = ocean2DefaultOceanId();
  const id = resolved && oceans.some((ocean) => ocean.id === resolved) ? resolved : fallback;

  ocean2ShowOcean(id);

  if (scroll) {
    requestAnimationFrame(() => ocean2ScrollToAnchor('ocean-explorer'));
  }

  if (new URLSearchParams(window.location.search).has('ocean')) {
    history.replaceState(null, '', `${window.location.pathname}#ocean-${id}`);
  }
};

const ocean2GetProfile = (id) => {
  const profiles = window.OCEAN_PROFILES || [];
  const profile = profiles.find((item) => item.id === id);
  if (profile) return profile;
  const oceans = window.LANCUN_DATA?.fiveOceans || [];
  const ocean = oceans.find((item) => item.id === id);
  if (!ocean) return null;
  const index = oceans.indexOf(ocean);
  const englishNames = ['PACIFIC', 'ATLANTIC', 'INDIAN', 'SOUTHERN', 'ARCTIC'];
  const { areaShare, avgDepth, highlight } = ocean.metrics;
  return {
    id: ocean.id,
    index: index + 1,
    name: ocean.name,
    englishName: englishNames[index] || '',
    image: ocean.image,
    geographicRange: '—',
    deepestPoint: '—',
    area: `${areaShare.value}${areaShare.unit || ''}`,
    averageDepth: `${avgDepth.value} ${avgDepth.unit}`,
    ecosystem: highlight.label,
    keySpecies: '—',
    threats: '—',
    protectionFocus: `${highlight.label} · ${highlight.value}${highlight.unit ? ` ${highlight.unit}` : ''}`,
    description: ocean.text,
    source: ocean.imageSource,
  };
};

const ocean2UpdateIndexHint = (index) => {
  const hint = document.querySelector('[data-ocean-index]');
  if (!hint) return;
  const num = String(index + 1).padStart(2, '0');
  hint.innerHTML = `<span class="ocean2-explorer-header__hint-label">五大洋档案</span> ${num} / 05`;
};

const ocean2Format = (value, digits = 1) => {
  const number = Number(value);
  return Number.isFinite(number) ? number.toFixed(digits) : String(value);
};

const ocean2Fetch = (url) => {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 8000);
  return fetch(url, { signal: controller.signal })
    .then((response) => (response.ok ? response.json() : Promise.reject(new Error('Request failed'))))
    .finally(() => window.clearTimeout(timeout));
};

const ocean2NoaaUrl = (product, extra = '') =>
  `${OCEAN2_NOAA_BASE}?date=today&station=${OCEAN2_STATION}&product=${product}&time_zone=gmt&units=metric&format=json${extra}`;

const ocean2Last = (data) => {
  const row = data?.data?.at(-1);
  if (!row) throw new Error('No measurement');
  return { value: Number(row.v), time: row.t };
};

const ocean2ReportKpiState = { temperature: '—', temperatureUnit: '°C', seaLevel: '—', seaLevelUnit: 'm' };

const ocean2StatBlock = (card, { variant } = {}) => {
  const label = variant === 'cover' && OCEAN2_COVER_LABELS[card.id] ? OCEAN2_COVER_LABELS[card.id] : card.title;
  return `<div class="ocean2-stat-block"><span>${label}</span><strong>${card.value}${card.unit ? `<small> ${card.unit}</small>` : ''}</strong><small>${card.note}</small></div>`;
};

const ocean2Metric = ({ id, title, value, unit, state, live, note, href }) => `
  <article class="ocean2-metric" data-metric="${id}">
    <p class="ocean2-metric__state ${live ? 'is-live' : 'is-demo'}" data-state>${state}</p>
    <h4>${title}</h4>
    <strong data-value>${value}</strong><small data-unit>${unit}</small>
    <p class="ocean2-metric__note" data-note>${note}</p>
    <a href="${href}" target="_blank" rel="noopener noreferrer">来源 ↗</a>
  </article>`;

const ocean2SetMetric = (id, value) => {
  const metric = document.querySelector(`[data-metric="${id}"]`);
  if (!metric) return;
  metric.querySelector('[data-value]').textContent = value.value;
  metric.querySelector('[data-unit]').textContent = value.unit;
  metric.querySelector('[data-state]').textContent = value.state;
  metric.querySelector('[data-note]').textContent = value.note;
  metric.querySelector('[data-state]').className = `ocean2-metric__state ${value.live ? 'is-live' : 'is-demo'}`;
};

const ocean2RenderMetricSkeleton = () => {
  const sourceCoral = OCEAN2_CORAL_URL;
  const sourceNoaa = 'https://tidesandcurrents.noaa.gov/';
  const items = [
    ['sst', 'Coral Temperature', '—', '°C', '正在读取', true, '珊瑚礁周边的表层热量', sourceCoral],
    ['stress', 'Heat Stress', '—', '°C·周', '正在读取', true, '连续高温可能累积压力', sourceCoral],
    ['bleaching', 'Bleaching Index', '—', '指数', '正在读取', true, '接近阈值时需要更密切观察', sourceCoral],
    ['tide', 'Sea Level (Tide)', '—', 'm', '正在读取', true, '相对当地潮位基准', sourceNoaa],
    ['temp', 'Coastal Water Temp', '—', '°C', '正在读取', true, '沿海站点即时读数', sourceNoaa],
    ['pressure', 'Air Pressure', '—', 'hPa', '正在读取', true, '与风场变化相关', sourceNoaa],
  ];
  document.querySelector('[data-metrics]').innerHTML = items.map(([id, title, value, unit, state, live, note, href]) => ocean2Metric({ id, title, value, unit, state, live, note, href })).join('');
};

const ocean2ApplyMock = () => {
  const mock = window.LANCUN_DATA?.oceanDashboardMock;
  if (!mock) return;
  ocean2SetMetric('sst', { value: ocean2Format(mock.coral.sst.value), unit: mock.coral.sst.unit, state: '本地演示 · Coral Watch', live: false, note: '珊瑚礁周边的表层热量' });
  ocean2SetMetric('stress', { value: ocean2Format(mock.coral.heatStress.dhw), unit: mock.coral.heatStress.dhwUnit, state: '本地演示 · Coral Watch', live: false, note: mock.coral.heatStress.stressLabel });
  ocean2SetMetric('bleaching', { value: ocean2Format(mock.coral.bleaching.baa, 2), unit: '指数', state: '本地演示 · Coral Watch', live: false, note: `阈值 ${mock.coral.bleaching.threshold} ${mock.coral.bleaching.thresholdUnit}` });
  ocean2SetMetric('tide', { value: ocean2Format(mock.noaa.tide.value, 2), unit: mock.noaa.tide.unit, state: '本地演示 · NOAA', live: false, note: '相对当地潮位基准' });
  ocean2SetMetric('temp', { value: ocean2Format(mock.noaa.waterTemp.value), unit: mock.noaa.waterTemp.unit, state: '本地演示 · NOAA', live: false, note: '沿海站点即时读数' });
  ocean2SetMetric('pressure', { value: ocean2Format(mock.noaa.windPressure.pressure), unit: mock.noaa.windPressure.pressureUnit, state: '本地演示 · NOAA', live: false, note: `风速 ${ocean2Format(mock.noaa.windPressure.wind)} ${mock.noaa.windPressure.windUnit}` });
};

const ocean2LoadLive = async () => {
  const coral = await ocean2Fetch(OCEAN2_CORAL_URL);
  const current = coral.current || {};
  ocean2SetMetric('sst', { value: ocean2Format(current.sst_max, 2), unit: '°C', state: '实时 · Coral Watch', live: true, note: current.date ? `观测于 ${current.date}` : '珊瑚礁周边的表层热量' });
  ocean2SetMetric('stress', { value: ocean2Format(current.dhw, 2), unit: '°C·周', state: '实时 · Coral Watch', live: true, note: `热应力：${current.stress_level || '待判定'}` });
  ocean2SetMetric('bleaching', { value: ocean2Format(current.baa_7day_max, 2), unit: '指数', state: '实时 · Coral Watch', live: true, note: `阈值 ${ocean2Format(coral.bleaching_threshold, 1)} °C` });

  const [tidePayload, tempPayload, pressurePayload] = await Promise.all([
    ocean2Fetch(`${ocean2NoaaUrl('water_level')}&datum=MLLW`),
    ocean2Fetch(ocean2NoaaUrl('water_temperature')),
    ocean2Fetch(ocean2NoaaUrl('air_pressure')),
  ]);
  const tide = ocean2Last(tidePayload);
  const temperature = ocean2Last(tempPayload);
  const pressure = ocean2Last(pressurePayload);
  ocean2SetMetric('tide', { value: ocean2Format(tide.value, 2), unit: 'm', state: '实时 · NOAA', live: true, note: `更新 ${tide.time} UTC` });
  ocean2SetMetric('temp', { value: ocean2Format(temperature.value), unit: '°C', state: '实时 · NOAA', live: true, note: `更新 ${temperature.time} UTC` });
  ocean2SetMetric('pressure', { value: ocean2Format(pressure.value), unit: 'hPa', state: '实时 · NOAA', live: true, note: `更新 ${pressure.time} UTC` });
};

const ocean2Refresh = async () => {
  const updated = document.querySelector('[data-updated]');
  const metrics = document.querySelector('[data-metrics]');
  const refreshBtn = document.querySelector('[data-refresh]');
  updated.textContent = '正在刷新公开观测…';
  metrics?.setAttribute('aria-busy', 'true');
  metrics?.classList.add('is-refreshing');
  refreshBtn?.classList.add('is-refreshing');
  try { await ocean2LoadLive(); }
  catch { ocean2ApplyMock(); }
  metrics?.setAttribute('aria-busy', 'false');
  metrics?.classList.remove('is-refreshing');
  refreshBtn?.classList.remove('is-refreshing');
  updated.textContent = `本次刷新：${new Intl.DateTimeFormat('zh-CN', { hour: '2-digit', minute: '2-digit' }).format(new Date())}`;
  ocean2SyncReportKpisFromMetrics();
};

const ocean2RenderCoverStats = (cards) => {
  const host = document.querySelector('[data-cover-stats]');
  if (!host) return;
  host.innerHTML = cards.slice(0, 3).map((card) => ocean2StatBlock(card, { variant: 'cover' })).join('');
};

const ocean2SyncReportKpisFromMetrics = () => {
  const sst = document.querySelector('[data-metric="sst"] [data-value]');
  const sstUnit = document.querySelector('[data-metric="sst"] [data-unit]');
  const tide = document.querySelector('[data-metric="tide"] [data-value]');
  const tideUnit = document.querySelector('[data-metric="tide"] [data-unit]');
  if (sst) ocean2ReportKpiState.temperature = sst.textContent;
  if (sstUnit) ocean2ReportKpiState.temperatureUnit = sstUnit.textContent;
  if (tide) ocean2ReportKpiState.seaLevel = tide.textContent;
  if (tideUnit) ocean2ReportKpiState.seaLevelUnit = tideUnit.textContent;
  ocean2RenderReportKpis();
};

const ocean2RenderReportKpis = () => {
  const host = document.querySelector('[data-report-kpis]');
  const data = window.LANCUN_DATA?.oceanRoleMetrics;
  if (!host || !data) return;
  const co2Card = data.cards.find((card) => card.id === 'co2-sink');
  const latestCo2 = data.co2Trend.points.at(-1);
  const acid = data.reportIndicators?.acidification;
  const kpis = [
    { label: 'Temperature', value: ocean2ReportKpiState.temperature, unit: ocean2ReportKpiState.temperatureUnit, note: '海表温度 · 公开观测' },
    { label: 'Sea Level', value: ocean2ReportKpiState.seaLevel, unit: ocean2ReportKpiState.seaLevelUnit, note: '潮位 · 公开观测' },
    {
      label: 'CO₂ Uptake',
      value: latestCo2?.value ?? co2Card?.value,
      unit: latestCo2 ? data.co2Trend.unit : co2Card?.unit,
      note: latestCo2 ? `${latestCo2.year} · ${data.co2Trend.source}` : co2Card?.note,
    },
    { label: acid?.label || 'Ocean Acidification', value: acid?.value, unit: acid?.unit, note: acid?.note },
  ];
  host.innerHTML = kpis.map((kpi) => `<div class="ocean2-stat-block"><span>${kpi.label}</span><strong>${kpi.value}${kpi.unit ? `<small> ${kpi.unit}</small>` : ''}</strong><small>${kpi.note}</small></div>`).join('');
};

const ocean2RenderRole = () => {
  const data = window.LANCUN_DATA?.oceanRoleMetrics;
  if (!data) return;
  const cards = data.cards;
  ocean2RenderCoverStats(cards);
  ocean2RenderReportKpis();

  const blueCarbon = cards.find((card) => card.id === 'blue-carbon');
  const mechanism = document.querySelector('[data-mechanism]');
  if (mechanism && blueCarbon) {
    mechanism.innerHTML = `<p class="ocean2-data-mechanism__label">机制说明</p><h3>${blueCarbon.title}</h3><strong class="ocean2-data-mechanism__value">约 ${blueCarbon.value} ${blueCarbon.unit}</strong><a href="${blueCarbon.sourceHref}" target="_blank" rel="noopener noreferrer">来源 ↗</a>`;
  } else if (mechanism) {
    mechanism.innerHTML = '';
  }

  const trend = data.co2Trend;
  const points = trend.points;
  const width = 650;
  const height = 110;
  const pad = { left: 38, right: 12, top: 10, bottom: 24 };
  const values = points.map((point) => point.value);
  const min = Math.min(...values) * .96;
  const max = Math.max(...values) * 1.04;
  const x = (index) => pad.left + ((width - pad.left - pad.right) / (points.length - 1)) * index;
  const y = (value) => pad.top + (height - pad.top - pad.bottom) - ((value - min) / (max - min)) * (height - pad.top - pad.bottom);
  const pointsText = points.map((point, index) => `${x(index)},${y(point.value)}`).join(' ');
  document.querySelector('[data-trend-chart]').innerHTML = `<div class="ocean2-chart"><h3 id="trend-title">${trend.label}</h3><p>单位：${trend.unit} · ${trend.source}</p><svg viewBox="0 0 ${width} ${height}" role="img" aria-label="${trend.label}"><line class="ocean2-axis" x1="${pad.left}" y1="${height - pad.bottom}" x2="${width - pad.right}" y2="${height - pad.bottom}" /><polyline class="ocean2-line" points="${pointsText}" />${points.map((point, index) => `<circle class="ocean2-dot" cx="${x(index)}" cy="${y(point.value)}" r="3.5" tabindex="0"><title>${point.year}：${point.value} ${trend.unit}</title></circle><text class="ocean2-label" x="${x(index)}" y="${height - 6}" text-anchor="middle">${point.year}</text>`).join('')}</svg><a href="${trend.sourceHref}" target="_blank" rel="noopener noreferrer">查看 ${trend.source} ↗</a></div>`;
  document.querySelector('[data-trend-table]').innerHTML = `<table class="ocean2-table"><thead><tr><th>年份</th><th>吸收量（${trend.unit}）</th></tr></thead><tbody>${points.map((point) => `<tr><td>${point.year}</td><td>${point.value}</td></tr>`).join('')}</tbody></table>`;
};

const ocean2PanelHtml = (ocean, index) => {
  const profile = ocean2GetProfile(ocean.id);
  if (!profile) return '';
  const dossier = [
    ['面积', profile.area],
    ['平均深度', profile.averageDepth],
    ['生态亮点', profile.ecosystem],
    ['主要威胁', profile.threats],
    ['保护重点', profile.protectionFocus],
  ];
  return `<article id="ocean-${ocean.id}" class="ocean2-explorer__layout">
    <figure class="ocean2-explorer__visual"><img src="../${profile.image}" alt="${profile.name}海域影像" loading="lazy" /></figure>
    <div class="ocean2-explorer__body">
      <div>
        <span class="ocean2-explorer__number">OCEAN ${String(index + 1).padStart(2, '0')}</span>
        <h3>${profile.name}</h3>
        <span class="ocean2-explorer__english">${profile.englishName}</span>
        <p>${profile.description}</p>
        <dl class="ocean2-explorer__dossier">${dossier.map(([label, value]) => `<div><dt>${label}</dt><dd>${value}</dd></div>`).join('')}</dl>
      </div>
      <div class="ocean2-explorer__actions">
        <small class="ocean2-explorer__source">影像来源：${ocean.imageSource}</small>
        <div class="ocean2-explorer__action-group">
          <button type="button" data-ocean-detail="${ocean.id}">查看完整档案 ↗</button>
          <a class="ocean2-explorer__home-link" href="../index.html#ocean-explore">返回首页探索地球</a>
        </div>
      </div>
    </div>
  </article>`;
};

const ocean2ShowOcean = (id, { focusTab = false } = {}) => {
  const oceans = window.LANCUN_DATA?.fiveOceans || [];
  const ocean = oceans.find((item) => item.id === id) || oceans[0];
  if (!ocean) return;
  ocean2ActiveId = ocean.id;
  const index = oceans.indexOf(ocean);

  document.querySelectorAll('[data-ocean-tabs] .ocean2-explorer__tab').forEach((tab) => {
    const selected = tab.dataset.oceanTab === ocean.id;
    tab.setAttribute('aria-selected', String(selected));
    tab.tabIndex = selected ? 0 : -1;
    if (focusTab && selected) tab.focus();
  });

  const panel = document.querySelector('[data-ocean-panel]');
  panel.innerHTML = ocean2PanelHtml(ocean, index);
  panel.setAttribute('aria-labelledby', `ocean-tab-${ocean.id}`);
  ocean2UpdateIndexHint(index);
  const img = panel.querySelector('.ocean2-explorer__visual img');
  if (img && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    img.classList.add('is-fading-in');
    img.addEventListener('animationend', () => img.classList.remove('is-fading-in'), { once: true });
  }
};

const ocean2NavigateOcean = (delta) => {
  const oceans = window.LANCUN_DATA?.fiveOceans || [];
  const index = oceans.findIndex((item) => item.id === ocean2ActiveId);
  if (index < 0) return;
  const next = (index + delta + oceans.length) % oceans.length;
  ocean2ShowOcean(oceans[next].id);
  history.replaceState(null, '', `#ocean-${oceans[next].id}`);
};

const ocean2RenderOceans = () => {
  const oceans = window.LANCUN_DATA?.fiveOceans || [];
  const tabs = document.querySelector('[data-ocean-tabs]');
  tabs.innerHTML = oceans.map((ocean, index) => `<button type="button" class="ocean2-explorer__tab" role="tab" id="ocean-tab-${ocean.id}" data-ocean-tab="${ocean.id}" aria-controls="ocean-panel" aria-selected="${index === 0}">${String(index + 1).padStart(2, '0')} ${ocean.name}</button>`).join('');
  document.querySelector('[data-ocean-panel]').id = 'ocean-panel';
  ocean2ShowOcean(ocean2DefaultOceanId());
};

const ocean2HashOcean = ({ scroll = false } = {}) => {
  ocean2ApplyOceanDeepLink({ scroll });
};

const ocean2OpenOceanProfile = (id) => {
  const profile = ocean2GetProfile(id);
  if (!profile) return;
  const dialog = document.querySelector('[data-dialog]');
  dialog.classList.remove('ocean2-dialog--sources');
  dialog.classList.add('ocean2-dialog--profile');
  dialog.querySelector('[data-dialog-eyebrow]').textContent = '完整档案';
  dialog.querySelector('[data-dialog-title]').textContent = profile.name;
  dialog.querySelector('[data-dialog-content]').innerHTML = `
    <figure class="ocean2-dialog__hero"><img src="../${profile.image}" alt="${profile.name}海域影像" loading="lazy" /></figure>
    <p class="ocean2-dialog__subtitle">${profile.englishName}</p>
    <p>${profile.description}</p>
    <dl class="ocean2-dialog__profile">
      <dt>地理范围</dt><dd>${profile.geographicRange}</dd>
      <dt>面积占比</dt><dd>${profile.area}</dd>
      <dt>平均深度</dt><dd>${profile.averageDepth}</dd>
      <dt>最深点</dt><dd>${profile.deepestPoint}</dd>
      <dt>生态系统</dt><dd>${profile.ecosystem}</dd>
      <dt>代表生物</dt><dd>${profile.keySpecies}</dd>
      <dt>主要威胁</dt><dd>${profile.threats}</dd>
      <dt>保护重点</dt><dd>${profile.protectionFocus}</dd>
    </dl>
    <p class="ocean2-dialog__source">数据来源：${profile.source}</p>`;
  dialog.showModal();
};

const ocean2DataSourcesHtml = () => `
  <p class="ocean2-dialog__intro">本页优先请求公开接口；发生超时、跨域限制或接口异常时，会自动显示项目内登记的本地演示数据。每个指标会明确标注「实时」或「本地演示」。</p>
  <section class="ocean2-dialog__group">
    <h3>观测与气候数据</h3>
    <ul>
      <li><a href="https://globalcarbonbudget.org/" target="_blank" rel="noopener noreferrer">NOAA Global Carbon Budget</a> — CO₂ 吸收趋势与碳汇摘要</li>
      <li><a href="https://coralwatch.org/" target="_blank" rel="noopener noreferrer">Coral Watch</a> — 珊瑚礁 SST / 热应力 / 白化指数</li>
      <li><a href="https://tidesandcurrents.noaa.gov/" target="_blank" rel="noopener noreferrer">NOAA CO-OPS</a> — 潮位、水温、气压（站 8518750）</li>
      <li><a href="https://www.ipcc.ch/report/sixth-assessment-report-working-group-i/" target="_blank" rel="noopener noreferrer">IPCC AR6</a> — 气候调节与海洋酸化口径</li>
    </ul>
  </section>
  <section class="ocean2-dialog__group">
    <h3>登记与影像来源</h3>
    <ul>
      <li><a href="https://oceanconservancy.org/trash-free-seas/international-coastal-cleanup/" target="_blank" rel="noopener noreferrer">Ocean Conservancy ICC</a> — 海洋垃圾与污染登记说明</li>
      <li><a href="https://www.pexels.com/" target="_blank" rel="noopener noreferrer">Pexels</a> / <a href="https://unsplash.com/" target="_blank" rel="noopener noreferrer">Unsplash</a> — 五大洋与页面影像</li>
    </ul>
  </section>
  <a class="ocean2-dialog__doc-link" href="../docs/DATA_SOURCES.md">完整清单：docs/DATA_SOURCES.md ↗</a>`;

const ocean2OpenDataSourcesModal = () => {
  const dialog = document.querySelector('[data-dialog]');
  dialog.classList.remove('ocean2-dialog--profile');
  dialog.classList.add('ocean2-dialog--sources');
  dialog.querySelector('[data-dialog-eyebrow]').textContent = '数据来源';
  dialog.querySelector('[data-dialog-title]').textContent = '公开观测与登记资料';
  dialog.querySelector('[data-dialog-content]').innerHTML = ocean2DataSourcesHtml();
  dialog.showModal();
};

const ocean2OpenDialog = (kind) => {
  if (kind === 'data') {
    ocean2OpenDataSourcesModal();
    return;
  }
  ocean2OpenOceanProfile(kind);
};

const ocean2CloseDialog = () => {
  const dialog = document.querySelector('[data-dialog]');
  dialog.classList.remove('ocean2-dialog--profile', 'ocean2-dialog--sources');
  dialog.close();
};

const ocean2PrefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const ocean2ScrollToAnchor = (id) => {
  const target = document.getElementById(id);
  if (!target) return;
  target.scrollIntoView({ behavior: ocean2PrefersReducedMotion() ? 'auto' : 'smooth', block: 'start' });
  if (typeof target.focus === 'function') target.focus({ preventScroll: true });
};

const ocean2InitSmoothAnchors = () => {
  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    const href = link.getAttribute('href');
    if (!href || href.length < 2) return;
    const id = href.slice(1);
    if (id.startsWith('ocean-')) return;
    if (!document.getElementById(id)) return;
    link.addEventListener('click', (event) => {
      event.preventDefault();
      ocean2ScrollToAnchor(id);
      history.replaceState(null, '', href);
    });
  });
};

const ocean2InitScrollProgress = () => {
  const bar = document.querySelector('[data-ocean-scroll-progress] span');
  if (!bar) return;
  const update = () => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.width = max > 0 ? `${(window.scrollY / max) * 100}%` : '0%';
  };
  update();
  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update);
};

const ocean2SetDock = () => {
  const anchors = ['hero', 'ocean-data', 'ocean-explorer', 'continue-exploring'];
  const targets = anchors.map((id) => document.getElementById(id)).filter(Boolean);
  if (!targets.length) return;
  const sectionObserver = new IntersectionObserver((entries) => {
    entries.filter((entry) => entry.isIntersecting).forEach((entry) => {
      document.querySelectorAll('[data-dock-link]').forEach((link) => {
        link.classList.toggle('is-current', link.dataset.dockLink === entry.target.id);
      });
    });
  }, { rootMargin: '-45% 0px -45% 0px', threshold: 0.01 });
  targets.forEach((target) => sectionObserver.observe(target));
};

document.addEventListener('DOMContentLoaded', () => {
  if (document.body.dataset.page !== 'ocean') return;
  const bgVideo = document.querySelector('.page-bg-video__media');
  if (bgVideo) {
    const setRate = () => { bgVideo.playbackRate = .6; };
    setRate();
    bgVideo.addEventListener('loadedmetadata', setRate);
  }
  const footerVideo = document.querySelector('.ocean2-end__bg');
  if (footerVideo) {
    const setFooterRate = () => { footerVideo.playbackRate = .6; };
    setFooterRate();
    footerVideo.addEventListener('loadedmetadata', setFooterRate);
  }
  ocean2RenderMetricSkeleton();
  ocean2RenderRole();
  ocean2RenderOceans();
  ocean2Refresh();
  ocean2SetDock();
  ocean2InitScrollProgress();
  ocean2InitSmoothAnchors();
  ocean2HashOcean({ scroll: Boolean(ocean2ResolveOceanIdFromLocation()) });

  document.querySelector('[data-refresh]')?.addEventListener('click', ocean2Refresh);
  document.querySelectorAll('[data-open-sources]').forEach((trigger) => {
    trigger.addEventListener('click', (event) => {
      if (trigger.hasAttribute('data-hero-open-data')) event.preventDefault();
      ocean2OpenDataSourcesModal();
    });
  });

  document.querySelector('[data-ocean-tabs]')?.addEventListener('click', (event) => {
    const tab = event.target.closest('[data-ocean-tab]');
    if (!tab) return;
    ocean2ShowOcean(tab.dataset.oceanTab, { focusTab: false });
    history.replaceState(null, '', `#ocean-${tab.dataset.oceanTab}`);
  });

  document.querySelector('[data-ocean-tabs]')?.addEventListener('keydown', (event) => {
    const tabs = [...event.currentTarget.querySelectorAll('[data-ocean-tab]')];
    const index = tabs.findIndex((tab) => tab.dataset.oceanTab === ocean2ActiveId);
    if (index < 0) return;
    let next = index;
    if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
    else if (event.key === 'ArrowLeft') next = (index - 1 + tabs.length) % tabs.length;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = tabs.length - 1;
    else return;
    event.preventDefault();
    ocean2ShowOcean(tabs[next].dataset.oceanTab, { focusTab: true });
    history.replaceState(null, '', `#ocean-${tabs[next].dataset.oceanTab}`);
  });

  document.querySelector('[data-ocean-panel]')?.addEventListener('click', (event) => {
    const button = event.target.closest('[data-ocean-detail]');
    if (button) ocean2OpenOceanProfile(button.dataset.oceanDetail);
  });

  document.querySelector('[data-ocean-panel]')?.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      ocean2NavigateOcean(1);
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      ocean2NavigateOcean(-1);
    }
  });

  document.querySelector('[data-ocean-prev]')?.addEventListener('click', () => ocean2NavigateOcean(-1));
  document.querySelector('[data-ocean-next]')?.addEventListener('click', () => ocean2NavigateOcean(1));

  window.addEventListener('hashchange', () => ocean2HashOcean({ scroll: false }));

  document.querySelector('[data-close-dialog]')?.addEventListener('click', ocean2CloseDialog);
  document.querySelector('[data-dialog]')?.addEventListener('close', () => {
    document.querySelector('[data-dialog]')?.classList.remove('ocean2-dialog--profile', 'ocean2-dialog--sources');
  });
  document.querySelectorAll('[data-view]').forEach((button) => button.addEventListener('click', () => {
    const table = button.dataset.view === 'table';
    document.querySelector('[data-trend-chart]').hidden = table;
    document.querySelector('[data-trend-table]').hidden = !table;
    document.querySelectorAll('[data-view]').forEach((item) => item.setAttribute('aria-selected', String(item === button)));
  }));
});
