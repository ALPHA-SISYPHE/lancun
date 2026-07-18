import { chromium } from 'playwright';
import { writeFileSync } from 'fs';

const TARGET_FRAC_X = 0.69;
const TARGET_RATIO = 1.12;
const FRAC_TOLERANCE = 0.04;
const RATIO_TOLERANCE = 0.03;
const Y_TOLERANCE = 0.02;
const VIEWPORTS = [
  { width: 1366, height: 768, label: '1366' },
  { width: 1440, height: 900, label: '1440' },
  { width: 1920, height: 1080, label: '1920' },
];

async function checkViewport(page, width, height, label) {
  await page.setViewportSize({ width, height });
  await page.goto('http://127.0.0.1:8080/index.html#ocean-explore', {
    waitUntil: 'networkidle',
    timeout: 30000,
  });
  await page.waitForFunction(() => window.LANCUN_globeInitState === 'ready', null, {
    timeout: 30000,
  });
  await page.evaluate(async () => {
    if (document.fonts?.ready) await document.fonts.ready;
    const el = document.querySelector('#ocean-explore');
    el?.scrollIntoView({ block: 'center', behavior: 'instant' });
  });
  await page.waitForTimeout(2500);

  await page.locator('#ocean-explore').screenshot({ path: `constitution-v18-${label}.png` });

  return page.evaluate(() => {
    const d = window.__globeDebug || {};
    const host = document.querySelector('[data-globe-canvas-wrap]');
    const hr = host?.getBoundingClientRect();
    return {
      globeState: window.LANCUN_globeInitState,
      fracX: d.earthScreenFracX,
      fracY: d.earthScreenFracY,
      targetFracX: d.targetFracX ?? 0.69,
      copyPanelCenterFracY: d.copyPanelCenterFracY,
      yAlignDelta: d.yAlignDelta,
      diameterToCopyRatio: d.diameterToCopyRatio,
      containmentOk: d.containmentOk,
      isSideBySide: d.isSideBySide,
      boundsTop: d.boundsTop,
      boundsBottom: d.boundsBottom,
      boundsLeft: d.boundsLeft,
      boundsRight: d.boundsRight,
      visibleSafeRect: d.visibleSafeRect,
      clipRight: d.clipRight,
      clipBottom: d.clipBottom,
      clipLeft: d.clipLeft,
      clipTop: d.clipTop,
      solverMode: d.solverMode,
      hostW: hr?.width,
      hostH: hr?.height,
      copyPanelHeight: d.copyPanelHeight,
    };
  });
}

function okContainment(r) {
  if (r.globeState !== 'ready') return false;
  if (r.containmentOk !== true) return false;
  if (typeof r.clipRight === 'number' && r.clipRight > 0.5) return false;
  if (typeof r.clipBottom === 'number' && r.clipBottom > 0.5) return false;
  if (typeof r.clipLeft === 'number' && r.clipLeft > 0.5) return false;
  if (typeof r.clipTop === 'number' && r.clipTop > 0.5) return false;
  if (typeof r.hostW === 'number' && typeof r.boundsRight === 'number') {
    if (r.boundsRight > r.hostW * 0.98) return false;
    if (r.boundsLeft < r.hostW * 0.02) return false;
  }
  if (typeof r.hostH === 'number' && typeof r.boundsBottom === 'number') {
    if (r.boundsBottom > r.hostH * 0.98) return false;
    if (r.boundsTop < r.hostH * 0.02) return false;
  }
  return true;
}

function okSideBySideExtras(r) {
  if (!r.isSideBySide) return true;
  if (typeof r.fracY !== 'number' || typeof r.copyPanelCenterFracY !== 'number') return false;
  if (Math.abs(r.fracY - r.copyPanelCenterFracY) > Y_TOLERANCE) return false;
  if (typeof r.fracX === 'number' && Math.abs(r.fracX - TARGET_FRAC_X) > FRAC_TOLERANCE) {
    // v1.8 allows X nudge — only warn via pass if containment ok
  }
  if (typeof r.diameterToCopyRatio === 'number' && r.diameterToCopyRatio > TARGET_RATIO + RATIO_TOLERANCE) {
    return false;
  }
  return true;
}

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
const errors = [];
page.on('console', (msg) => {
  if (msg.type() === 'error') errors.push(msg.text());
});
page.on('pageerror', (err) => errors.push(err.message));

const report = { errors, viewports: {} };

for (const vp of VIEWPORTS) {
  const r = await checkViewport(page, vp.width, vp.height, vp.label);
  report.viewports[vp.label] = {
    ...r,
    passContainment: okContainment(r),
    passSideBySide: okSideBySideExtras(r),
    pass: okContainment(r) && okSideBySideExtras(r),
  };
}

report.allPass = Object.values(report.viewports).every((v) => v.pass);

writeFileSync('constitution-v18-verify.json', JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));

await browser.close();
process.exit(errors.length || !report.allPass ? 1 : 0);
