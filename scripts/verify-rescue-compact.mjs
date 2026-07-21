import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const html = fs.readFileSync(path.join(root, 'pages/rescue.html'), 'utf8');
const css = fs.readFileSync(path.join(root, 'assets/css/rescue-page.css'), 'utf8');
const overviewJs = fs.readFileSync(path.join(root, 'assets/js/rescue/pollution-overview.js'), 'utf8');
const dashboardJs = fs.readFileSync(path.join(root, 'assets/js/rescue-dashboard.js'), 'utf8');
const commandDeckJs = fs.readFileSync(path.join(root, 'assets/js/rescue/command-deck.js'), 'utf8');
const liveWatchJs = fs.readFileSync(path.join(root, 'assets/js/rescue/live-watch.js'), 'utf8');
const pageStateJs = fs.readFileSync(path.join(root, 'assets/js/rescue/page-state.js'), 'utf8');
const dataSourcesJs = fs.readFileSync(path.join(root, 'assets/js/rescue/data-sources-modal.js'), 'utf8');
const mockJs = fs.readFileSync(path.join(root, 'assets/js/mock-data.js'), 'utf8');
const sourceJs = fs.readFileSync(path.join(root, 'assets/js/rescue/source-matrix.js'), 'utf8');

const footerBlock = html.match(/<footer[\s\S]*?<\/footer>/)?.[0] || '';

const checks = [
  ['command-deck legacy anchor', html.includes('id="command-deck"')],
  ['hero ribbon hook', html.includes('data-rescue-hero-ribbon')],
  ['status-ribbon class', html.includes('class="status-ribbon')],
  ['anchor pollution-command section', html.includes('id="pollution-command"') && html.includes('pollution-command-section')],
  ['anchor live-monitoring', html.includes('id="live-monitoring"')],
  ['anchor action-brief section', html.includes('id="action-brief"') && html.includes('class="action-brief ')],
  ['footer rescue-footer', html.includes('id="rescue-footer"') && !footerBlock.includes('id="action-brief"')],
  ['legacy action-cta', html.includes('id="action-cta"')],
  ['hero 4 anchors', (html.match(/pollution-hero__anchors[\s\S]*?<\/nav>/)?.[0].match(/<a /g) || []).length === 4],
  ['href pollution-command', html.includes('href="#pollution-command"')],
  ['href live-monitoring', html.includes('href="#live-monitoring"')],
  ['href action-brief', html.includes('href="#action-brief"')],
  ['legacy pressure-overview', html.includes('id="pressure-overview"')],
  ['command-layout', html.includes('class="command-layout"')],
  ['status filter toolbar', html.includes('data-rescue-status-filter')],
  ['chart tablist', html.includes('command-chart-tabs') && html.includes('data-chart-tab="trend"')],
  ['data sources dialog', html.includes('data-rescue-data-sources-dialog')],
  ['command-deck script', html.includes('command-deck.js')],
  ['page-state script', html.includes('page-state.js')],
  ['data-sources-modal script', html.includes('data-sources-modal.js')],
  ['css command-layout 360', css.includes('grid-template-columns: 360px minmax(0, 1fr)')],
  ['css action-brief', css.includes('.action-brief')],
  ['css status ribbon 5 col', css.includes('repeat(5, 1fr)')],
  ['css scroll-padding', css.includes('scroll-padding-top')],
  ['css panel 0.58', css.includes('rgba(234, 245, 247, 0.58)')],
  ['js ribbon data mode', overviewJs.includes("'Data Mode'")],
  ['js hero anchor scroll', dashboardJs.includes('initHeroAnchors')],
  ['js init page state', dashboardJs.includes('initPageState')],
  ['js init data sources modal', dashboardJs.includes('initDataSourcesModal')],
  ['js init command deck chain', dashboardJs.includes('initCommandDeck')],
  ['js refresh live watch', liveWatchJs.includes('refreshLiveWatch')],
  ['js filter four buttons', liveWatchJs.includes("'Critical'")],
  ['js chart tabs', commandDeckJs.includes('initChartTabs')],
  ['js refresh observe label', html.includes('刷新观测') && commandDeckJs.includes('刷新观测')],
  ['js page state fields', pageStateJs.includes('selectedStation') && pageStateJs.includes('isDataSourcesOpen')],
  ['js data sources open', dataSourcesJs.includes('data-rescue-data-sources-open')],
  ['js set state live', liveWatchJs.includes('setPageState')],
  ['js set state source', sourceJs.includes('setPageState')],
  ['mock updatedTime', mockJs.includes("updatedTime: '14:52'")],
  ['mock deck sources', mockJs.includes('rescueDeckSources')],
  ['mock data sources catalog', mockJs.includes('rescueDataSourcesCatalog')],
  ['hero data sources open', html.includes('pollution-hero__data-link') && html.includes('data-rescue-data-sources-open')],
  ['footer species link', html.includes('href="species.html"')],
  ['source solution shell', html.includes('class="source-solution-shell"')],
  ['source nav hooks', html.includes('data-rescue-source-nav') && html.includes('data-rescue-source-prev')],
  ['source archive drawer', html.includes('data-rescue-source-drawer')],
  ['css source grid 240', css.includes('grid-template-columns: 240px minmax(0, 0.95fr) minmax(360px, 0.9fr)')],
  ['js source info blocks', sourceJs.includes('source-info-block')],
  ['js no details blocks', !sourceJs.includes('<details class="source-detail-block"')],
  ['js action brief link', sourceJs.includes('#action-brief')],
  ['js source drawer', sourceJs.includes('openDrawer')],
  ['mock sourceBullets', mockJs.includes('sourceBullets')],
  ['hero copy lead split', html.includes('pollution-hero__copy--lead')],
  ['hero copy tail split', html.includes('pollution-hero__copy--tail')],
  ['css hero compact height', css.includes('clamp(440px, 46vh, 520px)')],
  ['css section padding 44', css.includes('padding: 44px 0 48px')],
  ['css monitor min 340', css.includes('min-height: 340px')],
  ['css deep soft 0.58', css.includes('rgba(3, 20, 38, 0.58)')],
  ['css tablet 64rem', css.includes('@media (max-width: 64rem)')],
  ['css source min 380', css.includes('min-height: 380px')],
  ['css hero grid rows', css.includes('grid-template-rows: auto auto')],
];

let failed = 0;
for (const [name, ok] of checks) {
  console.log(`${ok ? 'OK' : 'FAIL'} ${name}`);
  if (!ok) failed += 1;
}

if (failed) process.exit(1);
console.log('All rescue compact checks passed.');
