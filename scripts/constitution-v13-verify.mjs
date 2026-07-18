import { chromium } from 'playwright';
import { writeFileSync } from 'fs';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];
page.on('console', (msg) => {
  if (msg.type() === 'error') errors.push(msg.text());
});
page.on('pageerror', (err) => errors.push(err.message));

await page.goto('http://127.0.0.1:8080/index.html#ocean-explore', {
  waitUntil: 'networkidle',
  timeout: 30000,
});
await page.waitForTimeout(2500);
await page.evaluate(() => document.querySelector('#ocean-explore')?.scrollIntoView({ block: 'center' }));
await page.waitForTimeout(3500);

const debug = await page.evaluate(() => {
  const section = document.querySelector('#ocean-explore');
  const stage = document.querySelector('.ocean-explore__stage');
  const host = document.querySelector('[data-globe-canvas-wrap]');
  const d = window.__globeDebug || {};
  const sr = stage?.getBoundingClientRect();
  const hr = host?.getBoundingClientRect();
  const stageCenterFrac =
    sr && hr && hr.width > 0 ? (sr.left + sr.width * 0.5 - hr.left) / hr.width : null;
  return {
    globeState: window.LANCUN_globeInitState,
    camPos: d.camPos,
    homeZ: undefined,
    earthRotY: d.earthRotY,
    spinEnabled: d.spinEnabled,
    layerMasks: d.layerMasks,
    stageCenterFrac,
    stage: sr ? { w: sr.width, h: sr.height } : null,
    host: hr ? { w: hr.width, h: hr.height } : null,
  };
});

const rot1 = await page.evaluate(() => window.__globeDebug?.earthRotY);
await page.waitForTimeout(800);
const rot2 = await page.evaluate(() => window.__globeDebug?.earthRotY);

await page.locator('#ocean-explore').screenshot({ path: 'constitution-check-after.png' });

const report = {
  errors,
  debug,
  spinDelta: typeof rot1 === 'number' && typeof rot2 === 'number' ? rot2 - rot1 : null,
  layersOk:
    debug.layerMasks?.earthMesh === 1 &&
    debug.layerMasks?.backBubbles === 2 &&
    debug.layerMasks?.frontBubbles === 4,
};

writeFileSync('constitution-v13-verify.json', JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));

await browser.close();
process.exit(errors.length || !report.layersOk || report.spinDelta == null || report.spinDelta <= 0 ? 1 : 0);
