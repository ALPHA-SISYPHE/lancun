/**
 * 档案工作台 · 搜索联动（Phase 12）
 * 对外保留 LancunSpeciesRails.init/render/setActiveRail
 */
window.LancunSpeciesRails = (function speciesWorkspace() {
  const PAGE_SIZE = 8;
  const MAX_VISIBLE = 16;
  const AUTOPLAY_MS = 4000;

  let bound = false;
  let activeCategoryId = 'all';
  let visibleCount = PAGE_SIZE;
  let pageOffset = 0;
  let forceShuffleOnce = false;
  let searchVisibleCount = PAGE_SIZE;
  let lastSearchFingerprint = '';
  let autoplayTimer = null;
  let autoplayOn = false;
  let autoplayPaused = false;
  let hoverBound = false;

  function escapeHtml(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function getDb() {
    const dock = window.LancunSpeciesSearchDock;
    return dock?.getMergedDatabase?.() || window.LANCUN_SPECIES_DB || [];
  }

  function getDockState() {
    return window.LancunSpeciesSearchDock?.getState?.() || { isSearchMode: false, searchResults: [] };
  }

  function buildCategories(db) {
    const rails = window.LANCUN_SPECIES_CATEGORIES?.RAIL_GROUPS || [];
    const cats = [
      { id: 'all', title: '全部物种', filterFn: () => true },
      ...rails,
    ];

    return cats
      .map((cat) => {
        const items = db.filter(cat.filterFn);
        return { ...cat, count: items.length, items };
      })
      .filter((cat) => (cat.id === 'user-added' ? cat.count > 0 : true));
  }

  function resolveActive(categories, preferred) {
    if (preferred && categories.some((c) => c.id === preferred)) return preferred;
    return categories[0]?.id || 'all';
  }

  function getActiveCategory(categories) {
    return categories.find((c) => c.id === activeCategoryId) || categories[0];
  }

  function resetWindow() {
    pageOffset = 0;
    visibleCount = PAGE_SIZE;
  }

  function searchFingerprint(state) {
    return [
      state.searchQuery,
      state.selectedGroups.join(','),
      state.selectedStatuses.join(','),
      state.selectedHabitats.join(','),
      state.selectedThreats.join(','),
      state.searchResults.length,
    ].join('|');
  }

  function scrollToAiLab() {
    document.querySelector('#ai-identification-lab')?.scrollIntoView({ behavior: 'smooth' });
  }

  function resetSearch() {
    window.LancunSpeciesSearchDock?.resetAll?.();
  }

  function stopAutoplay() {
    if (autoplayTimer) {
      clearInterval(autoplayTimer);
      autoplayTimer = null;
    }
    autoplayOn = false;
    autoplayPaused = false;
    const btn = document.querySelector('[data-ws-autoplay]');
    if (btn) {
      btn.setAttribute('aria-pressed', 'false');
      btn.textContent = '自动播放';
    }
  }

  function tickAutoplay() {
    if (!autoplayOn || autoplayPaused || document.hidden) return;
    shuffleGroup();
  }

  function startAutoplay() {
    const reduced =
      document.documentElement.dataset.reducedMotion === 'true' ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return;

    if (autoplayTimer) clearInterval(autoplayTimer);
    autoplayOn = true;
    autoplayPaused = false;
    const btn = document.querySelector('[data-ws-autoplay]');
    if (btn) {
      btn.setAttribute('aria-pressed', 'true');
      btn.textContent = '停止播放';
    }

    autoplayTimer = window.setInterval(tickAutoplay, AUTOPLAY_MS);
  }

  function shuffleArray(list) {
    const copy = list.slice();
    for (let i = copy.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  function shuffleGroup() {
    const categories = buildCategories(getDb());
    const category = getActiveCategory(categories);
    const items = category?.items || [];
    const n = items.length;

    visibleCount = PAGE_SIZE;

    if (n <= PAGE_SIZE) {
      forceShuffleOnce = true;
      pageOffset = 0;
      render();
      return;
    }

    const maxStart = Math.max(0, n - PAGE_SIZE);
    let next = Math.floor(Math.random() * (maxStart + 1));
    let guard = 0;
    while (next === pageOffset && maxStart > 0 && guard < 8) {
      next = Math.floor(Math.random() * (maxStart + 1));
      guard += 1;
    }
    pageOffset = next;
    forceShuffleOnce = false;
    render();
  }

  function sliceItems(items) {
    if (!items.length) return [];

    if (forceShuffleOnce) {
      forceShuffleOnce = false;
      return shuffleArray(items).slice(0, Math.min(PAGE_SIZE, items.length));
    }

    const start = Math.min(Math.max(0, pageOffset), Math.max(0, items.length - 1));
    return items.slice(start, Math.min(items.length, start + Math.min(visibleCount, MAX_VISIBLE)));
  }

  function setBrowseControlsVisible(show) {
    const nextBtn = document.querySelector('[data-ws-next-group]');
    const autoplayBtn = document.querySelector('[data-ws-autoplay]');
    if (nextBtn) nextBtn.hidden = !show;
    if (autoplayBtn) autoplayBtn.hidden = !show;
  }

  function ensureSearchTitle() {
    const focus = document.querySelector('[data-focus-area]');
    const grid = document.querySelector('[data-species-grid]');
    if (!focus || !grid) return null;
    let title = focus.querySelector('[data-ws-search-title]');
    if (!title) {
      title = document.createElement('p');
      title.className = 'workspace-search-title';
      title.dataset.wsSearchTitle = '';
      focus.insertBefore(title, grid);
    }
    return title;
  }

  function hideSearchTitle() {
    document.querySelector('[data-ws-search-title]')?.remove();
  }

  function collectFilterLabels(state) {
    const cats = window.LANCUN_SPECIES_CATEGORIES || {};
    const labels = [];

    state.selectedGroups.forEach((id) => {
      labels.push((cats.GROUPS || []).find((g) => g.id === id)?.label || id);
    });
    state.selectedStatuses.forEach((id) => {
      labels.push((cats.IUCN_STATUSES || []).find((s) => s.id === id)?.label || id);
    });
    state.selectedHabitats.forEach((id) => {
      labels.push((cats.HABITATS || cats.OCEANS || []).find((h) => h.id === id)?.label || id);
    });
    state.selectedThreats.forEach((id) => {
      labels.push((cats.THREATS || []).find((t) => t.id === id)?.label || id);
    });

    return labels;
  }

  function renderCategoryRail(categories) {
    const host = document.querySelector('[data-category-rail]');
    if (!host) return;

    host.classList.remove('is-filter-summary');
    host.innerHTML = categories
      .map((cat) => {
        const selected = cat.id === activeCategoryId;
        return `<button
          type="button"
          class="category-nav-item${selected ? ' is-active' : ''}"
          data-category-id="${escapeHtml(cat.id)}"
          aria-current="${selected ? 'true' : 'false'}"
        >
          <span class="category-nav-item__name">${escapeHtml(cat.title)}</span>
          <span class="category-nav-item__count">${cat.count}</span>
        </button>`;
      })
      .join('');
  }

  function renderSearchFilterRail(state) {
    const host = document.querySelector('[data-category-rail]');
    if (!host) return;

    host.classList.add('is-filter-summary');
    const keyword = state.searchQuery.trim();
    const filters = collectFilterLabels(state);

    const filterHtml = filters.length
      ? `<ul class="search-filter-list">${filters
          .map((label) => `<li>${escapeHtml(label)}</li>`)
          .join('')}</ul>`
      : '<p class="search-filter-muted">当前无筛选条件</p>';

    host.innerHTML = `
      <div class="search-filter-panel">
        <p class="search-filter-panel__eyebrow">筛选摘要</p>
        <div class="search-filter-panel__block">
          <p class="search-filter-panel__label">关键词</p>
          <p class="search-filter-panel__value">${escapeHtml(keyword || '无关键词')}</p>
        </div>
        <div class="search-filter-panel__block">
          <p class="search-filter-panel__label">筛选条件</p>
          ${filterHtml}
        </div>
        <button type="button" class="button button-ghost search-filter-panel__clear" data-ws-reset-filters>
          清空筛选
        </button>
      </div>`;
  }

  function syncLoadMoreButton({ expanded, canExpand }) {
    const loadMore = document.querySelector('[data-ws-load-more]');
    if (!loadMore) return;

    if (expanded) {
      loadMore.hidden = false;
      loadMore.textContent = '收起';
      loadMore.setAttribute('aria-expanded', 'true');
      return;
    }

    if (canExpand) {
      loadMore.hidden = false;
      loadMore.textContent = '查看更多';
      loadMore.setAttribute('aria-expanded', 'false');
      return;
    }

    loadMore.hidden = true;
    loadMore.textContent = '查看更多';
    loadMore.setAttribute('aria-expanded', 'false');
  }

  function renderFocus(category) {
    hideSearchTitle();
    const grid = document.querySelector('[data-species-grid]');
    if (!grid) return;

    const items = category?.items || [];
    const slice = sliceItems(items);

    if (!slice.length) {
      grid.innerHTML = '<p class="rail-empty">该分类暂无档案</p>';
      syncLoadMoreButton({ expanded: false, canExpand: false });
    } else {
      grid.innerHTML = slice.map((s) => window.LancunSpeciesCard.render(s)).join('');
      window.LancunSpeciesCard.bindImageFallback(grid);
      window.LancunSpeciesCard.bindOpenHandlers(grid);

      const start = pageOffset < 0 ? 0 : pageOffset;
      const shown = slice.length;
      const remaining = Math.max(0, items.length - start - shown);
      syncLoadMoreButton({
        expanded: visibleCount > PAGE_SIZE,
        canExpand: remaining > 0 && visibleCount < MAX_VISIBLE,
      });
    }
  }

  function renderSearchFocus(state) {
    const title = ensureSearchTitle();
    const grid = document.querySelector('[data-species-grid]');
    const loadMore = document.querySelector('[data-ws-load-more]');
    if (!grid) return;

    const total = state.searchResults.length;
    if (title) title.textContent = `找到 ${total} 个相关物种`;

    if (!total) {
      grid.innerHTML = `
        <div class="workspace-search-empty" data-ws-search-empty>
          <p class="workspace-search-empty__title">未找到相关物种。</p>
          <p class="workspace-search-empty__text">请尝试更换关键词，或上传照片使用 AI 识别。</p>
          <div class="workspace-search-empty__actions">
            <button type="button" class="button" data-ws-empty-reset>重置筛选</button>
            <button type="button" class="button button-primary" data-ws-empty-ai>使用 AI 识别</button>
          </div>
        </div>`;
      if (loadMore) loadMore.hidden = true;
      return;
    }

    const visible = state.searchResults.slice(0, Math.min(searchVisibleCount, MAX_VISIBLE));
    grid.innerHTML = visible.map((s) => window.LancunSpeciesCard.render(s)).join('');
    window.LancunSpeciesCard.bindImageFallback(grid);
    window.LancunSpeciesCard.bindOpenHandlers(grid);

    syncLoadMoreButton({
      expanded: searchVisibleCount > PAGE_SIZE,
      canExpand: searchVisibleCount < total && searchVisibleCount < MAX_VISIBLE,
    });
  }

  function renderSummary(db, category) {
    const host = document.querySelector('[data-summary-panel]');
    if (!host) return;

    const items = category?.items || [];
    const cr = items.filter((s) => s.iucnStatus === 'CR').length;
    const en = items.filter((s) => s.iucnStatus === 'EN').length;
    const vu = items.filter((s) => s.iucnStatus === 'VU').length;
    const recentUser = db.filter((s) => s.isUserAdded).slice(-3).reverse();

    const recentHtml = recentUser.length
      ? `<ul class="summary-recent">${recentUser
          .map(
            (s) =>
              `<li><button type="button" class="summary-recent__btn" data-open-species="${escapeHtml(
                s.id
              )}">${escapeHtml(s.chineseName)}</button></li>`
          )
          .join('')}</ul>`
      : '<p class="summary-muted">暂无用户新增</p>';

    host.innerHTML = `
      <div class="summary-panel__inner">
        <p class="summary-panel__eyebrow">档案摘要</p>
        <p class="summary-panel__category" data-summary-category>${escapeHtml(
          category?.title || ''
        )}</p>
        <dl class="summary-stats">
          <div><dt>当前分类数量</dt><dd data-summary-count>${category?.count ?? 0}</dd></div>
          <div><dt>CR</dt><dd>${cr}</dd></div>
          <div><dt>EN</dt><dd>${en}</dd></div>
          <div><dt>VU</dt><dd>${vu}</dd></div>
        </dl>
        <div class="summary-block">
          <h3>最近新增档案</h3>
          ${recentHtml}
        </div>
        <div class="summary-actions">
          <a class="button button-primary summary-ai-link" href="#ai-identification-lab">AI 识别入口</a>
          <button type="button" class="button button-ghost" data-ws-view-all>查看全部</button>
        </div>
      </div>`;

    window.LancunSpeciesCard.bindOpenHandlers(host);
    host.querySelector('[data-ws-view-all]')?.addEventListener('click', () => {
      activeCategoryId = 'all';
      resetWindow();
      render();
    });
  }

  function renderSearchSummary(state) {
    const host = document.querySelector('[data-summary-panel]');
    if (!host) return;

    const results = state.searchResults || [];
    const cr = results.filter((s) => s.iucnStatus === 'CR').length;
    const en = results.filter((s) => s.iucnStatus === 'EN').length;
    const vu = results.filter((s) => s.iucnStatus === 'VU').length;

    host.innerHTML = `
      <div class="summary-panel__inner summary-panel__inner--search">
        <p class="summary-panel__eyebrow">搜索结果</p>
        <dl class="summary-stats">
          <div><dt>匹配总数</dt><dd data-ws-search-total>${results.length}</dd></div>
          <div><dt>CR</dt><dd>${cr}</dd></div>
          <div><dt>EN</dt><dd>${en}</dd></div>
          <div><dt>VU</dt><dd>${vu}</dd></div>
        </dl>
        <div class="summary-actions">
          <a class="button button-primary summary-ai-link" href="#ai-identification-lab">推荐使用 AI 识别</a>
          <button type="button" class="button button-ghost" data-ws-search-reset>重置筛选</button>
        </div>
      </div>`;
  }

  function renderBrowseMode() {
    const layout = document.querySelector('[data-species-rails]');
    layout?.classList.remove('is-search-mode');
    setBrowseControlsVisible(true);

    const db = getDb();
    const categories = buildCategories(db);
    activeCategoryId = resolveActive(categories, activeCategoryId);
    const category = getActiveCategory(categories);

    if (pageOffset >= 0 && category?.items?.length) {
      const maxStart = Math.max(0, category.items.length - 1);
      if (pageOffset > maxStart) pageOffset = 0;
    }

    renderCategoryRail(categories);
    renderFocus(category);
    renderSummary(db, category);
  }

  function renderSearchMode(state) {
    const layout = document.querySelector('[data-species-rails]');
    layout?.classList.add('is-search-mode');
    setBrowseControlsVisible(false);
    stopAutoplay();

    const fp = searchFingerprint(state);
    if (fp !== lastSearchFingerprint) {
      searchVisibleCount = PAGE_SIZE;
      lastSearchFingerprint = fp;
    }

    renderSearchFilterRail(state);
    renderSearchFocus(state);
    renderSearchSummary(state);
  }

  function onSearchMode(state) {
    const resultsSection = document.querySelector('#species-search-results');
    if (resultsSection) resultsSection.hidden = true;
    if (state.isSearchMode) stopAutoplay();
  }

  function render(state) {
    if (!window.LancunSpeciesCard) return;
    const dockState = state || getDockState();
    onSearchMode(dockState);

    if (dockState.isSearchMode) {
      renderSearchMode(dockState);
    } else {
      searchVisibleCount = PAGE_SIZE;
      lastSearchFingerprint = '';
      renderBrowseMode();
    }
  }

  function onState(state) {
    render(state);
  }

  function setActiveRail(id) {
    if (id) {
      activeCategoryId = id;
      resetWindow();
    }
  }

  function bindHoverPause() {
    if (hoverBound) return;
    const workspace = document.querySelector('#species-workspace');
    if (!workspace) return;
    hoverBound = true;

    const pause = () => {
      if (autoplayOn) autoplayPaused = true;
    };
    const resume = () => {
      if (autoplayOn) autoplayPaused = false;
    };

    workspace.addEventListener('mouseenter', pause);
    workspace.addEventListener('mouseleave', resume);
    workspace.addEventListener('pointerdown', pause, { passive: true });
  }

  function bindControls() {
    const root = document.querySelector('[data-species-rails]');
    if (!root || root.dataset.wsBound === 'true') return;
    root.dataset.wsBound = 'true';

    root.addEventListener('click', (event) => {
      if (event.target.closest('[data-ws-reset-filters], [data-ws-search-reset], [data-ws-empty-reset]')) {
        resetSearch();
        return;
      }
      if (event.target.closest('[data-ws-empty-ai]')) {
        scrollToAiLab();
        return;
      }

      const catBtn = event.target.closest('[data-category-id]');
      if (catBtn && root.contains(catBtn) && !root.classList.contains('is-search-mode')) {
        activeCategoryId = catBtn.getAttribute('data-category-id');
        resetWindow();
        render();
      }
    });

    document.querySelector('[data-ws-load-more]')?.addEventListener('click', () => {
      const loadMore = document.querySelector('[data-ws-load-more]');
      const state = getDockState();
      const isExpanded = loadMore?.getAttribute('aria-expanded') === 'true';

      if (state.isSearchMode) {
        searchVisibleCount = isExpanded
          ? PAGE_SIZE
          : Math.min(MAX_VISIBLE, searchVisibleCount + PAGE_SIZE);
        render(state);
      } else {
        visibleCount = isExpanded ? PAGE_SIZE : Math.min(MAX_VISIBLE, visibleCount + PAGE_SIZE);
        render();
      }
    });

    document.querySelector('[data-ws-next-group]')?.addEventListener('click', () => {
      shuffleGroup();
    });

    document.querySelector('[data-ws-autoplay]')?.addEventListener('click', () => {
      if (autoplayOn) stopAutoplay();
      else startAutoplay();
    });

    bindHoverPause();
  }

  function init() {
    if (bound) return;
    bound = true;
    bindControls();

    const resultsSection = document.querySelector('#species-search-results');
    if (resultsSection) resultsSection.hidden = true;

    const dock = window.LancunSpeciesSearchDock;
    if (dock?.subscribe) {
      dock.subscribe(onState);
      onState(dock.getState());
    } else {
      render();
    }
  }

  return {
    init,
    render,
    setActiveRail,
    getWindowState: () => ({
      pageOffset,
      visibleCount,
      activeCategoryId,
      autoplayOn,
      searchVisibleCount,
    }),
  };
})();
