/**
 * 海洋行动中心 · 个人行动档案 strip（阶段 5）
 */
(function archiveUIModule() {
  const ARCHIVE_SELECTORS = [
    '[data-archive-history]',
    '[data-archive-badges]',
    '[data-archive-volunteer-records]',
    '[data-archive-donations]',
  ];

  function getStored(key, fallback) {
    try {
      return JSON.parse(localStorage.getItem(key)) ?? fallback;
    } catch {
      return fallback;
    }
  }

  function getUsername() {
    const account = getStored('lancun.account', null);
    const session = getStored('lancun.session', { username: '', loggedIn: false });
    if (!account || !session.loggedIn || account.username !== session.username) return null;
    return account.username;
  }

  function $(selector, root = document) {
    return root.querySelector(selector);
  }

  function setStat(selector, value) {
    const node = $(selector);
    if (node) node.textContent = value;
  }

  function renderArchiveStrip() {
    if (document.body.dataset.page !== 'action') return;

    const username = getUsername();
    const summary = window.OceanAccountMenuStats?.getSummary?.(username) || {
      checkinCount: 0,
      badgeCount: 0,
      volunteerCount: 0,
      donationCount: 0,
    };

    setStat('[data-archive-stat-checkins]', `${summary.checkinCount} 次`);
    setStat('[data-archive-stat-badges]', `${summary.badgeCount} 枚`);
    setStat('[data-archive-stat-volunteer]', `${summary.volunteerCount} 次`);
    setStat('[data-archive-stat-donations]', `${summary.donationCount} 次`);
  }

  function bindRefreshHooks() {
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) renderArchiveStrip();
    });

    window.addEventListener('pageshow', renderArchiveStrip);

    ARCHIVE_SELECTORS.forEach((selector) => {
      document.querySelectorAll(selector).forEach((button) => {
        button.addEventListener('click', renderArchiveStrip, true);
      });
    });
  }

  function setupArchiveStrip() {
    if (document.body.dataset.page !== 'action') return;
    bindRefreshHooks();
    renderArchiveStrip();
  }

  document.addEventListener('DOMContentLoaded', setupArchiveStrip);

  window.OceanActionArchiveUI = { renderArchiveStrip };
})();
