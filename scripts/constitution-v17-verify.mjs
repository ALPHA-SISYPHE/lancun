import { chromium } from 'playwright';
import { writeFileSync } from 'fs';

const TARGET_FRAC_X = 0.69;
const TARGET_RATIO = 1.12;
const FRAC_TOLERANCE = 0.02;
const RATIO_TOLERANCE = 0.03;
const Y_TOLERANCE = 0.02;

async function checkViewport(page, width, height, zoom = 1) {
  await page.setViewportSize({ width, height });
  await page.goto('http://127.0.0.1:8080/index.html#ocean-explore', {
    waitUntil: 'networkidle',
    timeout: 30000,
  });
  await page.waitForTimeout(2000);
  await page.evaluate((z) => {
    document.body.style.zoom = String(z);
    const el = document.querySelector('#ocean-explore');
    if (!el) return;
    const y = el.offsetTop - window.innerHeight * 0.85;
    window.scrollTo(0, Math.max(0, y));
  }, zoom);
  await page.waitForTimeout(1500);

  return page.evaluate(() => {
    const d = window.__globeDebug || {};
    const host = document.querySelector('[data-globe-canvas-wrap]');
    const copy = document.querySelector('[data-ocean-panel]');
    const hr = host?.getBoundingClientRect();
    const cr = copy?.getBoundingClientRect();
    const copyCenterFracY =
      hr && cr ? (cr.top + cr.height * 0.5 - hr.top) / hr.height : d.copyPanelCenterFracY;
    return {
      globeState: window.LANCUN_globeInitState,
      fracX: d.earthScreenFracX,
      fracY: d.earthScreenFracY,
      targetFracX: d.targetFracX ?? 0.69,
      copyPanelCenterFracY: d.copyPanelCenterFracY ?? copyCenterFracY,
      yAlignDelta: d.yAlignDelta,
      diameterToCopyRatio: d.diameterToCopyRatio,
      ratioActual: d.ratioActual,
      containmentOk: d.containmentOk,
      isSideBySide: d.isSideBySide,
      boundsTop: d.boundsTop,
      boundsBottom: d.boundsBottom,
      boundsLeft: d.boundsLeft,
      boundsRight: d.boundsRight,
      hostW: hr?.width,
      hostH: hr?.height,
      copyPanelHeight: d.copyPanelHeight,
      earthTargetDiameter: d.earthTargetDiameter,
    };
  });
}

const okSideBySide = (r) => {
  if (r.globeState !== 'ready') return false;
  if (!r.isSideBySide) return true;
  if (typeof r.fracX !== 'number' || Math.abs(r.fracX - TARGET_FRAC_X) > FRAC_TOLERANCE) return false;
  if (typeof r.fracY !== 'number' || typeof r.copyPanelCenterFracY !== 'number') return false;
  if (Math.abs(r.fracY - r.copyPanelCenterFracY) > Y_TOLERANCE) return false;
  if (r.containmentOk !== true) return false;
  if (typeof r.diameterToCopyRatio === 'number' && r.diameterToCopyRatio <= TARGET_RATIO + RATIO_TOLERANCE) {
    return true;
  }
  if (r.copyPanelHeight > 0 && typeof r.earthTargetDiameter === 'number') {
    return r.earthTargetDiameter / r.copyPanelHeight <= TARGET_RATIO + 0.01;
  }
  return false;
};

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
const r900 = await checkViewport(page, 900, 700);
const r1440Zoom125 = await checkViewport(page, 1440, 900, 1.25);
const r1440Zoom90 = await checkViewport(page, 1440, 900, 0.9);

const report = {
  errors,
  r1440,
  r1280,
  r900,
  r1440Zoom125,
  r1440Zoom90,
  pass1440: okSideBySide(r1440),
  pass1280: okSideBySide(r1280),
  pass900: okSideBySide(r900),
  pass1440Zoom125: okSideBySide(r1440Zoom125),
  pass1440Zoom90: okSideBySide(r1440Zoom90),
};

writeFileSync('constitution-v17-verify.json', JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));

await browser.close();
process.exit(
  errors.length ||
    !report.pass1440 ||
    !report.pass1280 ||
    !report.pass900 ||
    !report.pass1440Zoom125 ||
    !report.pass1440Zoom90
    ? 1
    : 0,
);
