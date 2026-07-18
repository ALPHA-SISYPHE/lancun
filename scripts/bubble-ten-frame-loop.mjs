/**
 * Sample 10 frames over ~30s from #ocean-explore for size-stability checks.
 * Env: BUBBLE_ITER (default 12), BUBBLE_FRAMES (default 10), BUBBLE_SPAN_MS (default 30000)
 */
import { chromium } from 'playwright';
import { writeFileSync, mkdirSync } from 'fs';

const ITER = Number(process.env.BUBBLE_ITER || '14');
const FRAMES = Number(process.env.BUBBLE_FRAMES || '30');
const SPAN_MS = Number(process.env.BUBBLE_SPAN_MS || '30000');
const OUT_DIR = `bubble-loop-iter-${ITER}-frames`;

mkdirSync(OUT_DIR, { recursive: true });

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
await page.waitForTimeout(1200);

const meta0 = await page.evaluate(() => ({
  state: window.LANCUN_globeInitState,
  module: window.__globeDebug?.module,
  bubbleCount: window.__globeDebug?.bubbleCount,
  elasticAmp: null,
  uTime: window.__globeDebug?.uTime,
}));

const interval = SPAN_MS / Math.max(FRAMES - 1, 1);
const frames = [];
const t0 = Date.now();

for (let i = 0; i < FRAMES; i += 1) {
  if (i > 0) await page.waitForTimeout(interval);
  const pad = String(i + 1).padStart(2, '0');
  const path = `${OUT_DIR}/f${pad}.png`;
  const snap = await page.evaluate(() => ({
    uTime: window.__globeDebug?.uTime ?? null,
    running: window.__globeDebug?.running ?? null,
    scaleStats: window.__globeDebug?.scaleStats ?? null,
  }));
  await page.locator('#ocean-explore').screenshot({ path });
  frames.push({
    i: i + 1,
    path,
    elapsedMs: Date.now() - t0,
    ...snap,
  });
  console.log(`frame ${pad} @ ${frames[i].elapsedMs}ms uTime=${snap.uTime}`);
}

const report = {
  iter: ITER,
  outDir: OUT_DIR,
  spanMs: SPAN_MS,
  frames,
  meta0,
  errors,
};
writeFileSync(`bubble-loop-iter-${ITER}-10frames.json`, JSON.stringify(report, null, 2));
console.log(JSON.stringify({ iter: ITER, frames: frames.length, module: meta0.module, errors }, null, 2));

await browser.close();
process.exit(errors.length || meta0.state !== 'ready' ? 1 : 0);
