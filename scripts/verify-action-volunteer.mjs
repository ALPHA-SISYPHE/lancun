/**
 * 行动中心 · 阶段 3 志愿 smoke
 */
import { chromium } from 'playwright';

const BASE = process.env.BASE_URL || 'http://127.0.0.1:5500';
const USER = 'p3-volunteer-smoke';
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
await page.waitForFunction(() => window.VOLUNTEER_ACTIVITIES && window.OceanActionVolunteerUI);

await page.evaluate((username) => {
  localStorage.removeItem('ocean-action-volunteer-registrations');
  localStorage.removeItem('lancun.account');
  localStorage.removeItem('lancun.session');
  window.OceanActionVolunteerUI?.renderMissionBoard?.();
}, USER);

const dataCount = await page.evaluate(() => window.VOLUNTEER_ACTIVITIES.length);
if (dataCount >= 30) pass('30+ activities in database', dataCount);
else fail('30+ activities in database', dataCount);

const cardCount = await page.locator('.mission-card').count();
if (cardCount === 3) pass('shows exactly 3 cards');
else fail('shows exactly 3 cards', { cardCount });

const titlesBefore = await page.locator('.mission-card h3').allTextContents();
await page.click('[data-mission-refresh]');
await page.waitForTimeout(300);
const titlesAfter = await page.locator('.mission-card h3').allTextContents();
if (titlesBefore.join('|') !== titlesAfter.join('|')) pass('manual refresh changes batch');
else fail('manual refresh changes batch', { titlesBefore, titlesAfter });

const guest = await page.evaluate(() => ({
  hintVisible: document.querySelector('[data-volunteer-login-hint]')?.hidden === false,
  registerDisabled: Array.from(document.querySelectorAll('[data-volunteer-register]')).every((btn) => btn.disabled),
}));
if (guest.hintVisible && guest.registerDisabled) pass('guest gating');
else fail('guest gating', guest);

await page.evaluate(
  (username) => {
    localStorage.setItem(
      'lancun.account',
      JSON.stringify({ username, displayName: 'Volunteer Tester', email: `${username}@test.local` }),
    );
    localStorage.setItem('lancun.session', JSON.stringify({ username, loggedIn: true }));
    window.renderProfile?.();
    window.OceanActionVolunteerUI?.renderMissionBoard?.();
  },
  USER,
);

const firstDetailBtn = page.locator('[data-volunteer-detail]').first();
const activityId = await firstDetailBtn.getAttribute('data-volunteer-detail');
await firstDetailBtn.click();
await page.waitForSelector('[data-volunteer-detail-dialog][open]');
pass('detail dialog opens');

const detailCentered = await page.evaluate(() => {
  const dialog = document.querySelector('[data-volunteer-detail-dialog]');
  const rect = dialog?.getBoundingClientRect();
  const vh = window.innerHeight;
  const centerY = rect ? rect.top + rect.height / 2 : 0;
  const tolerance = vh * 0.25;
  return {
    ok: Boolean(dialog?.open && rect && rect.top >= 24 && Math.abs(centerY - vh / 2) <= tolerance),
    top: rect?.top,
    centerY,
    viewportCenterY: vh / 2,
  };
});
if (detailCentered.ok) pass('detail dialog viewport centered');
else fail('detail dialog viewport centered', detailCentered);

const detailHeroClear = await page.evaluate(() => {
  const cover = document.querySelector('[data-volunteer-detail-cover]');
  const meta = document.querySelector('.volunteer-detail-meta');
  if (!cover || !meta) return { ok: false, reason: 'missing nodes' };
  const a = cover.getBoundingClientRect();
  const b = meta.getBoundingClientRect();
  const overlaps = !(
    a.right <= b.left ||
    a.left >= b.right ||
    a.bottom <= b.top ||
    a.top >= b.bottom
  );
  return { ok: !overlaps, cover: { w: a.width, h: a.height }, meta: { w: b.width, h: b.height } };
});
if (detailHeroClear.ok) pass('detail cover does not overlap meta');
else fail('detail cover does not overlap meta', detailHeroClear);

await page.click('[data-volunteer-detail-register]');
await page.waitForSelector('[data-volunteer-register-dialog][open]');

const registerCentered = await page.evaluate(() => {
  const dialog = document.querySelector('[data-volunteer-register-dialog]');
  const rect = dialog?.getBoundingClientRect();
  const vh = window.innerHeight;
  const centerY = rect ? rect.top + rect.height / 2 : 0;
  const tolerance = vh * 0.25;
  return {
    ok: Boolean(dialog?.open && rect && rect.top >= 24 && Math.abs(centerY - vh / 2) <= tolerance),
    top: rect?.top,
    centerY,
    viewportCenterY: vh / 2,
  };
});
if (registerCentered.ok) pass('register dialog viewport centered');
else fail('register dialog viewport centered', registerCentered);

await page.fill('#volunteer-reg-name', 'Smoke Tester');
await page.fill('#volunteer-reg-phone', '13800138000');
await page.fill('#volunteer-reg-email', 'smoke@test.local');
await page.fill('#volunteer-reg-age', '22');
await page.fill('#volunteer-reg-emergency', 'Emergency Contact');
await page.click('[data-volunteer-register-form] button[type="submit"]');

await page.waitForSelector('[data-volunteer-success-dialog][open]', { timeout: 5000 });
pass('registration success dialog');

const saved = await page.evaluate(
  ({ username, activityId }) => {
    const list = JSON.parse(localStorage.getItem('ocean-action-volunteer-registrations') || '[]');
    return {
      count: list.length,
      record: list.find((item) => item.username === username && item.activityId === activityId),
    };
  },
  { username: USER, activityId },
);
if (saved.count >= 1 && saved.record) pass('registration saved to localStorage');
else fail('registration saved to localStorage', saved);

await page.click('[data-volunteer-success-continue]');

const duplicate = await page.evaluate(
  ({ activityId }) => window.OceanActionVolunteer.hasDuplicateRegistration(activityId, '13800138000', 'smoke@test.local'),
  { activityId },
);
if (duplicate) pass('duplicate registration blocked');
else fail('duplicate registration blocked');

await page.click('[data-archive-volunteer-records]');
await page.waitForSelector('[data-volunteer-records-dialog][open]');
const recordItems = await page.locator('.volunteer-record-item').count();
if (recordItems >= 1) pass('records dialog lists registrations');
else fail('records dialog lists registrations', { recordItems });

page.on('dialog', (dialog) => dialog.accept());
await page.locator('[data-volunteer-cancel]').first().click();
await page.waitForTimeout(300);
const afterCancel = await page.evaluate(() => JSON.parse(localStorage.getItem('ocean-action-volunteer-registrations') || '[]').length);
if (afterCancel === 0) pass('cancel registration removes record');
else fail('cancel registration removes record', { afterCancel });

await page.setViewportSize({ width: 375, height: 812 });
await page.waitForTimeout(300);
const overflow = await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1);
if (overflow) pass('no horizontal overflow at 375px');
else fail('no horizontal overflow at 375px');

const failed = checks.filter((c) => !c.ok);
console.log(JSON.stringify({ checks, errors, failed: failed.length }, null, 2));
await browser.close();
process.exit(failed.length || errors.length ? 1 : 0);
