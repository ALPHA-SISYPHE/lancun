/**
 * 生物档案页 · Phase A（mock 检索 + mock 识别）
 * 宪法：docs/SPECIES_PAGE.md
 */

const CATEGORY_MAP = {
  all: null,
  mammal: '哺乳动物',
  reptile: '海龟与爬行动物',
  coral: '珊瑚与腔肠动物',
  fish: '鱼类',
  seabird: '海鸟',
};

const METRIC_ICONS = {
  archive: '▦',
  shield: '◆',
  alert: '!',
  pin: '◎',
};

const state = {
  query: '',
  categoryTag: 'all',
  uploadFile: null,
  recognition: null,
  lastFocused: null,
};

function getArchive() {
  return window.LANCUN_DATA?.speciesArchive ?? [];
}

function getMetrics() {
  return window.LANCUN_DATA?.speciesMetrics ?? [];
}

function prefersReducedMotion() {
  return (
    document.documentElement.dataset.reducedMotion === 'true' ||
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

function resolveImage(path) {
  if (!path) return '';
  if (path.startsWith('http') || path.startsWith('../')) return path;
  return `../${path}`;
}

/**
 * @param {{ query: string, category: string }} params
 * @returns {Promise<object[]>}
 */
async function searchSpecies({ query, category }) {
  const normalizedQuery = (query || '').trim().toLowerCase();
  const categoryValue = CATEGORY_MAP[category] ?? CATEGORY_MAP.all;

  return getArchive().filter((item) => {
    const matchesCategory = !categoryValue || item.category === categoryValue;
    if (!normalizedQuery) return matchesCategory;

    const haystack = [item.name, item.latinName, ...(item.aliases || [])]
      .join(' ')
      .toLowerCase();
    return matchesCategory && haystack.includes(normalizedQuery);
  });
}

function hashFileName(file) {
  const seed = `${file.name}-${file.size}-${file.lastModified}`;
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

/**
 * Phase A mock recognition
 * @param {File} file
 */
async function recognizeSpeciesMock(file) {
  await new Promise((resolve) => setTimeout(resolve, 1500));

  if (!file || !file.type.startsWith('image/')) {
    return { ok: false };
  }

  const archive = getArchive();
  if (!archive.length) return { ok: false };

  const index = hashFileName(file) % archive.length;
  const species = archive[index];
  const confidence = 60 + (hashFileName(file) % 39);

  return {
    ok: true,
    speciesId: species.id,
    name: species.name,
    level: species.level,
    summary: species.summary,
    confidence,
  };
}

function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function renderMetricIcon(id) {
  const map = {
    catalogued: 'archive',
    'national-l1': 'shield',
    'iucn-threatened': 'alert',
    endemic: 'pin',
  };
  return METRIC_ICONS[map[id] || 'archive'] || '▦';
}

function animateMetricValue(element, target, suffix = '') {
  if (prefersReducedMotion()) {
    element.textContent = `${target}${suffix}`;
    return;
  }

  const duration = 900;
  const start = performance.now();
  const from = 0;

  function frame(now) {
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - (1 - progress) ** 3;
    const current = Math.round(from + (target - from) * eased);
    element.textContent = `${current}${suffix}`;
    if (progress < 1) requestAnimationFrame(frame);
  }

  requestAnimationFrame(frame);
}

function renderMetrics(container) {
  const metrics = getMetrics();
  container.innerHTML = metrics
    .map(
      (metric) => `
      <article class="species-metric-card" data-species-metric="${metric.id}">
        <span class="species-metric-card__icon" aria-hidden="true">${renderMetricIcon(metric.id)}</span>
        <p class="species-metric-card__value" data-species-metric-value>0${metric.suffix || ''}</p>
        <p class="species-metric-card__label">${metric.label}</p>
        <p class="species-metric-card__note">${metric.note || ''}</p>
      </article>`
    )
    .join('');

  container.setAttribute('aria-busy', 'false');

  if (!('IntersectionObserver' in window)) {
    container.querySelectorAll('[data-species-metric-value]').forEach((el, index) => {
      const metric = metrics[index];
      if (metric) el.textContent = `${metric.value}${metric.suffix || ''}`;
    });
    return;
  }

  const observer = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const card = entry.target;
        const id = card.dataset.speciesMetric;
        const metric = metrics.find((item) => item.id === id);
        const valueEl = card.querySelector('[data-species-metric-value]');
        if (metric && valueEl) animateMetricValue(valueEl, metric.value, metric.suffix || '');
        obs.unobserve(card);
      });
    },
    { threshold: 0.35 }
  );

  container.querySelectorAll('[data-species-metric]').forEach((card) => observer.observe(card));
}

function renderSpeciesCard(item) {
  const imagePath = resolveImage(item.image);
  const badgeClass = `species-badge--${item.levelTone || 'blue'}`;
  const media = imagePath
    ? `<img src="${imagePath}" alt="" loading="lazy" data-species-img />`
    : `<div class="species-card__placeholder">${item.name}</div>`;

  return `
    <article class="species-card" data-species-id="${item.id}">
      <div class="species-card__media">
        <span class="species-badge ${badgeClass}">${item.level}</span>
        ${media}
      </div>
      <div class="species-card__body">
        <h3 class="species-card__name">${item.name}</h3>
        <p class="species-card__latin">${item.latinName}</p>
        <p class="species-card__summary">${item.summary}</p>
        <button class="species-card__link" type="button" data-species-open="${item.id}">查看档案</button>
      </div>
    </article>`;
}

async function refreshSpeciesList(root) {
  const list = root.querySelector('[data-species-list]');
  const empty = root.querySelector('[data-species-empty]');
  if (!list || !empty) return;

  list.classList.remove('species-grid--visible');
  list.setAttribute('aria-busy', 'true');

  const items = await searchSpecies({ query: state.query, category: state.categoryTag });

  window.requestAnimationFrame(() => {
    if (!items.length) {
      list.innerHTML = '';
      list.hidden = true;
      empty.hidden = false;
    } else {
      list.innerHTML = items.map(renderSpeciesCard).join('');
      list.hidden = false;
      empty.hidden = true;
      window.requestAnimationFrame(() => list.classList.add('species-grid--visible'));
    }
    list.setAttribute('aria-busy', 'false');
  });
}

function getSuggestions(query, limit = 8) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return [];

  return getArchive()
    .filter((item) => {
      const haystack = [item.name, ...(item.aliases || [])].join(' ').toLowerCase();
      return haystack.includes(normalized);
    })
    .slice(0, limit);
}

function hideSuggest(root) {
  const suggest = root.querySelector('[data-species-suggest]');
  if (suggest) {
    suggest.hidden = true;
    suggest.innerHTML = '';
  }
}

function updateSuggest(root, query) {
  const suggest = root.querySelector('[data-species-suggest]');
  if (!suggest) return;

  const matches = getSuggestions(query);
  if (!matches.length || !query.trim()) {
    suggest.hidden = true;
    suggest.innerHTML = '';
    return;
  }

  suggest.innerHTML = matches
    .map(
      (item) =>
        `<li><button type="button" data-species-suggest-item="${item.id}">${item.name}</button></li>`
    )
    .join('');
  suggest.hidden = false;
}

function setActiveTag(root, tag) {
  hideSuggest(root);
  state.categoryTag = tag;
  root.querySelectorAll('[data-species-tag]').forEach((button) => {
    const isActive = button.dataset.speciesTag === tag;
    button.classList.toggle('is-active', isActive);
    button.setAttribute('aria-pressed', String(isActive));
  });
  refreshSpeciesList(root);
}

function resetFilters(root) {
  state.query = '';
  state.categoryTag = 'all';
  const input = root.querySelector('[data-species-search]');
  const clearBtn = root.querySelector('[data-species-search-clear]');
  if (input) input.value = '';
  if (clearBtn) clearBtn.hidden = true;
  updateSuggest(root, '');
  setActiveTag(root, 'all');
}

function findSpeciesById(id) {
  return getArchive().find((item) => item.id === id) ?? null;
}

function fillModal(modal, species) {
  if (!species) return;

  const imageEl = modal.querySelector('[data-species-modal-image]');
  const imagePath = resolveImage(species.image);
  if (imageEl) {
    imageEl.style.backgroundImage = imagePath ? `url('${imagePath}')` : '';
    if (!imagePath) {
      imageEl.style.backgroundImage = '';
    }
  }

  const badge = modal.querySelector('[data-species-modal-badge]');
  if (badge) {
    badge.textContent = species.level;
    badge.className = `species-badge species-badge--${species.levelTone || 'blue'}`;
  }

  modal.querySelector('[data-species-modal-name]').textContent = species.name;
  modal.querySelector('[data-species-modal-latin]').textContent = species.latinName;
  modal.querySelector('[data-species-modal-distribution]').textContent = species.distribution;
  modal.querySelector('[data-species-modal-habitat]').textContent = species.habitat;
  modal.querySelector('[data-species-modal-status]').textContent = species.status;
  modal.querySelector('[data-species-modal-protection]').textContent = species.protection;

  const source = modal.querySelector('[data-species-modal-source]');
  if (source) {
    if (species.sourceHref) {
      source.innerHTML = `来源：<a href="${species.sourceHref}" target="_blank" rel="noopener noreferrer">${species.source || '数据来源'}</a>`;
    } else {
      source.textContent = species.source || '演示数据，正式出处待补';
    }
  }
}

function openSpeciesModal(root, id) {
  const modal = root.querySelector('[data-species-modal]');
  const species = findSpeciesById(id);
  if (!modal || !species) return;

  state.lastFocused = document.activeElement;
  fillModal(modal, species);
  if (typeof modal.showModal === 'function') {
    modal.showModal();
  } else {
    modal.setAttribute('open', '');
  }
  modal.querySelector('[data-species-modal-close]')?.focus();
}

function closeSpeciesModal(root) {
  const modal = root.querySelector('[data-species-modal]');
  if (!modal) return;

  if (typeof modal.close === 'function' && modal.open) {
    modal.close();
  } else {
    modal.removeAttribute('open');
  }

  if (state.lastFocused && typeof state.lastFocused.focus === 'function') {
    state.lastFocused.focus();
  }
}

function showUploadPlaceholder(root) {
  root.querySelector('[data-species-upload-placeholder]')?.removeAttribute('hidden');
  root.querySelector('[data-species-upload-preview]')?.setAttribute('hidden', '');
  root.querySelector('[data-species-upload-loading]')?.setAttribute('hidden', '');
}

function showUploadPreview(root, file, previewUrl) {
  root.querySelector('[data-species-upload-placeholder]')?.setAttribute('hidden', '');
  root.querySelector('[data-species-upload-loading]')?.setAttribute('hidden', '');

  const preview = root.querySelector('[data-species-upload-preview]');
  const img = root.querySelector('[data-species-preview-img]');
  const name = root.querySelector('[data-species-preview-name]');
  const size = root.querySelector('[data-species-preview-size]');

  if (img) {
    img.src = previewUrl;
    img.alt = file.name;
  }
  if (name) name.textContent = file.name;
  if (size) size.textContent = formatFileSize(file.size);
  preview?.removeAttribute('hidden');
}

function showUploadLoading(root) {
  root.querySelector('[data-species-upload-placeholder]')?.setAttribute('hidden', '');
  root.querySelector('[data-species-upload-preview]')?.setAttribute('hidden', '');
  root.querySelector('[data-species-upload-loading]')?.removeAttribute('hidden');
}

function setRecognitionState(root, mode) {
  root.querySelector('[data-species-result-idle]')?.toggleAttribute('hidden', mode !== 'idle');
  root.querySelector('[data-species-result-success]')?.toggleAttribute('hidden', mode !== 'success');
  root.querySelector('[data-species-result-fail]')?.toggleAttribute('hidden', mode !== 'fail');
}

function renderRecognitionSuccess(root, result) {
  setRecognitionState(root, 'success');
  root.querySelector('[data-species-result-name]').textContent = result.name;
  root.querySelector('[data-species-result-level]').textContent = result.level;
  root.querySelector('[data-species-result-summary]').textContent = result.summary;

  const fill = root.querySelector('[data-species-confidence-fill]');
  const text = root.querySelector('[data-species-confidence-text]');
  const bar = root.querySelector('.species-confidence__bar');

  if (fill) fill.style.width = `${result.confidence}%`;
  if (text) text.textContent = `${result.confidence}%`;
  if (bar) {
    bar.setAttribute('aria-valuenow', String(result.confidence));
    bar.setAttribute('aria-label', `置信度 ${result.confidence}%`);
  }

  root.querySelector('[data-species-result-view]')?.setAttribute('data-species-result-id', result.speciesId);
}

async function runRecognition(root, file) {
  if (!file) return;

  state.uploadFile = file;
  showUploadLoading(root);
  setRecognitionState(root, 'idle');

  const result = await recognizeSpeciesMock(file);

  if (state.uploadFile !== file) return;

  const previewUrl = URL.createObjectURL(file);
  showUploadPreview(root, file, previewUrl);

  if (!result.ok) {
    state.recognition = null;
    setRecognitionState(root, 'fail');
    return;
  }

  state.recognition = result;
  renderRecognitionSuccess(root, result);
}

function clearUpload(root) {
  state.uploadFile = null;
  state.recognition = null;
  const input = root.querySelector('[data-species-file-input]');
  if (input) input.value = '';
  showUploadPlaceholder(root);
  setRecognitionState(root, 'idle');
}

function acceptFile(root, file) {
  if (!file || !/^image\/(jpeg|png)$/i.test(file.type)) {
    setRecognitionState(root, 'fail');
    showUploadPlaceholder(root);
    return;
  }
  runRecognition(root, file);
}

function setupSearch(root) {
  const input = root.querySelector('[data-species-search]');
  const clearBtn = root.querySelector('[data-species-search-clear]');
  const submitBtn = root.querySelector('[data-species-search-submit]');

  const applyQuery = () => {
    state.query = input?.value ?? '';
    if (clearBtn) clearBtn.hidden = !state.query;
    updateSuggest(root, state.query);
    refreshSpeciesList(root);
  };

  input?.addEventListener('input', applyQuery);
  input?.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      applyQuery();
      hideSuggest(root);
    }
    if (event.key === 'Escape') {
      hideSuggest(root);
    }
  });

  input?.addEventListener('blur', () => {
    window.setTimeout(() => hideSuggest(root), 150);
  });

  document.addEventListener('click', (event) => {
    if (event.target.closest('[data-species-suggest], [data-species-search]')) return;
    hideSuggest(root);
  });

  submitBtn?.addEventListener('click', applyQuery);
  clearBtn?.addEventListener('click', () => {
    if (input) input.value = '';
    applyQuery();
    input?.focus();
  });

  root.querySelector('[data-species-suggest]')?.addEventListener('click', (event) => {
    const button = event.target.closest('[data-species-suggest-item]');
    if (!button || !input) return;
    const id = button.dataset.speciesSuggestItem;
    const species = findSpeciesById(id);
    if (!species) return;
    input.value = species.name;
    applyQuery();
  });

  root.querySelectorAll('[data-species-tag]').forEach((button) => {
    button.addEventListener('click', () => {
      hideSuggest(root);
      setActiveTag(root, button.dataset.speciesTag || 'all');
    });
  });

  root.querySelector('[data-species-reset]')?.addEventListener('click', () => resetFilters(root));
}

function setupGrid(root) {
  root.querySelector('[data-species-list]')?.addEventListener('click', (event) => {
    const openBtn = event.target.closest('[data-species-open]');
    const card = event.target.closest('[data-species-id]');
    const id = openBtn?.dataset.speciesOpen || card?.dataset.speciesId;
    if (id) openSpeciesModal(root, id);
  });

  root.querySelector('[data-species-list]')?.addEventListener(
    'error',
    (event) => {
      const img = event.target;
      if (!(img instanceof HTMLImageElement) || !img.matches('[data-species-img]')) return;
      const card = img.closest('[data-species-id]');
      const name = card?.querySelector('.species-card__name')?.textContent || '';
      const placeholder = document.createElement('div');
      placeholder.className = 'species-card__placeholder';
      placeholder.textContent = name;
      img.replaceWith(placeholder);
    },
    true
  );
}

function setupModal(root) {
  const modal = root.querySelector('[data-species-modal]');
  if (!modal) return;

  modal.querySelector('[data-species-modal-close]')?.addEventListener('click', () => closeSpeciesModal(root));
  modal.addEventListener('click', (event) => {
    if (event.target === modal) closeSpeciesModal(root);
  });
  modal.addEventListener('cancel', (event) => {
    event.preventDefault();
    closeSpeciesModal(root);
  });
}

function setupRecognizer(root) {
  const zone = root.querySelector('[data-species-upload-zone]');
  const input = root.querySelector('[data-species-file-input]');
  if (!zone || !input) return;

  zone.addEventListener('click', (event) => {
    if (event.target.closest('button')) return;
    input.click();
  });

  zone.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      input.click();
    }
  });

  input.addEventListener('change', () => {
    const file = input.files?.[0];
    if (file) acceptFile(root, file);
  });

  zone.addEventListener('dragover', (event) => {
    event.preventDefault();
    zone.classList.add('is-dragover');
  });

  zone.addEventListener('dragleave', () => zone.classList.remove('is-dragover'));

  zone.addEventListener('drop', (event) => {
    event.preventDefault();
    zone.classList.remove('is-dragover');
    const file = event.dataTransfer?.files?.[0];
    if (file) acceptFile(root, file);
  });

  root.querySelector('[data-species-reupload]')?.addEventListener('click', (event) => {
    event.stopPropagation();
    input.click();
  });

  root.querySelector('[data-species-cancel-upload]')?.addEventListener('click', (event) => {
    event.stopPropagation();
    clearUpload(root);
  });

  root.querySelector('[data-species-result-view]')?.addEventListener('click', () => {
    const id = root.querySelector('[data-species-result-view]')?.dataset.speciesResultId;
    if (id) openSpeciesModal(root, id);
  });

  root.querySelector('[data-species-result-retry]')?.addEventListener('click', () => clearUpload(root));
  root.querySelector('[data-species-result-retry-fail]')?.addEventListener('click', () => {
    clearUpload(root);
    input.click();
  });
}

function initSpeciesPage() {
  if (document.body.dataset.page !== 'species') return;

  const root = document;
  const metrics = root.querySelector('[data-species-metrics]');
  if (metrics) renderMetrics(metrics);

  setupSearch(root);
  setupGrid(root);
  setupModal(root);
  setupRecognizer(root);
  refreshSpeciesList(root);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initSpeciesPage);
} else {
  initSpeciesPage();
}

window.initSpeciesPage = initSpeciesPage;
window.searchSpecies = searchSpecies;
window.recognizeSpeciesMock = recognizeSpeciesMock;
window.openSpeciesModal = (id) => openSpeciesModal(document, id);
