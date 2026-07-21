/**
 * 行动中心 · 阶段 2 打卡 smoke
 */
import { chromium } from 'playwright';

const BASE = process.env.BASE_URL || 'http://127.0.0.1:5500';
const USER = 'p2-checkin-smoke';
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
await page.waitForFunction(() => window.OceanActionCheckins && window.OceanActionCheckinUI);

// Clear prior smoke data
await page.evaluate((username) => {
  localStorage.removeItem(`ocean-action-checkins.${username}`);
  localStorage.removeItem(`ocean-action-badges.${username}`);
  localStorage.removeItem('lancun.account');
  localStorage.removeItem('lancun.session');
  window.OceanActionCheckinUI?.renderCheckinPanel?.();
}, USER);

const guest = await page.evaluate(() => ({
  hintHidden: document.querySelector('[data-checkin-login-hint]')?.hidden === false,
  submitDisabled: document.querySelector('[data-checkin-submit]')?.disabled === true,
}));
if (guest.hintHidden && guest.submitDisabled) pass('guest gating');
else fail('guest gating', guest);

// Login
await page.evaluate(
  (username) => {
    localStorage.setItem(
      'lancun.account',
      JSON.stringify({ username, displayName: 'Smoke Tester', email: `${username}@test.local` }),
    );
    localStorage.setItem('lancun.session', JSON.stringify({ username, loggedIn: true }));
    window.renderProfile?.();
    window.OceanActionCheckinUI?.renderCheckinPanel?.();
  },
  USER,
);

const loggedIn = await page.evaluate(() => ({
  hintHidden: document.querySelector('[data-checkin-login-hint]')?.hidden === true,
  submitEnabled: document.querySelector('[data-checkin-submit]')?.disabled === false,
}));
if (loggedIn.hintHidden && loggedIn.submitEnabled) pass('logged-in form enabled');
else fail('logged-in form enabled', loggedIn);

await page.selectOption('#checkin-action-type', '自带水杯');
await page.fill('#checkin-action-desc', 'Playwright 阶段2验收打卡');
await page.click('[data-checkin-submit]');

await page.waitForSelector('[data-checkin-certificate-dialog][open]', { timeout: 5000 });
pass('certificate dialog opens');

const afterSubmit = await page.evaluate((username) => {
  const checkins = window.OceanActionCheckins.getCheckins(username);
  const today = window.OceanActionCheckins.toIsoDate(new Date());
  const streak = window.OceanActionCheckins.calculateStreak(checkins);
  const badges = window.OceanActionBadges.getUnlockedBadges(username);
  return {
    count: checkins.length,
    today: checkins.find((c) => c.date === today),
    streak,
    badgeCount: badges.length,
    doneVisible: !document.querySelector('[data-checkin-done]')?.hidden,
    submitHidden: document.querySelector('[data-checkin-submit]')?.hidden === true,
    storageKey: localStorage.getItem(`ocean-action-checkins.${username}`) !== null,
  };
}, USER);

if (afterSubmit.count === 1 && afterSubmit.today && afterSubmit.storageKey) pass('checkin saved to localStorage');
else fail('checkin saved to localStorage', afterSubmit);

if (afterSubmit.streak.currentStreak >= 1 && afterSubmit.doneVisible && afterSubmit.submitHidden) {
  pass('post-submit UI state');
} else fail('post-submit UI state', afterSubmit);

await page.click('[data-checkin-certificate-close]');
await page.waitForFunction(() => !document.querySelector('[data-checkin-certificate-dialog][open]'));

await page.reload({ waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => window.OceanActionCheckins);

const persisted = await page.evaluate((username) => {
  const checkins = window.OceanActionCheckins.getCheckins(username);
  return {
    count: checkins.length,
    streak: window.OceanActionCheckins.calculateStreak(checkins).currentStreak,
  };
}, USER);

if (persisted.count === 1 && persisted.streak >= 1) pass('persistence after reload');
else fail('persistence after reload', persisted);

await page.click('[data-checkin-history-open]');
await page.waitForSelector('[data-checkin-history-dialog][open]');
const historyItems = await page.locator('.checkin-history-item').count();
if (historyItems >= 1) pass('history dialog list');
else fail('history dialog list', { historyItems });
await page.click('[data-checkin-history-close]');

await page.setViewportSize({ width: 375, height: 812 });
await page.waitForTimeout(300);
const overflow = await page.evaluate(() => {
  const doc = document.documentElement;
  return doc.scrollWidth <= doc.clientWidth + 1;
});
if (overflow) pass('no horizontal overflow at 375px');
else fail('no horizontal overflow at 375px');

const failed = checks.filter((c) => !c.ok);
console.log(JSON.stringify({ checks, errors, failed: failed.length }, null, 2));
await browser.close();
process.exit(failed.length || errors.length ? 1 : 0);
