/**
 * 未收录 · 新的档案线索补充（Phase 7）
 * 文案禁止使用「发现新物种」
 */
window.LancunNewRecordContribution = (function newRecordContribution() {
  let draft = null;
  let bound = false;
  let selectedOceans = [];
  let selectedThreats = [];

  function getDraftFromResult(result) {
    const preview = result?.previewUrl || '';
    return {
      chineseName: result?.chineseName || result?.name || result?.guessedName || '',
      englishName: result?.englishName || '',
      scientificName: result?.scientificName || result?.latinName || '',
      group: 'fish',
      iucnStatus: 'NT',
      habitat: [],
      ocean: ['coastal'],
      description: result?.brief || result?.summary || '',
      threats: ['habitat-loss'],
      protection: ['持续观察记录', '补充正式档案'],
      image: preview,
      thumbnail: preview,
      source: 'AI Recognition + User Confirmation',
      confidence: result?.confidence,
    };
  }

  function fillSelects() {
    const cats = window.LANCUN_SPECIES_CATEGORIES || {};
    const groupEl = document.querySelector('[data-draft-group]');
    const iucnEl = document.querySelector('[data-draft-iucn]');
    if (groupEl && !groupEl.options.length) {
      groupEl.innerHTML = (cats.GROUPS || [])
        .map((g) => `<option value="${g.id}">${g.label}</option>`)
        .join('');
    }
    if (iucnEl && !iucnEl.options.length) {
      iucnEl.innerHTML = (cats.IUCN_STATUSES || [])
        .map((s) => `<option value="${s.id}">${s.label}</option>`)
        .join('');
    }
  }

  function renderPills(containerSel, items, selected, dataAttr) {
    const host = document.querySelector(containerSel);
    if (!host) return;
    host.innerHTML = (items || [])
      .map((item) => {
        const on = selected.includes(item.id);
        return `<button type="button" class="new-record-pill${on ? ' is-active' : ''}" data-${dataAttr}="${item.id}" aria-pressed="${on}">${item.label}</button>`;
      })
      .join('');
  }

  function syncPills() {
    const cats = window.LANCUN_SPECIES_CATEGORIES || {};
    renderPills(
      '[data-draft-ocean-pills]',
      cats.HABITATS || cats.OCEANS || [],
      selectedOceans,
      'ocean-id'
    );
    renderPills('[data-draft-threat-pills]', cats.THREATS || [], selectedThreats, 'threat-id');
  }

  function setField(sel, value) {
    const el = document.querySelector(sel);
    if (el) el.value = value ?? '';
  }

  function renderForm(nextDraft) {
    const panel = document.querySelector('[data-new-record-panel]');
    if (!panel || !nextDraft) return;

    fillSelects();
    draft = { ...nextDraft };
    selectedOceans = [...(draft.ocean || [])];
    selectedThreats = [...(draft.threats || [])];

    setField('[data-draft-chineseName]', draft.chineseName);
    setField('[data-draft-englishName]', draft.englishName);
    setField('[data-draft-scientificName]', draft.scientificName);
    setField('[data-draft-group]', draft.group || 'fish');
    setField('[data-draft-iucn]', draft.iucnStatus || 'NT');
    setField('[data-draft-habitat]', (draft.habitat || []).join('、'));
    setField('[data-draft-description]', draft.description || '');
    setField('[data-draft-protection]', (draft.protection || []).join('、'));

    const preview = panel.querySelector('[data-new-record-preview]');
    if (preview) {
      if (draft.image) {
        preview.src = draft.image;
        preview.hidden = false;
      } else {
        preview.removeAttribute('src');
        preview.hidden = true;
      }
    }

    const summaryName = panel.querySelector('[data-new-record-summary-name]');
    if (summaryName) {
      summaryName.textContent = draft.chineseName || draft.englishName || draft.scientificName || '未命名线索';
    }
    const summaryMeta = panel.querySelector('[data-new-record-summary-meta]');
    if (summaryMeta) {
      summaryMeta.textContent =
        draft.confidence != null && draft.confidence !== ''
          ? `识别置信度 ${draft.confidence}% · 新的本地档案补充`
          : '新的观察记录 · 待确认';
    }

    syncPills();
    panel.hidden = false;
    panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function hide() {
    const panel = document.querySelector('[data-new-record-panel]');
    if (panel) panel.hidden = true;
  }

  function openFromRecognition(result) {
    const next = getDraftFromResult(result || {});
    renderForm(next);
  }

  function toggleInArray(arr, id) {
    return arr.includes(id) ? arr.filter((x) => x !== id) : [...arr, id];
  }

  function collectForm() {
    const read = (sel) => document.querySelector(sel)?.value?.trim() || '';
    const habitat = read('[data-draft-habitat]')
      .split(/[、,，]/)
      .map((s) => s.trim())
      .filter(Boolean);
    const protection = read('[data-draft-protection]')
      .split(/[、,，]/)
      .map((s) => s.trim())
      .filter(Boolean);
    const image = draft?.image || '';

    return {
      chineseName: read('[data-draft-chineseName]'),
      englishName: read('[data-draft-englishName]'),
      scientificName: read('[data-draft-scientificName]'),
      group: read('[data-draft-group]') || 'fish',
      iucnStatus: read('[data-draft-iucn]') || 'NT',
      habitat,
      ocean: selectedOceans.slice(),
      description: read('[data-draft-description]'),
      threats: selectedThreats.slice(),
      protection: protection.length ? protection : ['持续观察记录'],
      image,
      thumbnail: image,
      source: 'AI Recognition + User Confirmation',
      isUserAdded: true,
    };
  }

  function submit() {
    const data = collectForm();
    if (!data.chineseName) {
      window.LancunArchiveToast?.show('请填写中文名');
      document.querySelector('[data-draft-chineseName]')?.focus();
      return;
    }

    const species = {
      ...data,
      id: window.LancunGenerateSpeciesId('user-species'),
      isUserAdded: true,
    };

    window.LancunLocalSpeciesStorage.saveUserAddedSpecies(species);
    window.LancunSpeciesRails?.setActiveRail?.('user-added');
    window.LancunSpeciesSearchDock?.runSearch?.();
    window.LancunSpeciesRails?.render?.();
    hide();

    window.LancunArchiveToast?.show(
      '已添加到本地生命档案。\n你为海洋生命档案补充了一条新的观察记录。'
    );
    window.LancunSpeciesDetailDrawer?.open(species, [species]);
  }

  function rerecognize() {
    hide();
    const input = document.querySelector('[data-ai-file-input]');
    const zone = document.querySelector('[data-ai-upload-zone]');
    input?.click();
    zone?.focus?.();
  }

  function init() {
    if (bound) return;
    bound = true;
    fillSelects();

    document.querySelector('[data-new-record-submit]')?.addEventListener('click', submit);
    document.querySelector('[data-new-record-cancel]')?.addEventListener('click', hide);
    document.querySelector('[data-new-record-edit]')?.addEventListener('click', () => {
      document.querySelector('[data-draft-chineseName]')?.focus();
    });
    document.querySelector('[data-new-record-rerecognize]')?.addEventListener('click', rerecognize);

    document.querySelector('[data-draft-ocean-pills]')?.addEventListener('click', (event) => {
      const btn = event.target.closest('[data-ocean-id]');
      if (!btn) return;
      selectedOceans = toggleInArray(selectedOceans, btn.dataset.oceanId);
      syncPills();
    });

    document.querySelector('[data-draft-threat-pills]')?.addEventListener('click', (event) => {
      const btn = event.target.closest('[data-threat-id]');
      if (!btn) return;
      selectedThreats = toggleInArray(selectedThreats, btn.dataset.threatId);
      syncPills();
    });
  }

  return {
    init,
    openFromRecognition,
    getDraftFromResult,
    renderForm,
    hide,
    hideForm: hide,
    submit,
  };
})();
