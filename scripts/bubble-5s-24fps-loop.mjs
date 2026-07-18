/**
 * Sample #ocean-explore for 5s at 24fps (120 frames) with GPU Chromium.
 * Env: BUBBLE_ITER (default 38), BUBBLE_SPAN_MS (5000), BUBBLE_FPS (24)
 */
import { chromium } from 'playwright';
import { writeFileSync, mkdirSync } from 'fs';

// Hard defaults for this protocol (ignore leftover shell env pollution).
const ITER = Number(process.env.BUBBLE_ITER_5S || process.env.BUBBLE_ITER || '38');
const FPS = 24;
const SPAN_MS = 5000;
const FRAMES = 120; // 5s * 24fps — fixed gate
const OUT_DIR = `bubble-loop-iter-${ITER}-frames`;
const INTERVAL = SPAN_MS / Math.max(FRAMES - 1, 1);

mkdirSync(OUT_DIR, { recursive: true });

const browser = await chromium.launch({
  headless: true,
  args: [
    '--use-gl=angle',
    '--use-angle=d3d11',
    '--enable-gpu',
    '--ignore-gpu-blocklist',
  ],
});
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
await page.waitForTimeout(1000);

const meta0 = await page.evaluate(() => ({
  state: window.LANCUN_globeInitState,
  module: window.__globeDebug?.module,
  bubbleCount: window.__globeDebug?.bubbleCount,
  scaleStats: window.__globeDebug?.scaleStats ?? null,
  uTime: window.__globeDebug?.uTime,
}));

const frames = [];
const t0 = Date.now();

for (let i = 0; i < FRAMES; i += 1) {
  if (i > 0) await page.waitForTimeout(INTERVAL);
  const pad = String(i + 1).padStart(3, '0');
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
  if ((i + 1) % 24 === 0 || i === 0 || i === FRAMES - 1) {
    console.log(`frame ${pad} @ ${frames[i].elapsedMs}ms uTime=${snap.uTime}`);
  }
}

// Auto gate: iScale locked across frames
const scaleKeys = frames
  .map((f) => {
    const s = f.scaleStats;
    if (!s) return null;
    return JSON.stringify(s);
  })
  .filter(Boolean);
const scaleLocked =
  scaleKeys.length > 0 && scaleKeys.every((k) => k === scaleKeys[0]);

const report = {
  iter: ITER,
  outDir: OUT_DIR,
  spanMs: SPAN_MS,
  fps: FPS,
  frameCount: frames.length,
  scaleLocked,
  scaleSample: frames[0]?.scaleStats ?? null,
  meta0,
  errors,
  keyFrames: [1, 24, 48, 72, 96, FRAMES].filter((n) => n <= FRAMES).map((n) => frames[n - 1]?.path),
};
writeFileSync(`bubble-loop-iter-${ITER}-5s24fps.json`, JSON.stringify(report, null, 2));
console.log(
  JSON.stringify(
    {
      iter: ITER,
      frames: frames.length,
      module: meta0.module,
      scaleLocked,
      errors: errors.length,
      keyFrames: report.keyFrames,
    },
    null,
    2,
  ),
);

await browser.close();
process.exit(errors.length || meta0.state !== 'ready' || !scaleLocked ? 1 : 0);
