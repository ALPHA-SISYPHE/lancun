import { chromium } from 'playwright';
import { writeFileSync, copyFileSync, existsSync } from 'fs';

const ITER = Number(process.env.BUBBLE_ITER || '1');
const OUT = `bubble-loop-iter-${ITER}.png`;

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
  timeout: 25000,
});
await page.evaluate(() => {
  document.querySelector('#ocean-explore')?.scrollIntoView({ block: 'center' });
});
await page.waitForTimeout(2200);

const meta = await page.evaluate(() => ({
  state: window.LANCUN_globeInitState,
  module: window.__globeDebug?.module,
  darkInterim: window.__globeDebug?.darkInterim,
  hasDarkClass: document.querySelector('#ocean-explore')?.classList.contains('ocean-explore--dark-interim'),
}));

await page.locator('#ocean-explore').screenshot({ path: OUT });

const report = { iter: ITER, out: OUT, meta, errors };
writeFileSync(`bubble-loop-iter-${ITER}.json`, JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));

await browser.close();
process.exit(errors.length || meta.state !== 'ready' ? 1 : 0);
