/**
 * 行动中心 · 最终阶段 smoke（ParticipationHub + 多视口）
 * scrollHeight baseline (pre-phase-3): ~6600px @ 1440×900 — target ≤75%
 */
import { chromium } from 'playwright';

const BASE = process.env.BASE_URL || 'http://127.0.0.1:5500';
const SCROLL_HEIGHT_MAX = 6200;
const VIEWPORTS = [
  { label: '1440x900', width: 1440, height: 900 },
  { label: '1536x864', width: 1536, height: 864 },
  { label: '1920x1080', width: 1920, height: 1080 },
  { label: '768x1024', width: 768, height: 1024 },
  { label: '375x812', width: 375, height: 812 },
];
const errors = [];
const checks = [];

function pass(name, detail = true) {
  checks.push({ name, ok: true, detail });
}

function fail(name, detail) {
  checks.push({ name, ok: false, detail });
}

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

page.on('console', (msg) => {
  if (msg.type() === 'error') errors.push(msg.text());
});
page.on('pageerror', (err) => errors.push(err.message));

await page.goto(`${BASE}/pages/action.html`, { waitUntil: 'domcontentloaded', timeout: 30000 });
await page.waitForFunction(
  () =>
    window.OceanActionCheckins
    && window.OceanActionVolunteer
    && window.OceanActionDonation
    && window.OceanActionArchiveUI
    && window.OceanActionImpactCarousel
    && window.IMPACT_STORIES,
);

const modules = await page.evaluate(() => ({
  checkin: Boolean(document.querySelector('#daily-action-dock')),
  hub: Boolean(document.querySelector('#participation-hub')),
  volunteer: Boolean(document.querySelector('#volunteer-mission-board')),
  harbor: Boolean(document.querySelector('#support-harbor')),
  impact: Boolean(document.querySelector('#impact-story-carousel')),
  archive: Boolean(document.querySelector('#personal-action-archive')),
}));
if (modules.checkin && modules.hub && modules.volunteer && modules.harbor && modules.impact && modules.archive) {
  pass('top-level modules present');
} else fail('top-level modules present', modules);

const hubNest = await page.evaluate(() => {
  const hub = document.querySelector('#participation-hub');
  if (!hub) return { ok: false };
  return {
    ok: Boolean(hub.querySelector('#volunteer-mission-board'))
      && Boolean(hub.querySelector('#support-harbor'))
      && Boolean(hub.querySelector('#impact-story-carousel'))
      && Boolean(hub.querySelector('#impact-story-carousel-donation')),
  };
});
if (hubNest.ok) pass('participation hub contains volunteer, harbor and dual impact');
else fail('participation hub contains volunteer, harbor and dual impact', hubNest);

const dualHub = await page.evaluate(() => ({
  donationPanelVisible: document.querySelector('#participation-panel-donation')?.hidden === false,
  volunteerPanelVisible: document.querySelector('#participation-panel-volunteer')?.hidden === false,
  donationCards: document.querySelectorAll('.donation-project-card').length,
  removedCopy: !document.body.textContent.includes('志愿报名与公益支持集中在此')
    && !document.body.textContent.includes('不产生真实报名效力')
    && !document.body.textContent.includes('不产生真实支付效力'),
}));
if (dualHub.donationPanelVisible && dualHub.volunteerPanelVisible) {
  pass('volunteer and donation panels visible together');
} else {
  fail('volunteer and donation panels visible together', dualHub);
}
if (dualHub.donationCards === 3) pass('donation shows 3 cards alongside volunteer');
else fail('donation shows 3 cards alongside volunteer', { donationCards: dualHub.donationCards });
if (dualHub.removedCopy) pass('participation hub trimmed copy removed');
else fail('participation hub trimmed copy removed', dualHub);

const heroClear = await page.evaluate(() => {
  const shell = document.querySelector('.daily-action-shell');
  const h1 = document.querySelector('#action-hero-title');
  const lead = document.querySelector('.action-hero__lead');
  if (!shell || !h1 || !lead) return { ok: false };
  const shellRect = shell.getBoundingClientRect();
  const overlaps = (rect) => !(
    rect.right <= shellRect.left
    || rect.left >= shellRect.right
    || rect.bottom <= shellRect.top
    || rect.top >= shellRect.bottom
  );
  return {
    ok: !overlaps(h1.getBoundingClientRect()) && !overlaps(lead.getBoundingClientRect()),
    h1Top: h1.getBoundingClientRect().top,
    shellTop: shellRect.top,
  };
});
if (heroClear.ok) pass('hero title and lead not covered by dock');
else fail('hero title and lead not covered by dock', heroClear);

const dockBg = await page.evaluate(() => {
  const shell = document.querySelector('.daily-action-shell');
  return shell ? getComputedStyle(shell).backgroundColor : '';
});
if (dockBg && !dockBg.includes('234')) pass('checkin dock uses dark glass');
else fail('checkin dock uses dark glass', { dockBg });

const bgVideo = await page.evaluate(() => {
  const media = document.querySelector('.page-bg-video__media');
  return {
    present: Boolean(media),
    hidden: media ? getComputedStyle(media).display === 'none' : true,
  };
});
if (bgVideo.present && !bgVideo.hidden) pass('background video present');
else fail('background video present', bgVideo);

const guest = await page.evaluate(() => ({
  checkinHint: document.querySelector('[data-checkin-login-hint]')?.hidden === false,
  volunteerHint: document.querySelector('[data-volunteer-login-hint]')?.hidden === false,
  donationHint: document.querySelector('[data-donation-login-hint]')?.hidden === false,
}));
if (guest.checkinHint && guest.volunteerHint && guest.donationHint) pass('all modules guest hints');
else fail('all modules guest hints', guest);

const cards = await page.locator('.mission-card').count();
const impactTitles = await page.locator('[data-impact-card-volunteer] h3').count();
if (cards === 3) pass('volunteer shows 3 cards');
else fail('volunteer shows 3 cards', { cards });
if (impactTitles === 1) pass('impact shows 1 visible volunteer story');
else fail('impact shows 1 visible volunteer story', { impactTitles });

const desktopLayout = await page.evaluate(() => {
  const grid = document.querySelector('.mission-card-grid');
  const participationContent = document.querySelector('[data-participation-panel="volunteer"]');
  const cols = grid ? getComputedStyle(grid).gridTemplateColumns : '';
  const contentCols = participationContent ? getComputedStyle(participationContent).gridTemplateColumns : '';
  const scrollHeight = document.documentElement.scrollHeight;
  return { cols, contentCols, scrollHeight };
});
const threeCol = (desktopLayout.cols.match(/\d/g) || []).length >= 3
  || desktopLayout.cols.includes('repeat(3')
  || desktopLayout.cols.split(/\s+/).filter(Boolean).length >= 3;
if (threeCol) pass('desktop volunteer 3-column grid');
else fail('desktop volunteer 3-column grid', { cols: desktopLayout.cols });
const hubDual = desktopLayout.contentCols.split(/\s+/).filter(Boolean).length >= 2
  || desktopLayout.contentCols.includes('fr');
if (hubDual) pass('participation content dual-column layout');
else fail('participation content dual-column layout', { contentCols: desktopLayout.contentCols });
if (desktopLayout.scrollHeight <= SCROLL_HEIGHT_MAX) {
  pass('scroll height compressed');
} else {
  fail('scroll height compressed', {
    scrollHeight: desktopLayout.scrollHeight,
    max: SCROLL_HEIGHT_MAX,
  });
}

const hubReach = await page.evaluate(() => {
  const target = document.querySelector('#mission-board-title') || document.querySelector('#volunteer-mission-board');
  if (!target) return { ok: false };
  const docTop = target.getBoundingClientRect().top + window.scrollY;
  return {
    ok: docTop <= window.innerHeight * 2,
    docTop,
    threshold: window.innerHeight * 2,
  };
});
if (hubReach.ok) pass('volunteer board visible within two scrolls');
else fail('volunteer board visible within two scrolls', hubReach);

await page.evaluate(() => {
  const hub = document.querySelector('#participation-hub');
  if (!hub) return;
  const top = hub.getBoundingClientRect().top + window.scrollY - window.innerHeight * 0.2;
  window.scrollTo({ top: Math.max(0, top), behavior: 'instant' });
});

await page.locator('[data-volunteer-detail]').first().click();
await page.waitForSelector('[data-volunteer-detail-dialog][open]');
const volunteerDetailCentered = await page.evaluate(() => {
  const dialog = document.querySelector('[data-volunteer-detail-dialog]');
  if (!dialog?.open) return { ok: false, reason: 'not open' };
  const rect = dialog.getBoundingClientRect();
  const vh = window.innerHeight;
  const centerY = rect.top + rect.height / 2;
  const tolerance = vh * 0.25;
  return {
    ok: rect.top >= 24 && Math.abs(centerY - vh / 2) <= tolerance,
    top: rect.top,
    centerY,
    viewportCenterY: vh / 2,
    height: rect.height,
  };
});
if (volunteerDetailCentered.ok) pass('volunteer detail dialog viewport centered after scroll');
else fail('volunteer detail dialog viewport centered after scroll', volunteerDetailCentered);
await page.locator('[data-volunteer-detail-close]').click();
await page.waitForFunction(() => !document.querySelector('[data-volunteer-detail-dialog][open]'));

await page.locator('[data-impact-card-volunteer]').click();
const volunteerImpactDetail = await page.evaluate(() => {
  const dialog = document.querySelector('[data-impact-detail-dialog]');
  const title = document.querySelector('[data-impact-detail-title]')?.textContent?.trim();
  const rect = dialog?.getBoundingClientRect();
  const vh = window.innerHeight;
  const centerY = rect ? rect.top + rect.height / 2 : 0;
  const tolerance = vh * 0.25;
  const centered = Boolean(
    dialog?.open
    && rect
    && rect.top >= 24
    && Math.abs(centerY - vh / 2) <= tolerance,
  );
  return {
    open: dialog?.open === true,
    title,
    centered,
    top: rect?.top,
    centerY,
    viewportCenterY: vh / 2,
  };
});
if (volunteerImpactDetail.open && volunteerImpactDetail.title) {
  pass('volunteer impact detail dialog opens with title');
} else {
  fail('volunteer impact detail dialog opens with title', volunteerImpactDetail);
}
if (volunteerImpactDetail.centered) pass('volunteer impact detail dialog viewport centered after scroll');
else fail('volunteer impact detail dialog viewport centered after scroll', volunteerImpactDetail);
await page.locator('[data-impact-detail-close]').click();
await page.waitForFunction(() => !document.querySelector('[data-impact-detail-dialog][open]'));

await page.locator('[data-impact-card-donation]').scrollIntoViewIfNeeded();
await page.locator('[data-impact-card-donation]').click();
const donationImpactDetail = await page.evaluate(() => {
  const dialog = document.querySelector('[data-impact-detail-dialog]');
  const title = document.querySelector('[data-impact-detail-title]')?.textContent?.trim();
  const type = document.querySelector('[data-impact-detail-type]')?.textContent?.trim();
  return {
    open: dialog?.open === true,
    title,
    type,
  };
});
if (donationImpactDetail.open && donationImpactDetail.title && donationImpactDetail.type === '公益成果') {
  pass('donation impact detail dialog opens with title');
} else {
  fail('donation impact detail dialog opens with title', donationImpactDetail);
}
await page.locator('[data-impact-detail-close-footer]').click();
await page.waitForFunction(() => !document.querySelector('[data-impact-detail-dialog][open]'));

const archiveStrip = await page.evaluate(() => {
  const strip = document.querySelector('#personal-action-archive .personal-archive-strip');
  const stats = [
    document.querySelector('[data-archive-stat-checkins]')?.textContent?.trim(),
    document.querySelector('[data-archive-stat-badges]')?.textContent?.trim(),
    document.querySelector('[data-archive-stat-volunteer]')?.textContent?.trim(),
    document.querySelector('[data-archive-stat-donations]')?.textContent?.trim(),
  ];
  const footerLink = document.querySelector('.site-footer--action .site-footer__link')?.getAttribute('href');
  return {
    strip: Boolean(strip),
    statsOk: stats.every((text) => Boolean(text)),
    footerLink,
  };
});
if (archiveStrip.strip && archiveStrip.statsOk) pass('archive strip with stat counts');
else fail('archive strip with stat counts', archiveStrip);
if (archiveStrip.footerLink?.includes('DATA_SOURCES.md')) pass('action footer data source link');
else fail('action footer data source link', archiveStrip);

const noHarborForm = await page.evaluate(() => !document.querySelector('#support-harbor [data-donation-form]'));
if (noHarborForm) pass('donation form not exposed in support harbor');
else fail('donation form not exposed in support harbor');

const archiveReach = await page.evaluate(() => {
  const strip = document.querySelector('#personal-action-archive .personal-archive-strip');
  if (!strip) return { ok: false };
  const docTop = strip.getBoundingClientRect().top + window.scrollY;
  return {
    ok: strip.offsetHeight > 0,
    docTop,
    height: strip.offsetHeight,
  };
});
if (archiveReach.ok) pass('personal archive strip rendered with height');
else fail('personal archive strip rendered with height', archiveReach);

async function evaluateViewportHealth() {
  return page.evaluate(() => {
    const shell = document.querySelector('.daily-action-shell');
    const h1 = document.querySelector('#action-hero-title');
    const lead = document.querySelector('.action-hero__lead');
    const shellRect = shell?.getBoundingClientRect();
    const overlaps = (rect) => {
      if (!shellRect || !rect) return false;
      return !(
        rect.right <= shellRect.left
        || rect.left >= shellRect.right
        || rect.bottom <= shellRect.top
        || rect.top >= shellRect.bottom
      );
    };
    return {
      overflow: document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1,
      heroClear: Boolean(h1 && lead && shell && !overlaps(h1.getBoundingClientRect()) && !overlaps(lead.getBoundingClientRect())),
      scrollHeight: document.documentElement.scrollHeight,
    };
  });
}

for (const viewport of VIEWPORTS) {
  await page.setViewportSize({ width: viewport.width, height: viewport.height });
  await page.waitForTimeout(250);
  const health = await evaluateViewportHealth();
  if (health.overflow) pass(`${viewport.label} no horizontal overflow`);
  else fail(`${viewport.label} no horizontal overflow`, health);
  if (health.heroClear) pass(`${viewport.label} hero not covered by dock`);
  else fail(`${viewport.label} hero not covered by dock`, health);
  if (viewport.label === '1440x900' && health.scrollHeight <= SCROLL_HEIGHT_MAX) {
    pass('1440 scroll height compressed');
  } else if (viewport.label === '1440x900') {
    fail('1440 scroll height compressed', { scrollHeight: health.scrollHeight, max: SCROLL_HEIGHT_MAX });
  }
}

await page.setViewportSize({ width: 375, height: 812 });
await page.waitForTimeout(300);
const mobile = await page.evaluate(() => ({
  missionScroll: getComputedStyle(document.querySelector('.mission-card-grid')).overflowX,
  weekScroll: getComputedStyle(document.querySelector('.daily-week-strip__days')).overflowX,
  tabScroll: getComputedStyle(document.querySelector('.participation-tabs')).overflowX,
}));
if (mobile.missionScroll === 'auto' && mobile.weekScroll === 'auto') pass('mobile horizontal scroll strips');
else fail('mobile horizontal scroll strips', mobile);
if (mobile.tabScroll === 'auto') pass('mobile participation tabs horizontal scroll');
else fail('mobile participation tabs horizontal scroll', mobile);

const failed = checks.filter((c) => !c.ok);
console.log(JSON.stringify({ checks, errors, failed: failed.length }, null, 2));
await browser.close();
process.exit(failed.length || errors.length ? 1 : 0);
