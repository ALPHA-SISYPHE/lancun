/**
 * 行动中心 · 阶段 3 捐款 + 轮播 smoke
 */
import { chromium } from 'playwright';

const BASE = process.env.BASE_URL || 'http://127.0.0.1:5500';
const USER = 'p4-donation-smoke';
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
await page.waitForFunction(() => window.DONATION_PROJECTS && window.IMPACT_STORIES && window.OceanActionDonationUI);

await page.evaluate((username) => {
  localStorage.removeItem('ocean-action-donations');
  localStorage.removeItem('lancun.account');
  localStorage.removeItem('lancun.session');
  window.OceanActionDonationUI?.renderSupportHarbor?.();
}, USER);

const dataCounts = await page.evaluate(() => ({
  projects: window.DONATION_PROJECTS.length,
  stories: window.IMPACT_STORIES.length,
}));
if (dataCounts.projects >= 6 && dataCounts.stories >= 9) pass('donation + impact data counts', dataCounts);
else fail('donation + impact data counts', dataCounts);

await page.click('[data-participation-tab="donation"]');
await page.waitForTimeout(200);

const donationCards = await page.locator('.donation-project-card').count();
if (donationCards === 3) pass('donation tab shows 3 project cards');
else fail('donation tab shows 3 project cards', { donationCards });

const guest = await page.evaluate(() => ({
  hintVisible: document.querySelector('[data-donation-login-hint]')?.hidden === false,
  submitDisabled: document.querySelector('.support-submit')?.disabled === true,
}));
if (guest.hintVisible && guest.submitDisabled) pass('guest gating');
else fail('guest gating', guest);

const counterBefore = await page.locator('[data-impact-counter-donation]').textContent();
await page.click('[data-impact-next-donation]');
await page.waitForTimeout(200);
const counterAfter = await page.locator('[data-impact-counter-donation]').textContent();
const visibleCards = await page.locator('[data-impact-card-donation] h3').count();
if (visibleCards === 1 && counterBefore !== counterAfter) pass('donation impact carousel single slide + next');
else fail('donation impact carousel single slide + next', { visibleCards, counterBefore, counterAfter });

await page.evaluate(
  (username) => {
    localStorage.setItem(
      'lancun.account',
      JSON.stringify({ username, displayName: 'Donor Tester', email: `${username}@test.local` }),
    );
    localStorage.setItem('lancun.session', JSON.stringify({ username, loggedIn: true }));
    window.renderProfile?.();
    window.OceanActionDonationUI?.renderSupportHarbor?.();
  },
  USER,
);

await page.locator('[data-donation-support]').first().click();
await page.waitForSelector('[data-donation-detail-dialog][open]', { timeout: 5000 });
pass('donation detail dialog opens');

const raisedBefore = await page.locator('[data-donation-detail-dialog] .support-project-panel__raised-head span').first().textContent();
await page.click('[data-donation-amount="30"]');
await page.fill('#donate-name', 'Smoke Donor');
await page.fill('#donate-message', '支持海洋保护');
await page.click('.support-submit');
await page.waitForSelector('[data-donation-thanks-dialog][open]', { timeout: 5000 });
pass('thanks dialog opens');

const saved = await page.evaluate((username) => {
  const list = JSON.parse(localStorage.getItem('ocean-action-donations') || '[]');
  return {
    count: list.length,
    record: list.find((item) => item.username === username),
  };
}, USER);
if (saved.count >= 1 && saved.record?.amount === 30) pass('donation saved to localStorage');
else fail('donation saved to localStorage', saved);

await page.click('[data-donation-thanks-continue]');
const raisedAfter = await page.locator('.donation-project-card__raised-head strong').first().textContent();
if (raisedBefore !== raisedAfter) pass('raised amount updated');
else fail('raised amount updated', { raisedBefore, raisedAfter });

await page.click('[data-archive-donations]');
await page.waitForSelector('[data-donation-records-dialog][open]');
const recordItems = await page.locator('.donation-record-item').count();
if (recordItems >= 1) pass('records dialog lists donations');
else fail('records dialog lists donations', { recordItems });

page.on('dialog', (dialog) => dialog.accept());
await page.locator('[data-donation-delete]').first().click();
await page.waitForTimeout(300);
const afterDelete = await page.evaluate(() => JSON.parse(localStorage.getItem('ocean-action-donations') || '[]').length);
if (afterDelete === 0) pass('delete donation record');
else fail('delete donation record', { afterDelete });

await page.setViewportSize({ width: 375, height: 812 });
await page.waitForTimeout(300);
const overflow = await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1);
if (overflow) pass('no horizontal overflow at 375px');
else fail('no horizontal overflow at 375px');

const failed = checks.filter((c) => !c.ok);
console.log(JSON.stringify({ checks, errors, failed: failed.length }, null, 2));
await browser.close();
process.exit(failed.length || errors.length ? 1 : 0);
