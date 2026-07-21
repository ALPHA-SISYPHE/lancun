/**
 * 行动中心 · 阶段 6 整页 smoke
 * scrollHeight baseline (pre-phase-6): ~7800px @ 1440×900 — target ≤85%
 */
import { chromium } from 'playwright';

const BASE = process.env.BASE_URL || 'http://127.0.0.1:5500';
const SCROLL_HEIGHT_BASELINE = 7800;
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
    && window.IMPACT_STORIES,
);

const modules = await page.evaluate(() => ({
  checkin: Boolean(document.querySelector('#daily-action-dock')),
  volunteer: Boolean(document.querySelector('#volunteer-mission-board')),
  harbor: Boolean(document.querySelector('#support-harbor')),
  impact: Boolean(document.querySelector('#impact-story-carousel')),
  archive: Boolean(document.querySelector('#personal-action-archive')),
  lightPanel: getComputedStyle(document.querySelector('.daily-action-shell')).backgroundColor,
}));
if (modules.checkin && modules.volunteer && modules.harbor && modules.impact && modules.archive) {
  pass('seven modules present');
} else fail('seven modules present', modules);

const bgVideo = await page.evaluate(() => {
  const media = document.querySelector('.page-bg-video__media');
  return {
    present: Boolean(media),
    hidden: media ? getComputedStyle(media).display === 'none' : true,
  };
});
if (bgVideo.present && !bgVideo.hidden) pass('background video present');
else fail('background video present', bgVideo);

const dockBg = await page.evaluate(() => {
  const shell = document.querySelector('.daily-action-shell');
  return shell ? getComputedStyle(shell).backgroundColor : '';
});
if (dockBg && !dockBg.includes('234')) pass('checkin dock uses dark glass');
else fail('checkin dock uses dark glass', { dockBg });

const guest = await page.evaluate(() => ({
  checkinHint: document.querySelector('[data-checkin-login-hint]')?.hidden === false,
  volunteerHint: document.querySelector('[data-volunteer-login-hint]')?.hidden === false,
  donationHint: document.querySelector('[data-donation-login-hint]')?.hidden === false,
}));
if (guest.checkinHint && guest.volunteerHint && guest.donationHint) pass('all modules guest hints');
else fail('all modules guest hints', guest);

const cards = await page.locator('.mission-card').count();
const impactTitles = await page.locator('[data-impact-card] h3').count();
if (cards === 3) pass('volunteer shows 3 cards');
else fail('volunteer shows 3 cards', { cards });
if (impactTitles === 1) pass('impact shows 1 story');
else fail('impact shows 1 story', { impactTitles });

const desktopLayout = await page.evaluate(() => {
  const grid = document.querySelector('.mission-card-grid');
  const harborLayout = document.querySelector('.support-harbor-layout');
  const cols = grid ? getComputedStyle(grid).gridTemplateColumns : '';
  const harborCols = harborLayout ? getComputedStyle(harborLayout).gridTemplateColumns : '';
  const scrollHeight = document.documentElement.scrollHeight;
  return { cols, harborCols, scrollHeight };
});
const threeCol = (desktopLayout.cols.match(/\d/g) || []).length >= 3
  || desktopLayout.cols.includes('repeat(3')
  || desktopLayout.cols.split(/\s+/).filter(Boolean).length >= 3;
if (threeCol) pass('desktop volunteer 3-column grid');
else fail('desktop volunteer 3-column grid', { cols: desktopLayout.cols });
const harborDual = desktopLayout.harborCols.split(/\s+/).filter(Boolean).length >= 2
  || desktopLayout.harborCols.includes('fr');
if (harborDual) pass('harbor dual-column layout');
else fail('harbor dual-column layout', { harborCols: desktopLayout.harborCols });
if (desktopLayout.scrollHeight <= Math.round(SCROLL_HEIGHT_BASELINE * 0.85)) {
  pass('scroll height compressed');
} else {
  fail('scroll height compressed', {
    scrollHeight: desktopLayout.scrollHeight,
    max: Math.round(SCROLL_HEIGHT_BASELINE * 0.85),
  });
}

await page.evaluate(() => window.scrollTo(0, window.innerHeight * 2));
await page.waitForTimeout(200);
const earlyScroll = await page.evaluate(() => {
  const title = document.querySelector('#mission-board-title');
  const board = document.querySelector('#volunteer-mission-board');
  const target = title || board;
  if (!target) return { visible: false };
  const rect = target.getBoundingClientRect();
  return {
    visible: rect.top < window.innerHeight && rect.bottom > 0,
    top: rect.top,
    scrollY: window.scrollY,
  };
});
if (earlyScroll.visible) pass('volunteer board visible within two scrolls');
else fail('volunteer board visible within two scrolls', earlyScroll);

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

await page.setViewportSize({ width: 768, height: 1024 });
await page.waitForTimeout(300);
const tablet = await page.evaluate(() => ({
  overflow: document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1,
}));
if (tablet.overflow) pass('768px no horizontal overflow');
else fail('768px no horizontal overflow', tablet);

await page.setViewportSize({ width: 375, height: 812 });
await page.waitForTimeout(300);
const mobile = await page.evaluate(() => ({
  overflow: document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1,
  missionScroll: getComputedStyle(document.querySelector('.mission-card-grid')).overflowX,
  weekScroll: getComputedStyle(document.querySelector('.daily-week-strip__days')).overflowX,
  dialogMaxHeight: getComputedStyle(document.querySelector('.action-dialog') || document.body).maxHeight,
}));
if (mobile.overflow) pass('375px no horizontal overflow');
else fail('375px no horizontal overflow');
if (mobile.missionScroll === 'auto' && mobile.weekScroll === 'auto') pass('mobile horizontal scroll strips');
else fail('mobile horizontal scroll strips', mobile);

const failed = checks.filter((c) => !c.ok);
console.log(JSON.stringify({ checks, errors, failed: failed.length }, null, 2));
await browser.close();
process.exit(failed.length || errors.length ? 1 : 0);
