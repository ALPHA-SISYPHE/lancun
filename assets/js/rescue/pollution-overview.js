const STATUS_EN = { ok: 'Normal', watch: 'Warning', alert: 'Critical' };

const renderLineChart = (host, trend) => {
  if (!host || !trend?.points?.length) return;
  const points = trend.points;
  const width = 640;
  const height = 140;
  const pad = { top: 12, right: 12, bottom: 24, left: 36 };
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
    <h3>${trend.label}</h3>
    <p class="chart-frame__meta">单位：${trend.unit} · ${trend.source}${trend.footnote ? ` · ${trend.footnote}` : ''}</p>
    <div class="rescue-trend">
      <svg viewBox="0 0 ${width} ${height}" role="img" aria-label="${trend.label}">
        <line class="rescue-trend__axis" x1="${pad.left}" y1="${pad.top + innerH}" x2="${width - pad.right}" y2="${pad.top + innerH}" />
        <polyline class="rescue-trend__line" points="${polyline}" />
        ${dots}
        ${labels}
      </svg>
    </div>
    <a href="${trend.sourceHref}" target="_blank" rel="noopener noreferrer">查看 ${trend.source}</a>`;
};

const renderPieChart = (host, pie) => {
  if (!host || !pie?.slices?.length) return;
  const plastic = pie.slices.find((s) => s.label === '塑料')?.value ?? 85;
  host.innerHTML = `
    <h3>${pie.label}</h3>
    <p class="chart-frame__meta">${pie.source}</p>
    <div class="rescue-pie">
      <div class="rescue-pie__ring" style="background: conic-gradient(#4da3ff 0 ${plastic}%, rgba(255,255,255,0.15) ${plastic}% 100%)" role="img" aria-label="塑料 ${plastic}%，其它 ${100 - plastic}%"></div>
      <ul class="rescue-pie__legend">
        ${pie.slices
          .map(
            (s, i) =>
              `<li><span class="rescue-pie__swatch" style="background:${i === 0 ? '#4da3ff' : 'rgba(255,255,255,0.2)'}"></span>${s.label} ${s.value}%</li>`
          )
          .join('')}
      </ul>
    </div>
    <a href="${pie.sourceHref}" target="_blank" rel="noopener noreferrer">${pie.source}</a>`;
};

const renderBarChart = (host, bar) => {
  if (!host || !bar?.rows?.length) return;
  host.innerHTML = `
    <h3>${bar.label}</h3>
    <p class="chart-frame__meta">${bar.source}</p>
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
};

const renderSourcesTab = (host, sources) => {
  if (!host) return;
  const items = sources?.length
    ? sources
    : [
        { name: 'UNEP', href: 'https://www.unep.org/', note: '海洋塑料与污染评估' },
        { name: 'NOAA', href: 'https://www.noaa.gov/', note: '海水酸化与 CO-OPS 监测' },
        { name: 'IPCC', href: 'https://www.ipcc.ch/', note: '珊瑚白化与气候压力' },
        { name: 'Ocean Conservancy', href: 'https://oceanconservancy.org/', note: 'ICC 海岸清洁数据' },
        { name: 'OpenAQ', href: 'https://openaq.org/', note: '沿海 PM2.5 观测' },
      ];
  host.innerHTML = `
    <ul class="command-sources-list">
      ${items
        .map(
          (item) => `
        <li>
          <a href="${item.href}" target="_blank" rel="noopener noreferrer">${item.name}</a>
          <span>${item.note || ''}</span>
        </li>`
        )
        .join('')}
    </ul>
    <a class="command-sources-list__doc" href="../docs/DATA_SOURCES.md">docs/DATA_SOURCES.md</a>`;
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

const renderCommandDeckCharts = () => {
  const data = window.LANCUN_DATA;
  if (!data) return;

  const lineHost = document.querySelector('[data-rescue-line-chart]');
  renderLineChart(lineHost, data.rescueCharts?.line);

  renderPieChart(document.querySelector('[data-rescue-pie-chart]'), data.rescueCharts?.pie);
  renderBarChart(document.querySelector('[data-rescue-bar-chart]'), data.rescueCharts?.bar);
  renderSourcesTab(document.querySelector('[data-rescue-sources-tab]'), data.rescueDeckSources);
};

window.LANCUN_RESCUE.renderPollutionOverview = () => {
  const data = window.LANCUN_DATA;
  if (!data) return;

  renderPressurePanel(data.rescuePressureIndex);
  renderHeroRibbon(data.rescuePressureIndex);
  renderOverviewSummary(data.rescuePressureIndex);
  renderMetricMatrix(data.rescueStaticMetrics || []);
};

Object.assign(window.LANCUN_RESCUE, {
  renderLineChart,
  renderPieChart,
  renderBarChart,
  renderSourcesTab,
  renderSourcesDialog,
  renderCommandDeckCharts,
});
