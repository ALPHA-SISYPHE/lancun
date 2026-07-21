/**
 * 海洋生命档案馆 · Phase 10 smoke（Workspace / 折叠筛选 / 持久化）
 * 运行：node scripts/verify-life-archive.mjs
 */
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const PAGE = join(ROOT, 'pages', 'species.html').replace(/\\/g, '/');

async function checkViewport(page, width, height) {
  await page.setViewportSize({ width, height });
  await page.waitForTimeout(200);
  return page.evaluate(() => {
    const doc = document.documentElement;
    return {
      overflow: doc.scrollWidth > doc.clientWidth + 1,
      scrollWidth: doc.scrollWidth,
      clientWidth: doc.clientWidth,
    };
  });
}

async function measureDockState(page) {
  return page.evaluate(() => {
    const dock = document.querySelector('.search-dock-inner');
    const advanced = document.querySelector('[data-filter-advanced]');
    const style = dock ? getComputedStyle(dock) : null;
    return {
      dockHeight: dock?.offsetHeight || 0,
      dockScrollHeight: dock?.scrollHeight || 0,
      dockClientHeight: dock?.clientHeight || 0,
      dockOverflowY: style?.overflowY || '',
      advancedOpen: advanced?.classList.contains('is-open') || false,
      advancedBodyHeight: document.querySelector('.filter-advanced__body')?.offsetHeight || 0,
    };
  });
}

async function measureCompactLayout(page) {
  return page.evaluate(() => {
    const hero = document.querySelector('#life-archive-hero');
    const dock = document.querySelector('.search-dock-inner');
    const aiLab = document.querySelector('.ai-lab-shell');
    const footer = document.querySelector('.site-footer--archive');
    return {
      heroHeight: hero?.offsetHeight || 0,
      dockHeight: dock?.offsetHeight || 0,
      aiLabHeight: aiLab?.offsetHeight || 0,
      footerHeight: footer?.offsetHeight || 0,
      scrollHeight: document.documentElement.scrollHeight,
      gridCards: document.querySelectorAll('[data-species-grid] .species-card').length,
      stackedRails: document.querySelectorAll('.species-rail').length,
      video: !!document.querySelector('.page-bg-video video'),
    };
  });
}

async function measureWorkspaceCardLayout(page) {
  return page.evaluate(() => {
    const cards = [...document.querySelectorAll('[data-species-grid] .species-card')];
    const heights = cards.map((card) => card.offsetHeight);
    const descEls = [...document.querySelectorAll('[data-species-grid] .species-card__desc')];
    const descHidden = descEls.every((el) => {
      const style = getComputedStyle(el);
      return style.display === 'none' || el.offsetHeight === 0;
    });
    const minH = heights.length ? Math.min(...heights) : 0;
    const maxH = heights.length ? Math.max(...heights) : 0;

    const rail = document.querySelector('[data-category-rail]');
    const grid = document.querySelector('[data-species-grid]');
    const summary = document.querySelector('[data-summary-panel]');
    const railBottom = rail?.getBoundingClientRect().bottom || 0;
    const gridBottom = grid?.getBoundingClientRect().bottom || 0;
    const summaryBottom = summary?.getBoundingClientRect().bottom || 0;
    const bottoms = [railBottom, gridBottom, summaryBottom];
    const minBottom = Math.min(...bottoms);
    const maxBottom = Math.max(...bottoms);

    return {
      cardCount: cards.length,
      descHidden,
      cardHeightSpread: maxH - minH,
      columnBottomSpread: maxBottom - minBottom,
    };
  });
}

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));

  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(`file:///${PAGE}`, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('#life-archive-hero');
  await page.waitForFunction(() => typeof window.LancunSpeciesDetailDrawer !== 'undefined');
  await page.waitForSelector('[data-species-grid] .species-card');
  await page.waitForTimeout(300);

  const checks = await page.evaluate(() => ({
    video: !!document.querySelector('.page-bg-video video'),
    hero: !!document.querySelector('#life-archive-hero'),
    dock: !!document.querySelector('#species-search-dock'),
    workspace: !!document.querySelector('#species-workspace'),
    workspaceVisible: !document.querySelector('#species-workspace')?.hidden,
    resultsHidden: !!document.querySelector('#species-search-results')?.hidden,
    drawerDom: !!document.querySelector('[data-species-drawer]'),
    lab: !!document.querySelector('#ai-identification-lab'),
    uploadZone: !!document.querySelector('[data-upload-zone], [data-ai-upload-zone]'),
    fileInput: !!document.querySelector('[data-ai-file-input]'),
    startBtn: !!document.querySelector('[data-start-recognize], [data-ai-start]'),
    recognitionPanel: !!document.querySelector('[data-recognition-panel]'),
    aiApiConfig: typeof window.LANCUN_AI_RECOGNITION_API === 'string',
    aiLabInit: typeof window.LancunAIIdentificationLab?.init === 'function',
    newRecordPanel: !!document.querySelector('[data-new-record-panel]'),
    toastDom: !!document.querySelector('[data-archive-toast]'),
    addNewBtn: !!document.querySelector('[data-add-new-record]'),
    categoryCount: document.querySelectorAll('[data-category-rail] [data-category-id]').length,
    stackedRails: document.querySelectorAll('.species-rail').length,
    gridCards: document.querySelectorAll('[data-species-grid] .species-card').length,
    pageCards: document.querySelectorAll('.species-card').length,
    summaryPanel: !!document.querySelector('[data-summary-panel] .summary-panel__inner'),
    summaryCategory: !!document.querySelector('[data-summary-category]'),
    viewAllBtn: !!document.querySelector('[data-ws-view-all]'),
    loadMoreBtn: !!document.querySelector('[data-ws-load-more]'),
    nextGroupBtn: !!document.querySelector('[data-ws-next-group]'),
    autoplayBtn: !!document.querySelector('[data-ws-autoplay]'),
    advancedHidden: !document.querySelector('[data-filter-advanced]')?.classList.contains('is-open'),
    moreFilters: !!document.querySelector('[data-toggle-advanced]'),
    dbSize: window.LANCUN_SPECIES_DB?.length || 0,
    activeCategory: document
      .querySelector('[data-category-rail] [data-category-id].is-active')
      ?.getAttribute('data-category-id') || '',
  }));

  const workspaceCards = await measureWorkspaceCardLayout(page);

  const compactLayout = await measureCompactLayout(page);
  const dockCollapsed = await measureDockState(page);

  await page.click('[data-toggle-advanced]');
  await page.waitForTimeout(320);
  const dockExpanded = await measureDockState(page);

  await page.click('[data-toggle-advanced]');
  await page.waitForTimeout(320);
  const dockClosedAgain = await measureDockState(page);

  const firstCategory = checks.activeCategory;
  await page.evaluate(() => {
    const items = [...document.querySelectorAll('[data-category-rail] [data-category-id]')];
    const next = items.find((el) => !el.classList.contains('is-active'));
    next?.click();
  });
  await page.waitForTimeout(200);

  const afterCategorySwitch = await page.evaluate(() => ({
    activeCategory: document
      .querySelector('[data-category-rail] [data-category-id].is-active')
      ?.getAttribute('data-category-id') || '',
    gridCards: document.querySelectorAll('[data-species-grid] .species-card').length,
    stackedRails: document.querySelectorAll('.species-rail').length,
    summaryName: document.querySelector('[data-summary-category]')?.textContent?.trim() || '',
  }));

  // 切到「全部物种」保证换一组有足够样本
  await page.evaluate(() => {
    document.querySelector('[data-category-id="all"]')?.click();
  });
  await page.waitForTimeout(150);

  const beforeShuffle = await page.evaluate(() => {
    const first = document.querySelector('[data-species-grid] [data-species-id]');
    const win = window.LancunSpeciesRails?.getWindowState?.() || {};
    return {
      firstId: first?.getAttribute('data-species-id') || '',
      pageOffset: win.pageOffset ?? null,
      ids: [...document.querySelectorAll('[data-species-grid] [data-species-id]')].map((el) =>
        el.getAttribute('data-species-id')
      ),
    };
  });

  await page.click('[data-ws-next-group]');
  await page.waitForTimeout(200);

  const afterShuffle = await page.evaluate(() => {
    const first = document.querySelector('[data-species-grid] [data-species-id]');
    const win = window.LancunSpeciesRails?.getWindowState?.() || {};
    return {
      firstId: first?.getAttribute('data-species-id') || '',
      pageOffset: win.pageOffset ?? null,
      activeCategory: win.activeCategoryId || '',
      gridCards: document.querySelectorAll('[data-species-grid] .species-card').length,
      ids: [...document.querySelectorAll('[data-species-grid] [data-species-id]')].map((el) =>
        el.getAttribute('data-species-id')
      ),
    };
  });

  const afterSearch = await page.evaluate(() => {
    window.LancunSpeciesSearchDock?.setSearchQuery?.('\u4e2d\u534e\u767d\u6d77\u8c5a');
    const dock = window.LancunSpeciesSearchDock?.getState?.() || {};
    return {
      isSearchMode: !!dock.isSearchMode,
      resultCount: dock.searchResults?.length || 0,
      query: dock.searchQuery || '',
      workspaceVisible: !document.querySelector('#species-workspace')?.hidden,
      resultsHidden: !!document.querySelector('#species-search-results')?.hidden,
      isSearchLayout: document.querySelector('[data-species-rails]')?.classList.contains('is-search-mode'),
      gridCards: document.querySelectorAll('[data-species-grid] .species-card').length,
      searchTitle: document.querySelector('[data-ws-search-title]')?.textContent?.trim() || '',
      filterSummary: !!document.querySelector('[data-category-rail].is-filter-summary'),
      clearFiltersBtn: !!document.querySelector('[data-ws-reset-filters]'),
      nextGroupHidden: document.querySelector('[data-ws-next-group]')?.hidden ?? false,
      stackedRails: document.querySelectorAll('.species-rail').length,
    };
  });
  await page.waitForTimeout(200);

  await page.click('[data-species-search-clear]');
  await page.waitForTimeout(200);

  const afterClear = await page.evaluate(() => {
    const dock = window.LancunSpeciesSearchDock?.getState?.() || {};
    return {
      isSearchMode: !!dock.isSearchMode,
      workspaceVisible: !document.querySelector('#species-workspace')?.hidden,
      resultsHidden: !!document.querySelector('#species-search-results')?.hidden,
      categoryNav: document.querySelectorAll('[data-category-rail] [data-category-id]').length,
      isSearchLayout: document.querySelector('[data-species-rails]')?.classList.contains('is-search-mode'),
    };
  });

  const afterEmptySearch = await page.evaluate(() => {
    window.LancunSpeciesSearchDock?.setSearchQuery?.('__no_match_xyz_phase12__');
    const dock = window.LancunSpeciesSearchDock?.getState?.() || {};
    return {
      isSearchMode: !!dock.isSearchMode,
      resultCount: dock.searchResults?.length || 0,
      emptyVisible: !!document.querySelector('[data-ws-search-empty]'),
      emptyReset: !!document.querySelector('[data-ws-empty-reset]'),
      emptyAi: !!document.querySelector('[data-ws-empty-ai]'),
      workspaceVisible: !document.querySelector('#species-workspace')?.hidden,
      resultsHidden: !!document.querySelector('#species-search-results')?.hidden,
    };
  });
  await page.waitForTimeout(200);

  await page.evaluate(() => {
    window.LancunSpeciesSearchDock?.resetAll?.();
  });
  await page.waitForTimeout(250);

  await page.click('[data-filter-group="group"] [data-filter-id="cetacean"]');
  await page.waitForTimeout(250);

  const afterFilter = await page.evaluate(() => {
    const dock = window.LancunSpeciesSearchDock?.getState?.() || {};
    const loadMore = document.querySelector('[data-ws-load-more]');
    return {
      isSearchMode: !!dock.isSearchMode,
      resultCount: dock.searchResults?.length || 0,
      gridCards: document.querySelectorAll('[data-species-grid] .species-card').length,
      loadMoreVisible: loadMore ? !loadMore.hidden : false,
      workspaceVisible: !document.querySelector('#species-workspace')?.hidden,
      resultsHidden: !!document.querySelector('#species-search-results')?.hidden,
      stackedRails: document.querySelectorAll('.species-rail').length,
    };
  });

  let afterLoadMore = null;
  let afterLoadMoreCollapse = null;
  if (afterFilter.loadMoreVisible) {
    await page.click('[data-ws-load-more]');
    await page.waitForTimeout(200);
    afterLoadMore = await page.evaluate(() => {
      const loadMore = document.querySelector('[data-ws-load-more]');
      return {
        gridCards: document.querySelectorAll('[data-species-grid] .species-card').length,
        loadMoreLabel: loadMore?.textContent?.trim() || '',
        loadMoreExpanded: loadMore?.getAttribute('aria-expanded') === 'true',
        loadMoreHidden: loadMore?.hidden ?? true,
      };
    });

    if (afterLoadMore.loadMoreExpanded) {
      await page.click('[data-ws-load-more]');
      await page.waitForTimeout(200);
      afterLoadMoreCollapse = await page.evaluate(() => {
        const loadMore = document.querySelector('[data-ws-load-more]');
        return {
          gridCards: document.querySelectorAll('[data-species-grid] .species-card').length,
          loadMoreLabel: loadMore?.textContent?.trim() || '',
          loadMoreExpanded: loadMore?.getAttribute('aria-expanded') === 'true',
          loadMoreHidden: loadMore?.hidden ?? true,
        };
      });
    }
  }

  await page.click('[data-reset-all-filters]');
  await page.waitForTimeout(250);
  await page.waitForSelector('[data-species-grid] .species-card');

  const openAttempt = await page.evaluate(() => {
    const btn = document.querySelector('[data-species-grid] [data-open-species]');
    if (!btn) return { ok: false };
    btn.click();
    return { ok: true, id: btn.getAttribute('data-open-species') };
  });
  await page.waitForSelector('[data-species-drawer].is-open', { timeout: 5000 });
  await page.waitForTimeout(200);

  const afterOpen = await page.evaluate(() => {
    const drawer = document.querySelector('[data-species-drawer]');
    const style = drawer ? getComputedStyle(drawer) : null;
    return {
      open: drawer?.classList.contains('is-open') || false,
      name: drawer?.querySelector('[data-drawer-name]')?.textContent?.trim() || '',
      ariaHidden: drawer?.getAttribute('aria-hidden'),
      position: style?.position || '',
      right: style?.right || '',
      top: style?.top || '',
      widthPx: drawer ? drawer.getBoundingClientRect().width : 0,
      leftPx: drawer ? drawer.getBoundingClientRect().left : 0,
      viewport: window.innerWidth,
    };
  });

  const nameBeforeNext = afterOpen.name;
  await page.evaluate(() => {
    const body = document.querySelector('.species-drawer__body');
    const next = document.querySelector('[data-drawer-next]');
    body?.scrollTo({ top: body.scrollHeight });
    next?.click();
  });
  await page.waitForTimeout(200);

  const afterNext = await page.evaluate(() => ({
    name: document.querySelector('[data-drawer-name]')?.textContent?.trim() || '',
    stillOpen: document.querySelector('[data-species-drawer]')?.classList.contains('is-open') || false,
  }));

  await page.keyboard.press('Escape');
  await page.waitForTimeout(200);

  const afterEsc = await page.evaluate(() => ({
    open: document.querySelector('[data-species-drawer]')?.classList.contains('is-open') || false,
    ariaHidden: document.querySelector('[data-species-drawer]')?.getAttribute('aria-hidden'),
  }));

  page.on('dialog', async (dialog) => {
    await dialog.accept();
  });

  await page.evaluate(() => {
    localStorage.removeItem('ocean-life-user-species');
  });

  await page.evaluate(() => {
    document.querySelector('#ai-identification-lab')?.scrollIntoView({ block: 'center' });
  });
  await page.waitForTimeout(200);

  const newRecordFromUnmatched = await page.evaluate(async () => {
    const tiny =
      'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAn/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCwAA8A/9k=';
    const blob = await fetch(tiny).then((r) => r.blob());
    const file = new File([blob], 'test-clue.jpg', { type: 'image/jpeg' });
    window.LancunAIIdentificationLabSetPreview?.(file, tiny);
    window.LancunAIIdentificationLabStubRecognize?.(async () => ({
      chineseName: '测试线索海豚',
      englishName: 'Test Clue Dolphin',
      scientificName: 'Testus cluinus',
      confidence: 71,
      rawResult: { ok: true },
      ok: true,
      previewUrl: tiny,
      brief: '用于验收的新的观察记录。',
    }));
    await window.LancunAIIdentificationLabRunRecognition?.(file);
    window.LancunAIIdentificationLabStubRecognize?.(null);

    const unmatchedVisible = !document.querySelector('[data-ai-state="unmatched"]')?.hidden;
    document.querySelector('[data-add-new-record]')?.click();

    const panel = document.querySelector('[data-new-record-panel]');
    const title = panel?.querySelector('#new-record-title')?.textContent || '';
    const html = panel?.innerText || '';
    return {
      unmatchedVisible,
      uiState: window.LancunAIIdentificationLab?.getUIState?.() || '',
      visible: panel ? !panel.hidden : false,
      title,
      hasClue: title.includes('档案线索'),
      hasForbidden: html.includes('新物种'),
      draftPrefilled:
        (document.querySelector('[data-draft-chineseName]')?.value || '').includes('测试线索海豚'),
      imageLabel: !!document.querySelector('[data-new-record-image-label]'),
    };
  });

  await page.fill('[data-draft-chineseName]', '测试线索海豚');
  await page.evaluate(() => window.LancunNewRecordContribution.submit());
  await page.waitForTimeout(400);

  const afterSubmit = await page.evaluate(() => {
    const raw = localStorage.getItem('ocean-life-user-species');
    let list = [];
    try {
      list = raw ? JSON.parse(raw) : [];
    } catch {
      list = [];
    }
    const item = list[0] || {};
    const required = [
      'id',
      'chineseName',
      'englishName',
      'scientificName',
      'group',
      'iucnStatus',
      'habitat',
      'ocean',
      'image',
      'thumbnail',
      'description',
      'threats',
      'protection',
      'source',
      'isUserAdded',
    ];
    const schemaOk = required.every((key) => Object.prototype.hasOwnProperty.call(item, key));
    const drawer = document.querySelector('[data-species-drawer]');
    const badge = drawer?.querySelector('[data-drawer-user-badge]');
    const userCat = document.querySelector('[data-category-id="user-added"]');
    return {
      saved: Array.isArray(list) && list.length >= 1,
      savedName: item.chineseName || '',
      isUserAdded: item.isUserAdded === true,
      sourceOk: item.source === 'AI Recognition + User Confirmation',
      schemaOk,
      drawerOpen: drawer?.classList.contains('is-open') || false,
      badgeVisible: badge ? !badge.hidden : false,
      userCategoryExists: !!userCat,
      userCategoryActive: userCat?.classList.contains('is-active') || false,
      userGridCards: document.querySelectorAll('[data-species-grid] .species-card').length,
    };
  });

  await page.evaluate(() => {
    window.LancunSpeciesSearchDock?.setSearchQuery?.('测试线索海豚');
  });
  await page.waitForTimeout(250);

  const afterSearchUserAdded = await page.evaluate(() => {
    const dock = window.LancunSpeciesSearchDock?.getState?.() || {};
    return {
      isSearchMode: !!dock.isSearchMode,
      resultCount: dock.searchResults?.length || 0,
      hasSavedName: (dock.searchResults || []).some((s) => s.chineseName === '测试线索海豚'),
      gridCards: document.querySelectorAll('[data-species-grid] .species-card').length,
      workspaceVisible: !document.querySelector('#species-workspace')?.hidden,
    };
  });

  await page.keyboard.press('Escape');
  await page.waitForTimeout(200);

  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForSelector('#life-archive-hero');
  await page.waitForFunction(() => typeof window.LancunSpeciesDetailDrawer !== 'undefined');
  await page.waitForSelector('[data-category-id="user-added"]', { timeout: 8000 });
  await page.click('[data-category-id="user-added"]');
  await page.waitForSelector('[data-species-grid] .species-card', { timeout: 5000 });
  await page.waitForTimeout(300);

  const afterReload = await page.evaluate(() => {
    const raw = localStorage.getItem('ocean-life-user-species');
    let list = [];
    try {
      list = raw ? JSON.parse(raw) : [];
    } catch {
      list = [];
    }
    const userCat = document.querySelector('[data-category-id="user-added"]');
    const island = document.querySelector('.page-island');
    const islandBg = island ? getComputedStyle(island).backgroundColor : '';
    const parseAlpha = (bg) => {
      if (!bg || bg === 'transparent') return 0;
      const m = bg.match(/rgba?\(([^)]+)\)/);
      if (!m) return 1;
      const parts = m[1].split(',').map((s) => s.trim());
      if (parts.length === 4) return Number(parts[3]);
      return 1;
    };
    return {
      persisted: Array.isArray(list) && list.length >= 1,
      savedName: list[0]?.chineseName || '',
      userCategoryExists: !!userCat,
      userGridCards: document.querySelectorAll('[data-species-grid] .species-card').length,
      video: !!document.querySelector('.page-bg-video video'),
      islandAlpha: parseAlpha(islandBg),
      islandBg,
    };
  });

  await page.evaluate(() => {
    document.querySelector('[data-species-grid] [data-open-species]')?.click();
  });
  await page.waitForSelector('[data-species-drawer].is-open', { timeout: 5000 });
  await page.waitForTimeout(200);

  await page.evaluate(() => {
    document.querySelector('[data-drawer-delete]')?.click();
  });
  await page.waitForTimeout(300);

  const afterDelete = await page.evaluate(() => {
    const raw = localStorage.getItem('ocean-life-user-species');
    let list = [];
    try {
      list = raw ? JSON.parse(raw) : [];
    } catch {
      list = [];
    }
    return {
      cleared: !list.length,
      drawerClosed: !document.querySelector('[data-species-drawer]')?.classList.contains('is-open'),
    };
  });

  const desktop = await checkViewport(page, 1440, 900);
  const wide1536 = await checkViewport(page, 1536, 900);
  const wide1920 = await checkViewport(page, 1920, 900);
  const tablet = await checkViewport(page, 768, 1024);

  await page.evaluate(() => {
    document.querySelector('[data-species-grid] [data-open-species]')?.click();
  });
  await page.waitForSelector('[data-species-drawer].is-open', { timeout: 5000 });
  await page.waitForTimeout(150);

  const tabletDrawer = await page.evaluate(() => {
    const drawer = document.querySelector('[data-species-drawer]');
    const style = drawer ? getComputedStyle(drawer) : null;
    const rect = drawer?.getBoundingClientRect();
    return {
      position: style?.position || '',
      widthPx: rect?.width || 0,
      maxAllowed: window.innerWidth * 0.8 + 1,
      open: drawer?.classList.contains('is-open') || false,
    };
  });

  await page.keyboard.press('Escape');
  await page.waitForTimeout(150);

  const mobile = await checkViewport(page, 375, 812);

  const result = {
    ...checks,
    firstCategory,
    afterCategorySwitch,
    beforeShuffle,
    afterShuffle,
    openAttempt,
    afterSearch,
    afterClear,
    afterEmptySearch,
    afterFilter,
    afterLoadMore,
    afterLoadMoreCollapse,
    afterOpen,
    afterNext,
    afterEsc,
    newRecordFromUnmatched,
    afterSubmit,
    afterSearchUserAdded,
    afterReload,
    afterDelete,
    compactLayout,
    workspaceCards,
    dockExpand: {
      collapsedHeight: dockCollapsed.dockHeight,
      expandedHeight: dockExpanded.dockHeight,
      closedAgainHeight: dockClosedAgain.dockHeight,
      grewOnExpand: dockExpanded.dockHeight > dockCollapsed.dockHeight,
      noInnerScrollOnExpand: dockExpanded.dockScrollHeight <= dockExpanded.dockClientHeight + 1,
      advancedOpened: dockExpanded.advancedOpen && dockExpanded.advancedBodyHeight > 0,
      shrankOnCollapse:
        dockClosedAgain.dockHeight <= dockCollapsed.dockHeight + 4 &&
        dockClosedAgain.dockHeight >= dockCollapsed.dockHeight - 4,
      collapsedAgain: !dockClosedAgain.advancedOpen,
    },
    tabletDrawer,
    desktopOverflow: desktop.overflow,
    wide1536Overflow: wide1536.overflow,
    wide1920Overflow: wide1920.overflow,
    tabletOverflow: tablet.overflow,
    mobileOverflow: mobile.overflow,
    errors,
  };

  console.log(JSON.stringify(result, null, 2));

  await browser.close();

  const isRightDrawer =
    afterOpen.position === 'fixed' &&
    afterOpen.open &&
    afterOpen.leftPx > afterOpen.viewport * 0.4 &&
    afterOpen.widthPx >= 320 &&
    afterOpen.widthPx <= 521;

  const islandOk = afterReload.video && afterReload.islandAlpha < 0.95;
  const tabletDrawerOk =
    tabletDrawer.position === 'fixed' && tabletDrawer.widthPx <= tabletDrawer.maxAllowed;

  const shuffleChanged =
    afterShuffle.activeCategory === 'all' &&
    afterShuffle.gridCards >= 1 &&
    afterShuffle.gridCards <= 8 &&
    (afterShuffle.pageOffset !== beforeShuffle.pageOffset ||
      afterShuffle.firstId !== beforeShuffle.firstId ||
      JSON.stringify(afterShuffle.ids) !== JSON.stringify(beforeShuffle.ids));

  const workspaceCardsOk =
    workspaceCards.cardCount === 8 &&
    workspaceCards.descHidden &&
    workspaceCards.cardHeightSpread <= 2 &&
    workspaceCards.columnBottomSpread <= 4;

  const loadMoreToggleOk =
    !afterLoadMore ||
    (afterLoadMore.gridCards > 8 &&
      afterLoadMore.loadMoreLabel === '收起' &&
      afterLoadMore.loadMoreExpanded &&
      afterLoadMoreCollapse &&
      afterLoadMoreCollapse.gridCards === 8 &&
      !afterLoadMoreCollapse.loadMoreExpanded &&
      (afterLoadMoreCollapse.loadMoreLabel === '查看更多' || afterLoadMoreCollapse.loadMoreHidden));

  const dockExpandOk =
    dockExpanded.dockHeight > dockCollapsed.dockHeight &&
    dockExpanded.dockScrollHeight <= dockExpanded.dockClientHeight + 1 &&
    dockExpanded.advancedOpen &&
    dockExpanded.advancedBodyHeight > 0 &&
    dockClosedAgain.dockHeight <= dockCollapsed.dockHeight + 4 &&
    dockClosedAgain.dockHeight >= dockCollapsed.dockHeight - 4 &&
    !dockClosedAgain.advancedOpen;

  const ok =
    checks.video &&
    checks.hero &&
    checks.dock &&
    checks.workspace &&
    checks.workspaceVisible &&
    checks.resultsHidden &&
    checks.drawerDom &&
    checks.lab &&
    checks.uploadZone &&
    checks.fileInput &&
    checks.startBtn &&
    checks.recognitionPanel &&
    checks.aiApiConfig &&
    checks.aiLabInit &&
    checks.newRecordPanel &&
    checks.toastDom &&
    checks.addNewBtn &&
    checks.categoryCount >= 2 &&
    checks.stackedRails === 0 &&
    checks.gridCards >= 1 &&
    checks.gridCards <= 8 &&
    checks.pageCards < 100 &&
    checks.summaryPanel &&
    checks.summaryCategory &&
    checks.viewAllBtn &&
    checks.loadMoreBtn &&
    checks.nextGroupBtn &&
    checks.autoplayBtn &&
    checks.advancedHidden &&
    checks.moreFilters &&
    checks.dbSize >= 100 &&
    afterCategorySwitch.stackedRails === 0 &&
    afterCategorySwitch.activeCategory &&
    afterCategorySwitch.activeCategory !== firstCategory &&
    afterCategorySwitch.summaryName.length > 0 &&
    shuffleChanged &&
    afterSearch.isSearchMode &&
    afterSearch.workspaceVisible &&
    afterSearch.resultsHidden &&
    afterSearch.isSearchLayout &&
    afterSearch.filterSummary &&
    afterSearch.clearFiltersBtn &&
    afterSearch.nextGroupHidden &&
    afterSearch.stackedRails === 0 &&
    afterSearch.gridCards >= 1 &&
    afterSearch.gridCards <= 8 &&
    afterSearch.resultCount >= 1 &&
    afterSearch.searchTitle.includes('\u4e2a') &&
    !afterClear.isSearchMode &&
    afterClear.workspaceVisible &&
    afterClear.resultsHidden &&
    !afterClear.isSearchLayout &&
    afterClear.categoryNav >= 2 &&
    afterEmptySearch.isSearchMode &&
    afterEmptySearch.resultCount === 0 &&
    afterEmptySearch.emptyVisible &&
    afterEmptySearch.emptyReset &&
    afterEmptySearch.emptyAi &&
    afterEmptySearch.workspaceVisible &&
    afterEmptySearch.resultsHidden &&
    afterFilter.isSearchMode &&
    afterFilter.workspaceVisible &&
    afterFilter.resultsHidden &&
    afterFilter.stackedRails === 0 &&
    afterFilter.gridCards <= 8 &&
    (afterFilter.resultCount <= 8 || afterFilter.loadMoreVisible) &&
    (!afterLoadMore || afterLoadMore.gridCards > 8) &&
    loadMoreToggleOk &&
    afterOpen.open &&
    afterOpen.name.length > 0 &&
    afterOpen.ariaHidden === 'false' &&
    isRightDrawer &&
    afterNext.stillOpen &&
    afterNext.name.length > 0 &&
    afterNext.name !== nameBeforeNext &&
    !afterEsc.open &&
    afterEsc.ariaHidden === 'true' &&
    newRecordFromUnmatched.unmatchedVisible &&
    newRecordFromUnmatched.uiState === 'unmatched' &&
    newRecordFromUnmatched.visible &&
    newRecordFromUnmatched.hasClue &&
    !newRecordFromUnmatched.hasForbidden &&
    newRecordFromUnmatched.draftPrefilled &&
    newRecordFromUnmatched.imageLabel &&
    afterSubmit.saved &&
    afterSubmit.isUserAdded &&
    afterSubmit.schemaOk &&
    afterSubmit.sourceOk &&
    afterSubmit.drawerOpen &&
    afterSubmit.badgeVisible &&
    afterSubmit.userCategoryExists &&
    afterSearchUserAdded.isSearchMode &&
    afterSearchUserAdded.hasSavedName &&
    afterSearchUserAdded.resultCount >= 1 &&
    afterSearchUserAdded.gridCards >= 1 &&
    afterSearchUserAdded.workspaceVisible &&
    afterReload.persisted &&
    afterReload.userCategoryExists &&
    afterReload.userGridCards >= 1 &&
    islandOk &&
    afterDelete.cleared &&
    compactLayout.heroHeight >= 460 &&
    compactLayout.heroHeight <= 520 &&
    compactLayout.dockHeight >= 180 &&
    compactLayout.dockHeight <= 400 &&
    compactLayout.aiLabHeight >= 360 &&
    compactLayout.aiLabHeight <= 460 &&
    compactLayout.footerHeight >= 120 &&
    compactLayout.footerHeight <= 180 &&
    compactLayout.gridCards <= 8 &&
    compactLayout.stackedRails === 0 &&
    compactLayout.video &&
    compactLayout.scrollHeight <= 4200 &&
    workspaceCardsOk &&
    dockExpandOk &&
    tabletDrawerOk &&
    !desktop.overflow &&
    !wide1536.overflow &&
    !wide1920.overflow &&
    !tablet.overflow &&
    !mobile.overflow &&
    errors.length === 0;

  process.exit(ok ? 0 : 1);
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
