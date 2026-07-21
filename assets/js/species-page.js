/**
 * 海洋生命档案馆 · 页面编排入口（Phase 7：+ New Record）
 */
function initLifeArchivePage() {
  if (document.body.dataset.page !== 'species') return;

  window.LancunSpeciesSearchDock?.init();
  window.LancunSpeciesRails?.init();
  window.LancunSearchResultsGrid?.init();
  window.LancunSpeciesDetailDrawer?.init();
  window.LancunAIIdentificationLab?.init();
  window.LancunArchiveToast?.init();
  window.LancunNewRecordContribution?.init();

  if (location.hash === '#user-added') {
    window.LancunSpeciesRails?.setActiveRail?.('user-added');
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initLifeArchivePage);
} else {
  initLifeArchivePage();
}

window.initLifeArchivePage = initLifeArchivePage;
