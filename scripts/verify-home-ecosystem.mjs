import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const eco = fs.readFileSync(path.join(root, 'assets/js/home-ecosystem.js'), 'utf8');
const preview = fs.readFileSync(path.join(root, 'assets/js/ocean-preview-card.js'), 'utf8');
const controls = fs.readFileSync(path.join(root, 'assets/js/globe/controls.js'), 'utf8');
const globe = fs.readFileSync(path.join(root, 'assets/js/globe/index.js'), 'utf8');
const css = fs.readFileSync(path.join(root, 'assets/css/home.css'), 'utf8');

const checks = [
  ['section indicator', () => html.includes('data-home-section-indicator')],
  ['globe hint dismiss hook', () => html.includes('data-globe-scene-hint') && eco.includes('lancun-globe-hint-dismiss')],
  ['ocean index rail', () => html.includes('data-ocean-index') && eco.includes('ocean-index-rail__item')],
  ['continue explore links', () => html.includes('home-continue') && html.includes('pages/species.html')],
  ['no home footer', () => !html.includes('home-footer')],
  ['ESC reset overview', () => preview.includes("event.key !== 'Escape'")],
  ['ocean preview API', () => preview.includes('LANCUN_oceanPreview')],
  ['globe grab cursor', () => controls.includes("cursor = 'grab'")],
  ['rotate to ocean', () => globe.includes('rotateToOcean') && controls.includes('rotateToLng')],
  ['index select event', () => preview.includes('lancun-ocean-index-select')],
  ['hint updated copy', () => html.includes('拖动地球 · 点击 + 探索五大洋')],
  ['section indicator styles', () => css.includes('.home-section-indicator')],
  ['home body bg override', () => css.includes('body.home-page::before') && css.includes('display: none')],
  ['no hero bottom fade', () => !css.includes('.hero-ocean-intro::after')],
];

let failed = 0;
for (const [name, fn] of checks) {
  const pass = fn();
  console.log(`${pass ? 'OK' : 'FAIL'} ${name}`);
  if (!pass) failed += 1;
}

if (failed) process.exit(1);
console.log(`\nAll ${checks.length} home P6 checks passed.`);
