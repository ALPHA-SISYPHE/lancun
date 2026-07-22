(() => {
  const {
    LIVE_CONFIG,
    STRIP_METRICS,
    STATUS_LABELS,
    NOAA_DOCS,
    OPENAQ_DOCS,
    openaqProxyUrl,
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
          waterLevel: display.waterLevel ?? null,
          airPressure: display.airPressure ?? null,
          temperature: display.temperature ?? null,
          pm25: display.pm25 ?? null,
        },
        trends: {
          waterLevel: trends.waterLevel || 'flat',
          airPressure: trends.airPressure || 'flat',
          temperature: trends.temperature || 'flat',
          pm25: trends.pm25 || 'flat',
        },
        metricDemo: {
          waterLevel: cfg.metricKey !== 'waterLevel',
          airPressure: cfg.metricKey !== 'airPressure',
          temperature: cfg.metricKey !== 'temperature',
          pm25: cfg.metricKey !== 'pm25',
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
      host.className = 'station-panel monitor-station-bar';
      host.innerHTML = `<p class="station-panel__empty">暂无实时数据，展示最近一次观测记录。</p>`;
      host.setAttribute('aria-busy', 'false');
      return;
    }

    const { config, live, updatedAt, sourceUrl, statusLevel } = state;
    const level = statusLevel || 'ok';

    host.className = 'station-panel monitor-station-bar';
    host.innerHTML = `
      <div class="station-panel__primary">
        <h3>${config.label}</h3>
        <p class="station-panel__coords">${formatLonLat(config.lat, config.lon)}</p>
        <p class="station-panel__meta">
          ${live ? '实时' : '暂无实时数据，展示最近一次观测'} · ${updatedAt || '—'}
        </p>
      </div>
      <div class="station-panel__aside">
        <span class="status-pill status-pill--${level}">${STATUS_LABELS[level]}</span>
        <a class="station-panel__source" href="${sourceUrl}" target="_blank" rel="noopener noreferrer">NOAA / OpenAQ</a>
      </div>`;
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
      const url = `${openaqProxyUrl()}?lat=${config.lat}&lon=${config.lon}`;
      const payload = await fetchJson(url);
      if (payload?.value == null || Number.isNaN(Number(payload.value))) throw new Error('OpenAQ empty');
      const value = Number(payload.value);
      const level = config.evaluate(value);
      return {
        value,
        statusLevel: level,
        updatedAt: payload.updatedAt ? `${payload.updatedAt} UTC` : '—',
        sourceUrl: payload.sourceUrl || OPENAQ_DOCS,
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
