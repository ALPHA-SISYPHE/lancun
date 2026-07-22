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
  ['home css v96', () => html.includes('home.css?v=96')],
  ['hero content framed', () => html.includes('hero-content--framed') && css.includes('.hero-content--framed::before')],
  ['hero lxgw font cdn', () => html.includes('lxgw-wenkai-screen-webfont')],
  ['hero lxgw font css', () => css.includes('LXGW WenKai Screen')],
  ['hero lframe strengthened', () => css.includes('border-top: 2px solid rgba(255, 255, 255, 0.62)') && css.includes('clamp(3.75rem, 10vw, 5.75rem)')],
  ['home two-screen hero lock', () => css.includes('body.home-page #hero-intro.hero-ocean-intro') && css.includes('var(--home-screen, 100svh)')],
  ['home two-screen explore lock', () => css.includes('body.home-page #ocean-explore.ocean-globe-explorer.ocean-explore') && css.includes('var(--home-screen, 100svh)')],
  ['home screen height sync', () => hero.includes('syncHomeScreenHeight') && hero.includes('--home-screen')],
  ['home hero pin by scrollY', () => hero.includes('isHomeHeroPinned') && hero.includes('syncHeroPinState')],
  ['home globe scroll max', () => hero.includes('scrollHeight - doc.clientHeight')],
  ['home globe scroll snap', () => hero.includes('scrollend') || hero.includes('setTimeout(snap')],
  ['no home footer', () => !html.includes('home-footer')],
  ['home body bg override', () => css.includes('body.home-page::before') && css.includes('display: none')],
  ['no hero bottom fade', () => !css.includes('.hero-ocean-intro::after')],
  ['hero media pin css', () => css.includes('hero-media-unpinned') && css.includes('object-position: center top')],
  ['hero media pin js', () => hero.includes('is-hero-media-pinned') && hero.includes('hero-media-unpinned')],
];

let failed = 0;
for (const [name, fn] of checks) {
  const pass = fn();
  console.log(`${pass ? 'OK' : 'FAIL'} ${name}`);
  if (!pass) failed += 1;
}

if (failed) process.exit(1);
console.log(`\nAll ${checks.length} home final acceptance checks passed.`);
