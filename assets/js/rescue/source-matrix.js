(() => {
  const { resolveMediaPath, prefersReducedMotion } = window.LANCUN_RESCUE;

  const bulletList = (items) => {
    if (!items?.length) return '<p>—</p>';
    return `<ul class="source-info-block__list">${items.map((item) => `<li>${item}</li>`).join('')}</ul>`;
  };

  const infoBlock = (title, items, extraHtml = '') => `
    <article class="source-info-block">
      <h4 class="source-info-block__head">${title}</h4>
      ${bulletList(items)}
      ${extraHtml}
    </article>`;

  window.LANCUN_RESCUE.initSourceMatrix = () => {
    const panels = window.LANCUN_DATA?.rescuePollutionPanels;
    const rail = document.querySelector('[data-rescue-source-rail]');
    const visual = document.querySelector('[data-rescue-source-visual]');
    const panelHost = document.querySelector('[data-rescue-source-detail]');
    const navHost = document.querySelector('[data-rescue-source-nav]');
    const drawer = document.querySelector('[data-rescue-source-drawer]');
    const drawerBackdrop = document.querySelector('[data-rescue-source-drawer-backdrop]');
    const drawerBody = document.querySelector('[data-rescue-source-drawer-body]');
    const drawerClose = document.querySelector('[data-rescue-source-drawer-close]');

    if (!panels?.length || !rail || !visual || !panelHost) return;

    let activeIndex = 0;

    panelHost.id = 'rescue-source-detail';

    rail.innerHTML = panels
      .map((p, i) => {
        const imagePath = resolveMediaPath(p.image);
        const thumbStyle = imagePath ? ` style="background-image:url('${imagePath}')"` : '';
        const status = p.status || 'ok';
        const blurb = (p.navBlurb || p.summary || '').slice(0, 28);
        return `
    <button type="button" class="source-card-rail__btn" role="tab" id="rescue-tab-${p.id}"
      aria-selected="${i === 0}" aria-controls="rescue-source-detail" data-index="${i}">
      <span class="source-card-rail__thumb" aria-hidden="true"${thumbStyle}></span>
      <span class="source-card-rail__copy">
        <span class="source-card-rail__label">${p.title}</span>
        <span class="status-pill status-pill--${status}">${p.statusLabel || status}</span>
        <span class="source-card-rail__blurb">${blurb}</span>
      </span>
    </button>`;
      })
      .join('');

    const renderVisual = (p, animate = false) => {
      const imagePath = resolveMediaPath(p.image);
      const apply = () => {
        visual.innerHTML = `
        ${imagePath ? `<img class="source-image-stage__img" src="${imagePath}" alt="" />` : ''}
        <div class="source-image-stage__scrim" aria-hidden="true"></div>
        <p class="source-image-stage__caption">${p.title}</p>`;
        visual.classList.remove('is-fading');
        visual.removeAttribute('aria-hidden');
      };

      if (animate && !prefersReducedMotion()) {
        visual.classList.add('is-fading');
        window.setTimeout(apply, 150);
      } else {
        apply();
      }
    };

    const getBullets = (p, key, fallbackText) => {
      const fromPanel = p[key];
      if (Array.isArray(fromPanel) && fromPanel.length) return fromPanel.slice(0, 4);
      if (fallbackText) {
        return fallbackText
          .split(/[，,、；;]/)
          .map((s) => s.trim())
          .filter(Boolean)
          .slice(0, 4);
      }
      return [];
    };

    const renderDrawer = (p) => {
      if (!drawerBody) return;
      const archive = p.fullArchive || {};
      const governance = archive.solutions || p.governance || [];
      const personal = archive.personal || p.personalAction || [];

      drawerBody.innerHTML = `
        <h3 class="source-archive-drawer__title" id="source-archive-title">${p.title}</h3>
        <p class="source-archive-drawer__highlight">${p.dataHighlight || p.summary || ''}</p>
        <section class="source-archive-drawer__section">
          <h4>传输路径</h4>
          <p>${archive.pathway || p.pathway || '—'}</p>
        </section>
        <section class="source-archive-drawer__section">
          <h4>Source · 来源</h4>
          <p>${archive.sources || p.sources || '—'}</p>
        </section>
        <section class="source-archive-drawer__section">
          <h4>Impact · 生态影响</h4>
          <p>${archive.impact || p.ecologicalImpact || '—'}</p>
        </section>
        <section class="source-archive-drawer__section">
          <h4>Solution · 解决方案</h4>
          ${bulletList(governance)}
        </section>
        <section class="source-archive-drawer__section">
          <h4>Personal Action · 个人行动</h4>
          ${bulletList(personal)}
        </section>
        <p class="source-archive-drawer__refs">来源：${(p.sourceRefs || []).join(' · ') || '见 DATA_SOURCES.md'}</p>`;
    };

    const openDrawer = (index) => {
      const p = panels[index];
      if (!p || !drawer || !drawerBackdrop) return;
      renderDrawer(p);
      drawer.classList.add('is-open');
      drawerBackdrop.hidden = false;
      drawerBackdrop.classList.add('is-open');
      drawer.setAttribute('aria-hidden', 'false');
      document.body.classList.add('source-drawer-open');
      window.LANCUN_RESCUE.setPageState?.({ isSourceModalOpen: true });
      drawerClose?.focus();
    };

    const closeDrawer = () => {
      if (!drawer || !drawerBackdrop) return;
      drawer.classList.remove('is-open');
      drawerBackdrop.classList.remove('is-open');
      drawer.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('source-drawer-open');
      window.LANCUN_RESCUE.setPageState?.({ isSourceModalOpen: false });
      window.setTimeout(() => {
        drawerBackdrop.hidden = true;
      }, prefersReducedMotion() ? 0 : 280);
      panelHost.querySelector('[data-rescue-source-archive-open]')?.focus();
    };

    const scrollToActionBrief = (event) => {
      event.preventDefault();
      const target = document.getElementById('action-brief');
      if (!target) return;
      target.scrollIntoView({
        behavior: prefersReducedMotion() ? 'auto' : 'smooth',
        block: 'start',
      });
      if (history.replaceState) {
        history.replaceState(null, '', '#action-brief');
      } else {
        location.hash = 'action-brief';
      }
    };

    const bindPanelActions = () => {
      panelHost.querySelector('[data-rescue-source-archive-open]')?.addEventListener('click', () => {
        openDrawer(activeIndex);
      });

      panelHost.querySelector('[data-rescue-source-action]')?.addEventListener('click', scrollToActionBrief);
      panelHost.querySelector('[data-rescue-data-sources-open]')?.addEventListener('click', (e) => {
        e.preventDefault();
        window.LANCUN_RESCUE.openDataSourcesModal?.();
      });
    };

    const renderPanel = (index, animate = true) => {
      const p = panels[index];
      if (!p) return;

      const sourceBullets = getBullets(p, 'sourceBullets', p.sources).slice(0, 2);
      const impactBullets = getBullets(p, 'impactBullets', p.ecologicalImpact).slice(0, 2);

      const applyContent = () => {
        renderVisual(p, false);
        panelHost.innerHTML = `
          <h3 class="source-detail-panel__title">${p.title}</h3>
          <p class="source-detail-panel__judgment">${p.dataHighlight || p.summary || ''}</p>
          <div class="source-detail-blocks">
            ${infoBlock('Source · 来源', sourceBullets)}
            ${infoBlock('Impact · 生态影响', impactBullets)}
          </div>
          <div class="source-detail-panel__footer">
            <p class="source-detail-panel__sources">
              来源：${(p.sourceRefs || []).join(' · ') || '见 DATA_SOURCES.md'}
              <button type="button" class="source-detail-panel__data-link" data-rescue-data-sources-open>查看数据来源</button>
            </p>
            <div class="source-detail-panel__actions">
              <button type="button" class="source-detail-panel__cta source-detail-panel__cta--secondary" data-rescue-source-archive-open>查看完整档案</button>
              <a class="source-detail-panel__cta" href="#action-brief" data-rescue-source-action>查看行动建议 <span aria-hidden="true">→</span></a>
            </div>
          </div>`;
        panelHost.classList.remove('is-fading');
        bindPanelActions();
      };

      if (animate && !prefersReducedMotion()) {
        panelHost.classList.add('is-fading');
        visual.classList.add('is-fading');
        window.setTimeout(applyContent, 150);
      } else {
        applyContent();
      }

      rail.querySelectorAll('.source-card-rail__btn').forEach((btn, i) => {
        btn.setAttribute('aria-selected', i === index ? 'true' : 'false');
      });
      activeIndex = index;
      window.LANCUN_RESCUE.setPageState?.({ selectedSource: index });
    };

    const selectIndex = (index) => {
      const next = (index + panels.length) % panels.length;
      renderPanel(next);
    };

    const handleNavKeys = (e) => {
      if (drawer?.classList.contains('is-open')) return;
      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
        e.preventDefault();
        selectIndex(activeIndex + 1);
      } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
        e.preventDefault();
        selectIndex(activeIndex - 1);
      }
    };

    rail.addEventListener('click', (e) => {
      const btn = e.target.closest('.source-card-rail__btn');
      if (!btn) return;
      selectIndex(Number(btn.dataset.index));
    });

    rail.addEventListener('keydown', handleNavKeys);
    panelHost.addEventListener('keydown', handleNavKeys);

    navHost?.querySelector('[data-rescue-source-prev]')?.addEventListener('click', () => {
      selectIndex(activeIndex - 1);
    });
    navHost?.querySelector('[data-rescue-source-next]')?.addEventListener('click', () => {
      selectIndex(activeIndex + 1);
    });

    drawerClose?.addEventListener('click', closeDrawer);
    drawerBackdrop?.addEventListener('click', closeDrawer);

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && drawer?.classList.contains('is-open')) {
        e.preventDefault();
        closeDrawer();
      }
    });

    renderPanel(0, false);
  };
})();
