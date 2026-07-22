/**
 * 海洋行动中心 · 往期成果轮播（阶段 4 · 详情弹窗）
 */
(function impactCarouselModule() {
  const instances = [];
  let lastTriggerCard = null;

  function $(selector, root = document) {
    return root.querySelector(selector);
  }

  function escapeHtml(text) {
    return String(text ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function typeLabel(type) {
    if (type === 'volunteer') return '志愿行动';
    if (type === 'donation') return '公益支持';
    return '协同成果';
  }

  function detailTypeLabel(type) {
    if (type === 'volunteer') return '志愿成果';
    if (type === 'donation') return '公益成果';
    return '协同成果';
  }

  function isImpactDetailOpen() {
    return Boolean(document.querySelector('[data-impact-detail-dialog][open]'));
  }

  function openImpactDetailDialog(storyId, triggerCard) {
    const story = (window.IMPACT_STORIES ?? []).find((item) => item.id === storyId);
    if (!story) return;

    lastTriggerCard = triggerCard || null;

    const dialog = $('[data-impact-detail-dialog]');
    const cover = $('[data-impact-detail-cover]');
    const typeNode = $('[data-impact-detail-type]');
    const title = $('[data-impact-detail-title]');
    const metric = $('[data-impact-detail-metric]');
    const location = $('[data-impact-detail-location]');
    const date = $('[data-impact-detail-date]');
    const summary = $('[data-impact-detail-summary]');
    const detailRoot = $('[data-impact-detail-detail]');
    const organizer = $('[data-impact-detail-organizer]');
    const gallery = $('[data-impact-detail-gallery]');

    if (cover) {
      cover.style.backgroundImage = story.image ? `url('${story.image}')` : '';
      cover.setAttribute('aria-label', `${story.title} 封面`);
    }
    if (typeNode) {
      typeNode.textContent = detailTypeLabel(story.relatedType);
      typeNode.dataset.type = story.relatedType;
    }
    if (title) title.textContent = story.title;
    if (metric) metric.textContent = story.metric || '';
    if (location) location.textContent = story.location || '—';
    if (date) date.textContent = story.date || '—';
    if (summary) summary.textContent = story.description || '';
    if (detailRoot) {
      const paragraphs = String(story.detail || '')
        .split(/\n\n+/)
        .map((part) => part.trim())
        .filter(Boolean);
      detailRoot.innerHTML = paragraphs.length
        ? paragraphs.map((part) => `<p>${escapeHtml(part)}</p>`).join('')
        : '<p>暂无详细说明。</p>';
    }
    if (organizer) {
      organizer.textContent = story.organizer ? `组织方：${story.organizer}` : '';
      organizer.hidden = !story.organizer;
    }
    if (gallery) {
      const items = Array.isArray(story.gallery) ? story.gallery.filter(Boolean) : [];
      if (items.length) {
        gallery.hidden = false;
        gallery.innerHTML = items
          .map(
            (src, index) => `
              <div
                class="impact-detail-gallery__item"
                style="background-image:url('${escapeHtml(src)}')"
                role="img"
                aria-label="${escapeHtml(story.title)} 图 ${index + 1}"
              ></div>
            `,
          )
          .join('');
      } else {
        gallery.hidden = true;
        gallery.innerHTML = '';
      }
    }

    dialog?.showModal();
    instances.forEach((instance) => {
      instance.stopAuto();
      instance.updateAutoHint();
    });
  }

  function closeImpactDetailDialog() {
    $('[data-impact-detail-dialog]')?.close();
    if (lastTriggerCard?.focus) lastTriggerCard.focus();
    lastTriggerCard = null;
    setActiveTab(window.OceanActionParticipationHub?.getActiveTab?.() || 'volunteer');
  }

  function createCarousel(config) {
    const state = {
      id: config.id,
      tabKey: config.tabKey,
      typeFilter: config.typeFilter,
      index: 0,
      timer: null,
      hoverPaused: false,
      reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
      root: $(config.root),
      card: $(config.card),
      counter: $(config.counter),
      hint: $(config.hint),
      prev: $(config.prev),
      next: $(config.next),
    };

    function stories() {
      return (window.IMPACT_STORIES ?? []).filter((item) => item.relatedType === state.typeFilter);
    }

    function shouldPause() {
      return (
        state.hoverPaused
        || document.hidden
        || state.reducedMotion
        || isImpactDetailOpen()
        || Boolean(
          document.querySelector(
            '[data-donation-detail-dialog][open], [data-donation-thanks-dialog][open], [data-donation-records-dialog][open], [data-volunteer-detail-dialog][open], [data-volunteer-register-dialog][open], [data-volunteer-success-dialog][open], [data-volunteer-records-dialog][open]',
          ),
        )
      );
    }

    function updateAutoHint() {
      if (!state.hint) return;
      const paused = shouldPause();
      state.hint.classList.toggle('is-paused', paused && !state.reducedMotion);
      state.hint.textContent = paused && !state.reducedMotion
        ? '已暂停自动切换'
        : '一次展示一条 · 每 8 秒自动切换';
    }

    function renderSlide() {
      const list = stories();
      if (!state.card || !list.length) {
        if (state.card) {
          state.card.innerHTML = '';
          state.card.classList.remove('is-clickable');
          state.card.removeAttribute('role');
          state.card.removeAttribute('tabindex');
          state.card.removeAttribute('aria-label');
        }
        if (state.counter) state.counter.textContent = '00 / 00';
        return;
      }

      if (state.index >= list.length) state.index = 0;
      const item = list[state.index];
      const coverStyle = item.image ? `background-image:url('${item.image}')` : '';

      state.card.classList.add('is-clickable');
      state.card.setAttribute('role', 'button');
      state.card.setAttribute('tabindex', '0');
      state.card.setAttribute('aria-label', `查看成果详情：${item.title}`);
      state.card.dataset.impactStoryId = item.id;

      state.card.innerHTML = `
        <div class="impact-story-card__media" style="${coverStyle}" role="img" aria-label="${escapeHtml(item.title)}"></div>
        <div class="impact-story-card__body">
          <span class="impact-story-card__type" data-type="${escapeHtml(item.relatedType)}">${typeLabel(item.relatedType)}</span>
          <h3>${escapeHtml(item.title)}</h3>
          <p class="impact-story-card__highlight">${escapeHtml(item.metric)}</p>
          <dl class="impact-story-card__meta">
            <div><dt>地点</dt><dd>${escapeHtml(item.location)}</dd></div>
            <div><dt>时间</dt><dd>${escapeHtml(item.date)}</dd></div>
          </dl>
          <p class="impact-story-card__summary">${escapeHtml(item.description)}</p>
        </div>
      `;

      if (state.counter) {
        const current = String(state.index + 1).padStart(2, '0');
        const max = String(list.length).padStart(2, '0');
        state.counter.textContent = `${current} / ${max}`;
      }
      updateAutoHint();
    }

    function go(delta) {
      const list = stories();
      if (!list.length) return;
      state.index = (state.index + delta + list.length) % list.length;
      renderSlide();
    }

    function openCurrentDetail() {
      const list = stories();
      const item = list[state.index];
      if (item) openImpactDetailDialog(item.id, state.card);
    }

    function startAuto() {
      stopAuto();
      if (state.reducedMotion) return;
      state.timer = window.setInterval(() => {
        if (!shouldPause()) go(1);
      }, 8000);
    }

    function stopAuto() {
      if (state.timer) {
        window.clearInterval(state.timer);
        state.timer = null;
      }
    }

    function bindEvents() {
      state.root?.addEventListener('mouseenter', () => {
        state.hoverPaused = true;
        updateAutoHint();
      });
      state.root?.addEventListener('mouseleave', () => {
        state.hoverPaused = false;
        updateAutoHint();
        if (!shouldPause()) startAuto();
      });
      state.prev?.addEventListener('click', () => go(-1));
      state.next?.addEventListener('click', () => go(1));
      state.card?.addEventListener('click', openCurrentDetail);
      state.card?.addEventListener('keydown', (event) => {
        if (event.key !== 'Enter' && event.key !== ' ') return;
        event.preventDefault();
        openCurrentDetail();
      });
    }

    return {
      id: state.id,
      tabKey: state.tabKey,
      renderSlide,
      go,
      startAuto,
      stopAuto,
      updateAutoHint,
      bindEvents,
      shouldPause,
    };
  }

  function refreshAllCarousels() {
    instances.forEach((instance) => {
      instance.stopAuto();
      instance.updateAutoHint();
      instance.renderSlide();
      if (!instance.shouldPause()) instance.startAuto();
    });
  }

  function setActiveTab() {
    refreshAllCarousels();
  }

  function bindImpactDetailDialog() {
    const dialog = $('[data-impact-detail-dialog]');
    if (!dialog) return;

    dialog.addEventListener('close', () => {
      if (lastTriggerCard?.focus) lastTriggerCard.focus();
      lastTriggerCard = null;
      setActiveTab(window.OceanActionParticipationHub?.getActiveTab?.() || 'volunteer');
    });

    document.querySelectorAll('[data-impact-detail-close], [data-impact-detail-close-footer]').forEach((button) => {
      button.addEventListener('click', () => dialog.close());
    });
  }

  function setupImpactCarousels() {
    if (document.body.dataset.page !== 'action') return;
    if (!window.IMPACT_STORIES?.length) return;

    instances.push(
      createCarousel({
        id: 'volunteer',
        tabKey: 'volunteer',
        typeFilter: 'volunteer',
        root: '[data-impact-carousel-volunteer]',
        card: '[data-impact-card-volunteer]',
        counter: '[data-impact-counter-volunteer]',
        prev: '[data-impact-prev-volunteer]',
        next: '[data-impact-next-volunteer]',
      }),
      createCarousel({
        id: 'donation',
        tabKey: 'donation',
        typeFilter: 'donation',
        root: '[data-impact-carousel-donation]',
        card: '[data-impact-card-donation]',
        counter: '[data-impact-counter-donation]',
        prev: '[data-impact-prev-donation]',
        next: '[data-impact-next-donation]',
      }),
    );

    instances.forEach((instance) => {
      instance.bindEvents();
      instance.renderSlide();
    });

    bindImpactDetailDialog();

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        instances.forEach((instance) => instance.stopAuto());
      } else {
        refreshAllCarousels();
      }
    });

    refreshAllCarousels();
  }

  document.addEventListener('DOMContentLoaded', setupImpactCarousels);

  window.OceanActionImpactCarousel = {
    setActiveTab,
    getInstance: (id) => instances.find((item) => item.id === id),
    openDetailDialog: openImpactDetailDialog,
    closeDetailDialog: closeImpactDetailDialog,
  };
})();
