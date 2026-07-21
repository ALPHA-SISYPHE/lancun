/**
 * 物种详情抽屉（Phase 5）
 * 对接 lancun:open-species；桌面右侧 / 移动底部
 */
window.LancunSpeciesDetailDrawer = (function speciesDetailDrawer() {
  let lastFocus = null;
  let currentSpecies = null;
  let listContext = [];
  let bound = false;
  let copyResetTimer = null;

  function getDatabase() {
    return (
      window.LancunSpeciesSearchDock?.getMergedDatabase?.() ||
      (window.LANCUN_SPECIES_DB || []).slice()
    );
  }

  function labelMap(list, id) {
    return (list || []).find((x) => x.id === id)?.label || id;
  }

  function resolveImage(path) {
    if (window.LancunSpeciesCard?.resolveImage) {
      return window.LancunSpeciesCard.resolveImage(path);
    }
    if (!path) return '';
    if (path.startsWith('http') || path.startsWith('../') || path.startsWith('data:') || path.startsWith('/')) {
      return path;
    }
    return `../${path}`;
  }

  function groupLabel(groupId) {
    if (window.LancunSpeciesCard?.groupLabel) {
      return window.LancunSpeciesCard.groupLabel(groupId);
    }
    return labelMap(window.LANCUN_SPECIES_CATEGORIES?.GROUPS, groupId);
  }

  function buildListFromTrack(track) {
    const db = getDatabase();
    const ids = [...track.querySelectorAll('[data-species-id]')].map((el) => el.dataset.speciesId);
    return ids.map((id) => db.find((s) => s.id === id)).filter(Boolean);
  }

  function resolveListContext(sourceEl) {
    const railTrack = sourceEl?.closest?.('[data-rail-track]');
    if (railTrack) return buildListFromTrack(railTrack);

    const inResults = sourceEl?.closest?.('[data-search-results-grid]');
    if (inResults) {
      const results = window.LancunSpeciesSearchDock?.getState?.()?.searchResults;
      if (results?.length) return results.slice();
    }

    return getDatabase();
  }

  function fillList(container, items, asTags) {
    if (!container) return;
    if (!items.length) {
      container.innerHTML = '<li class="is-empty">—</li>';
      return;
    }
    container.innerHTML = items
      .map((text) => `<li class="${asTags ? 'species-drawer__tag' : ''}">${escapeText(text)}</li>`)
      .join('');
  }

  function escapeText(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function renderContent(species) {
    const drawer = document.querySelector('[data-species-drawer]');
    if (!drawer || !species) return;

    const cats = window.LANCUN_SPECIES_CATEGORIES || {};
    const imagePath = resolveImage(species.image || species.thumbnail);
    const hero = drawer.querySelector('[data-drawer-hero]');
    const placeholder = drawer.querySelector('[data-drawer-hero-placeholder]');
    const heroName = drawer.querySelector('[data-drawer-hero-name]');

    if (hero) {
      if (imagePath) {
        hero.style.backgroundImage = `url('${imagePath}')`;
        hero.classList.remove('is-placeholder');
        if (placeholder) placeholder.hidden = true;
      } else {
        hero.style.backgroundImage = '';
        hero.classList.add('is-placeholder');
        if (placeholder) placeholder.hidden = false;
        if (heroName) heroName.textContent = species.chineseName;
      }
    }

    const setText = (sel, value) => {
      const el = drawer.querySelector(sel);
      if (el) el.textContent = value ?? '';
    };

    setText('[data-drawer-name]', species.chineseName);
    setText('[data-drawer-en]', species.englishName);
    setText('[data-drawer-sci]', species.scientificName);
    setText('[data-drawer-group]', groupLabel(species.group));
    setText('[data-drawer-iucn]', species.iucnStatus);
    setText('[data-drawer-habitat]', (species.habitat || []).join('、') || '—');
    setText(
      '[data-drawer-ocean]',
      (species.ocean || []).map((id) => labelMap(cats.OCEANS || cats.HABITATS, id)).join('、') || '—'
    );
    setText('[data-drawer-desc]', species.description || '—');
    setText('[data-drawer-source]', species.source || '演示数据');

    const threatLabels = (species.threats || []).map((id) => labelMap(cats.THREATS, id));
    fillList(drawer.querySelector('[data-drawer-threats]'), threatLabels, true);
    fillList(drawer.querySelector('[data-drawer-protection]'), species.protection || [], false);

    const userBadge = drawer.querySelector('[data-drawer-user-badge]');
    if (userBadge) userBadge.hidden = !species.isUserAdded;

    const deleteBtn = drawer.querySelector('[data-drawer-delete]');
    if (deleteBtn) deleteBtn.hidden = !species.isUserAdded;

    const iucnEl = drawer.querySelector('[data-drawer-iucn]');
    if (iucnEl) {
      iucnEl.dataset.status = species.iucnStatus || '';
    }
  }

  function open(species, contextList) {
    if (!species) return;
    lastFocus = document.activeElement;
    currentSpecies = species;
    listContext = Array.isArray(contextList) && contextList.length ? contextList.slice() : [species];

    const drawer = document.querySelector('[data-species-drawer]');
    const backdrop = document.querySelector('[data-species-drawer-backdrop]');

    renderContent(species);
    drawer?.classList.add('is-open');
    backdrop?.classList.add('is-open');
    if (backdrop) backdrop.hidden = false;
    drawer?.setAttribute('aria-hidden', 'false');
    document.body.classList.add('drawer-open');
    drawer?.querySelector('[data-drawer-close]')?.focus();
  }

  function close() {
    const drawer = document.querySelector('[data-species-drawer]');
    const backdrop = document.querySelector('[data-species-drawer-backdrop]');
    drawer?.classList.remove('is-open');
    backdrop?.classList.remove('is-open');
    if (backdrop) backdrop.hidden = true;
    drawer?.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('drawer-open');
    currentSpecies = null;
    if (lastFocus && typeof lastFocus.focus === 'function') {
      try {
        lastFocus.focus();
      } catch {
        /* ignore */
      }
    }
  }

  function navigate(delta) {
    if (!currentSpecies || !listContext.length) return;
    const idx = listContext.findIndex((s) => s.id === currentSpecies.id);
    if (idx < 0) return;
    const next = listContext[(idx + delta + listContext.length) % listContext.length];
    if (!next) return;
    currentSpecies = next;
    renderContent(next);
  }

  function copyScientificName() {
    const drawer = document.querySelector('[data-species-drawer]');
    const sci = drawer?.querySelector('[data-drawer-sci]')?.textContent?.trim();
    const btn = drawer?.querySelector('[data-drawer-copy]');
    if (!sci) return;

    const done = () => {
      if (!btn) return;
      const original = btn.dataset.label || btn.textContent;
      btn.dataset.label = original;
      btn.textContent = '已复制';
      clearTimeout(copyResetTimer);
      copyResetTimer = setTimeout(() => {
        btn.textContent = btn.dataset.label || '复制拉丁学名';
      }, 1600);
    };

    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(sci).then(done).catch(() => {
        fallbackCopy(sci);
        done();
      });
      return;
    }
    fallbackCopy(sci);
    done();
  }

  function fallbackCopy(text) {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.left = '-9999px';
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand('copy');
    } catch {
      /* ignore */
    }
    ta.remove();
  }

  function deleteCurrent() {
    if (!currentSpecies?.isUserAdded) return;
    const ok = window.confirm('确认删除该用户新增档案？此操作不可撤销。');
    if (!ok) return;

    const id = currentSpecies.id;
    window.LancunLocalSpeciesStorage?.deleteUserAddedSpecies?.(id);
    close();
    window.LancunSpeciesSearchDock?.runSearch?.();
    window.LancunSpeciesRails?.render?.();
  }

  function handleOpenEvent(event) {
    const id = event.detail?.id;
    if (!id) return;
    const species = getDatabase().find((s) => s.id === id);
    if (!species) return;
    const source = event.detail?.source || null;
    open(species, resolveListContext(source));
  }

  function init() {
    if (bound) return;
    bound = true;

    const drawer = document.querySelector('[data-species-drawer]');
    const backdrop = document.querySelector('[data-species-drawer-backdrop]');

    drawer?.querySelectorAll('[data-drawer-close], [data-drawer-close-secondary]').forEach((btn) => {
      btn.addEventListener('click', close);
    });
    backdrop?.addEventListener('click', close);
    drawer?.querySelector('[data-drawer-prev]')?.addEventListener('click', () => navigate(-1));
    drawer?.querySelector('[data-drawer-next]')?.addEventListener('click', () => navigate(1));
    drawer?.querySelector('[data-drawer-copy]')?.addEventListener('click', copyScientificName);
    drawer?.querySelector('[data-drawer-delete]')?.addEventListener('click', deleteCurrent);

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && drawer?.classList.contains('is-open')) {
        e.preventDefault();
        close();
      }
    });

    document.addEventListener('lancun:open-species', handleOpenEvent);
  }

  return { init, open, close, renderContent, navigate };
})();
