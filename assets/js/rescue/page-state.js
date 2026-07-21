(() => {
  const R = window.LANCUN_RESCUE;

  const formatRescueTime = (date = new Date()) => {
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  };

  const getInitialUpdatedAt = () => {
    const mockTime = window.LANCUN_DATA?.rescuePressureIndex?.updatedTime;
    return mockTime || formatRescueTime();
  };

  R.pageState = {
    selectedStation: 'A',
    selectedSource: 0,
    selectedChartTab: 'trend',
    selectedRiskFilter: 'all',
    lastUpdatedAt: null,
    isSourceModalOpen: false,
    isDataSourcesOpen: false,
  };

  R.formatRescueTime = formatRescueTime;

  R.getPageState = () => ({ ...R.pageState });

  R.setPageState = (patch) => {
    if (!patch || typeof patch !== 'object') return R.getPageState();
    Object.assign(R.pageState, patch);
    return R.getPageState();
  };

  R.initPageState = () => {
    R.setPageState({ lastUpdatedAt: getInitialUpdatedAt() });
    const el = document.querySelector('[data-rescue-deck-refreshed-at]');
    if (el) el.textContent = R.pageState.lastUpdatedAt;
  };
})();
