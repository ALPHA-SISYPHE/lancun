import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');

const markersJs = fs.readFileSync(path.join(root, 'assets/js/globe/markers.js'), 'utf8');
const controlsJs = fs.readFileSync(path.join(root, 'assets/js/globe/controls.js'), 'utf8');
const indexJs = fs.readFileSync(path.join(root, 'assets/js/globe/index.js'), 'utf8');
const mockData = fs.readFileSync(path.join(root, 'assets/js/mock-data.js'), 'utf8');

const checks = [
  ['auto spin 0.18-0.35 range', () => /AUTO_SPIN_SPEED = 0\.28/.test(controlsJs)],
  ['idle resume 2s', () => /IDLE_MS = 2000/.test(controlsJs)],
  ['lat/lng 3D markers', () => markersJs.includes('latLonToVector3')],
  ['back-face visibility', () => markersJs.includes('updateVisibility')],
  ['keyboard Enter/Space', () => markersJs.includes("event.key === 'Enter'")],
  ['active state', () => markersJs.includes('is-active')],
  ['pin select event (no card yet)', () => markersJs.includes('lancun-ocean-pin-select')],
  ['no page navigation on click', () => !markersJs.includes('window.location.href')],
  ['animate loop updates markers', () => indexJs.includes('markerApi.updateVisibility')],
  ['five ocean hotspot fields', () =>
    ['englishName', 'shortDescription', 'targetTab', 'lng'].every((key) => mockData.includes(key))],
  ['five oceans count', () => (mockData.match(/id: '(pacific|atlantic|indian|southern|arctic)'/g) || []).length === 5],
];

let failed = 0;
for (const [name, fn] of checks) {
  const pass = fn();
  console.log(`${pass ? 'OK' : 'FAIL'} ${name}`);
  if (!pass) failed += 1;
}

if (failed) process.exit(1);
console.log(`\nAll ${checks.length} globe P2 checks passed.`);
