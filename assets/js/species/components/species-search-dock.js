/**
 * Search Dock · 双层检索（Phase 3 管线；Phase 4 仅加 subscribe / 交出结果渲染）
 */
window.LancunSpeciesSearchDock = (function speciesSearchDock() {
  const state = {
    searchQuery: '',
    exactSearchEnabled: false,
    selectedGroups: [],
    selectedStatuses: [],
    selectedHabitats: [],
    selectedThreats: [],
    searchResults: [],
    isSearchMode: false,
  };

  const listeners = new Set();
  let bound = false;

  function escapeHtml(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function getMergedDatabase() {
    const base = window.LANCUN_SPECIES_DB || [];
    const storage = window.LancunLocalSpeciesStorage;
    if (!storage) return base.slice();
    return storage.mergeSpeciesDatabase(base, storage.getUserAddedSpecies());
  }

  function notify() {
    const snapshot = getState();
    listeners.forEach((fn) => {
      try {
        fn(snapshot);
      } catch (err) {
        console.error(err);
      }
    });
  }

  function subscribe(listener) {
    if (typeof listener !== 'function') return () => {};
    listeners.add(listener);
    return () => listeners.delete(listener);
  }

  function getState() {
    return { ...state, searchResults: state.searchResults.slice() };
  }

  function hasActiveFilters() {
    return (
      state.selectedGroups.length > 0 ||
      state.selectedStatuses.length > 0 ||
      state.selectedHabitats.length > 0 ||
      state.selectedThreats.length > 0
    );
  }

  function toggleInArray(arr, id) {
    return arr.includes(id) ? arr.filter((x) => x !== id) : [...arr, id];
  }

  function fillFilterPills() {
    const cats = window.LANCUN_SPECIES_CATEGORIES || {};
    const PRIMARY_GROUPS = ['cetacean', 'turtle', 'coral', 'shark-ray', 'fish'];
    const PRIMARY_STATUS = ['CR', 'EN', 'VU', 'NT'];
    const map = {
      group: cats.GROUPS || [],
      status: cats.IUCN_STATUSES || [],
      habitat: cats.HABITATS || cats.OCEANS || [],
      threat: cats.THREATS || [],
    };

    document.querySelectorAll('[data-filter-pills]').forEach((host) => {
      const dim = host.getAttribute('data-filter-pills');
      const scope = host.getAttribute('data-filter-scope') || 'all';
      let items = map[dim] || [];
      if (dim === 'group' && scope === 'primary') {
        items = items.filter((item) => PRIMARY_GROUPS.includes(item.id));
      } else if (dim === 'group' && scope === 'advanced') {
        items = items.filter((item) => !PRIMARY_GROUPS.includes(item.id));
      } else if (dim === 'status' && scope === 'primary') {
        items = items.filter((item) => PRIMARY_STATUS.includes(item.id));
      } else if (dim === 'status' && scope === 'advanced') {
        items = items.filter((item) => !PRIMARY_STATUS.includes(item.id));
      }

      host.innerHTML = items
        .map((item) => {
          const statusClass =
            dim === 'status' ? ` filter-pill-btn--${String(item.id).toLowerCase()}` : '';
          return `<button type="button" class="filter-pill-btn${statusClass}" data-filter-id="${escapeHtml(
            item.id
          )}" aria-pressed="false">${escapeHtml(item.label)}</button>`;
        })
        .join('');
    });
  }

  function syncPillPressed() {
    const selected = {
      group: state.selectedGroups,
      status: state.selectedStatuses,
      habitat: state.selectedHabitats,
      threat: state.selectedThreats,
    };
    Object.entries(selected).forEach(([dim, ids]) => {
      document.querySelectorAll(`[data-filter-group="${dim}"] [data-filter-id]`).forEach((btn) => {
        const on = ids.includes(btn.dataset.filterId);
        btn.classList.toggle('is-active', on);
        btn.setAttribute('aria-pressed', String(on));
      });
    });
  }

  function renderActiveFilters() {
    const wrap = document.querySelector('[data-active-filters]');
    if (!wrap) return;

    const cats = window.LANCUN_SPECIES_CATEGORIES || {};
    const pills = [];

    const push = (type, id, label) => {
      pills.push(
        `<button type="button" class="active-filter-pill" data-remove-filter="${type}" data-filter-id="${escapeHtml(
          id
        )}">${escapeHtml(label)} ×</button>`
      );
    };

    state.selectedGroups.forEach((id) => {
      push('group', id, (cats.GROUPS || []).find((g) => g.id === id)?.label || id);
    });
    state.selectedStatuses.forEach((id) => {
      push('status', id, (cats.IUCN_STATUSES || []).find((s) => s.id === id)?.label || id);
    });
    state.selectedHabitats.forEach((id) => {
      push(
        'habitat',
        id,
        (cats.HABITATS || cats.OCEANS || []).find((h) => h.id === id)?.label || id
      );
    });
    state.selectedThreats.forEach((id) => {
      push('threat', id, (cats.THREATS || []).find((t) => t.id === id)?.label || id);
    });

    if (state.searchQuery.trim()) {
      pills.push(
        `<span class="active-filter-pill active-filter-pill--static">关键词：${escapeHtml(
          state.searchQuery.trim()
        )}</span>`
      );
    }

    wrap.innerHTML = pills.length
      ? pills.join('')
      : '<span class="active-filter-pill active-filter-pill--muted">当前无筛选条件</span>';
  }

  function renderSuggest(query) {
    const list = document.querySelector('[data-species-suggest]');
    if (!list) return;
    const q = String(query || '')
      .trim()
      .toLowerCase();
    if (!q) {
      list.hidden = true;
      list.innerHTML = '';
      return;
    }

    const matches = getMergedDatabase()
      .filter((s) =>
        [s.chineseName, s.englishName, s.scientificName].some((f) =>
          String(f || '')
            .toLowerCase()
            .includes(q)
        )
      )
      .slice(0, 8);

    if (!matches.length) {
      list.hidden = true;
      list.innerHTML = '';
      return;
    }

    list.innerHTML = matches
      .map(
        (s) =>
          `<li role="option"><button type="button" data-suggest-id="${escapeHtml(s.id)}">${escapeHtml(
            s.chineseName
          )} · ${escapeHtml(s.englishName)}</button></li>`
      )
      .join('');
    list.hidden = false;
  }

  function hideSuggest() {
    const list = document.querySelector('[data-species-suggest]');
    if (!list) return;
    list.hidden = true;
  }

  function runSearch() {
    const query = state.searchQuery.trim();
    const filtered = window.LancunFilterSpecies({
      speciesList: getMergedDatabase(),
      selectedGroups: state.selectedGroups,
      selectedStatuses: state.selectedStatuses,
      selectedHabitats: state.selectedHabitats,
      selectedThreats: state.selectedThreats,
    });

    const results = query
      ? window.LancunSearchSpecies({
          speciesList: filtered,
          query,
          exactSearchEnabled: state.exactSearchEnabled,
        })
      : filtered;

    state.searchResults = results;
    state.isSearchMode = Boolean(query) || hasActiveFilters();
    renderActiveFilters();
    syncPillPressed();
    notify();
  }

  function resetAll() {
    state.searchQuery = '';
    state.exactSearchEnabled = false;
    state.selectedGroups = [];
    state.selectedStatuses = [];
    state.selectedHabitats = [];
    state.selectedThreats = [];
    state.searchResults = [];
    state.isSearchMode = false;

    const input = document.querySelector('[data-species-search-input]');
    const exact = document.querySelector('[data-exact-search]');
    const clearBtn = document.querySelector('[data-species-search-clear]');
    if (input) input.value = '';
    if (exact) exact.checked = false;
    if (clearBtn) clearBtn.hidden = true;
    hideSuggest();
    runSearch();
  }

  function applyQueryFromInput(hideSuggestions = false) {
    const input = document.querySelector('[data-species-search-input]');
    const clearBtn = document.querySelector('[data-species-search-clear]');
    state.searchQuery = input?.value || '';
    if (clearBtn) clearBtn.hidden = !state.searchQuery.trim();
    if (hideSuggestions) hideSuggest();
    else renderSuggest(state.searchQuery);
    runSearch();
  }

  function setSearchQuery(query, hideSuggestions = true) {
    const input = document.querySelector('[data-species-search-input]');
    if (input) input.value = String(query || '');
    applyQueryFromInput(hideSuggestions);
  }

  function init() {
    if (bound) return;
    bound = true;

    fillFilterPills();

    const input = document.querySelector('[data-species-search-input]');
    const clearBtn = document.querySelector('[data-species-search-clear]');
    const submitBtn = document.querySelector('[data-species-search-submit]');
    const exactToggle = document.querySelector('[data-exact-search]');
    const resetBtn = document.querySelector('[data-reset-all-filters]');

    input?.addEventListener('input', () => applyQueryFromInput(false));
    input?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        applyQueryFromInput(true);
      }
      if (e.key === 'Escape') hideSuggest();
    });

    submitBtn?.addEventListener('click', () => applyQueryFromInput(true));
    clearBtn?.addEventListener('click', () => {
      if (input) input.value = '';
      applyQueryFromInput(true);
      input?.focus();
    });

    exactToggle?.addEventListener('change', () => {
      state.exactSearchEnabled = Boolean(exactToggle.checked);
      runSearch();
    });

    resetBtn?.addEventListener('click', resetAll);

    document.querySelector('[data-species-suggest]')?.addEventListener('click', (event) => {
      const btn = event.target.closest('[data-suggest-id]');
      if (!btn || !input) return;
      const species = getMergedDatabase().find((s) => s.id === btn.dataset.suggestId);
      if (!species) return;
      input.value = species.chineseName;
      applyQueryFromInput(true);
    });

    document.querySelector('[data-active-filters]')?.addEventListener('click', (event) => {
      const btn = event.target.closest('[data-remove-filter]');
      if (!btn) return;
      const type = btn.dataset.removeFilter;
      const id = btn.dataset.filterId;
      const map = {
        group: 'selectedGroups',
        status: 'selectedStatuses',
        habitat: 'selectedHabitats',
        threat: 'selectedThreats',
      };
      const key = map[type];
      if (!key) return;
      state[key] = state[key].filter((x) => x !== id);
      runSearch();
    });

    document.querySelector('.filter-groups')?.addEventListener('click', (event) => {
      const btn = event.target.closest('[data-filter-id]');
      if (!btn) return;
      const row = btn.closest('[data-filter-group]');
      if (!row) return;
      const dim = row.dataset.filterGroup;
      const id = btn.dataset.filterId;
      const map = {
        group: 'selectedGroups',
        status: 'selectedStatuses',
        habitat: 'selectedHabitats',
        threat: 'selectedThreats',
      };
      const key = map[dim];
      if (!key) return;
      state[key] = toggleInArray(state[key], id);
      runSearch();
    });

    document.querySelector('[data-empty-reset]')?.addEventListener('click', resetAll);
    document.querySelector('[data-empty-ai]')?.addEventListener('click', () => {
      document.querySelector('#ai-identification-lab')?.scrollIntoView({ behavior: 'smooth' });
    });

    const advanced = document.querySelector('[data-filter-advanced]');
    const toggleAdvanced = document.querySelector('[data-toggle-advanced]');
    toggleAdvanced?.addEventListener('click', () => {
      if (!advanced) return;
      const open = !advanced.classList.contains('is-open');
      advanced.classList.toggle('is-open', open);
      advanced.setAttribute('aria-hidden', String(!open));
      toggleAdvanced.setAttribute('aria-expanded', String(open));
      toggleAdvanced.textContent = open ? '收起筛选' : '更多筛选';
    });

    document.addEventListener('click', (event) => {
      const suggest = document.querySelector('[data-species-suggest]');
      const main = document.querySelector('.search-main');
      if (!suggest || suggest.hidden) return;
      if (main?.contains(event.target)) return;
      hideSuggest();
    });

    runSearch();
  }

  return {
    init,
    getState,
    getMergedDatabase,
    subscribe,
    runSearch,
    resetAll,
    setSearchQuery,
  };
})();
