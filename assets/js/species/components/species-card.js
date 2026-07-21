/**
 * 物种档案卡渲染
 */
window.LancunSpeciesCard = (function speciesCard() {
  const IUCN_CLASS = { CR: 'critical', EN: 'critical', VU: 'warning', NT: 'normal', LC: 'normal' };
  const fallbackBound = new WeakSet();

  function escapeHtml(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function resolveImage(path) {
    if (!path) return '';
    if (path.startsWith('http') || path.startsWith('../') || path.startsWith('data:') || path.startsWith('/')) {
      return path;
    }
    return `../${path}`;
  }

  function groupLabel(groupId) {
    return (window.LANCUN_SPECIES_CATEGORIES?.GROUPS || []).find((g) => g.id === groupId)?.label || groupId;
  }

  function placeholderHtml(name) {
    return `<div class="species-card__placeholder" aria-hidden="true"><span>${escapeHtml(name)}</span></div>`;
  }

  function oceanLabel(species) {
    const oceans = species.ocean || [];
    const list = window.LANCUN_SPECIES_CATEGORIES?.HABITATS || window.LANCUN_SPECIES_CATEGORIES?.OCEANS || [];
    const first = oceans[0];
    if (!first) return '';
    return list.find((o) => o.id === first)?.label || first;
  }

  function render(species) {
    const imagePath = resolveImage(species.thumbnail || species.image);
    const iucnClass = IUCN_CLASS[species.iucnStatus] || 'normal';
    const userTag = species.isUserAdded
      ? '<span class="species-card__user-tag">用户新增</span>'
      : '';
    const media = imagePath
      ? `<img class="species-card-image" src="${escapeHtml(imagePath)}" alt="" loading="lazy" data-species-img />`
      : placeholderHtml(species.chineseName);
    const meta = [groupLabel(species.group), oceanLabel(species)].filter(Boolean).join(' · ');
    const brief = String(species.description || '').trim();

    return `
      <article class="species-card" data-species-id="${escapeHtml(species.id)}">
        <div class="species-card__media">
          ${userTag}
          <span class="species-card__iucn species-card__iucn--${iucnClass}">${escapeHtml(
            species.iucnStatus
          )}</span>
          ${media}
        </div>
        <div class="species-card__body">
          <h3 class="species-card__name">${escapeHtml(species.chineseName)}</h3>
          <p class="species-card__sci">${escapeHtml(species.scientificName)}</p>
          <p class="species-card__group">${escapeHtml(meta)}</p>
          <p class="species-card__desc">${escapeHtml(brief)}</p>
          <button class="species-card__link" type="button" data-open-species="${escapeHtml(
            species.id
          )}">查看档案</button>
        </div>
      </article>`;
  }

  function bindImageFallback(container) {
    if (!container || fallbackBound.has(container)) return;
    fallbackBound.add(container);
    container.addEventListener(
      'error',
      (event) => {
        const img = event.target;
        if (!(img instanceof HTMLImageElement) || !img.matches('[data-species-img]')) return;
        const card = img.closest('[data-species-id]');
        const name = card?.querySelector('.species-card__name')?.textContent || '';
        const placeholder = document.createElement('div');
        placeholder.className = 'species-card__placeholder';
        placeholder.setAttribute('aria-hidden', 'true');
        const span = document.createElement('span');
        span.textContent = name;
        placeholder.appendChild(span);
        img.replaceWith(placeholder);
      },
      true
    );
  }

  function emitOpenSpecies(id, sourceEl) {
    if (!id) return;
    document.dispatchEvent(
      new CustomEvent('lancun:open-species', {
        detail: { id, source: sourceEl || null },
      })
    );
  }

  function bindOpenHandlers(container) {
    if (!container || container.dataset.openBound === 'true') return;
    container.dataset.openBound = 'true';
    container.addEventListener('click', (event) => {
      const openBtn = event.target.closest('[data-open-species]');
      if (openBtn) {
        event.preventDefault();
        emitOpenSpecies(openBtn.dataset.openSpecies, openBtn);
        return;
      }
      const card = event.target.closest('[data-species-id]');
      if (card && container.contains(card)) {
        emitOpenSpecies(card.dataset.speciesId, card);
      }
    });
  }

  return { render, bindImageFallback, bindOpenHandlers, resolveImage, groupLabel, emitOpenSpecies };
})();
