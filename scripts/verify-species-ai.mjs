/**
 * AI 识别 smoke：代理可用则测 API；页面六态 mock smoke（Phase 13）
 * 运行：node scripts/verify-species-ai.mjs
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { chromium } from 'playwright';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const API = 'http://127.0.0.1:8787';
const PAGE = join(ROOT, 'pages', 'species.html').replace(/\\/g, '/');
const imagePath = join(ROOT, 'assets/media/species/chinese-white-dolphin.jpg');
const imageBase64 = readFileSync(imagePath).toString('base64');

async function checkApi() {
  const quotaRes = await fetch(`${API}/api/quota-status`, {
    signal: AbortSignal.timeout(5000),
  });
  if (!quotaRes.ok) throw new Error(`quota-status failed: ${quotaRes.status}`);

  const recognizeRes = await fetch(`${API}/api/recognize-species`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ imageBase64, mimeType: 'image/jpeg' }),
    signal: AbortSignal.timeout(65000),
  });
  const payload = await recognizeRes.json();
  if (!payload.ok) {
    throw new Error(`recognize failed: ${JSON.stringify(payload)}`);
  }
  return payload;
}

async function checkPageStates(page) {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));

  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(`file:///${PAGE}`, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => typeof window.LancunAIIdentificationLab !== 'undefined');
  await page.waitForTimeout(400);

  const initial = await page.evaluate(() => ({
    lab: !!document.querySelector('#ai-identification-lab'),
    upload: !!document.querySelector('[data-ai-upload-zone]'),
    input: !!document.querySelector('[data-ai-file-input]'),
    start: !!document.querySelector('[data-ai-start]'),
    quota: !!document.querySelector('[data-species-quota]'),
    badge: !!document.querySelector('[data-ai-state-badge]'),
    uploadCol: !!document.querySelector('[data-ai-upload-col]'),
    resultCol: !!document.querySelector('[data-ai-result-col]'),
    api: typeof window.LANCUN_AI_RECOGNITION_API === 'string',
    matchFn: typeof window.LancunMatchRecognitionResult === 'function',
    workspaceVisible: !document.querySelector('#species-workspace')?.hidden,
    resultsHidden: !!document.querySelector('#species-search-results')?.hidden,
    shellHeight: document.querySelector('.ai-lab-shell')?.offsetHeight || 0,
    shellCols: getComputedStyle(document.querySelector('.ai-lab-shell')).gridTemplateColumns.split(' ').length,
    uiState: window.LancunAIIdentificationLab?.getUIState?.() || '',
    badgeText: document.querySelector('[data-ai-state-badge]')?.textContent?.trim() || '',
  }));

  const preview = await page.evaluate(async () => {
    const blob = await fetch('data:image/jpeg;base64,' + window.__TEST_IMAGE_B64__).then((r) => r.blob());
    const file = new File([blob], 'test-dolphin.jpg', { type: 'image/jpeg' });
    window.LancunAIIdentificationLab?.setPreviewFile?.(file, 'data:image/jpeg;base64,' + window.__TEST_IMAGE_B64__);
    return {
      uiState: window.LancunAIIdentificationLab?.getUIState?.() || '',
      previewVisible: !document.querySelector('[data-upload-preview]')?.hidden,
      previewImg: !!document.querySelector('[data-ai-preview-img]')?.src,
      badgeText: document.querySelector('[data-ai-state-badge]')?.textContent?.trim() || '',
    };
  });

  const matched = await page.evaluate(async () => {
    window.LancunAIIdentificationLabStubRecognize?.(async () => ({
      chineseName: '中华白海豚',
      englishName: 'Chinese White Dolphin',
      scientificName: 'Sousa chinensis',
      confidence: 88,
      rawResult: { ok: true },
      ok: true,
      previewUrl: document.querySelector('[data-ai-preview-img]')?.src || '',
    }));
    const blob = await fetch('data:image/jpeg;base64,' + window.__TEST_IMAGE_B64__).then((r) => r.blob());
    const file = new File([blob], 'test-dolphin.jpg', { type: 'image/jpeg' });
    await window.LancunAIIdentificationLabRunRecognition?.(file);
    window.LancunAIIdentificationLabStubRecognize?.(null);
    return {
      uiState: window.LancunAIIdentificationLab?.getUIState?.() || '',
      matchName: document.querySelector('[data-ai-match-name]')?.textContent?.trim() || '',
      openBtn: !!document.querySelector('[data-ai-open-drawer]'),
      leftPreview: !document.querySelector('[data-upload-preview]')?.hidden,
      badgeText: document.querySelector('[data-ai-state-badge]')?.textContent?.trim() || '',
    };
  });

  await page.click('[data-ai-open-drawer]');
  await page.waitForSelector('[data-species-drawer].is-open', { timeout: 5000 });
  await page.keyboard.press('Escape');
  await page.waitForTimeout(200);

  const unmatched = await page.evaluate(async () => {
    window.LancunAIIdentificationLabStubRecognize?.(async () => ({
      chineseName: 'ZZZ_UNMATCHED_PHASE13',
      englishName: 'ZZZ_UNMATCHED_PHASE13',
      scientificName: 'Zzz unmatched phase13',
      confidence: 71,
      rawResult: { ok: true },
      ok: true,
      previewUrl: document.querySelector('[data-ai-preview-img]')?.src || '',
    }));
    const blob = await fetch('data:image/jpeg;base64,' + window.__TEST_IMAGE_B64__).then((r) => r.blob());
    const file = new File([blob], 'test-dolphin.jpg', { type: 'image/jpeg' });
    await window.LancunAIIdentificationLabRunRecognition?.(file);
    window.LancunAIIdentificationLabStubRecognize?.(null);
    const panel = document.querySelector('[data-ai-state="unmatched"]');
    return {
      uiState: window.LancunAIIdentificationLab?.getUIState?.() || '',
      unmatchBtn: !!document.querySelector('[data-add-new-record]'),
      unmatchVisible: panel ? !panel.hidden : false,
      unmatchName: document.querySelector('[data-ai-unmatch-name]')?.textContent?.trim() || '',
    };
  });

  const newRecordOpen = await page.evaluate(() => {
    if (document.querySelector('[data-ai-state="unmatched"]')?.hidden) {
      return { panelVisible: false, insideShell: false, skipped: true };
    }
    document.querySelector('[data-add-new-record]')?.click();
    return {
      panelVisible: !document.querySelector('[data-new-record-panel]')?.hidden,
      insideShell: !!document.querySelector('.ai-lab-shell [data-new-record-panel]'),
      skipped: false,
    };
  });
  await page.waitForTimeout(200);

  await page.evaluate(() => {
    document.querySelector('[data-new-record-cancel]')?.click();
  });
  await page.waitForTimeout(150);

  const errorState = await page.evaluate(async () => {
    window.LancunAIIdentificationLabStubRecognize?.(async () => {
      throw new Error('mock recognition failed');
    });
    const blob = await fetch('data:image/jpeg;base64,' + window.__TEST_IMAGE_B64__).then((r) => r.blob());
    const file = new File([blob], 'test-dolphin.jpg', { type: 'image/jpeg' });
    await window.LancunAIIdentificationLabRunRecognition?.(file);
    window.LancunAIIdentificationLabStubRecognize?.(null);
    return {
      uiState: window.LancunAIIdentificationLab?.getUIState?.() || '',
      retryBtn: !!document.querySelector('[data-ai-retry]'),
      errorMsg: document.querySelector('[data-ai-error-msg]')?.textContent?.trim() || '',
      badgeText: document.querySelector('[data-ai-state-badge]')?.textContent?.trim() || '',
    };
  });

  const html = await page.content();
  const leakedKey = /sk-[a-z0-9]{20,}/i.test(html);

  return {
    initial,
    preview,
    matched,
    unmatched,
    newRecordOpen,
    errorState,
    leakedKey,
    errors,
  };
}

let apiOk = false;
try {
  const apiResult = await checkApi();
  apiOk = true;
  console.log('API OK:', {
    name: apiResult.name,
    speciesId: apiResult.speciesId,
    unknown: apiResult.unknown,
    quotaPercent: apiResult.quota?.monthPercent,
  });
} catch (error) {
  console.warn('API check skipped (proxy not running or unreachable):', error.message);
  console.warn('UI will use mock fallback. Start with: npm run api');
}

const browser = await chromium.launch();
const page = await browser.newPage();
await page.addInitScript((b64) => {
  window.__TEST_IMAGE_B64__ = b64;
}, imageBase64);

const pageResult = await checkPageStates(page);
await browser.close();
console.log('Page states:', JSON.stringify(pageResult, null, 2));

if (pageResult.leakedKey) {
  console.error('Leaked API key detected in page HTML');
  process.exit(1);
}

const ok =
  pageResult.initial.lab &&
  pageResult.initial.upload &&
  pageResult.initial.input &&
  pageResult.initial.start &&
  pageResult.initial.quota &&
  pageResult.initial.badge &&
  pageResult.initial.uploadCol &&
  pageResult.initial.resultCol &&
  pageResult.initial.api &&
  pageResult.initial.matchFn &&
  pageResult.initial.workspaceVisible &&
  pageResult.initial.resultsHidden &&
  pageResult.initial.shellCols >= 2 &&
  pageResult.initial.shellHeight >= 360 &&
  pageResult.initial.shellHeight <= 520 &&
  pageResult.initial.uiState === 'idle' &&
  pageResult.preview.uiState === 'preview' &&
  pageResult.preview.previewVisible &&
  pageResult.preview.previewImg &&
  pageResult.matched.uiState === 'matched' &&
  pageResult.matched.matchName.includes('\u4e2d\u534e\u767d\u6d77\u8c5a') &&
  pageResult.matched.openBtn &&
  pageResult.matched.leftPreview &&
  pageResult.unmatched.uiState === 'unmatched' &&
  pageResult.unmatched.unmatchVisible &&
  pageResult.unmatched.unmatchName.includes('ZZZ_UNMATCHED_PHASE13') &&
  !pageResult.newRecordOpen.skipped &&
  pageResult.newRecordOpen.panelVisible &&
  !pageResult.newRecordOpen.insideShell &&
  pageResult.errorState.uiState === 'error' &&
  pageResult.errorState.retryBtn &&
  pageResult.errorState.errorMsg.length > 0 &&
  pageResult.errors.length === 0;

if (!ok) {
  console.error('Page AI Lab state checks failed');
  process.exit(1);
}

console.log(JSON.stringify({ apiOk, pageOk: ok }, null, 2));
process.exit(0);
