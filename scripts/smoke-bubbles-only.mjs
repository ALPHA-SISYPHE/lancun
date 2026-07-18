import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => {
  if (m.type() === 'error') errors.push(m.text());
});

await page.setViewportSize({ width: 1440, height: 900 });
await page.goto('http://127.0.0.1:8080/index.html#ocean-explore', {
  waitUntil: 'networkidle',
  timeout: 30000,
});
await page.waitForFunction(() => window.LANCUN_globeInitState === 'ready', null, {
  timeout: 20000,
});
await page.evaluate(() => {
  document.querySelector('#ocean-explore')?.scrollIntoView({ block: 'center' });
});
await page.waitForTimeout(1500);

const d = await page.evaluate(() => ({
  state: window.LANCUN_globeInitState,
  module: window.__globeDebug?.module,
  earthRemoved: window.__globeDebug?.earthRemoved,
  hasEarthScript: !!document.querySelector('script[src*="ocean-globe"]'),
  hasBubblesScript: !!document.querySelector('script[src*="ocean-bubbles"]'),
  shelves: !!document.querySelector('[data-shelves-toggle]'),
}));

await page.locator('#ocean-explore').screenshot({ path: 'constitution-v191-bubbles-only.png' });
console.log(JSON.stringify({ d, errors }, null, 2));
await browser.close();

const fail =
  errors.length ||
  d.state !== 'ready' ||
  d.module !== 'ocean-bubbles@v20' ||
  !d.earthRemoved ||
  d.hasEarthScript ||
  d.shelves;
process.exit(fail ? 1 : 0);
