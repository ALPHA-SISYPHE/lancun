import { chromium } from 'playwright';

const BASE = process.env.RESCUE_VERIFY_URL || 'http://127.0.0.1:8080';
const MAX_SCROLL_HEIGHT = Number(process.env.RESCUE_MAX_SCROLL_HEIGHT || 3900);
const MAX_SCROLL_RATIO = Number(process.env.RESCUE_MAX_SCROLL_RATIO || 4.3);

const browser = await chromium.launch();
const errors = [];

const assert = (name, ok, detail = '') => {
  console.log(`${ok ? 'OK' : 'FAIL'} ${name}${detail ? ` — ${detail}` : ''}`);
  if (!ok) errors.push(name);
};

const consoleErrors = [];
const trackPage = (page) => {
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  page.on('pageerror', (err) => consoleErrors.push(String(err)));
};

const desktop = await browser.newPage();
trackPage(desktop);
await desktop.setViewportSize({ width: 1440, height: 900 });
await desktop.goto(`${BASE}/pages/rescue.html`, { waitUntil: 'domcontentloaded', timeout: 45000 });
await desktop.waitForFunction(
  () => (document.querySelector('[data-rescue-hero-ribbon]')?.children.length ?? 0) >= 5,
  { timeout: 10000 },
);
await desktop.waitForTimeout(500);

const desktopMetrics = await desktop.evaluate(() => {
  const command = document.getElementById('pollution-command');
  const commandTop = command?.getBoundingClientRect().top ?? 9999;
  const anchors = document.querySelector('.pollution-hero__anchors');
  const ribbon = document.querySelector('.pollution-hero__status-ribbon');
  const anchorsRect = anchors?.getBoundingClientRect();
  const ribbonRect = ribbon?.getBoundingClientRect();
  return {
    pageVideo: Boolean(document.querySelector('.page-bg-video__media')),
    scrollHeight: document.documentElement.scrollHeight,
    viewportHeight: window.innerHeight,
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
    commandTop,
    heroRibbon: document.querySelector('[data-rescue-hero-ribbon]')?.children.length ?? 0,
    heroAnchorGap: ribbonRect && anchorsRect ? ribbonRect.top - anchorsRect.bottom : -1,
    mapPins: document.querySelectorAll('[data-rescue-map-pins] .rescue-watch__pin, [data-rescue-map-pins] circle').length,
    filterBtns: document.querySelectorAll('[data-rescue-status-filter] button').length,
    chartTabs: document.querySelectorAll('[data-chart-tab]').length,
    dataSourcesTriggers: document.querySelectorAll('[data-rescue-data-sources-open]').length,
    footerLinks: document.querySelectorAll('.rescue-end__cta-item').length,
  };
});

assert('page video present', desktopMetrics.pageVideo);
assert(
  'desktop scroll height budget',
  desktopMetrics.scrollHeight <= MAX_SCROLL_HEIGHT,
  `${desktopMetrics.scrollHeight}px (max ${MAX_SCROLL_HEIGHT})`,
);
assert(
  'desktop scroll ratio',
  desktopMetrics.scrollHeight / desktopMetrics.viewportHeight <= MAX_SCROLL_RATIO,
  `${(desktopMetrics.scrollHeight / desktopMetrics.viewportHeight).toFixed(2)} (max ${MAX_SCROLL_RATIO})`,
);
assert(
  'desktop no horizontal overflow',
  desktopMetrics.scrollWidth <= desktopMetrics.clientWidth + 1,
  `${desktopMetrics.scrollWidth} vs ${desktopMetrics.clientWidth}`,
);
assert(
  'command deck within ~1.2 viewport',
  desktopMetrics.commandTop <= desktopMetrics.viewportHeight * 1.2,
  `top ${Math.round(desktopMetrics.commandTop)}px`,
);
assert('hero ribbon cells', desktopMetrics.heroRibbon >= 5, String(desktopMetrics.heroRibbon));
assert(
  'hero anchors clear of ribbon',
  desktopMetrics.heroAnchorGap >= 8,
  `${Math.round(desktopMetrics.heroAnchorGap)}px`,
);
assert('map pins rendered', desktopMetrics.mapPins >= 4, String(desktopMetrics.mapPins));
assert('status filters', desktopMetrics.filterBtns >= 4, String(desktopMetrics.filterBtns));
assert('chart tabs removed', desktopMetrics.chartTabs === 0, String(desktopMetrics.chartTabs));
assert('data sources triggers', desktopMetrics.dataSourcesTriggers >= 3, String(desktopMetrics.dataSourcesTriggers));
assert('footer explore links', desktopMetrics.footerLinks === 3, String(desktopMetrics.footerLinks));

await desktop.locator('[data-rescue-deck-refresh]').click();
await desktop.waitForTimeout(700);
const refreshedAt = await desktop.locator('[data-rescue-deck-refreshed-at]').textContent();
assert('refresh observe updates timestamp', refreshedAt && refreshedAt.trim() !== '—', refreshedAt || 'empty');

const filterBtn = desktop.locator('[data-rescue-status-filter] button').first();
if (await filterBtn.count()) {
  await filterBtn.click();
  await desktop.waitForTimeout(200);
}
assert('status filter clickable', await filterBtn.count() > 0);

const chartInsights = await desktop.evaluate(() => {
  const panel = document.querySelector('.pollution-insight-panel');
  const grid = document.querySelector('.insight-panel-grid');
  const canvas = document.querySelector('.trend-chart-card__canvas');
  const ring = document.querySelector('.composition-card .composition-ring');
  const svg = document.querySelector('.trend-chart-card__canvas .rescue-trend svg');
  const yUnit = document.querySelector('.pollution-insight-panel .rescue-trend__unit');
  const ringSegments = document.querySelectorAll('.composition-ring__segment');
  return {
    hasGrid: Boolean(grid),
    hasTrendCard: Boolean(document.querySelector('[data-rescue-trend-card] .rescue-trend svg')),
    hasRing: Boolean(ring),
    hasBars: Boolean(document.querySelector('.source-structure-card .rescue-bar')),
    panelHeight: panel?.getBoundingClientRect().height ?? 0,
    gridHeight: grid?.getBoundingClientRect().height ?? 0,
    canvasHeight: canvas?.getBoundingClientRect().height ?? 0,
    ringSize: ring?.getBoundingClientRect().width ?? 0,
    svgHeight: svg?.getBoundingClientRect().height ?? 0,
    yearLabels: document.querySelectorAll('.rescue-trend__label').length,
    yTicks: document.querySelectorAll('.pollution-insight-panel .rescue-trend__tick').length,
    yUnitText: yUnit?.textContent?.trim() ?? '',
    ringSegmentCount: ringSegments.length,
    barColors: [...document.querySelectorAll('.pollution-insight-panel .insight-source-bars .chart-fill')].map(
      (el) => getComputedStyle(el).backgroundColor,
    ),
    sourcesSummary: document.querySelector('[data-rescue-sources-summary]')?.textContent?.trim() ?? '',
    tabCount: document.querySelectorAll('[data-chart-tab]').length,
  };
});

assert('no chart tabs', chartInsights.tabCount === 0);
assert('insight panel grid', chartInsights.hasGrid && chartInsights.hasTrendCard);
assert('insight ring and bars', chartInsights.hasRing && chartInsights.hasBars);
assert(
  'insight panel height budget',
  chartInsights.panelHeight >= 420 && chartInsights.panelHeight <= 500,
  `${Math.round(chartInsights.panelHeight)}px`,
);
assert(
  'insight grid height cap',
  chartInsights.gridHeight >= 298 && chartInsights.gridHeight <= 320,
  `${Math.round(chartInsights.gridHeight)}px`,
);
assert(
  'trend canvas height range',
  chartInsights.canvasHeight >= 280 && chartInsights.canvasHeight <= 320,
  `${Math.round(chartInsights.canvasHeight)}px`,
);
assert(
  'composition ring size cap',
  chartInsights.ringSize >= 112 && chartInsights.ringSize <= 136,
  `${Math.round(chartInsights.ringSize)}px`,
);
assert(
  'desktop trend svg height',
  chartInsights.svgHeight >= 60,
  `${Math.round(chartInsights.svgHeight)}px`,
);
assert(
  'desktop trend year labels',
  chartInsights.yearLabels >= 5,
  String(chartInsights.yearLabels),
);
assert(
  'desktop trend y axis ticks',
  chartInsights.yTicks >= 3,
  String(chartInsights.yTicks),
);
assert('desktop trend y axis unit', chartInsights.yUnitText === '指数', chartInsights.yUnitText);
assert(
  'composition ring segments',
  chartInsights.ringSegmentCount >= 2,
  String(chartInsights.ringSegmentCount),
);
assert(
  'source bar color variety',
  new Set(chartInsights.barColors).size >= 2,
  chartInsights.barColors.join(' | '),
);
assert('data insights sources summary', chartInsights.sourcesSummary.startsWith('数据参考'), chartInsights.sourcesSummary.slice(0, 48));

await desktop.locator('.pollution-insight-panel').scrollIntoViewIfNeeded();
await desktop.waitForTimeout(300);
await desktop.locator('.composition-card .rescue-pie__legend li[data-segment="plastic"]').hover();
await desktop.waitForTimeout(220);
const ringHoverActive = await desktop.evaluate(
  () => document.querySelector('.composition-ring__segment.is-active') !== null,
);
assert('composition ring hover pop', ringHoverActive);

await desktop.locator('#live-monitoring').scrollIntoViewIfNeeded();
await desktop.waitForTimeout(300);

const desktopLiveConsole = await desktop.evaluate(() => {
  const monitorWindow = document.querySelector('.monitor-window');
  const stationBar = document.querySelector('.monitor-station-bar');
  const map = document.querySelector('.monitor-map');
  const metricsStrip = document.querySelector('.monitor-metrics');
  const windowRect = monitorWindow?.getBoundingClientRect();
  const barRect = stationBar?.getBoundingClientRect();
  const mapRect = map?.getBoundingClientRect();
  const metricsRect = metricsStrip?.getBoundingClientRect();
  return {
    stationPos: stationBar ? getComputedStyle(stationBar).position : '',
    metricsPos: metricsStrip ? getComputedStyle(metricsStrip).position : '',
    monitorRows: getComputedStyle(monitorWindow).gridTemplateRows,
    mapSvgZ: getComputedStyle(document.querySelector('.monitor-map__svg')).zIndex,
    windowWidth: windowRect?.width ?? 0,
    mapWidth: mapRect?.width ?? 0,
    barAboveMap: barRect && mapRect ? barRect.bottom <= mapRect.top + 2 : false,
    metricsBelowMap: metricsRect && mapRect ? metricsRect.top >= mapRect.bottom - 2 : false,
    metricCells: document.querySelectorAll('.monitor-metrics__cell').length,
    metricCols: metricsStrip ? getComputedStyle(metricsStrip).gridTemplateColumns : '',
  };
});

assert('desktop station bar in rail', desktopLiveConsole.stationPos === 'relative', desktopLiveConsole.stationPos);
assert('desktop metrics strip stacked', desktopLiveConsole.metricsPos === 'relative', desktopLiveConsole.metricsPos);
assert(
  'desktop monitor stack rows',
  desktopLiveConsole.monitorRows.split(' ').filter(Boolean).length === 3,
  desktopLiveConsole.monitorRows,
);
assert(
  'desktop map full width',
  Math.abs(desktopLiveConsole.mapWidth - desktopLiveConsole.windowWidth) <= 4,
  `${Math.round(desktopLiveConsole.mapWidth)} vs ${Math.round(desktopLiveConsole.windowWidth)}`,
);
assert('desktop bar above map', desktopLiveConsole.barAboveMap);
assert('desktop metrics below map', desktopLiveConsole.metricsBelowMap);
assert('desktop monitor map svg above gradient', desktopLiveConsole.mapSvgZ === '2', desktopLiveConsole.mapSvgZ);
assert('desktop metric cells', desktopLiveConsole.metricCells >= 4, String(desktopLiveConsole.metricCells));
assert(
  'desktop metrics four columns',
  desktopLiveConsole.metricCols.split(' ').filter(Boolean).length >= 4,
  desktopLiveConsole.metricCols,
);

await desktop.evaluate(() => {
  window.LANCUN_RESCUE?.openDataSourcesModal?.();
});
await desktop.waitForTimeout(400);
const dialogOpen = await desktop.locator('[data-rescue-data-sources-dialog]').evaluate(
  (el) => el?.open === true,
);
assert('data sources dialog opens', dialogOpen);
const dialogLayout = await desktop.evaluate(() => {
  const dialog = document.querySelector('.rescue-data-dialog');
  const body = document.querySelector('.rescue-data-dialog__body');
  const items = body?.querySelectorAll('.rescue-data-dialog__list li').length ?? 0;
  const style = dialog ? getComputedStyle(dialog) : null;
  const bodyStyle = body ? getComputedStyle(body) : null;
  return {
    items,
    maxHeight: style?.maxHeight ?? '',
    bodyOverflow: bodyStyle?.overflowY ?? '',
    hasDocItem: Boolean(body?.textContent?.includes('本项目数据说明文件')),
  };
});
assert('data sources modal list items', dialogLayout.items >= 6, String(dialogLayout.items));
assert('data sources modal scroll body', dialogLayout.bodyOverflow === 'auto', dialogLayout.bodyOverflow);
assert('data sources modal doc note', dialogLayout.hasDocItem);
await desktop.keyboard.press('Escape');
await desktop.waitForTimeout(150);

await desktop.locator('#source-solution').scrollIntoViewIfNeeded();
await desktop.waitForFunction(
  () => document.querySelectorAll('.source-card-rail__btn').length >= 4,
  { timeout: 8000 },
);
assert(
  'source rail buttons',
  (await desktop.locator('.source-card-rail__btn').count()) >= 4,
);

const sourceBtn = desktop.locator('.source-card-rail__btn').nth(1);
if (await sourceBtn.count()) {
  await sourceBtn.click();
  await desktop.waitForTimeout(250);
}
assert('source rail switch', await sourceBtn.count() > 0);

const pin = desktop.locator('[data-rescue-map-pins] .rescue-watch__pin').first();
if (await pin.count()) {
  await desktop.locator('#live-monitoring').scrollIntoViewIfNeeded();
  await pin.click({ force: true });
  await desktop.waitForTimeout(250);
  const stationText = await desktop.locator('[data-rescue-station-detail]').textContent();
  assert('station detail updates on pin click', Boolean(stationText?.trim()), stationText?.slice(0, 40) || 'empty');
}

await desktop.goto(`${BASE}/pages/rescue.html`, { waitUntil: 'domcontentloaded' });
await desktop.waitForFunction(
  () => (document.querySelector('[data-rescue-hero-ribbon]')?.children.length ?? 0) >= 5,
  { timeout: 10000 },
);
await desktop.locator('.pollution-hero__anchors a[href="#action-brief"]').click({ force: true });
await desktop.waitForTimeout(1200);
const briefState = await desktop.evaluate(() => {
  const el = document.getElementById('action-brief');
  const rect = el?.getBoundingClientRect();
  return {
    hash: location.hash,
    top: rect?.top ?? -1,
    visible: Boolean(rect && rect.top < window.innerHeight && rect.bottom > 80),
  };
});
assert(
  'action brief hero anchor scroll',
  briefState.hash === '#action-brief' && briefState.visible,
  `hash=${briefState.hash} top=${Math.round(briefState.top)}`,
);

const tablet = await browser.newPage();
trackPage(tablet);
await tablet.setViewportSize({ width: 768, height: 1024 });
await tablet.goto(`${BASE}/pages/rescue.html`, { waitUntil: 'domcontentloaded', timeout: 45000 });
await tablet.waitForTimeout(1500);

const tabletMetrics = await tablet.evaluate(() => {
  const canvas = document.querySelector('.trend-chart-card__canvas');
  const panel = document.querySelector('.pollution-insight-panel');
  const grid = document.querySelector('.insight-panel-grid');
  return {
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
    commandCols: getComputedStyle(document.querySelector('.command-layout')).gridTemplateColumns,
    sourceCols: getComputedStyle(document.querySelector('.source-solution-shell')).gridTemplateColumns,
    monitorOrder: getComputedStyle(document.querySelector('.live-monitor-stage')).order,
    pressureOrder: getComputedStyle(document.querySelector('.pressure-summary-panel')).order,
    stationPos: getComputedStyle(document.querySelector('.station-panel')).position,
    metricsPos: getComputedStyle(document.querySelector('.monitor-metrics')).position,
    canvasHeight: canvas?.getBoundingClientRect().height ?? 0,
    panelHeight: panel?.getBoundingClientRect().height ?? 0,
    gridCols: grid ? getComputedStyle(grid).gridTemplateColumns : '',
    tabCount: document.querySelectorAll('[data-chart-tab]').length,
  };
});

assert(
  'tablet no horizontal overflow',
  tabletMetrics.scrollWidth <= tabletMetrics.clientWidth + 1,
  `${tabletMetrics.scrollWidth} vs ${tabletMetrics.clientWidth}`,
);
assert('tablet command stacked', !tabletMetrics.commandCols.includes('360px'), tabletMetrics.commandCols);
assert('tablet map before pressure', tabletMetrics.monitorOrder === '1' && tabletMetrics.pressureOrder === '2');
assert(
  'tablet monitor stack layout',
  tabletMetrics.stationPos === 'relative' && tabletMetrics.metricsPos === 'relative',
  `station=${tabletMetrics.stationPos} metrics=${tabletMetrics.metricsPos}`,
);
assert(
  'tablet chart canvas height',
  tabletMetrics.canvasHeight >= 240 && tabletMetrics.canvasHeight <= 280,
  `${Math.round(tabletMetrics.canvasHeight)}px`,
);
assert(
  'tablet insight single column',
  !tabletMetrics.gridCols.includes('1.45fr') && tabletMetrics.gridCols.split(' ').filter(Boolean).length === 1,
  tabletMetrics.gridCols,
);
assert('tablet insight panel height', tabletMetrics.panelHeight > 0 && tabletMetrics.panelHeight <= 720, `${Math.round(tabletMetrics.panelHeight)}px`);
assert('tablet no chart tabs', tabletMetrics.tabCount === 0);

const mobile = await browser.newPage();
trackPage(mobile);
await mobile.setViewportSize({ width: 375, height: 812 });
await mobile.goto(`${BASE}/pages/rescue.html`, { waitUntil: 'domcontentloaded', timeout: 45000 });
await mobile.waitForTimeout(1500);

const mobileHeroOverlap = await mobile.evaluate(() => {
  const anchors = document.querySelector('.pollution-hero__anchors');
  const ribbon = document.querySelector('.pollution-hero__status-ribbon');
  const anchorsRect = anchors?.getBoundingClientRect();
  const ribbonRect = ribbon?.getBoundingClientRect();
  return ribbonRect && anchorsRect ? ribbonRect.top - anchorsRect.bottom : -1;
});
assert(
  'mobile hero anchors clear of ribbon',
  mobileHeroOverlap >= 4,
  `${Math.round(mobileHeroOverlap)}px`,
);

await mobile.locator('.pollution-insight-panel').scrollIntoViewIfNeeded();
await mobile.waitForTimeout(400);

const mobileMetrics = await mobile.evaluate(() => {
  const inner = document.querySelector('.pollution-hero__inner');
  const children = inner ? [...inner.children].map((el) => el.className) : [];
  const panelIdx = children.findIndex((c) => c.includes('pressure-panel'));
  const leadIdx = children.findIndex((c) => c.includes('copy--lead'));
  const tailIdx = children.findIndex((c) => c.includes('copy--tail'));
  const stationPanel = document.querySelector('.monitor-station-bar');
  const monitorWindow = document.querySelector('.monitor-window');
  const metricsStrip = document.querySelector('.monitor-metrics');
  const canvas = document.querySelector('.trend-chart-card__canvas');
  const ring = document.querySelector('.composition-card .composition-ring');
  const grid = document.querySelector('.insight-panel-grid');
  const mapRect = document.querySelector('.monitor-map')?.getBoundingClientRect();
  const barRect = stationPanel?.getBoundingClientRect();
  const metricsRect = metricsStrip?.getBoundingClientRect();
  const stationPos = stationPanel ? getComputedStyle(stationPanel).position : '';
  const metricsPos = metricsStrip ? getComputedStyle(metricsStrip).position : '';
  return {
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
    pressureAfterTitle: panelIdx > leadIdx && panelIdx < tailIdx,
    stationRelative: stationPos === 'relative',
    metricsRelative: metricsPos === 'relative',
    monitorIsGrid: getComputedStyle(monitorWindow).display === 'grid',
    barAboveMap: barRect && mapRect ? barRect.bottom <= mapRect.top + 2 : false,
    metricsBelowMap: metricsRect && mapRect ? metricsRect.top >= mapRect.bottom - 2 : false,
    canvasHeight: canvas?.getBoundingClientRect().height ?? 0,
    ringSize: ring?.getBoundingClientRect().width ?? 0,
    gridCols: grid ? getComputedStyle(grid).gridTemplateColumns : '',
    yearLabels: document.querySelectorAll('.rescue-trend__label').length,
    tabCount: document.querySelectorAll('[data-chart-tab]').length,
    childrenOrder: children.join(' | '),
  };
});

assert(
  'mobile no horizontal overflow',
  mobileMetrics.scrollWidth <= mobileMetrics.clientWidth + 1,
  `${mobileMetrics.scrollWidth} vs ${mobileMetrics.clientWidth}`,
);
assert(
  'mobile pressure panel after title',
  mobileMetrics.pressureAfterTitle,
  mobileMetrics.childrenOrder,
);
assert('mobile station bar above map', mobileMetrics.stationRelative && mobileMetrics.monitorIsGrid && mobileMetrics.barAboveMap);
assert('mobile metrics strip below map', mobileMetrics.metricsRelative && mobileMetrics.monitorIsGrid && mobileMetrics.metricsBelowMap);
assert(
  'mobile chart canvas height',
  mobileMetrics.canvasHeight >= 240 && mobileMetrics.canvasHeight <= 260,
  `${Math.round(mobileMetrics.canvasHeight)}px`,
);
assert(
  'mobile ring size',
  mobileMetrics.ringSize >= 110 && mobileMetrics.ringSize <= 120,
  `${Math.round(mobileMetrics.ringSize)}px`,
);
assert(
  'mobile insight single column',
  !mobileMetrics.gridCols.includes('1.45fr') && mobileMetrics.gridCols.split(' ').filter(Boolean).length === 1,
  mobileMetrics.gridCols,
);
assert('mobile no chart tabs', mobileMetrics.tabCount === 0);
assert(
  'mobile trend year labels',
  mobileMetrics.yearLabels >= 5,
  String(mobileMetrics.yearLabels),
);

const blockingConsoleErrors = consoleErrors.filter(
  (msg) => !/(CORS|openaq|noaa|ERR_FAILED|status of 400|Failed to load resource)/i.test(msg),
);
assert('no blocking console errors', blockingConsoleErrors.length === 0, blockingConsoleErrors.slice(0, 3).join(' | '));

await browser.close();

if (errors.length) {
  console.error(`\n${errors.length} observatory check(s) failed.`);
  process.exit(1);
}

console.log('\nAll rescue observatory checks passed.');
