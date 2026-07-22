/**
 * Final acceptance checks for homepage globe hotspots.
 * Run: node scripts/verify-home-globe-hotspots.mjs
 */
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');

const markersJs = fs.readFileSync(path.join(root, 'assets/js/globe/markers.js'), 'utf8');
const indexJs = fs.readFileSync(path.join(root, 'assets/js/globe/index.js'), 'utf8');
const controlsJs = fs.readFileSync(path.join(root, 'assets/js/globe/controls.js'), 'utf8');
const earthJs = fs.readFileSync(path.join(root, 'assets/js/globe/earth.js'), 'utf8');
const homeCss = fs.readFileSync(path.join(root, 'assets/css/home.css'), 'utf8');
const indexHtml = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const latlonJs = fs.readFileSync(path.join(root, 'assets/js/globe/utils/latlon.js'), 'utf8');

const checks = [
  ['1 pin anchor left/top 0 (no screen % positioning)', () =>
    homeCss.includes('left: 0') &&
    homeCss.includes('top: 0') &&
    !markersJs.includes("style.left = '") &&
    !markersJs.includes('style.top = ')],
  ['2 lat/lng to Vector3', () => latlonJs.includes('latLngToVector3') && markersJs.includes('latLngToVector3')],
  ['3 camera.project projection', () => markersJs.includes('.project(camera)')],
  ['4 earthGroup.matrixWorld', () => markersJs.includes('applyMatrix4(earthGroup.matrixWorld)')],
  ['5 earth mesh in earthGroup', () => earthJs.includes('earthGroup.add(earthMesh)')],
  ['6 dot product backface', () => markersJs.includes('.dot(_cameraDir)')],
  ['7 hotspot layer in globe stage', () => indexHtml.includes('data-globe-hotspot-layer') && indexHtml.includes('data-globe-scene')],
  ['8 resize updates renderer aspect hotspots', () =>
    indexJs.includes('renderer.setSize') &&
    indexJs.includes('camera.aspect') &&
    indexJs.includes('updateHotspotPositions')],
  ['9 drag rotates earthGroup', () => controlsJs.includes('earthGroup.rotation.y') && controlsJs.includes('earthGroup.rotation.x')],
  ['10 animate calls hotspot update after spin', () => {
    const animateBlock = indexJs.slice(indexJs.indexOf('const animate = () =>'));
    const spin = animateBlock.indexOf('updateAutoSpin');
    const hot = animateBlock.indexOf('updateHotspotPositions');
    return spin >= 0 && hot > spin;
  }],
  ['translate3d transform', () => markersJs.includes('translate3d')],
  ['no CSS2DRenderer (DOM project path)', () => !indexJs.includes('CSS2DRenderer')],
  ['touch-action none on canvas drag', () => controlsJs.includes("touchAction = 'none'")],
  ['pointer capture for touch drag', () => controlsJs.includes('setPointerCapture')],
  ['selectedOcean on click', () => markersJs.includes('window.selectedOcean')],
  ['idle resume 2s', () => controlsJs.includes('IDLE_MS = 2000')],
];

let failed = 0;
for (const [name, fn] of checks) {
  const pass = fn();
  console.log(`${pass ? 'OK' : 'FAIL'} ${name}`);
  if (!pass) failed += 1;
}

if (failed) {
  console.error(`\n${failed} acceptance check(s) failed.`);
  process.exit(1);
}

console.log(`\nAll ${checks.length} globe hotspot acceptance checks passed.`);
