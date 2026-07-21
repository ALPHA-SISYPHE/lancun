(() => {
  const {
    LIVE_CONFIG,
    STRIP_METRICS,
    STATUS_LABELS,
    NOAA_DOCS,
    OPENAQ_DOCS,
    formatNum,
    lonLatToSvg,
    fetchJson,
    latestNoaaValue,
    noaaStationUrl,
  } = window.LANCUN_RESCUE;

  const TREND_ARROW = { up: '↑', down: '↓', flat: '→' };
  const FILTER_OPTIONS = [
    { id: 'all', label: 'All' },
    { id: 'ok', label: 'Normal' },
    { id: 'watch', label: 'Warning' },
    { id: 'alert', label: 'Critical' },
  ];
  const stationState = new Map();
  let activeLiveId = 'A';
  let filterLevel = 'all';

  const getMockPoint = (id) =>
    window.LANCUN_DATA?.rescueLiveMock?.points?.find((p) => p.id === id);

  const initStationState = () => {
    LIVE_CONFIG.forEach((cfg) => {
      const mock = getMockPoint(cfg.id);
      const display = mock?.displayMetrics || {};
      const trends = mock?.metricTrends || {};
      stationState.set(cfg.id, {
        config: cfg,
        live: false,
        updatedAt: mock?.updatedAt || '—',
        sourceUrl: mock?.sourceUrl || NOAA_DOCS,
        statusLevel: mock?.statusLevel || 'ok',
        metrics: {
          ph: display.ph ?? null,
          temperature: display.temperature ?? null,
          salinity: display.salinity ?? null,
          pm25: display.pm25 ?? null,
          dissolvedOxygen: display.dissolvedOxygen ?? null,
        },
        trends: {
          ph: trends.ph || 'flat',
          temperature: trends.temperature || 'flat',
          salinity: trends.salinity || 'flat',
          pm25: trends.pm25 || 'flat',
        },
        metricDemo: {
          ph: cfg.metricKey !== 'ph',
          temperature: true,
          salinity: cfg.metricKey !== 'salinity',
          pm25: cfg.metricKey !== 'pm25',
          dissolvedOxygen: cfg.metricKey !== 'dissolvedOxygen',
        },
      });
    });
  };

  const applyPrimaryReading = (id, reading) => {
    const state = stationState.get(id);
    if (!state) return;
    const key = state.config.metricKey;
    state.metrics[key] = reading.value;
    state.metricDemo[key] = !reading.live;
    state.live = reading.live;
    state.updatedAt = reading.updatedAt || state.updatedAt;
    state.sourceUrl = reading.sourceUrl || state.sourceUrl;
    state.statusLevel = reading.statusLevel || state.statusLevel;
  };

  const evaluateMetricLevel = (key, value) => {
    if (value == null || Number.isNaN(Number(value))) return 'ok';
    const cfg = LIVE_CONFIG.find((c) => c.metricKey === key);
    if (cfg?.evaluate) return cfg.evaluate(Number(value));
    if (key === 'temperature') return Number(value) > 28 ? 'watch' : 'ok';
    return 'ok';
  };

  const formatMetricValue = (key, value) => {
    if (value == null) return '—';
    const strip = STRIP_METRICS.find((m) => m.key === key);
    return formatNum(value, strip?.digits ?? 1);
  };

  const formatLonLat = (lat, lon) => {
    const latDir = lat >= 0 ? 'N' : 'S';
    const lonDir = lon >= 0 ? 'E' : 'W';
    return `${Math.abs(lat).toFixed(2)}°${latDir}, ${Math.abs(lon).toFixed(2)}°${lonDir}`;
  };

  const pinMatchesFilter = (id) => {
    if (filterLevel === 'all') return true;
    const level = stationState.get(id)?.statusLevel || 'ok';
    return level === filterLevel;
  };

  const firstVisibleId = () => LIVE_CONFIG.find((cfg) => pinMatchesFilter(cfg.id))?.id || 'A';

  const applyPinFilter = () => {
    document.querySelectorAll('[data-rescue-map-pins] .rescue-watch__pin').forEach((pin) => {
      const visible = pinMatchesFilter(pin.dataset.pointId);
      pin.classList.toggle('is-filtered-out', !visible);
    });
    if (!pinMatchesFilter(activeLiveId)) {
      setActiveLivePoint(firstVisibleId());
    }
  };

  const renderStatusFilter = () => {
    const host = document.querySelector('[data-rescue-status-filter]');
    if (!host) return;

    host.innerHTML = FILTER_OPTIONS.map(
      (opt) =>
        `<button type="button" class="monitor-filter-btn" data-filter-level="${opt.id}" aria-pressed="${filterLevel === opt.id ? 'true' : 'false'}">${opt.label}</button>`
    ).join('');

    host.querySelectorAll('[data-filter-level]').forEach((btn) => {
      btn.addEventListener('click', () => {
        filterLevel = btn.dataset.filterLevel || 'all';
        host.querySelectorAll('[data-filter-level]').forEach((b) => {
          b.setAttribute('aria-pressed', b.dataset.filterLevel === filterLevel ? 'true' : 'false');
        });
        window.LANCUN_RESCUE.setPageState?.({ selectedRiskFilter: filterLevel });
        applyPinFilter();
      });
    });
  };

  const renderDetail = () => {
    const host = document.querySelector('[data-rescue-station-detail]');
    if (!host) return;

    const state = stationState.get(activeLiveId);
    if (!state) {
      host.innerHTML = `<p class="station-panel__empty">暂无实时数据，展示最近一次观测记录。</p>`;
      host.setAttribute('aria-busy', 'false');
      return;
    }

    const { config, live, updatedAt, sourceUrl, statusLevel, metrics, metricDemo } = state;
    const level = statusLevel || 'ok';
    const detailRows = [
      { key: 'ph', label: 'pH', value: metrics.ph, demo: metricDemo.ph, unit: '' },
      { key: 'temperature', label: '温度', value: metrics.temperature, demo: metricDemo.temperature, unit: '°C' },
      { key: 'salinity', label: '盐度', value: metrics.salinity, demo: metricDemo.salinity, unit: 'PSU' },
      { key: 'pm25', label: 'PM2.5', value: metrics.pm25, demo: metricDemo.pm25, unit: 'µg/m³' },
    ];

    host.className = 'station-panel';
    host.innerHTML = `
      <div class="station-panel__head">
        <div>
          <h3>${config.label}</h3>
          <p class="station-panel__coords">${formatLonLat(config.lat, config.lon)}</p>
        </div>
        <span class="status-pill status-pill--${level}">${STATUS_LABELS[level]}</span>
      </div>
      <p class="station-panel__meta">
        ${live ? '实时' : '暂无实时数据，展示最近一次观测'} · ${updatedAt || '—'}
      </p>
      <dl class="station-panel__metrics">
        ${detailRows
          .map(
            (row) => `
          <div class="station-panel__row">
            <dt>${row.label}</dt>
            <dd>
              ${formatMetricValue(row.key, row.value)}${row.value != null && row.unit ? ` ${row.unit}` : ''}
              ${row.demo || row.value == null ? '<small>最近一次观测</small>' : ''}
            </dd>
          </div>`
          )
          .join('')}
      </dl>
      <a class="station-panel__source" href="${sourceUrl}" target="_blank" rel="noopener noreferrer">NOAA / OpenAQ</a>`;
    host.setAttribute('aria-busy', 'false');
  };

  const renderMetricStrip = () => {
    const host = document.querySelector('[data-rescue-metric-strip]');
    if (!host) return;
    const state = stationState.get(activeLiveId);
    if (!state) {
      host.innerHTML = `<div class="monitor-metrics__cell"><span class="monitor-metrics__label">状态</span><span class="monitor-metrics__value">暂无实时数据</span></div>`;
      return;
    }

    host.className = 'monitor-metrics';
    host.innerHTML = STRIP_METRICS.map((m) => {
      const value = state.metrics[m.key];
      const level = evaluateMetricLevel(m.key, value);
      const isPrimary = state.config.metricKey === m.key;
      const arrow = TREND_ARROW[state.trends[m.key] || 'flat'] || '→';
      return `
      <div class="monitor-metrics__cell${isPrimary ? ' is-active-metric' : ''}">
        <span class="monitor-metrics__label">${m.label}</span>
        <span class="monitor-metrics__value">
          ${formatMetricValue(m.key, value)}${value != null && m.unit ? ` ${m.unit}` : ''}
          <span class="trend-arrow" aria-hidden="true">${arrow}</span>
        </span>
        <span class="monitor-metrics__status monitor-metrics__status--${level}">${STATUS_LABELS[level]}</span>
      </div>`;
    }).join('');
  };

  const setActiveLivePoint = (id) => {
    activeLiveId = id;
    window.LANCUN_RESCUE.setPageState?.({ selectedStation: id });
    document.querySelectorAll('[data-rescue-map-pins] .rescue-watch__pin').forEach((pin) => {
      pin.classList.toggle('is-active', pin.dataset.pointId === id);
      pin.setAttribute('aria-pressed', pin.dataset.pointId === id ? 'true' : 'false');
    });
    renderDetail();
    renderMetricStrip();
  };

  const renderMapPins = () => {
    const pinsHost = document.querySelector('[data-rescue-map-pins]');
    if (!pinsHost) return;

    pinsHost.innerHTML = LIVE_CONFIG.map((cfg) => {
      const { x, y } = lonLatToSvg(cfg.lon, cfg.lat);
      const state = stationState.get(cfg.id);
      const level = state?.statusLevel || 'ok';
      return `
      <g class="rescue-watch__pin rescue-watch__pin--${level}" data-point-id="${cfg.id}" role="button" tabindex="0" aria-label="${cfg.label} · ${STATUS_LABELS[level]}" aria-pressed="${cfg.id === activeLiveId}">
        <title>${cfg.label} · ${STATUS_LABELS[level]}</title>
        <circle class="rescue-watch__pin-pulse" cx="${x}" cy="${y}" r="8"/>
        <circle class="rescue-watch__pin-core" cx="${x}" cy="${y}" r="8"/>
        <text class="rescue-watch__pin-label" x="${x + 10}" y="${y + 4}">${cfg.label}</text>
      </g>`;
    }).join('');

    pinsHost.querySelectorAll('.rescue-watch__pin').forEach((pin) => {
      pin.addEventListener('click', () => setActiveLivePoint(pin.dataset.pointId));
      pin.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          setActiveLivePoint(pin.dataset.pointId);
        }
      });
    });

    applyPinFilter();
  };

  const fetchLiveData = async () => {
    await Promise.all(
      LIVE_CONFIG.map(async (config) => {
        try {
          const reading =
            config.type === 'openaq' ? await fetchOpenAqPoint(config) : await fetchNoaaPoint(config);
          applyPrimaryReading(config.id, reading);
        } catch {
          const mock = getMockPoint(config.id);
          if (mock) {
            applyPrimaryReading(config.id, {
              value: mock.value,
              statusLevel: mock.statusLevel,
              updatedAt: mock.updatedAt,
              sourceUrl: mock.sourceUrl,
              live: false,
            });
          }
        }
      })
    );
  };

  const fetchNoaaPoint = async (config) => {
    const mock = getMockPoint(config.id);
    try {
      const payload = await fetchJson(noaaStationUrl(config.station, config.product));
      const latest = latestNoaaValue(payload);
      const level = config.evaluate(latest.value);
      return {
        value: latest.value,
        statusLevel: level,
        updatedAt: `${latest.time} UTC`,
        sourceUrl: NOAA_DOCS,
        live: true,
      };
    } catch {
      if (!mock) throw new Error('no mock');
      return {
        value: mock.value,
        statusLevel: mock.statusLevel,
        updatedAt: mock.updatedAt,
        sourceUrl: mock.sourceUrl || NOAA_DOCS,
        live: false,
      };
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
        statusLevel: level,
        updatedAt: measurement.lastUpdated || result.lastUpdated || '—',
        sourceUrl: OPENAQ_DOCS,
        live: true,
      };
    } catch {
      if (!mock) throw new Error('no mock');
      return {
        value: mock.value,
        statusLevel: mock.statusLevel,
        updatedAt: mock.updatedAt,
        sourceUrl: mock.sourceUrl || OPENAQ_DOCS,
        live: false,
      };
    }
  };

  window.LANCUN_RESCUE.initLiveWatch = async () => {
    initStationState();
    renderStatusFilter();
    renderMapPins();
    setActiveLivePoint('A');

    await fetchLiveData();

    renderMapPins();
    setActiveLivePoint(activeLiveId);
  };

  window.LANCUN_RESCUE.refreshLiveWatch = async () => {
    await fetchLiveData();
    renderMapPins();
    setActiveLivePoint(activeLiveId);
  };
})();
