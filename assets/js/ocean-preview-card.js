/**
 * 首页 Section 2 · 五大洋简介卡片（P3）+ 对外 API（P6）
 */
(function initOceanPreviewCard() {
  if (document.body?.dataset?.page !== 'home') return;

  const hotspots = () => window.OCEAN_HOTSPOTS || [];
  const intro = document.querySelector('[data-ocean-intro]');
  const slot = document.querySelector('[data-ocean-card-slot]');
  const panel = document.querySelector('[data-ocean-panel]');

  if (!intro || !slot || !panel) return;

  let selectedId = null;

  function motionReduced() {
    if (document.documentElement.dataset.reducedMotion === 'true') return true;
    if (typeof window.LANCUN_getPrefs === 'function' && window.LANCUN_getPrefs().reduceMotion) {
      return true;
    }
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  function getMarkerApi() {
    return window.LANCUN_homeGlobe?.markerApi ?? null;
  }

  function findOcean(id) {
    return hotspots().find((ocean) => ocean.id === id) ?? null;
  }

  function formatIndex(index) {
    return String((index ?? 0) + 1).padStart(2, '0');
  }

  function syncMarker(id) {
    getMarkerApi()?.setActive(id ?? null);
  }

  function notifyChange(id) {
    window.dispatchEvent(
      new CustomEvent('lancun-ocean-preview-change', {
        bubbles: true,
        detail: { id },
      }),
    );
  }

  function renderCard(ocean) {
    const list = hotspots();
    const idx = formatIndex(ocean.index ?? list.findIndex((item) => item.id === ocean.id));
    const pager = `${idx} / ${String(list.length).padStart(2, '0')}`;
    const profileHref = `pages/ocean.html#ocean-${ocean.targetTab || ocean.id}`;

    return `
      <article class="ocean-preview-card" aria-labelledby="ocean-preview-title-${ocean.id}">
        <button type="button" class="ocean-preview-card__close" data-ocean-preview-close aria-label="返回总览">
          <span aria-hidden="true">×</span>
        </button>
        <p class="ocean-preview-card__eyebrow">OCEAN ${idx}</p>
        <h3 id="ocean-preview-title-${ocean.id}" class="ocean-preview-card__name">${ocean.name}</h3>
        <p class="ocean-preview-card__english">${ocean.englishName}</p>
        <p class="ocean-preview-card__desc">${ocean.description}</p>
        <dl class="ocean-preview-card__stats">
          <div class="ocean-preview-card__stat">
            <dt>面积</dt>
            <dd>约 ${ocean.area}</dd>
          </div>
          <div class="ocean-preview-card__stat">
            <dt>平均深度</dt>
            <dd>${ocean.averageDepth}</dd>
          </div>
          <div class="ocean-preview-card__stat">
            <dt>生态亮点</dt>
            <dd>${ocean.ecosystem}</dd>
          </div>
          <div class="ocean-preview-card__stat">
            <dt>主要威胁</dt>
            <dd>${ocean.threats}</dd>
          </div>
        </dl>
        <a class="ocean-preview-card__link" href="${profileHref}">查看完整档案 →</a>
        <div class="ocean-preview-card__nav">
          <button type="button" class="ocean-preview-card__nav-btn" data-ocean-preview-prev>上一片海</button>
          <span class="ocean-preview-card__pager" aria-live="polite">${pager}</span>
          <button type="button" class="ocean-preview-card__nav-btn" data-ocean-preview-next>下一片海</button>
        </div>
      </article>`;
  }

  function showIntro() {
    selectedId = null;
    window.selectedOcean = null;
    intro.hidden = false;
    slot.innerHTML = '';
    slot.hidden = true;
    slot.setAttribute('aria-hidden', 'true');
    panel.classList.remove('has-ocean-preview');
    syncMarker(null);
    notifyChange(null);
  }

  function showCard(id, { rotateGlobe = true } = {}) {
    const ocean = findOcean(id);
    if (!ocean) return;

    selectedId = id;
    window.selectedOcean = id;
    intro.hidden = true;
    slot.hidden = false;
    slot.removeAttribute('aria-hidden');
    panel.classList.add('has-ocean-preview');
    slot.innerHTML = renderCard(ocean);

    if (!motionReduced()) {
      slot.classList.remove('is-entering');
      void slot.offsetWidth;
      slot.classList.add('is-entering');
    }

    syncMarker(id);
    notifyChange(id);

    if (rotateGlobe) {
      window.LANCUN_homeGlobe?.rotateToOcean?.(id);
    }
  }

  function showAdjacent(delta) {
    const list = hotspots();
    if (!list.length || selectedId == null) return;
    const current = list.findIndex((ocean) => ocean.id === selectedId);
    if (current < 0) return;
    const next = (current + delta + list.length) % list.length;
    showCard(list[next].id);
  }

  slot.addEventListener('click', (event) => {
    const target = event.target.closest('[data-ocean-preview-close], [data-ocean-preview-prev], [data-ocean-preview-next]');
    if (!target) return;

    if (target.matches('[data-ocean-preview-close]')) {
      showIntro();
      return;
    }
    if (target.matches('[data-ocean-preview-prev]')) {
      showAdjacent(-1);
      return;
    }
    if (target.matches('[data-ocean-preview-next]')) {
      showAdjacent(1);
    }
  });

  window.addEventListener('lancun-ocean-pin-select', (event) => {
    const id = event.detail?.ocean?.id;
    if (!id) return;
    showCard(id, { rotateGlobe: false });
  });

  window.addEventListener('lancun-ocean-index-select', (event) => {
    const id = event.detail?.id;
    if (!id) return;
    showCard(id);
  });

  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape' || selectedId == null) return;
    const dialogOpen = document.querySelector('dialog[open]');
    if (dialogOpen) return;
    event.preventDefault();
    showIntro();
  });

  window.LANCUN_oceanPreview = {
    select: (id) => showCard(id),
    reset: () => showIntro(),
    getSelectedId: () => selectedId,
  };

  showIntro();
})();
