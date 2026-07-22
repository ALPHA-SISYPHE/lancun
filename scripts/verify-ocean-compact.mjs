import { chromium } from 'playwright';

const BASE = process.env.OCEAN_VERIFY_URL || 'http://127.0.0.1:8080';

const browser = await chromium.launch();
const page = await browser.newPage();

await page.setViewportSize({ width: 1440, height: 900 });
await page.goto(`${BASE}/pages/ocean.html`, { waitUntil: 'networkidle', timeout: 45000 });
await page.waitForTimeout(1500);

const base = await page.evaluate(() => {
  const visual = document.querySelector('.ocean2-explorer__visual');
  const body = document.querySelector('.ocean2-explorer__body');
  const vr = visual?.getBoundingClientRect();
  const br = body?.getBoundingClientRect();
  const layout = document.querySelector('.ocean2-explorer__layout');
  const layoutCols = layout ? getComputedStyle(layout).gridTemplateColumns : '';
  const explorer = document.querySelector('.ocean2-explorer');
  const explorerBg = explorer ? getComputedStyle(explorer).backgroundImage + getComputedStyle(explorer).backgroundColor : '';
  return {
    pageVideo: Boolean(document.querySelector('.page-bg-video__media')),
    footerVideo: Boolean(document.querySelector('.ocean2-end__bg')),
    footerOverlay: Boolean(document.querySelector('.ocean2-end__overlay')),
    tabs: document.querySelectorAll('[data-ocean-tab]').length,
    reportKpis: document.querySelector('[data-report-kpis]')?.children.length,
    coverStats: document.querySelector('[data-cover-stats]')?.children.length,
    reportMain: Boolean(document.querySelector('.ocean2-data-main')),
    dataHeader: Boolean(document.querySelector('.ocean2-data-header')),
    observationGrid: Boolean(document.querySelector('.ocean2-observation-grid')),
    mechanism: Boolean(document.querySelector('[data-mechanism]')?.textContent?.trim()),
    footerCta: Boolean(document.querySelector('.ocean2-end__cta')),
    footerMain: Boolean(document.querySelector('.ocean2-end__main')),
    footerIndex: Boolean(document.querySelector('.ocean2-end__index[data-dock]')),
    fixedDock: Boolean(document.querySelector('.ocean2-dock')),
    indexPosition: document.querySelector('.ocean2-end__index')
      ? getComputedStyle(document.querySelector('.ocean2-end__index')).position
      : null,
    bodyBg: body ? getComputedStyle(body).backgroundColor : null,
    bodyZ: body ? getComputedStyle(body).zIndex : null,
    visualNoOverlap: Boolean(vr && br && vr.right <= br.left + 1),
    bodyReadableWidth: Boolean(br && br.width > 280),
    layoutHasTwoCols: (layoutCols.match(/px/g) || []).length >= 2,
    explorerBgClean: explorerBg.includes('rgb(234, 245, 247)') && !explorerBg.includes('linear-gradient'),
    maxVar: getComputedStyle(document.body).getPropertyValue('--ocean2-max').trim(),
    heroLabel: document.querySelector('[data-cover-stats] .ocean2-stat-block span')?.textContent,
    metrics: document.querySelectorAll('[data-metrics] .ocean2-metric').length,
    scrollHeight: document.documentElement.scrollHeight,
    fiveOceansTop: document.getElementById('five-oceans')?.offsetTop ?? null,
    viewportHeight: window.innerHeight,
    heroNavLinks: document.querySelectorAll('.ocean2-cover__nav-link').length,
    oceanDataAnchor: Boolean(document.getElementById('ocean-data')),
    oceanExplorerAnchor: Boolean(document.getElementById('ocean-explorer')),
    heroBreathRemoved: !document.querySelector('.ocean2-cover__breath'),
    oceanPrev: Boolean(document.querySelector('[data-ocean-prev]')),
    oceanNext: Boolean(document.querySelector('[data-ocean-next]')),
    oceanIndexText: document.querySelector('[data-ocean-index]')?.textContent?.trim() || '',
    heroAnchor: Boolean(document.getElementById('hero')),
    continueExploringAnchor: Boolean(document.getElementById('continue-exploring')),
    openSourcesTriggers: document.querySelectorAll('[data-open-sources]').length,
    footerCtaItems: document.querySelectorAll('.ocean2-end__cta-item').length,
    footerIndexLinks: document.querySelectorAll('.ocean2-end__index a').length,
    scrollProgress: Boolean(document.querySelector('[data-ocean-scroll-progress]')),
  };
});

await page.locator('[data-ocean-tab="indian"]').click();
await page.waitForTimeout(300);

const indian = await page.evaluate(() => ({
  panelTitle: document.querySelector('[data-ocean-panel] h3')?.textContent,
  visualNoOverlap: (() => {
    const vr = document.querySelector('.ocean2-explorer__visual')?.getBoundingClientRect();
    const br = document.querySelector('.ocean2-explorer__body')?.getBoundingClientRect();
    return Boolean(vr && br && vr.right <= br.left + 1);
  })(),
}));

await page.goto(`${BASE}/pages/ocean.html#ocean-atlantic`, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(800);

const hash = await page.evaluate(() => ({
  hashTitle: document.querySelector('[data-ocean-panel] h3')?.textContent,
}));

await page.goto(`${BASE}/pages/ocean.html`, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(800);

const smoke = { refreshDone: false, sourcesModal: false, dialogClosed: false, prevChanged: false, profileModal: false };

await page.locator('[data-refresh]').click();
try {
  await page.waitForFunction(
    () => document.querySelector('[data-metrics]')?.getAttribute('aria-busy') !== 'true',
    { timeout: 12000 },
  );
  smoke.refreshDone = true;
} catch {
  smoke.refreshDone = false;
}

await page.locator('[data-open-info]').click();
await page.waitForTimeout(200);
const sourcesState = await page.evaluate(() => {
  const dialog = document.querySelector('[data-dialog]');
  return {
    open: dialog?.open === true,
    hasSourcesClass: dialog?.classList.contains('ocean2-dialog--sources') === true,
    title: dialog?.querySelector('[data-dialog-title]')?.textContent || '',
  };
});
smoke.sourcesModal = sourcesState.open && sourcesState.hasSourcesClass && sourcesState.title.includes('公开观测');

await page.locator('[data-close-dialog]').click();
await page.waitForTimeout(200);
smoke.dialogClosed = await page.evaluate(() => !document.querySelector('[data-dialog]')?.open);

const beforePrev = await page.evaluate(() => document.querySelector('[data-ocean-panel] h3')?.textContent || '');
await page.locator('[data-ocean-prev]').click();
await page.waitForTimeout(300);
const afterPrev = await page.evaluate(() => document.querySelector('[data-ocean-panel] h3')?.textContent || '');
smoke.prevChanged = beforePrev !== afterPrev && Boolean(afterPrev);

await page.locator('[data-ocean-detail]').click();
await page.waitForTimeout(200);
smoke.profileModal = await page.evaluate(() => {
  const dialog = document.querySelector('[data-dialog]');
  return dialog?.open === true && dialog.classList.contains('ocean2-dialog--profile');
});
await page.locator('[data-close-dialog]').click();

const viewports = [1440, 1536, 1920, 375];
const overflowByWidth = {};
for (const width of viewports) {
  await page.setViewportSize({ width, height: width === 375 ? 812 : 900 });
  await page.waitForTimeout(300);
  overflowByWidth[width] = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
}

console.log(JSON.stringify({ base, indian, hash, smoke, overflowByWidth }, null, 2));
await browser.close();

const noOverflow = Object.values(overflowByWidth).every((v) => v === false);

const ok = base.pageVideo
  && base.footerVideo
  && base.footerOverlay
  && base.tabs === 5
  && base.reportKpis === 4
  && base.coverStats === 3
  && base.reportMain
  && base.dataHeader
  && base.observationGrid
  && base.mechanism
  && base.footerCta
  && base.footerMain
  && base.footerIndex
  && !base.fixedDock
  && base.indexPosition === 'relative'
  && base.visualNoOverlap
  && base.bodyReadableWidth
  && base.layoutHasTwoCols
  && base.explorerBgClean
  && base.maxVar === '1180px'
  && base.heroLabel === 'Ocean Coverage'
  && base.metrics === 6
  && indian.panelTitle === '印度洋'
  && indian.visualNoOverlap
  && hash.hashTitle === '大西洋'
  && noOverflow
  && base.fiveOceansTop !== null
  && base.fiveOceansTop < base.viewportHeight * 1.75
  && base.scrollHeight <= 2780
  && base.heroNavLinks === 3
  && base.oceanDataAnchor
  && base.oceanExplorerAnchor
  && base.heroBreathRemoved
  && base.oceanPrev
  && base.oceanNext
  && /^\S+\s+\d{2} \/ 05$/.test(base.oceanIndexText)
  && base.heroAnchor
  && base.continueExploringAnchor
  && base.openSourcesTriggers >= 2
  && base.footerCtaItems === 3
  && base.footerIndexLinks === 4
  && base.scrollProgress
  && smoke.refreshDone
  && smoke.sourcesModal
  && smoke.dialogClosed
  && smoke.prevChanged
  && smoke.profileModal;

process.exit(ok ? 0 : 1);
