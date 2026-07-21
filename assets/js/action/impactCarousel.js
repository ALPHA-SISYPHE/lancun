/**
 * 海洋行动中心 · 往期成果轮播（阶段 4）
 */
(function impactCarouselModule() {
  const state = {
    index: 0,
    timer: null,
    hoverPaused: false,
    reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  };

  function stories() {
    return window.IMPACT_STORIES ?? [];
  }

  function $(selector, root = document) {
    return root.querySelector(selector);
  }

  function escapeHtml(text) {
    return String(text ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function typeLabel(type) {
    if (type === 'volunteer') return '志愿行动';
    if (type === 'donation') return '公益支持';
    return '协同成果';
  }

  function shouldPause() {
    return (
      state.hoverPaused
      || document.hidden
      || state.reducedMotion
      || Boolean(document.querySelector('[data-donation-thanks-dialog][open], [data-donation-records-dialog][open]'))
    );
  }

  function startAuto() {
    stopAuto();
    if (state.reducedMotion) return;
    state.timer = window.setInterval(() => {
      if (!shouldPause()) go(1);
    }, 8000);
  }

  function stopAuto() {
    if (state.timer) {
      window.clearInterval(state.timer);
      state.timer = null;
    }
  }

  const AUTO_HINT_DEFAULT = '一次展示一条影响力故事 · 每 8 秒自动切换';
  const AUTO_HINT_PAUSED = '已暂停自动切换';

  function updateAutoHint() {
    const hint = $('[data-impact-auto-hint]');
    if (!hint) return;
    const paused = shouldPause();
    hint.classList.toggle('is-paused', paused && !state.reducedMotion);
    hint.textContent = paused && !state.reducedMotion ? AUTO_HINT_PAUSED : AUTO_HINT_DEFAULT;
  }

  function renderSlide() {
    const list = stories();
    const card = $('[data-impact-card]');
    const counter = $('[data-impact-counter]');
    if (!card || !list.length) return;

    const total = list.length;
    const item = list[state.index];
    const coverStyle = item.image ? `background-image:url('${item.image}')` : '';

    card.innerHTML = `
      <div class="impact-story-card__media" style="${coverStyle}" role="img" aria-label="${escapeHtml(item.title)}"></div>
      <div class="impact-story-card__body">
        <span class="impact-story-card__type" data-type="${escapeHtml(item.relatedType)}">${typeLabel(item.relatedType)}</span>
        <h3>${escapeHtml(item.title)}</h3>
        <p class="impact-story-card__highlight">${escapeHtml(item.metric)}</p>
        <dl class="impact-story-card__meta">
          <div><dt>地点</dt><dd>${escapeHtml(item.location)}</dd></div>
          <div><dt>时间</dt><dd>${escapeHtml(item.date)}</dd></div>
        </dl>
        <p class="impact-story-card__summary">${escapeHtml(item.description)}</p>
      </div>
    `;

    if (counter) {
      const current = String(state.index + 1).padStart(2, '0');
      const max = String(total).padStart(2, '0');
      counter.textContent = `${current} / ${max}`;
    }
    updateAutoHint();
  }

  function go(delta) {
    const list = stories();
    if (!list.length) return;
    state.index = (state.index + delta + list.length) % list.length;
    renderSlide();
  }

  function bindEvents() {
    const root = $('[data-impact-carousel]');
    root?.addEventListener('mouseenter', () => {
      state.hoverPaused = true;
      updateAutoHint();
    });
    root?.addEventListener('mouseleave', () => {
      state.hoverPaused = false;
      updateAutoHint();
      if (!shouldPause()) startAuto();
    });

    $('[data-impact-prev]')?.addEventListener('click', () => go(-1));
    $('[data-impact-next]')?.addEventListener('click', () => go(1));

    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && !shouldPause()) startAuto();
      else stopAuto();
    });
  }

  function setupImpactCarousel() {
    if (document.body.dataset.page !== 'action') return;
    if (!stories().length) return;
    bindEvents();
    renderSlide();
    startAuto();
  }

  document.addEventListener('DOMContentLoaded', setupImpactCarousel);

  window.OceanActionImpactCarousel = { renderSlide, go };
})();
