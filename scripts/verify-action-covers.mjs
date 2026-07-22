/** @deprecated Legacy pre-ParticipationHub DOM; use verify-action-page.mjs instead. */
import { chromium } from 'playwright';

const browser = await chromium.launch();
const page = await browser.newPage();
const errors = [];

page.on('response', (r) => {
  if (r.status() === 404 && /\/media\/action\//.test(r.url())) {
    errors.push(r.url());
  }
});

await page.goto(
  'file:///C:/Users/%E5%BB%96%E4%BF%8A%E6%9D%B0/Desktop/web%20hw/pages/action.html',
  { waitUntil: 'domcontentloaded' }
);
await page.waitForTimeout(1500);

const volunteer = await page.locator('.action-volunteer-cover[style*="background-image"]').count();
const past = await page.locator('.action-past-cover[style*="background-image"]').count();
const overflow = await page.evaluate(
  () => document.documentElement.scrollWidth > document.documentElement.clientWidth
);

console.log(JSON.stringify({ volunteer, past, errors, overflow }, null, 2));
await browser.close();

if (volunteer !== 4 || past !== 4 || errors.length) process.exit(1);
