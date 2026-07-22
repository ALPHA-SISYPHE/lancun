/**
 * AI 识别实验舱（Phase 6）
 * 上传 → 识别 → 匹配本地库；未匹配仅预留入口
 */
window.LancunAIIdentificationLab = (function aiIdentificationLab() {
  let bound = false;
  let uploadedFile = null;
  let previewUrl = '';
  let matchedSpecies = null;
  let lastResult = null;
  let recognizeHandler = null;

  function apiBase() {
    return window.LANCUN_AI_RECOGNITION_API || window.AI_RECOGNITION_API || 'http://127.0.0.1:8787';
  }

  function getDatabase() {
    return (
      window.LancunSpeciesSearchDock?.getMergedDatabase?.() ||
      (window.LANCUN_SPECIES_DB || []).slice()
    );
  }

  const STATE_LABELS = {
    idle: '待机',
    preview: '待识别',
    loading: '识别中',
    matched: '已匹配',
    unmatched: '未收录',
    error: '失败',
  };

  function syncStateBadge(stateName) {
    const badge = document.querySelector('[data-ai-state-badge]');
    if (!badge) return;
    badge.textContent = STATE_LABELS[stateName] || stateName;
    badge.classList.remove('is-loading', 'is-success', 'is-error');
    if (stateName === 'loading') badge.classList.add('is-loading');
    if (stateName === 'matched') badge.classList.add('is-success');
    if (stateName === 'error') badge.classList.add('is-error');
  }

  function setUIState(stateName) {
    const states = ['idle', 'preview', 'loading', 'matched', 'unmatched', 'error'];
    states.forEach((s) => {
      document.querySelector(`[data-ai-state="${s}"]`)?.toggleAttribute('hidden', s !== stateName);
    });

    const idle = document.querySelector('[data-upload-idle]');
    const preview = document.querySelector('[data-upload-preview]');
    const keepLeftPreview =
      Boolean(previewUrl) &&
      (stateName === 'preview' ||
        stateName === 'loading' ||
        stateName === 'matched' ||
        stateName === 'unmatched' ||
        stateName === 'error');

    if (idle) idle.hidden = keepLeftPreview;
    if (preview) preview.hidden = !keepLeftPreview;

    if (stateName === 'idle') {
      if (idle) idle.hidden = false;
      if (preview) preview.hidden = true;
    }

    syncStateBadge(stateName);
  }

  function compressImageFile(file, maxDim = 1024, quality = 0.85) {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        const scale = Math.min(1, maxDim / Math.max(width, height));
        width = Math.max(1, Math.round(width * scale));
        height = Math.max(1, Math.round(height * scale));
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          URL.revokeObjectURL(url);
          reject(new Error('canvas unavailable'));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        URL.revokeObjectURL(url);
        const mimeType = 'image/jpeg';
        const dataUrl = canvas.toDataURL(mimeType, quality);
        resolve({
          base64: dataUrl.split(',')[1],
          mimeType,
          previewUrl: dataUrl,
        });
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('image load failed'));
      };
      img.src = url;
    });
  }

  function normalizeRecognitionResult(raw, extras = {}) {
    const source = raw && typeof raw === 'object' ? raw : {};
    const chineseName =
      source.chineseName || source.name || source.guessedName || source.commonName || '';
    const englishName = source.englishName || source.enName || '';
    const scientificName = source.scientificName || source.latinName || source.latin || '';
    let confidence = Number(source.confidence);
    if (Number.isNaN(confidence)) confidence = 0;
    if (confidence > 0 && confidence <= 1) confidence = Math.round(confidence * 100);

    return {
      chineseName,
      englishName,
      scientificName,
      confidence,
      rawResult: source,
      speciesId: source.speciesId || null,
      unknown: Boolean(source.unknown),
      demoMode: Boolean(extras.demoMode || source.demoMode),
      brief: source.brief || source.summary || '',
      previewUrl: extras.previewUrl || source.previewUrl || previewUrl,
      ok: source.ok !== false,
    };
  }

  async function fetchQuotaStatus() {
    const meta = document.querySelector('[data-species-quota-meta]');
    try {
      const res = await fetch(`${apiBase()}/api/quota-status`, {
        signal: AbortSignal.timeout(8000),
      });
      if (!res.ok) throw new Error('quota failed');
      const payload = await res.json();
      const quota = payload?.quota;
      if (quota && meta) {
        meta.textContent = `本月 credits ${quota.monthCreditsUsed}/${quota.monthCreditsLimit} · 今日 ${quota.dailyRequestCount}/${quota.dailyRequestLimit} 次`;
      }
      return quota || null;
    } catch {
      if (meta) meta.textContent = '本地识别服务未连接 · 识别将降级为演示模式';
      return null;
    }
  }

  async function recognizeMarineAnimal(file) {
    if (recognizeHandler) return recognizeHandler(file);
    return recognizeMarineAnimalCore(file);
  }

  async function recognizeMarineAnimalCore(file) {
    const compressed = await compressImageFile(file);
    const endpoint = `${apiBase()}/api/recognize-species`;

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: compressed.base64,
          mimeType: compressed.mimeType,
        }),
        signal: AbortSignal.timeout(65000),
      });
      const payload = await res.json();
      if (payload?.quota) {
        const meta = document.querySelector('[data-species-quota-meta]');
        if (meta) {
          meta.textContent = `本月 credits ${payload.quota.monthCreditsUsed}/${payload.quota.monthCreditsLimit} · 今日 ${payload.quota.dailyRequestCount}/${payload.quota.dailyRequestLimit} 次`;
        }
      }
      if (payload?.ok) {
        return normalizeRecognitionResult(payload, {
          demoMode: false,
          previewUrl: compressed.previewUrl,
        });
      }
      throw new Error(payload?.error || 'recognize failed');
    } catch {
      /* mock 降级 */
    }

    await new Promise((r) => setTimeout(r, 1200));
    const db = getDatabase();
    const pick = db[Math.floor(Math.random() * Math.max(db.length, 1))] || {
      chineseName: '中华白海豚',
      englishName: 'Chinese White Dolphin',
      scientificName: 'Sousa chinensis',
      description: '演示数据',
    };
    return normalizeRecognitionResult(
      {
        ok: true,
        chineseName: pick.chineseName,
        englishName: pick.englishName,
        scientificName: pick.scientificName,
        confidence: 62 + Math.floor(Math.random() * 30),
        brief: pick.description,
      },
      { demoMode: true, previewUrl: compressed.previewUrl }
    );
  }

  function renderMatched(species, result, matchType) {
    setUIState('matched');
    matchedSpecies = species;
    const panel = document.querySelector('[data-ai-state="matched"]');
    if (!panel) return;
    panel.querySelector('[data-ai-match-name]').textContent = species.chineseName;
    panel.querySelector('[data-ai-match-en]').textContent = species.englishName;
    panel.querySelector('[data-ai-match-sci]').textContent = species.scientificName;
    panel.querySelector('[data-ai-match-conf]').textContent = `${result.confidence || 0}%`;
    panel.querySelector('[data-ai-match-type]').textContent =
      matchType === 'fuzzy' ? '模糊匹配到本地档案' : '已在本地生命档案库中找到';
    panel.querySelector('[data-ai-match-desc]').textContent =
      species.description || result.brief || '—';
    const openBtn = panel.querySelector('[data-ai-open-drawer]');
    if (openBtn) openBtn.dataset.speciesId = species.id;
    const demo = panel.querySelector('[data-ai-demo-note]');
    if (demo) demo.hidden = !result.demoMode;
  }

  function renderUnmatched(result) {
    setUIState('unmatched');
    matchedSpecies = null;
    const panel = document.querySelector('[data-ai-state="unmatched"]');
    if (!panel) return;
    panel.querySelector('[data-ai-unmatch-name]').textContent =
      result.chineseName || result.englishName || result.scientificName || '—';
    panel.querySelector('[data-ai-unmatch-conf]').textContent = `${result.confidence || 0}%`;
    const img = panel.querySelector('[data-ai-unmatch-img]');
    if (img) {
      img.src = result.previewUrl || previewUrl || '';
      img.alt = result.chineseName || '识别预览';
      img.hidden = !img.src;
    }
    const demo = panel.querySelector('[data-ai-demo-note-unmatched]');
    if (demo) demo.hidden = !result.demoMode;
    const hint = document.querySelector('[data-add-new-hint]');
    if (hint) hint.hidden = true;
  }

  async function runRecognition(file) {
    if (!file) return;
    setUIState('loading');
    matchedSpecies = null;

    try {
      const result = await recognizeMarineAnimal(file);
      lastResult = result;
      const db = getDatabase();

      if (result.speciesId && !result.unknown) {
        const direct = db.find((s) => s.id === result.speciesId);
        if (direct) {
          renderMatched(direct, result, 'exact');
          return;
        }
      }

      const match = window.LancunMatchRecognitionResult(result, db);
      if (match.matched && match.species) {
        renderMatched(match.species, result, match.matchType);
      } else {
        renderUnmatched(result);
      }
    } catch (err) {
      const msg = document.querySelector('[data-ai-error-msg]');
      if (msg) msg.textContent = err?.message || '无法完成识别，请重试。';
      setUIState('error');
    }
  }

  function setPreviewFile(file, url) {
    uploadedFile = file;
    previewUrl = url;
    const img = document.querySelector('[data-ai-preview-img]');
    const name = document.querySelector('[data-ai-preview-name]');
    if (img) {
      img.src = url;
      img.alt = file?.name || '预览图片';
    }
    if (name) name.textContent = file?.name || '';
    setUIState('preview');
  }

  function clearUpload() {
    uploadedFile = null;
    previewUrl = '';
    matchedSpecies = null;
    lastResult = null;
    const input = document.querySelector('[data-ai-file-input]');
    if (input) input.value = '';
    const img = document.querySelector('[data-ai-preview-img]');
    if (img) img.removeAttribute('src');
    setUIState('idle');
  }

  const AI_DEMO_SPECIES_ID = 'chinese-white-dolphin';
  const AI_DEMO_IMAGE = '../assets/media/species/chinese-white-dolphin.jpg';
  const AI_DEMO_CONFIDENCE = 88;

  async function loadDemoScenario() {
    const species = getDatabase().find((s) => s.id === AI_DEMO_SPECIES_ID);
    if (!species) return;

    let url = AI_DEMO_IMAGE;
    let file = null;

    try {
      const res = await fetch(AI_DEMO_IMAGE);
      if (res.ok) {
        const blob = await res.blob();
        file = new File([blob], 'chinese-white-dolphin-demo.jpg', {
          type: blob.type || 'image/jpeg',
        });
        url = URL.createObjectURL(blob);
      }
    } catch {
      /* file:// 或离线环境：仍用相对路径展示预览 */
    }

    if (file) {
      setPreviewFile(file, url);
    } else {
      uploadedFile = null;
      previewUrl = url;
      const img = document.querySelector('[data-ai-preview-img]');
      const name = document.querySelector('[data-ai-preview-name]');
      if (img) {
        img.src = url;
        img.alt = species.chineseName;
      }
      if (name) name.textContent = 'chinese-white-dolphin-demo.jpg';
      document.querySelector('[data-upload-idle]')?.setAttribute('hidden', '');
      document.querySelector('[data-upload-preview]')?.removeAttribute('hidden');
    }

    const result = normalizeRecognitionResult(
      {
        chineseName: species.chineseName,
        englishName: species.englishName,
        scientificName: species.scientificName,
        confidence: AI_DEMO_CONFIDENCE,
        speciesId: species.id,
        brief: species.description,
      },
      { demoMode: true, previewUrl: url },
    );

    lastResult = result;
    renderMatched(species, result, 'exact');

    const demo = document.querySelector('[data-ai-demo-note]');
    if (demo) {
      demo.hidden = false;
      demo.textContent = '演示样本 · 点击上传可替换演示样本';
    }
  }

  function acceptFile(file) {
    if (!file || !/^image\/(jpeg|png)$/i.test(file.type)) {
      const msg = document.querySelector('[data-ai-error-msg]');
      if (msg) msg.textContent = '请上传 JPG 或 PNG 图片。';
      setUIState('error');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setPreviewFile(file, reader.result);
    reader.onerror = () => {
      const msg = document.querySelector('[data-ai-error-msg]');
      if (msg) msg.textContent = '图片读取失败，请重试。';
      setUIState('error');
    };
    reader.readAsDataURL(file);
  }

  function init() {
    if (bound) return;
    bound = true;

    const zone = document.querySelector('[data-ai-upload-zone]');
    const input = document.querySelector('[data-ai-file-input]');

    zone?.addEventListener('click', (e) => {
      if (e.target.closest('button')) return;
      if (e.target.closest('[data-upload-preview]') && !e.target.closest('[data-upload-idle]')) {
        return;
      }
      if (!previewUrl) input?.click();
    });

    zone?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if (!previewUrl) input?.click();
      }
    });

    input?.addEventListener('change', () => {
      const file = input.files?.[0];
      if (file) acceptFile(file);
    });

    zone?.addEventListener('dragover', (e) => {
      e.preventDefault();
      zone.classList.add('is-dragover');
    });
    zone?.addEventListener('dragleave', () => zone.classList.remove('is-dragover'));
    zone?.addEventListener('drop', (e) => {
      e.preventDefault();
      zone.classList.remove('is-dragover');
      const file = e.dataTransfer?.files?.[0];
      if (file) acceptFile(file);
    });

    document.querySelector('[data-ai-start]')?.addEventListener('click', () => {
      if (uploadedFile) runRecognition(uploadedFile);
    });

    document.querySelector('[data-ai-upload]')?.addEventListener('click', () => {
      input?.click();
    });

    document.querySelector('[data-ai-retry]')?.addEventListener('click', () => {
      if (uploadedFile) runRecognition(uploadedFile);
      else input?.click();
    });

    document.querySelector('[data-ai-open-drawer]')?.addEventListener('click', (e) => {
      const id = e.currentTarget.dataset.speciesId;
      const species = matchedSpecies || getDatabase().find((s) => s.id === id);
      if (species) window.LancunSpeciesDetailDrawer?.open(species, [species]);
    });

    document.querySelector('[data-add-new-record]')?.addEventListener('click', () => {
      const result = lastResult || {
        chineseName: document.querySelector('[data-ai-unmatch-name]')?.textContent || '',
        confidence: parseInt(
          String(document.querySelector('[data-ai-unmatch-conf]')?.textContent || '0'),
          10
        ),
        previewUrl,
      };
      window.LancunNewRecordContribution?.openFromRecognition(result);
    });

    // expose for new-record / tests
    window.LancunAIIdentificationLabGetLastResult = () => lastResult;
    window.LancunAIIdentificationLabSetPreview = setPreviewFile;
    window.LancunAIIdentificationLabRunRecognition = runRecognition;
    window.LancunAIIdentificationLabStubRecognize = (fn) => {
      recognizeHandler = typeof fn === 'function' ? fn : null;
    };
    window.LancunAIIdentificationLabGetState = () => {
      const visible = document.querySelector('[data-recognition-panel] [data-ai-state]:not([hidden])');
      return visible?.getAttribute('data-ai-state') || 'idle';
    };

    fetchQuotaStatus();
    loadDemoScenario();
  }

  return {
    init,
    recognizeMarineAnimal,
    normalizeRecognitionResult,
    getApiBase: apiBase,
    setPreviewFile,
    runRecognition,
    loadDemoScenario,
    getUIState: () => {
      const visible = document.querySelector('[data-recognition-panel] [data-ai-state]:not([hidden])');
      return visible?.getAttribute('data-ai-state') || 'idle';
    },
    stubRecognize: (fn) => {
      recognizeHandler = typeof fn === 'function' ? fn : null;
    },
  };
})();
