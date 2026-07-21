(() => {
  const R = window.LANCUN_RESCUE;

  const sleep = (ms) => new Promise((resolve) => window.setTimeout(resolve, ms));

  const updateRefreshLabel = (time) => {
    const el = document.querySelector('[data-rescue-deck-refreshed-at]');
    const value = time || R.pageState?.lastUpdatedAt || R.formatRescueTime?.();
    if (el && value) el.textContent = value;
  };

  const initChartTabs = () => {
    const tabs = document.querySelectorAll('[data-chart-tab]');
    const panels = document.querySelectorAll('[data-rescue-chart-panel]');
    if (!tabs.length) return;

    const activate = (tabId) => {
      tabs.forEach((tab) => {
        const active = tab.dataset.chartTab === tabId;
        tab.classList.toggle('is-active', active);
        tab.setAttribute('aria-selected', active ? 'true' : 'false');
      });
      panels.forEach((panel) => {
        const show = panel.dataset.rescueChartPanel === tabId;
        panel.hidden = !show;
      });
      R.setPageState?.({ selectedChartTab: tabId });
    };

    tabs.forEach((tab) => {
      tab.addEventListener('click', () => activate(tab.dataset.chartTab));
    });

    activate(R.pageState?.selectedChartTab || 'trend');
  };

  const initRefresh = () => {
    const btn = document.querySelector('[data-rescue-deck-refresh]');
    if (!btn) return;

    btn.addEventListener('click', async () => {
      btn.disabled = true;
      btn.textContent = '刷新中…';
      try {
        await Promise.all([
          R.refreshLiveWatch?.() ?? Promise.resolve(),
          sleep(500),
        ]);
        const now = R.formatRescueTime?.() || '';
        R.setPageState?.({ lastUpdatedAt: now });
        updateRefreshLabel(now);
      } finally {
        btn.disabled = false;
        btn.textContent = '刷新观测';
      }
    });

    updateRefreshLabel();
  };

  R.initCommandDeck = () => {
    R.renderCommandDeckCharts?.();
    initChartTabs();
    initRefresh();
  };
})();
