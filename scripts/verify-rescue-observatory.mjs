import { chromium } from 'playwright';

const BASE = process.env.RESCUE_VERIFY_URL || 'http://127.0.0.1:8080';
const MAX_SCROLL_HEIGHT = Number(process.env.RESCUE_MAX_SCROLL_HEIGHT || 3000);
const MAX_SCROLL_RATIO = Number(process.env.RESCUE_MAX_SCROLL_RATIO || 3.35);

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
  return {
    pageVideo: Boolean(document.querySelector('.page-bg-video__media')),
    scrollHeight: document.documentElement.scrollHeight,
    viewportHeight: window.innerHeight,
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
    commandTop,
    heroRibbon: document.querySelector('[data-rescue-hero-ribbon]')?.children.length ?? 0,
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
assert('map pins rendered', desktopMetrics.mapPins >= 4, String(desktopMetrics.mapPins));
assert('status filters', desktopMetrics.filterBtns >= 4, String(desktopMetrics.filterBtns));
assert('chart tabs', desktopMetrics.chartTabs >= 3, String(desktopMetrics.chartTabs));
assert('data sources triggers', desktopMetrics.dataSourcesTriggers >= 4, String(desktopMetrics.dataSourcesTriggers));
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

const chartTab = desktop.locator('[data-chart-tab="composition"]');
if (await chartTab.count()) {
  await chartTab.click();
  await desktop.waitForTimeout(200);
}
assert('chart tab clickable', await chartTab.count() > 0);

await desktop.locator('.command-header__data-link[data-rescue-data-sources-open]').click();
await desktop.waitForTimeout(300);
const dialogOpen = await desktop.locator('[data-rescue-data-sources-dialog]').evaluate(
  (el) => el?.open === true,
);
assert('data sources dialog opens', dialogOpen);
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

const tabletMetrics = await tablet.evaluate(() => ({
  scrollWidth: document.documentElement.scrollWidth,
  clientWidth: document.documentElement.clientWidth,
  commandCols: getComputedStyle(document.querySelector('.command-layout')).gridTemplateColumns,
  sourceCols: getComputedStyle(document.querySelector('.source-solution-shell')).gridTemplateColumns,
  monitorOrder: getComputedStyle(document.querySelector('.live-monitor-stage')).order,
  pressureOrder: getComputedStyle(document.querySelector('.pressure-summary-panel')).order,
}));

assert(
  'tablet no horizontal overflow',
  tabletMetrics.scrollWidth <= tabletMetrics.clientWidth + 1,
  `${tabletMetrics.scrollWidth} vs ${tabletMetrics.clientWidth}`,
);
assert('tablet command stacked', !tabletMetrics.commandCols.includes('360px'), tabletMetrics.commandCols);
assert('tablet map before pressure', tabletMetrics.monitorOrder === '1' && tabletMetrics.pressureOrder === '2');

const mobile = await browser.newPage();
trackPage(mobile);
await mobile.setViewportSize({ width: 375, height: 812 });
await mobile.goto(`${BASE}/pages/rescue.html`, { waitUntil: 'domcontentloaded', timeout: 45000 });
await mobile.waitForTimeout(1500);

const mobileMetrics = await mobile.evaluate(() => {
  const inner = document.querySelector('.pollution-hero__inner');
  const children = inner ? [...inner.children].map((el) => el.className) : [];
  const panelIdx = children.findIndex((c) => c.includes('pressure-panel'));
  const leadIdx = children.findIndex((c) => c.includes('copy--lead'));
  const tailIdx = children.findIndex((c) => c.includes('copy--tail'));
  const stationPanel = document.querySelector('.station-panel');
  const monitorWindow = document.querySelector('.monitor-window');
  const stationPos = stationPanel ? getComputedStyle(stationPanel).position : '';
  return {
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
    pressureAfterTitle: panelIdx > leadIdx && panelIdx < tailIdx,
    stationRelative: stationPos === 'relative',
    monitorIsGrid: getComputedStyle(monitorWindow).display === 'grid',
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
assert('mobile station panel below map', mobileMetrics.stationRelative && mobileMetrics.monitorIsGrid);

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
