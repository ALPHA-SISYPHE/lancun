/**
 * 海洋行动中心 · ParticipationHub Tab 切换（阶段 3）
 */
(function participationHubModule() {
  const state = {
    activeTab: 'volunteer',
  };

  function $(selector, root = document) {
    return root.querySelector(selector);
  }

  function $$ (selector, root = document) {
    return [...root.querySelectorAll(selector)];
  }

  function setActiveTab(tabId) {
    if (state.activeTab === tabId) return;
    state.activeTab = tabId;

    $$('[data-participation-tab]').forEach((btn) => {
      const active = btn.getAttribute('data-participation-tab') === tabId;
      btn.classList.toggle('is-active', active);
      btn.setAttribute('aria-selected', active ? 'true' : 'false');
      btn.tabIndex = active ? 0 : -1;
    });

    $$('[data-participation-panel]').forEach((panel) => {
      const active = panel.getAttribute('data-participation-panel') === tabId;
      panel.hidden = !active;
    });

    window.OceanActionImpactCarousel?.setActiveTab?.(tabId);
    window.OceanActionVolunteerUI?.resumeAutoRotate?.();
    window.OceanActionDonationUI?.resumeAutoRotate?.();
  }

  function bindEvents() {
    const hub = $('[data-participation-hub]');
    if (!hub) return;

    $$('[data-participation-tab]').forEach((btn) => {
      btn.addEventListener('click', () => {
        setActiveTab(btn.getAttribute('data-participation-tab'));
      });
    });

    hub.addEventListener('mouseenter', () => {
      window.OceanActionVolunteerUI?.pauseAutoRotate?.(true);
      window.OceanActionDonationUI?.pauseAutoRotate?.(true);
    });

    hub.addEventListener('mouseleave', () => {
      window.OceanActionVolunteerUI?.pauseAutoRotate?.(false);
      window.OceanActionDonationUI?.pauseAutoRotate?.(false);
    });
  }

  function setupParticipationHub() {
    if (document.body.dataset.page !== 'action') return;
    bindEvents();
    setActiveTab('volunteer');
  }

  document.addEventListener('DOMContentLoaded', setupParticipationHub);

  window.OceanActionParticipationHub = {
    setActiveTab,
    getActiveTab: () => state.activeTab,
  };
})();
