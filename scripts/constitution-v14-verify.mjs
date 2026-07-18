import { chromium } from 'playwright';
import { writeFileSync } from 'fs';

async function checkViewport(page, width, height) {
  await page.setViewportSize({ width, height });
  await page.goto('http://127.0.0.1:8080/index.html#ocean-explore', {
    waitUntil: 'networkidle',
    timeout: 30000,
  });
  await page.waitForTimeout(2000);
  await page.evaluate(() => document.querySelector('#ocean-explore')?.scrollIntoView({ block: 'center' }));
  await page.waitForTimeout(2500);

  return page.evaluate(() => {
    const d = window.__globeDebug || {};
    const host = document.querySelector('[data-globe-canvas-wrap]');
    const hr = host?.getBoundingClientRect();
    return {
      globeState: window.LANCUN_globeInitState,
      fracX: d.earthScreenFracX,
      target: d.targetFracX ?? 0.69,
      camZ: d.camPos?.[2],
      hostW: hr?.width,
      hostH: hr?.height,
    };
  });
}

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
const errors = [];
page.on('console', (msg) => {
  if (msg.type() === 'error') errors.push(msg.text());
});
page.on('pageerror', (err) => errors.push(err.message));

const r1440 = await checkViewport(page, 1440, 900);
await page.locator('#ocean-explore').screenshot({ path: 'constitution-check-after.png' });
const r1280 = await checkViewport(page, 1280, 800);

const ok = (r) =>
  r.globeState === 'ready' &&
  typeof r.fracX === 'number' &&
  Math.abs(r.fracX - 0.69) <= 0.02;

const report = {
  errors,
  r1440,
  r1280,
  pass1440: ok(r1440),
  pass1280: ok(r1280),
};

writeFileSync('constitution-v14-verify.json', JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));

await browser.close();
process.exit(errors.length || !report.pass1440 || !report.pass1280 ? 1 : 0);
