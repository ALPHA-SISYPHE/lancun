const initHeroAnchors = () => {
  const { prefersReducedMotion } = window.LANCUN_RESCUE;
  document.querySelectorAll('.pollution-hero__anchors a[href^="#"]').forEach((link) => {
    link.addEventListener('click', (event) => {
      const id = link.getAttribute('href')?.slice(1);
      if (!id) return;
      const target = document.getElementById(id);
      if (!target) return;
      event.preventDefault();
      target.scrollIntoView({
        behavior: prefersReducedMotion() ? 'auto' : 'smooth',
        block: 'start',
      });
      if (history.replaceState) {
        history.replaceState(null, '', `#${id}`);
      } else {
        location.hash = id;
      }
    });
  });
};

const initRescuePage = async () => {
  if (document.body.dataset.page !== 'rescue') return;
  if (!location.hash) window.scrollTo(0, 0);

  const R = window.LANCUN_RESCUE;
  if (!R?.renderPollutionOverview) return;

  R.initPageState?.();
  R.renderPollutionOverview();
  await R.initLiveWatch();
  R.initDataSourcesModal?.();
  R.initCommandDeck?.();
  R.initSourceMatrix();
  initHeroAnchors();
};

document.addEventListener('DOMContentLoaded', () => {
  initRescuePage();
});
