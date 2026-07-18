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

const debug = await page.evaluate(() => ({
  globeState: window.LANCUN_globeInitState,
  debug: window.__globeDebug,
  statusHidden: document.querySelector('[data-globe-status]')?.hidden,
  toggleRect: (() => {
    const t = document.querySelector('[data-shelves-toggle]');
    if (!t) return null;
    const r = t.getBoundingClientRect();
    const sec = document.querySelector('#ocean-explore').getBoundingClientRect();
    return {
      leftFrac: (r.left - sec.left) / sec.width,
      topFrac: (r.top - sec.top) / sec.height,
      bottomFrac: (r.bottom - sec.top) / sec.height,
    };
  })(),
}));

const pixelSample = await page.evaluate(() => {
  const canvas = document.querySelector('[data-globe-canvas]');
  if (!canvas || canvas.width < 10) return { ok: false };
  const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
  const w = canvas.width;
  const h = canvas.height;
  const sample = (fx, fy) => {
    const buf = new Uint8Array(4);
    gl.readPixels(Math.floor(w * fx), Math.floor(h * fy), 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, buf);
    return Array.from(buf);
  };
  const lum = (p) => (p[0] + p[1] + p[2]) / 3;
  const left = sample(0.12, 0.5);
  const mid = sample(0.5, 0.5);
  const right = sample(0.78, 0.48);
  return {
    ok: true,
    left,
    mid,
    right,
    leftLum: lum(left),
    midLum: lum(mid),
    rightLum: lum(right),
    navyBg: lum(left) < 80 && left[2] > left[0],
    earthLikely: lum(right) > 25 && lum(right) < 220 && Math.abs(lum(right) - lum(left)) > 8,
  };
});

const clip = await page.locator('#ocean-explore').screenshot();
writeFileSync('phase0-ocean-explore.png', clip);
console.log(JSON.stringify({ debug, pixelSample, errors }, null, 2));
await browser.close();
