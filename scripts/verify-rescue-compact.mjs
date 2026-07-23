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

const stationBarRule = css.split('.monitor-station-bar {')[1]?.split('}')[0] ?? '';
const metricsRule = css.split('.monitor-metrics {')[1]?.split('}')[0] ?? '';

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
  ['chart tablist', !html.includes('data-chart-tab="trend"') && html.includes('pollution-insight-panel')],
  ['html insight panel grid', html.includes('insight-panel-grid') && html.includes('data-rescue-trend-card')],
  ['html no static chart panels', !html.includes('data-rescue-chart-panel=')],
  ['js render data insights', overviewJs.includes('renderDataInsightsPanel')],
  ['js no chart tabs init', !commandDeckJs.includes('initChartTabs')],
  ['html sources summary', html.includes('data-rescue-sources-summary') && overviewJs.includes('数据参考')],
  ['js modal doc in list', dataSourcesJs.includes('docs/DATA_SOURCES.md') && dataSourcesJs.includes('本项目数据说明文件')],
  ['css dialog max height', css.includes('max-height: 80vh') && css.includes('.rescue-data-dialog__body')],
  ['data sources dialog', html.includes('data-rescue-data-sources-dialog')],
  ['command-deck script', html.includes('command-deck.js')],
  ['page-state script', html.includes('page-state.js')],
  ['data-sources-modal script', html.includes('data-sources-modal.js')],
  ['css command-layout 360', css.includes('grid-template-columns: 360px minmax(0, 1fr)')],
  ['css action-brief', css.includes('.action-brief')],
  ['css status ribbon 4 col', css.includes('repeat(4, 1fr)')],
  ['css scroll-padding', css.includes('scroll-padding-top')],
  ['css panel 0.58', css.includes('rgba(234, 245, 247, 0.58)')],
  ['js ribbon four cells', overviewJs.includes("'Last Update'") && !overviewJs.includes("'Data Mode'")],
  ['js hero anchor scroll', dashboardJs.includes('initHeroAnchors')],
  ['js init page state', dashboardJs.includes('initPageState')],
  ['js init data sources modal', dashboardJs.includes('initDataSourcesModal')],
  ['js init command deck chain', dashboardJs.includes('initCommandDeck')],
  ['js refresh live watch', liveWatchJs.includes('refreshLiveWatch')],
  ['js filter four buttons', liveWatchJs.includes("'Critical'")],
  ['js chart tabs removed', !commandDeckJs.includes('initChartTabs')],
  ['js refresh observe label', html.includes('刷新观测') && commandDeckJs.includes('刷新观测')],
  ['js page state fields', pageStateJs.includes('selectedStation') && pageStateJs.includes('isDataSourcesOpen')],
  ['js data sources open', dataSourcesJs.includes('data-rescue-data-sources-open')],
  ['js set state live', liveWatchJs.includes('setPageState')],
  ['js set state source', sourceJs.includes('setPageState')],
  ['mock updatedTime', mockJs.includes("updatedTime: '14:52'")],
  ['mock deck sources', mockJs.includes('rescueDeckSources')],
  ['mock data sources catalog', mockJs.includes('rescueDataSourcesCatalog')],
  ['hero no data link', !html.includes('pollution-hero__data-link')],
  ['footer species link', html.includes('href="species.html"')],
  ['source solution shell', html.includes('class="source-solution-shell"')],
  ['source nav hooks', html.includes('data-rescue-source-nav') && html.includes('data-rescue-source-prev')],
  ['source archive drawer', html.includes('data-rescue-source-drawer')],
  ['css source grid 240', css.includes('grid-template-columns: 240px minmax(0, 0.95fr) minmax(320px, 0.9fr)')],
  ['js source info blocks', sourceJs.includes('source-info-block')],
  ['js source panel slim', sourceJs.includes("infoBlock('Impact · 生态影响'") && !sourceJs.includes("infoBlock('Solution · 解决方案'")],
  ['js source no expand', !sourceJs.includes('data-rescue-source-expand')],
  ['js no details blocks', !sourceJs.includes('<details class="source-detail-block"')],
  ['js action brief link', sourceJs.includes('#action-brief')],
  ['js source drawer', sourceJs.includes('openDrawer')],
  ['mock sourceBullets', mockJs.includes('sourceBullets')],
  ['hero copy lead split', html.includes('pollution-hero__copy--lead')],
  ['hero copy tail split', html.includes('pollution-hero__copy--tail')],
  ['css hero compact height', css.includes('clamp(440px, 46vh, 520px)')],
  ['css hero ribbon no negative margin', css.includes('.pollution-hero__status-ribbon') && !css.includes('margin: -20px auto 0')],
  ['css section padding 44', css.includes('padding: 44px 0 48px')],
  ['css monitor min 500', css.includes('min-height: 500px')],
  ['css deep soft 0.58', css.includes('rgba(3, 20, 38, 0.58)')],
  ['css tablet 64rem', css.includes('@media (max-width: 64rem)')],
  ['css source shell 460', css.includes('height: 460px') && css.includes('.source-solution-shell')],
  ['css source image max 320', css.includes('.source-image-stage') && css.includes('max-height: min(320px, 100%)')],
  ['css hero grid rows', css.includes('grid-template-rows: auto auto')],
  ['css console overlay token', css.includes('--console-overlay: rgba(3, 20, 38, 0.72)')],
  ['css frost station panel', css.includes('.monitor-station-bar') && css.includes('var(--light-panel)')],
  ['css metric strip frost', css.includes('.monitor-metrics') && css.includes('var(--light-panel)')],
  ['css monitor bars no blur', !stationBarRule.includes('backdrop-filter') && !metricsRule.includes('backdrop-filter')],
  ['css map stage gradient', css.includes('.monitor-map::after') && css.includes('linear-gradient')],
  ['html monitor stack bar', html.includes('monitor-station-bar') && html.includes('data-rescue-station-detail')],
  ['css monitor stack grid', css.includes('grid-template-rows: auto minmax(340px, 1fr) auto')],
  ['css metrics 4 col', css.includes('.monitor-metrics') && css.includes('repeat(4, 1fr)')],
  ['js station compact bar', liveWatchJs.includes('station-panel__primary') && liveWatchJs.includes('station-panel__aside')],
  ['css basemap slice', html.includes('preserveAspectRatio="xMidYMid slice"')],
  ['css insight panel grid', css.includes('.pollution-insight-panel .insight-panel-grid') && css.includes('max-height: 320px')],
  ['css tablet insight single col', css.includes('grid-template-columns: 1fr') && css.includes('max-height: 720px')],
  ['css trend canvas range', css.includes('.trend-chart-card__canvas') && css.includes('280px')],
  ['css compact ring', css.includes('.composition-ring') && css.includes('112px')],
  ['css y axis unit', css.includes('.pollution-insight-panel .rescue-trend__unit')],
  ['js y axis unit label', overviewJs.includes('rescue-trend__unit')],
  ['js composition ring svg', overviewJs.includes('buildCompositionRingSvg') && overviewJs.includes('composition-ring__segment')],
  ['js ring hover bind', overviewJs.includes('bindCompositionRingInteractions') && overviewJs.includes('--pop-x')],
  ['css ring segment hover', css.includes('.composition-ring__segment.is-active') && css.includes('--pop-x')],
  ['css ring reduced motion', css.includes('prefers-reduced-motion: reduce') && css.includes('.composition-ring__segment.is-active')],
  ['css insight tokens', css.includes('--insight-blue: #4da3ff') && css.includes('--insight-teal: #55d6c2')],
  ['js trend y axis ticks', overviewJs.includes('rescue-trend__tick') && overviewJs.includes('yAxisLine')],
  ['css source bar colors', css.includes('.insight-source-bars .chart-row:nth-child(2) .chart-fill') && css.includes('--insight-teal')],
  ['js chart tooltip', overviewJs.includes('chart-tooltip') && overviewJs.includes('r="4"')],
  ['css chart cyan token', css.includes('--chart-cyan') && css.includes('--chart-axis')],
  ['css monitor map svg z2', css.includes('.monitor-map__svg') && css.includes('z-index: 2')],
  ['js insight reveal bind', overviewJs.includes('bindInsightPanelReveal') && overviewJs.includes('prepareInsightTrendDraw')],
  ['js trend line draw path', overviewJs.includes('rescue-trend__line--draw') && overviewJs.includes('linePath')],
  ['js bar draw target', overviewJs.includes('chart-fill--draw') && overviewJs.includes('--bar-target')],
  ['css insight line reveal', css.includes('.pollution-insight-panel.is-insight-revealed .rescue-trend__line--draw')],
  ['css insight bar reveal', css.includes('.pollution-insight-panel.is-insight-revealed .chart-fill--draw')],
  ['css insight reveal reduced motion', css.includes('prefers-reduced-motion: reduce') && css.includes('.rescue-trend__line--draw')],
];

let failed = 0;
for (const [name, ok] of checks) {
  console.log(`${ok ? 'OK' : 'FAIL'} ${name}`);
  if (!ok) failed += 1;
}

if (failed) process.exit(1);
console.log('All rescue compact checks passed.');
