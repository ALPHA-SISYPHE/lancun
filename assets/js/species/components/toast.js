/**
 * Toast 轻量反馈（Phase 7 · 独立，不依赖 ArchiveState）
 */
window.LancunArchiveToast = (function archiveToast() {
  let root;
  let timer = null;

  function init() {
    root = document.querySelector('[data-archive-toast]');
  }

  function show(message, options = {}) {
    if (!root) root = document.querySelector('[data-archive-toast]');
    if (!root) return;
    const duration = Number(options.duration) || 3200;
    root.innerHTML = String(message || '')
      .split('\n')
      .map((line) => `<span class="archive-toast__line">${escapeHtml(line)}</span>`)
      .join('');
    root.hidden = false;
    root.classList.add('is-visible');
    clearTimeout(timer);
    timer = setTimeout(() => {
      root.classList.remove('is-visible');
      setTimeout(() => {
        if (!root.classList.contains('is-visible')) root.hidden = true;
      }, 280);
    }, duration);
  }

  function escapeHtml(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  return { init, show };
})();
