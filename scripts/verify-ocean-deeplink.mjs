import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const dashboard = fs.readFileSync(path.join(root, 'assets/js/ocean-dashboard.js'), 'utf8');
const cardJs = fs.readFileSync(path.join(root, 'assets/js/ocean-preview-card.js'), 'utf8');

const checks = [
  ['hash deep link resolver', () => dashboard.includes('ocean-') && dashboard.includes('ocean2ResolveOceanIdFromLocation')],
  ['query param fallback', () => dashboard.includes("params.get('ocean')")],
  ['scroll to explorer on entry', () => dashboard.includes("ocean2ScrollToAnchor('ocean-explorer')")],
  ['invalid id defaults', () => dashboard.includes('ocean2DefaultOceanId')],
  ['five tab ids', () => dashboard.includes("'pacific'") && dashboard.includes("'arctic'")],
  ['homepage card hash link', () => cardJs.includes('pages/ocean.html#ocean-')],
  ['no new window on card link', () => !cardJs.includes('target="_blank"')],
  ['return home link in explorer', () => dashboard.includes('ocean2-explorer__home-link') && dashboard.includes('../index.html#ocean-explore')],
  ['query normalized to hash', () => dashboard.includes('URLSearchParams') && dashboard.includes('replaceState')],
];

let failed = 0;
for (const [name, fn] of checks) {
  const pass = fn();
  console.log(`${pass ? 'OK' : 'FAIL'} ${name}`);
  if (!pass) failed += 1;
}

if (failed) process.exit(1);
console.log(`\nAll ${checks.length} ocean deep-link checks passed.`);
