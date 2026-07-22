import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(root, 'assets/css/home.css'), 'utf8');
const hero = fs.readFileSync(path.join(root, 'assets/js/hero.js'), 'utf8');
const bg = fs.readFileSync(path.join(root, 'assets/js/ocean-explore-bg.js'), 'utf8');
const globe = fs.readFileSync(path.join(root, 'assets/js/globe/index.js'), 'utf8');
const framing = fs.readFileSync(path.join(root, 'assets/js/globe/utils/framing.js'), 'utf8');

const checks = [
  ['overflow-x clip', () => css.includes('overflow-x: clip')],
  ['hero video attrs in html', () => html.includes('autoplay muted loop playsinline')],
  ['section2 video attrs', () => html.match(/ocean-explore__bg-video[\s\S]*autoplay/)],
  ['object-fit cover', () => css.includes('object-fit: cover')],
  ['hero poster element', () => html.includes('hero-poster')],
  ['globe visibility pause', () => globe.includes('visibilitychange') && globe.includes('pageVisible')],
  ['globe intersection pause', () => globe.includes('IntersectionObserver') && globe.includes('if (!visible')],
  ['hero video viewport pause', () => hero.includes('initHeroVideoViewport')],
  ['explore video visibility pause', () => bg.includes('document.hidden')],
  ['responsive earth fill', () => framing.includes('EARTH_SCREEN_FILL_NARROW')],
  ['mobile index horizontal scroll', () => css.includes('overflow-x: auto') && css.includes('.ocean-index-rail')],
  ['mobile pin 40px+', () => css.includes('min-width: 2.5rem')],
  ['reduced motion hooks', () => css.includes("html[data-reduced-motion='true']")],
  ['home css v85', () => html.includes('home.css?v=85')],
];

let failed = 0;
for (const [name, fn] of checks) {
  const pass = fn();
  console.log(`${pass ? 'OK' : 'FAIL'} ${name}`);
  if (!pass) failed += 1;
}

if (failed) process.exit(1);
console.log(`\nAll ${checks.length} home final acceptance checks passed.`);
