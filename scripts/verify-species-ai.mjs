import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { chromium } from 'playwright';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const API = 'http://127.0.0.1:8787';
const imagePath = join(ROOT, 'assets/media/species/chinese-white-dolphin.jpg');
const imageBase64 = readFileSync(imagePath).toString('base64');

async function checkApi() {
  const quotaRes = await fetch(`${API}/api/quota-status`);
  if (!quotaRes.ok) throw new Error(`quota-status failed: ${quotaRes.status}`);

  const recognizeRes = await fetch(`${API}/api/recognize-species`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ imageBase64, mimeType: 'image/jpeg' }),
  });
  const payload = await recognizeRes.json();
  if (!payload.ok) {
    throw new Error(`recognize failed: ${JSON.stringify(payload)}`);
  }
  if (!payload.quota) throw new Error('missing quota in recognize response');
  return payload;
}

async function checkPage() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('http://127.0.0.1:5500/pages/species.html', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);

  const quotaVisible = await page.locator('[data-species-quota]').isVisible();
  const quotaMeta = await page.locator('[data-species-quota-meta]').textContent();
  const html = await page.content();
  const leakedKey = /sk-[a-z0-9]{20,}/i.test(html);

  await browser.close();
  return { quotaVisible, quotaMeta, leakedKey };
}

try {
  const apiResult = await checkApi();
  console.log('API OK:', {
    name: apiResult.name,
    speciesId: apiResult.speciesId,
    unknown: apiResult.unknown,
    quotaPercent: apiResult.quota?.monthPercent,
  });

  try {
    const pageResult = await checkPage();
    console.log('Page OK:', pageResult);
    if (pageResult.leakedKey) process.exit(1);
  } catch (error) {
    console.warn('Page check skipped (run npm run serve on :5500):', error.message);
  }
} catch (error) {
  console.error(error.message);
  console.error('Ensure proxy is running: npm run api');
  process.exit(1);
}
