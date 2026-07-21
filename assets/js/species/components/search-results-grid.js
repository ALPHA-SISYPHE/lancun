/**
 * 搜索结果网格（Phase 12 · 已迁入 Workspace，本模块仅保持独立区块隐藏）
 */
window.LancunSearchResultsGrid = (function searchResultsGrid() {
  function init() {
    const resultsEl = document.querySelector('#species-search-results');
    if (resultsEl) resultsEl.hidden = true;
  }

  return { init, render: () => {} };
})();
