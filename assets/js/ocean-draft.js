const OCEAN_DRAFT_CORAL_URL = 'https://api.coral.tsr.lol/stations/southeast_florida/current';
const OCEAN_DRAFT_NOAA_BASE = 'https://api.tidesandcurrents.noaa.gov/api/prod/datagetter';
const OCEAN_DRAFT_NOAA_STATION = '8518750';
const OCEAN_DRAFT_TIMEOUT = 8000;

const oceanDraftFetchJson = (url) => {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), OCEAN_DRAFT_TIMEOUT);
  return fetch(url, { signal: controller.signal })
    .then((response) => {
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response.json();
    })
    .finally(() => window.clearTimeout(timer));
};

const oceanDraftFormat = (value, digits = 1) => {
  const number = Number(value);
  return Number.isNaN(number) ? String(value) : number.toFixed(digits);
};

const oceanDraftNoaaUrl = (product, extra = '') =>
  `${OCEAN_DRAFT_NOAA_BASE}?date=today&station=${OCEAN_DRAFT_NOAA_STATION}&product=${product}&time_zone=gmt&units=metric&format=json${extra}`;

const oceanDraftLastNoaa = (payload) => {
  const rows = payload?.data;
  if (!Array.isArray(rows) || !rows.length) throw new Error('NOAA empty');
  return { value: Number(rows.at(-1).v), time: rows.at(-1).t };
};

const oceanDraftSetMetric = (id, state) => {
  const card = document.querySelector(`[data-draft-metric="${id}"]`);
  if (!card) return;
  card.querySelector('[data-value]').textContent = state.value;
  card.querySelector('[data-unit]').textContent = state.unit || '';
  const sub = card.querySelector('[data-sub]');
  sub.textContent = state.sub || '';
  sub.hidden = !state.sub;
  const status = card.querySelector('[data-status]');
  status.textContent = state.status;
  status.classList.toggle('is-live', Boolean(state.live));
  status.classList.toggle('is-demo', !state.live);
};

const oceanDraftRenderMetrics = () => {
  const cards = [
    { id: 'sst', group: 'coral', title: '海表温度', href: OCEAN_DRAFT_CORAL_URL },
    { id: 'heat-stress', group: 'coral', title: '热应力', href: OCEAN_DRAFT_CORAL_URL },
    { id: 'bleaching', group: 'coral', title: '白化相关', href: OCEAN_DRAFT_CORAL_URL },
    { id: 'tide', group: 'noaa', title: '潮位', href: 'https://api.tidesandcurrents.noaa.gov/api/prod' },
    { id: 'water-temp', group: 'noaa', title: '水温', href: 'https://api.tidesandcurrents.noaa.gov/api/prod' },
    { id: 'wind-pressure', group: 'noaa', title: '风与气压', href: 'https://api.tidesandcurrents.noaa.gov/api/prod' },
  ];
  const template = (card) => `
    <article class="ocean-draft-metric" data-draft-metric="${card.id}">
      <p class="ocean-draft-metric__status" data-status aria-live="polite">加载中…</p>
      <h3>${card.title}</h3>
      <p class="ocean-draft-metric__value"><strong data-value>—</strong> <span data-unit></span></p>
      <p class="ocean-draft-metric__sub" data-sub hidden></p>
      <a href="${card.href}" target="_blank" rel="noopener noreferrer">数据来源 ↗</a>
    </article>`;
  const coralHost = document.querySelector('[data-coral-dashboard]');
  const noaaHost = document.querySelector('[data-noaa-dashboard]');
  coralHost.innerHTML = cards.filter((card) => card.group === 'coral').map(template).join('');
  noaaHost.innerHTML = cards.filter((card) => card.group === 'noaa').map(template).join('');
};

const oceanDraftLoadCoral = async () => {
  const mock = window.LANCUN_DATA?.oceanDashboardMock?.coral;
  try {
    const data = await oceanDraftFetchJson(OCEAN_DRAFT_CORAL_URL);
    const current = data.current || {};
    oceanDraftSetMetric('sst', { value: oceanDraftFormat(current.sst_max ?? mock.sst.value, 2), unit: '°C', sub: current.date ? `观测日 ${current.date}` : '', status: '实时 · Coral Watch', live: true });
    oceanDraftSetMetric('heat-stress', { value: oceanDraftFormat(current.dhw ?? mock.heatStress.dhw, 2), unit: '°C·周', sub: `热应力 ${current.stress_level ?? '—'}`, status: '实时 · Coral Watch', live: true });
    oceanDraftSetMetric('bleaching', { value: oceanDraftFormat(current.baa_7day_max ?? mock.bleaching.baa, 2), unit: '指数', sub: `白化阈值 ${oceanDraftFormat(data.bleaching_threshold ?? mock.bleaching.threshold, 1)} °C`, status: '实时 · Coral Watch', live: true });
  } catch {
    oceanDraftSetMetric('sst', { value: oceanDraftFormat(mock.sst.value), unit: mock.sst.unit, sub: '当前为本地演示数据', status: '演示数据 · Coral Watch', live: false });
    oceanDraftSetMetric('heat-stress', { value: oceanDraftFormat(mock.heatStress.dhw), unit: mock.heatStress.dhwUnit, sub: `${mock.heatStress.stressLabel}（演示）`, status: '演示数据 · Coral Watch', live: false });
    oceanDraftSetMetric('bleaching', { value: oceanDraftFormat(mock.bleaching.baa, 2), unit: '指数', sub: `白化阈值 ${mock.bleaching.threshold} ${mock.bleaching.thresholdUnit}（演示）`, status: '演示数据 · Coral Watch', live: false });
  }
};

const oceanDraftApplyNoaaMock = () => {
  const mock = window.LANCUN_DATA?.oceanDashboardMock?.noaa;
  oceanDraftSetMetric('tide', { value: oceanDraftFormat(mock.tide.value, 2), unit: mock.tide.unit, sub: '当前为本地演示数据', status: '演示数据 · NOAA CO-OPS', live: false });
  oceanDraftSetMetric('water-temp', { value: oceanDraftFormat(mock.waterTemp.value), unit: mock.waterTemp.unit, sub: '当前为本地演示数据', status: '演示数据 · NOAA CO-OPS', live: false });
  oceanDraftSetMetric('wind-pressure', { value: oceanDraftFormat(mock.windPressure.pressure), unit: mock.windPressure.pressureUnit, sub: `风速 ${oceanDraftFormat(mock.windPressure.wind)} ${mock.windPressure.windUnit}（演示）`, status: '演示数据 · NOAA CO-OPS', live: false });
};

const oceanDraftLoadNoaa = async () => {
  try {
    const [tidePayload, tempPayload, pressurePayload] = await Promise.all([
      oceanDraftFetchJson(`${oceanDraftNoaaUrl('water_level')}&datum=MLLW`),
      oceanDraftFetchJson(oceanDraftNoaaUrl('water_temperature')),
      oceanDraftFetchJson(oceanDraftNoaaUrl('air_pressure')),
    ]);
    const tide = oceanDraftLastNoaa(tidePayload);
    const temperature = oceanDraftLastNoaa(tempPayload);
    const pressure = oceanDraftLastNoaa(pressurePayload);
    oceanDraftSetMetric('tide', { value: oceanDraftFormat(tide.value, 2), unit: 'm', sub: `更新 ${tide.time} UTC`, status: '实时 · NOAA · 8518750', live: true });
    oceanDraftSetMetric('water-temp', { value: oceanDraftFormat(temperature.value), unit: '°C', sub: `更新 ${temperature.time} UTC`, status: '实时 · NOAA · 8518750', live: true });
    oceanDraftSetMetric('wind-pressure', { value: oceanDraftFormat(pressure.value), unit: 'hPa', sub: `更新 ${pressure.time} UTC`, status: '实时 · NOAA · 8518750', live: true });
  } catch {
    oceanDraftApplyNoaaMock();
  }
};

const oceanDraftSetUpdated = (text) => {
  const node = document.querySelector('[data-dashboard-updated]');
  if (node) node.textContent = text;
};

const oceanDraftRefresh = async () => {
  oceanDraftSetUpdated('正在刷新观测数据…');
  document.querySelectorAll('[data-coral-dashboard], [data-noaa-dashboard]').forEach((element) => element.setAttribute('aria-busy', 'true'));
  await Promise.all([oceanDraftLoadCoral(), oceanDraftLoadNoaa()]);
  document.querySelectorAll('[data-coral-dashboard], [data-noaa-dashboard]').forEach((element) => element.setAttribute('aria-busy', 'false'));
  const time = new Intl.DateTimeFormat('zh-CN', { hour: '2-digit', minute: '2-digit' }).format(new Date());
  oceanDraftSetUpdated(`本次刷新 · ${time}`);
};

const oceanDraftRenderRole = () => {
  const data = window.LANCUN_DATA?.oceanRoleMetrics;
  if (!data) return;
  const [primary, ...facts] = data.cards;
  document.querySelector('[data-ocean-role-primary]').innerHTML = `
    <div class="ocean-draft-role-primary">
      <strong class="ocean-draft-role-primary__value">约 ${primary.value}${primary.unit}</strong>
      <p class="ocean-draft-role-primary__title">${primary.title}</p>
      <p class="ocean-draft-role-primary__note">${primary.note}</p>
      <a href="${primary.sourceHref}" target="_blank" rel="noopener noreferrer">来源：${primary.source} ↗</a>
    </div>`;
  document.querySelector('[data-ocean-role-facts]').innerHTML = facts.map((item, index) => `
    <article class="ocean-draft-role-fact">
      <span class="ocean-draft-role-fact__number">0${index + 1}</span>
      <h3>${item.title}</h3>
      <p>${item.note}${item.footnote ? ` · ${item.footnote}` : ''}</p>
      <strong>约 ${item.value} ${item.unit}</strong>
      <a href="${item.sourceHref}" target="_blank" rel="noopener noreferrer">${item.source} ↗</a>
    </article>`).join('');

  const trend = data.co2Trend;
  const points = trend.points;
  const width = 640; const height = 230; const pad = { top: 18, right: 18, bottom: 34, left: 46 };
  const values = points.map((point) => point.value); const min = Math.min(...values) * .95; const max = Math.max(...values) * 1.05;
  const innerWidth = width - pad.left - pad.right; const innerHeight = height - pad.top - pad.bottom;
  const x = (index) => pad.left + (innerWidth / (points.length - 1)) * index;
  const y = (value) => pad.top + innerHeight - ((value - min) / (max - min)) * innerHeight;
  const line = points.map((point, index) => `${x(index)},${y(point.value)}`).join(' ');
  document.querySelector('[data-co2-trend-chart]').innerHTML = `
    <div class="ocean-draft-trend">
      <h3>${trend.label}</h3><p class="ocean-draft-trend__meta">单位：${trend.unit} · ${trend.source}</p>
      <svg viewBox="0 0 ${width} ${height}" role="img" aria-label="${trend.label}">
        <line class="ocean-draft-trend__axis" x1="${pad.left}" y1="${pad.top + innerHeight}" x2="${width - pad.right}" y2="${pad.top + innerHeight}" />
        <polyline class="ocean-draft-trend__line" points="${line}" />
        ${points.map((point, index) => `<circle class="ocean-draft-trend__dot" cx="${x(index)}" cy="${y(point.value)}" r="4" tabindex="0"><title>${point.year}: ${point.value} ${trend.unit}</title></circle><text class="ocean-draft-trend__label" x="${x(index)}" y="${height - 9}" text-anchor="middle">${point.year}</text>`).join('')}
      </svg>
      <a href="${trend.sourceHref}" target="_blank" rel="noopener noreferrer">查看 ${trend.source} ↗</a>
    </div>`;
  document.querySelector('[data-co2-trend-table]').innerHTML = `<table><thead><tr><th scope="col">年份</th><th scope="col">吸收量（${trend.unit}）</th></tr></thead><tbody>${points.map((point) => `<tr><td>${point.year}</td><td>${point.value}</td></tr>`).join('')}</tbody></table>`;
};

const oceanDraftOceanDetails = {
  pacific: ['太平洋档案', '地理范围', '覆盖亚洲、大洋洲与美洲之间的广阔水域。', '资料索引', 'NOAA / CTI-CFF；页面指标见数据来源登记。'],
  atlantic: ['大西洋档案', '代表生态', '暖流、深海与鲸类迁徙路线共同构成其生态网络。', '资料索引', 'NOAA Fisheries / IUCN；页面指标见数据来源登记。'],
  indian: ['印度洋档案', '代表生态', '珊瑚礁、海草床与红树林为沿岸生命提供栖息地。', '资料索引', 'FAO；页面指标见数据来源登记。'],
  southern: ['南大洋档案', '代表生态', '环南极上升流支持磷虾与企鹅食物网。', '资料索引', 'CCAMLR；页面指标见数据来源登记。'],
  arctic: ['北冰洋档案', '代表生态', '海冰及其边缘水域是高纬度生态系统的重要基础。', '资料索引', 'NSIDC；页面指标见数据来源登记。'],
};

const oceanDraftRenderOceans = () => {
  const oceans = window.LANCUN_DATA?.fiveOceans || [];
  const metric = (item) => `<div class="ocean-draft-ocean__metric"><span>${item.label}</span><strong>${item.value}${item.unit ? ` ${item.unit}` : ''}</strong></div>`;
  document.querySelector('[data-five-oceans-list]').innerHTML = oceans.map((ocean, index) => `
    <article class="ocean-draft-ocean" id="ocean-${ocean.id}">
      <div class="ocean-draft-ocean__visual"><img src="../${ocean.image}" alt="${ocean.name} 实景" loading="lazy" /></div>
      <div class="ocean-draft-ocean__body">
        <span class="ocean-draft-ocean__number">OCEAN ${String(index + 1).padStart(2, '0')}</span>
        <h3>${ocean.name}</h3><span class="ocean-draft-ocean__english">${['PACIFIC','ATLANTIC','INDIAN','SOUTHERN','ARCTIC'][index]}</span>
        <p>${ocean.text}</p>
        <div class="ocean-draft-ocean__metrics">${metric(ocean.metrics.areaShare)}${metric(ocean.metrics.avgDepth)}${metric(ocean.metrics.highlight)}</div>
        <div class="ocean-draft-ocean__actions"><small class="ocean-draft-ocean__source">影像来源：${ocean.imageSource}</small><button type="button" data-open-ocean="${ocean.id}">查看完整档案 ↗</button></div>
      </div>
    </article>`).join('');
};

const oceanDraftOpenDialog = (kind) => {
  const dialog = document.querySelector('[data-ocean-dialog]');
  const title = dialog.querySelector('[data-dialog-title]');
  const eyebrow = dialog.querySelector('[data-dialog-eyebrow]');
  const content = dialog.querySelector('[data-dialog-content]');
  if (kind === 'observatory') {
    eyebrow.textContent = '数据说明'; title.textContent = '观测数据如何呈现';
    content.innerHTML = '<p>珊瑚礁指标来自 Coral Watch，沿海站指标来自 NOAA CO-OPS The Battery 8518750。页面会优先读取公开接口；连接超时、跨域或接口异常时，自动展示项目中登记的本地演示数据。</p><dl><dt>实时状态</dt><dd>接口返回成功后的数据。</dd><dt>演示状态</dt><dd>用于保证课程展示稳定的本地 mock 数据。</dd><dt>数据口径</dt><dd>具体字段、站点和来源已记录在 docs/DATA_SOURCES.md。</dd></dl>';
  } else {
    const [heading, labelOne, valueOne, labelTwo, valueTwo] = oceanDraftOceanDetails[kind];
    eyebrow.textContent = '档案摘要'; title.textContent = heading;
    content.innerHTML = `<p>此处为 UI 草稿阶段的简短档案摘要。后续可在不改变版式的前提下补充洋流、物种与地理资料。</p><dl><dt>${labelOne}</dt><dd>${valueOne}</dd><dt>${labelTwo}</dt><dd>${valueTwo}</dd><dt>完整资料</dt><dd>优先沿用本项目 DATA_SOURCES.md 中已登记的来源。</dd></dl>`;
  }
  dialog.showModal();
};

const oceanDraftInit = () => {
  document.querySelectorAll('[data-ocean-draft-video]').forEach((video) => {
    const setPlaybackRate = () => { video.playbackRate = .6; };
    setPlaybackRate();
    video.addEventListener('loadedmetadata', setPlaybackRate);
    video.addEventListener('error', () => {
      video.closest('.ocean-draft-cover__video, .ocean-draft-section-video')?.classList.add('is-failed');
    });
  });
  oceanDraftRenderMetrics(); oceanDraftRenderRole(); oceanDraftRenderOceans(); oceanDraftRefresh();
  document.querySelector('[data-refresh-dashboard]')?.addEventListener('click', oceanDraftRefresh);
  document.querySelectorAll('[data-chart-view]').forEach((button) => button.addEventListener('click', () => {
    const showTable = button.dataset.chartView === 'table';
    document.querySelector('[data-co2-trend-chart]').hidden = showTable;
    document.querySelector('[data-co2-trend-table]').hidden = !showTable;
    document.querySelectorAll('[data-chart-view]').forEach((item) => item.setAttribute('aria-selected', String(item === button)));
  }));
  document.querySelector('[data-open-info="observatory"]')?.addEventListener('click', () => oceanDraftOpenDialog('observatory'));
  document.querySelector('[data-five-oceans-list]')?.addEventListener('click', (event) => {
    const button = event.target.closest('[data-open-ocean]'); if (button) oceanDraftOpenDialog(button.dataset.openOcean);
  });
  document.querySelector('[data-close-dialog]')?.addEventListener('click', () => document.querySelector('[data-ocean-dialog]').close());
};

document.addEventListener('DOMContentLoaded', oceanDraftInit);
