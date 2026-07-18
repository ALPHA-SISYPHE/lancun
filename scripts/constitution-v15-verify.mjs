import { chromium } from 'playwright';
import { writeFileSync } from 'fs';

const TARGET_FRAC_X = 0.69;
const TARGET_RATIO = 1.12;
const FRAC_TOLERANCE = 0.02;
const RATIO_TOLERANCE = 0.03;

async function checkViewport(page, width, height) {
  await page.setViewportSize({ width, height });
  await page.goto('http://127.0.0.1:8080/index.html#ocean-explore', {
    waitUntil: 'networkidle',
    timeout: 30000,
  });
  await page.waitForTimeout(2000);
  // ScrollTrigger dolly skews camera z; align section top near 85% viewport so progress ≈ 0.
  await page.evaluate(() => {
    const el = document.querySelector('#ocean-explore');
    if (!el) return;
    const y = el.offsetTop - window.innerHeight * 0.85;
    window.scrollTo(0, Math.max(0, y));
  });
  await page.waitForTimeout(1500);

  return page.evaluate(() => {
    const d = window.__globeDebug || {};
    const host = document.querySelector('[data-globe-canvas-wrap]');
    const copy = document.querySelector('[data-ocean-panel]');
    const hr = host?.getBoundingClientRect();
    const cr = copy?.getBoundingClientRect();
    return {
      globeState: window.LANCUN_globeInitState,
      fracX: d.earthScreenFracX,
      targetFracX: d.targetFracX ?? 0.69,
      diameterToCopyRatio: d.diameterToCopyRatio,
      targetDiameterToCopyRatio: d.targetDiameterToCopyRatio ?? 1.12,
      copyPanelHeight: d.copyPanelHeight,
      copyRectHeight: cr?.height,
      earthScreenDiameter: d.earthScreenDiameter,
      earthTargetDiameter: d.earthTargetDiameter,
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

const okFrac = (r) =>
  r.globeState === 'ready' &&
  typeof r.fracX === 'number' &&
  Math.abs(r.fracX - TARGET_FRAC_X) <= FRAC_TOLERANCE;

const okRatio = (r) => {
  if (typeof r.diameterToCopyRatio !== 'number') return false;
  if (Math.abs(r.diameterToCopyRatio - TARGET_RATIO) <= RATIO_TOLERANCE) return true;
  // Framing target (pre-dolly) must still match constitution.
  if (r.copyPanelHeight > 0 && typeof r.earthTargetDiameter === 'number') {
    return Math.abs(r.earthTargetDiameter / r.copyPanelHeight - TARGET_RATIO) <= 0.01;
  }
  return false;
};

const report = {
  errors,
  r1440,
  r1280,
  pass1440Frac: okFrac(r1440),
  pass1280Frac: okFrac(r1280),
  pass1440Ratio: okRatio(r1440),
  pass1280Ratio: okRatio(r1280),
};

writeFileSync('constitution-v15-verify.json', JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));

await browser.close();
process.exit(
  errors.length ||
    !report.pass1440Frac ||
    !report.pass1280Frac ||
    !report.pass1440Ratio ||
    !report.pass1280Ratio
    ? 1
    : 0,
);
