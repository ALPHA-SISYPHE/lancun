const STATUS_EN = { ok: 'Normal', watch: 'Warning', alert: 'Critical' };

const PIE_SWATCH_CLASS = ['rescue-pie__swatch--primary', 'rescue-pie__swatch--secondary'];

const buildLineChartSvg = (trend, compact = false) => {
  if (!trend?.points?.length) return '';
  const points = trend.points;
  const width = 640;
  const height = compact ? 300 : 280;
  const pad = compact
    ? { top: 16, right: 14, bottom: 28, left: 40 }
    : { top: 20, right: 16, bottom: 36, left: 44 };
  const innerW = width - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;
  const values = points.map((p) => p.value);
  const minV = Math.min(...values) * 0.95;
  const maxV = Math.max(...values) * 1.05;
  const xStep = points.length > 1 ? innerW / (points.length - 1) : 0;
  const toX = (i) => pad.left + i * xStep;
  const toY = (v) => pad.top + innerH - ((v - minV) / (maxV - minV)) * innerH;
  const polyline = points.map((p, i) => `${toX(i)},${toY(p.value)}`).join(' ');
  const gridLines = Array.from({ length: 4 }, (_, i) => {
    const y = pad.top + (innerH / 3) * i;
    return `<line class="rescue-trend__grid" x1="${pad.left}" y1="${y}" x2="${width - pad.right}" y2="${y}" />`;
  }).join('');
  const dots = points
    .map(
      (p, i) =>
        `<circle class="rescue-trend__dot" cx="${toX(i)}" cy="${toY(p.value)}" r="4" tabindex="0" data-year="${p.year}" data-value="${p.value}" aria-label="${p.year}: ${p.value}${trend.unit}"></circle>`
    )
    .join('');
  const labels = points
    .map((p, i) => `<text class="rescue-trend__label" x="${toX(i)}" y="${height - 10}" text-anchor="middle">${p.year}</text>`)
    .join('');

  return `
    <svg viewBox="0 0 ${width} ${height}" role="img" aria-label="${trend.label}">
      ${gridLines}
      <line class="rescue-trend__axis" x1="${pad.left}" y1="${pad.top + innerH}" x2="${width - pad.right}" y2="${pad.top + innerH}" />
      <polyline class="rescue-trend__line" points="${polyline}" />
      ${dots}
      ${labels}
    </svg>`;
};

const bindTrendChartInteractions = (wrap, trend) => {
  if (!wrap || !trend) return;
  const tooltip = wrap.querySelector('.chart-tooltip');
  const dots = wrap.querySelectorAll('.rescue-trend__dot');
  if (!tooltip || !dots.length) return;

  const unit = trend.unit || '';
  let activeDot = null;

  const hideTooltip = () => {
    tooltip.classList.remove('is-visible');
    tooltip.hidden = true;
    if (activeDot) {
      activeDot.classList.remove('is-active');
      activeDot.setAttribute('r', '4');
      activeDot = null;
    }
  };

  const showTooltip = (dot) => {
    if (activeDot && activeDot !== dot) {
      activeDot.classList.remove('is-active');
      activeDot.setAttribute('r', '4');
    }
    activeDot = dot;
    dot.classList.add('is-active');
    dot.setAttribute('r', '5');

    tooltip.textContent = `${dot.dataset.year} · ${dot.dataset.value}${unit}`;
    tooltip.hidden = false;
    tooltip.classList.add('is-visible');

    const wrapRect = wrap.getBoundingClientRect();
    const dotRect = dot.getBoundingClientRect();
    tooltip.style.left = `${dotRect.left + dotRect.width / 2 - wrapRect.left}px`;
    tooltip.style.top = `${dotRect.top - wrapRect.top - 8}px`;
  };

  dots.forEach((dot) => {
    dot.addEventListener('mouseenter', () => showTooltip(dot));
    dot.addEventListener('focus', () => showTooltip(dot));
    dot.addEventListener('mouseleave', hideTooltip);
    dot.addEventListener('blur', hideTooltip);
  });
};

const renderTrendTab = (host, trend) => {
  if (!host || !trend?.points?.length) return;
  const meta = `单位：${trend.unit} · ${trend.source}${trend.footnote ? ` · ${trend.footnote}` : ''}`;
  host.innerHTML = `
    <div class="trend-tab__copy">
      <h3>${trend.label}</h3>
      <p class="trend-tab__meta">${meta}</p>
    </div>
    <div class="trend-tab__chart">
      <div class="chart-canvas-wrap">
        <div class="rescue-trend">${buildLineChartSvg(trend)}</div>
        <div class="chart-tooltip" hidden role="tooltip"></div>
      </div>
    </div>`;

  bindTrendChartInteractions(host.querySelector('.chart-canvas-wrap'), trend);
};

const renderLineChart = (host, trend) => {
  renderTrendTab(host, trend);
};

const renderCompositionTab = (host, charts) => {
  const pie = charts?.pie;
  const bar = charts?.bar;
  if (!host || !pie?.slices?.length || !bar?.rows?.length) return;

  const plastic = pie.slices.find((s) => s.label === '塑料')?.value ?? 85;
  host.innerHTML = `
    <div class="composition-tab__ring">
      <h3 class="composition-tab__title">${pie.label}</h3>
      <div class="rescue-pie">
        <div class="rescue-pie__ring" style="--ring-plastic: ${plastic}%" role="img" aria-label="塑料 ${plastic}%，其它 ${100 - plastic}%"></div>
        <ul class="rescue-pie__legend">
          ${pie.slices
            .map(
              (s, i) =>
                `<li><span class="rescue-pie__swatch ${PIE_SWATCH_CLASS[i] || 'rescue-pie__swatch--secondary'}"></span>${s.label} ${s.value}%</li>`
            )
            .join('')}
        </ul>
      </div>
    </div>
    <div class="composition-tab__bars">
      <h3 class="composition-tab__title">${bar.label}</h3>
      <div class="rescue-bar">
        ${bar.rows
          .map(
            (row) => `
          <div class="chart-row">
            <span class="chart-row__label">${row.label}</span>
            <div class="chart-track"><div class="chart-fill" style="width:${row.value}%"></div></div>
            <strong class="chart-row__value">${row.value}%</strong>
          </div>`
          )
          .join('')}
      </div>
    </div>`;
};

const renderPieChart = (host, pie) => {
  if (!host || !pie?.slices?.length) return;
  const plastic = pie.slices.find((s) => s.label === '塑料')?.value ?? 85;
  host.innerHTML = `
    <div class="composition-tab__ring">
      <h3 class="composition-tab__title">${pie.label}</h3>
      <div class="rescue-pie">
        <div class="rescue-pie__ring" style="--ring-plastic: ${plastic}%" role="img" aria-label="塑料 ${plastic}%，其它 ${100 - plastic}%"></div>
        <ul class="rescue-pie__legend">
          ${pie.slices
            .map(
              (s, i) =>
                `<li><span class="rescue-pie__swatch ${PIE_SWATCH_CLASS[i] || 'rescue-pie__swatch--secondary'}"></span>${s.label} ${s.value}%</li>`
            )
            .join('')}
        </ul>
      </div>
    </div>`;
};

const renderBarChart = (host, bar) => {
  if (!host || !bar?.rows?.length) return;
  host.innerHTML = `
    <div class="composition-tab__bars">
      <h3 class="composition-tab__title">${bar.label}</h3>
      <div class="rescue-bar">
        ${bar.rows
          .map(
            (row) => `
          <div class="chart-row">
            <span class="chart-row__label">${row.label}</span>
            <div class="chart-track"><div class="chart-fill" style="width:${row.value}%"></div></div>
            <strong class="chart-row__value">${row.value}%</strong>
          </div>`
          )
          .join('')}
      </div>
    </div>`;
};

const renderSourcesTab = (host, sources) => {
  if (!host) return;
  const data = window.LANCUN_DATA;
  const deckItems = sources?.length ? sources : data?.rescueDeckSources;
  const items = deckItems?.length
    ? [...deckItems]
    : [
        { name: 'UNEP', href: 'https://www.unep.org/', note: '海洋塑料与污染全球评估' },
        { name: 'NOAA', href: 'https://www.noaa.gov/', note: 'CO-OPS 水质监测与海水酸化' },
        { name: 'IPCC', href: 'https://www.ipcc.ch/', note: '珊瑚白化与气候压力' },
        { name: 'Ocean Conservancy ICC', href: 'https://oceanconservancy.org/', note: '国际海岸清洁与垃圾组成' },
        { name: 'OpenAQ', href: 'https://openaq.org/', note: '沿海 PM2.5 公开观测' },
      ];
  const docHref = data?.rescueDataSourcesCatalog?.docHref || '../docs/DATA_SOURCES.md';
  items.push({ name: 'docs/DATA_SOURCES.md', href: docHref, note: '本项目数据说明文件' });

  host.innerHTML = `
    <div class="sources-grid">
      ${items
        .map(
          (item) => `
        <div class="sources-grid__item">
          <a class="sources-grid__name" href="${item.href}" target="_blank" rel="noopener noreferrer">${item.name}</a>
          <span class="sources-grid__note">${item.note || ''}</span>
        </div>`
        )
        .join('')}
    </div>`;
};

const renderSourcesDialog = (host, sources) => {
  if (!host) return;
  const data = window.LANCUN_DATA;
  const items = sources?.length ? sources : data?.rescueDeckSources;
  const topics = data?.rescueEducation?.topics || [];
  const list = items?.length
    ? items
    : topics.map((t) => ({ name: t.sourceLabel || t.title, href: t.sourceHref, note: t.text?.slice(0, 80) }));
  host.innerHTML = `
    <ul class="rescue-data-dialog__list">
      ${list
        .map(
          (item) => `
        <li>
          <strong><a href="${item.href}" target="_blank" rel="noopener noreferrer">${item.name}</a></strong>
          <p>${item.note || ''}</p>
        </li>`
        )
        .join('')}
    </ul>`;
};

const renderPressurePanel = (pressure) => {
  const host = document.querySelector('[data-rescue-pressure-panel]');
  if (!host || !pressure) return;
  const rows = pressure.rows || [];
  host.className = 'pressure-panel';
  host.innerHTML = `
    <span class="pressure-panel__label">Ocean Pressure Index</span>
    <p class="pressure-panel__value">${pressure.value} / ${pressure.level}</p>
    <ul class="pressure-panel__rows">
      ${rows
        .map(
          (row) => `
        <li class="pressure-panel__row">
          <span class="pressure-panel__row-label">${row.label}</span>
          <span class="pressure-panel__row-status is-${row.status || 'ok'}">${row.statusLabel}</span>
        </li>`
        )
        .join('')}
    </ul>`;
};

const renderOverviewSummary = (pressure) => {
  const host = document.querySelector('[data-rescue-pressure-axis]');
  if (!host || !pressure) return;
  host.className = 'pressure-summary-panel__head';
  host.innerHTML = `
    <h3 class="pressure-summary-panel__title">污染压力总览</h3>
    <p class="pressure-summary-panel__index">${pressure.value} / ${pressure.level}</p>
    <p class="pressure-summary-panel__risk">${pressure.riskSummary || '污染压力正在从局部问题转向系统性风险。'}</p>`;
};

const renderMetricMatrix = (metrics) => {
  const host = document.querySelector('[data-rescue-risk-matrix]');
  if (!host || !metrics?.length) return;

  host.innerHTML = metrics
    .map((m) => {
      const level = m.status || 'ok';
      const statusText = m.statusLabel || STATUS_EN[level] || 'Normal';
      return `
    <article class="risk-row">
      <div class="risk-row__main">
        <h4 class="risk-row__title">${m.title}</h4>
        <p class="risk-row__value">${m.value}${m.unit ? `<span> ${m.unit}</span>` : ''}</p>
      </div>
      <div class="risk-row__meta">
        <span class="status-pill status-pill--${level}">${statusText}</span>
        ${m.trend ? `<span class="risk-row__trend">${m.trend}</span>` : ''}
        <a class="risk-row__source" href="${m.sourceHref}" target="_blank" rel="noopener noreferrer">${m.source}</a>
      </div>
    </article>`;
    })
    .join('');
  host.setAttribute('aria-busy', 'false');
};

const renderHeroRibbon = (pressure) => {
  const host = document.querySelector('[data-rescue-hero-ribbon]');
  if (!host || !pressure) return;

  const cells = [
    { label: 'Pressure', value: `${pressure.level} / ${pressure.value}` },
    { label: 'Active Stations', value: String(pressure.activeStations ?? '—') },
    { label: 'Critical Sources', value: String(pressure.criticalSources ?? '—') },
    { label: 'Last Update', value: pressure.updatedTime || pressure.updatedAt || '—' },
    { label: 'Data Mode', value: pressure.dataMode || 'Mock / Local' },
  ];

  host.innerHTML = cells
    .map(
      (cell) => `
    <div class="hero-ribbon__cell">
      <span class="hero-ribbon__label">${cell.label}</span>
      <span class="hero-ribbon__value">${cell.value}</span>
    </div>`
    )
    .join('');
};

const renderSourcesSummary = (host, sources) => {
  if (!host) return;
  const data = window.LANCUN_DATA;
  const items = sources?.length ? sources : data?.rescueDeckSources;
  const docHref = data?.rescueDataSourcesCatalog?.docHref || '../docs/DATA_SOURCES.md';
  const sep = '<span class="insight-source-row__sep" aria-hidden="true"> · </span>';
  const label = '<span class="insight-source-row__label">数据参考：</span>';
  const docLink = `<a class="insight-source-row__link" href="${docHref}">docs/DATA_SOURCES.md</a>`;

  if (!items?.length) {
    host.innerHTML = `${label}UNEP · NOAA · IPCC · Ocean Conservancy ICC · OpenAQ · ${docLink}`;
    return;
  }

  const links = items
    .map(
      (item) =>
        `<a class="insight-source-row__link" href="${item.href}" target="_blank" rel="noopener noreferrer">${item.name}</a>`
    )
    .join(sep);

  host.innerHTML = `${label}${links}${sep}${docLink}`;
};

const renderDataInsightsPanel = () => {
  const trendCard = document.querySelector('[data-rescue-trend-card]');
  const compositionCard = document.querySelector('[data-rescue-composition-card]');
  const sourceCard = document.querySelector('[data-rescue-source-structure-card]');
  const data = window.LANCUN_DATA;
  if (!trendCard || !compositionCard || !sourceCard || !data) return;

  const trend = data.rescueCharts?.line;
  const pie = data.rescueCharts?.pie;
  const bar = data.rescueCharts?.bar;
  if (!trend?.points?.length || !pie?.slices?.length || !bar?.rows?.length) return;

  const plastic = pie.slices.find((s) => s.label === '塑料')?.value ?? 85;
  const meta = `单位：${trend.unit} · ${trend.source}${trend.footnote ? ` · ${trend.footnote}` : ''}`;

  trendCard.innerHTML = `
    <h4 class="insight-card__title">${trend.label}</h4>
    <p class="insight-card__meta">${meta}</p>
    <div class="chart-canvas-wrap trend-chart-card__canvas">
      <div class="rescue-trend">${buildLineChartSvg(trend, true)}</div>
      <div class="chart-tooltip" hidden role="tooltip"></div>
    </div>`;

  compositionCard.innerHTML = `
    <h4 class="insight-card__title">${pie.label}</h4>
    <p class="insight-card__source">${pie.source}</p>
    <div class="rescue-pie rescue-pie--compact composition-card__ring">
      <div class="rescue-pie__ring" style="--ring-plastic: ${plastic}%" role="img" aria-label="塑料 ${plastic}%，其它 ${100 - plastic}%"></div>
      <ul class="rescue-pie__legend">
        ${pie.slices
          .map(
            (s, i) =>
              `<li><span class="rescue-pie__swatch ${PIE_SWATCH_CLASS[i] || 'rescue-pie__swatch--secondary'}"></span><span class="rescue-pie__legend-label">${s.label}</span><span class="rescue-pie__legend-value">${s.value}%</span></li>`
          )
          .join('')}
      </ul>
    </div>`;

  sourceCard.innerHTML = `
    <h4 class="insight-card__title">${bar.label}</h4>
    <p class="insight-card__source">${bar.source}</p>
    <div class="rescue-bar rescue-bar--compact insight-source-bars">
      ${bar.rows
        .map(
          (row) => `
        <div class="chart-row">
          <span class="chart-row__label">${row.label}</span>
          <div class="chart-track"><div class="chart-fill" style="width:${row.value}%"></div></div>
          <span class="chart-row__value">${row.value}%</span>
        </div>`
        )
        .join('')}
    </div>`;

  bindTrendChartInteractions(trendCard.querySelector('.trend-chart-card__canvas'), trend);
  renderSourcesSummary(document.querySelector('[data-rescue-sources-summary]'), data.rescueDeckSources);
};

const renderCommandDeckCharts = () => {
  renderDataInsightsPanel();
};

window.LANCUN_RESCUE.renderPollutionOverview = () => {
  const data = window.LANCUN_DATA;
  if (!data) return;

  renderPressurePanel(data.rescuePressureIndex);
  renderHeroRibbon(data.rescuePressureIndex);
  renderOverviewSummary(data.rescuePressureIndex);
  renderMetricMatrix(data.rescueStaticMetrics || []);
  renderDataInsightsPanel();
};

Object.assign(window.LANCUN_RESCUE, {
  renderTrendTab,
  renderCompositionTab,
  renderDataInsightsPanel,
  renderLineChart,
  renderPieChart,
  renderBarChart,
  renderSourcesTab,
  renderSourcesSummary,
  renderSourcesDialog,
  renderCommandDeckCharts,
});
