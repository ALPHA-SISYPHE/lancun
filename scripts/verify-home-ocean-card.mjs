import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const cardJs = fs.readFileSync(path.join(root, 'assets/js/ocean-preview-card.js'), 'utf8');
const hotspots = fs.readFileSync(path.join(root, 'data/oceanHotspots.js'), 'utf8');
const css = fs.readFileSync(path.join(root, 'assets/css/home.css'), 'utf8');
const globeIndex = fs.readFileSync(path.join(root, 'assets/js/globe/index.js'), 'utf8');

const checks = [
  ['oceanHotspots script loaded', () => html.includes('data/oceanHotspots.js')],
  ['ocean-preview-card script loaded', () => html.includes('ocean-preview-card.js')],
  ['card slot hook', () => html.includes('data-ocean-card-slot')],
  ['five hotspots data file', () => (hotspots.match(/id: '/g) || []).length === 5],
  ['hotspot schema fields', () =>
    ['area', 'averageDepth', 'ecosystem', 'threats', 'description', 'targetTab'].every((k) =>
      hotspots.includes(k),
    )],
  ['pin select listener', () => cardJs.includes('lancun-ocean-pin-select')],
  ['close / prev / next controls', () =>
    cardJs.includes('data-ocean-preview-close') &&
    cardJs.includes('data-ocean-preview-prev') &&
    cardJs.includes('data-ocean-preview-next')],
  ['no modal / no redirect on select', () =>
    !cardJs.includes('window.location') && !cardJs.includes('modal')],
  ['profile deep link', () => cardJs.includes('pages/ocean.html#ocean-')],
  ['marker sync', () => cardJs.includes('markerApi') && globeIndex.includes('markerApi')],
  ['preview card styles', () => css.includes('.ocean-preview-card')],
  ['enter animation', () => css.includes('ocean-preview-enter')],
];

let failed = 0;
for (const [name, fn] of checks) {
  const pass = fn();
  console.log(`${pass ? 'OK' : 'FAIL'} ${name}`);
  if (!pass) failed += 1;
}

if (failed) process.exit(1);
console.log(`\nAll ${checks.length} ocean preview P3 checks passed.`);
