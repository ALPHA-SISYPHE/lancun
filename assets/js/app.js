const storageKeys = { account: 'lancun.account', session: 'lancun.session', actions: 'lancun.actions', points: 'lancun.points', checked: 'lancun.checked-days' };

const getStored = (key, fallback) => {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
};
const setStored = (key, value) => localStorage.setItem(key, JSON.stringify(value));
const getAccount = () => getStored(storageKeys.account, null);
const getSession = () => getStored(storageKeys.session, { username: '', loggedIn: false });
const isLoggedIn = () => {
  const account = getAccount(); const session = getSession();
  return Boolean(account && session.loggedIn && account.username === session.username);
};
const getActions = () => getStored(storageKeys.actions, []);
const getPoints = () => getStored(storageKeys.points, 0);

let userDropdownOpen = false;

function isProfilePage() {
  return document.body.dataset.page === 'profile';
}

function mountUserMenu() {
  if (typeof window.buildUserMenuHtml !== 'function') return;
  document.querySelectorAll('[data-user-menu-host]').forEach((host) => {
    const href = host.dataset.profileHref || 'pages/profile.html';
    host.innerHTML = window.buildUserMenuHtml(href);
  });
}

function openAuthModal() {
  if (isLoggedIn()) return;
  const overlay = document.querySelector('[data-auth-modal]');
  const trigger = document.querySelector('[data-user-menu-trigger]');
  if (!overlay) return;
  overlay.hidden = false;
  overlay.setAttribute('aria-hidden', 'false');
  document.body.classList.add('auth-modal-open');
  if (trigger) trigger.setAttribute('aria-expanded', 'true');
  const firstInput = overlay.querySelector('input:not([type="hidden"])');
  firstInput?.focus();
}

function forceCloseAuthModal() {
  const overlay = document.querySelector('[data-auth-modal]');
  const trigger = document.querySelector('[data-user-menu-trigger]');
  if (!overlay) return;
  overlay.hidden = true;
  overlay.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('auth-modal-open');
  if (trigger) trigger.setAttribute('aria-expanded', 'false');
}

function openUserDropdown() {
  const dropdown = document.querySelector('[data-user-menu-dropdown]');
  const trigger = document.querySelector('[data-user-menu-trigger]');
  if (!dropdown || !trigger) return;
  userDropdownOpen = true;
  dropdown.hidden = false;
  trigger.setAttribute('aria-expanded', 'true');
}

function closeUserDropdown() {
  const dropdown = document.querySelector('[data-user-menu-dropdown]');
  const trigger = document.querySelector('[data-user-menu-trigger]');
  if (!dropdown || !trigger) return;
  userDropdownOpen = false;
  dropdown.hidden = true;
  trigger.setAttribute('aria-expanded', 'false');
}

function setupUserMenu() {
  const menu = document.querySelector('[data-user-menu]');
  if (!menu) return;
  const trigger = menu.querySelector('[data-user-menu-trigger]');
  const authModal = menu.querySelector('[data-auth-modal]');
  const dropdown = menu.querySelector('[data-user-menu-dropdown]');
  if (!trigger) return;

  trigger.addEventListener('click', (event) => {
    event.stopPropagation();
    if (!isLoggedIn()) {
      openAuthModal();
      return;
    }
    if (isProfilePage()) return;
    if (userDropdownOpen) closeUserDropdown();
    else openUserDropdown();
  });

  authModal?.addEventListener('click', (event) => {
    event.stopPropagation();
    if (!isLoggedIn() && event.target === authModal) return;
  });

  dropdown?.addEventListener('click', (event) => {
    event.stopPropagation();
  });

  document.addEventListener('click', (event) => {
    if (!menu.contains(event.target)) closeUserDropdown();
  });

  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;
    if (!isLoggedIn() && authModal && !authModal.hidden) return;
    closeUserDropdown();
  });

  document.querySelectorAll('[data-open-user-menu]').forEach((node) => {
    node.addEventListener('click', (event) => {
      event.preventDefault();
      if (isLoggedIn()) return;
      openAuthModal();
      trigger.focus();
    });
  });
}

function setupNavigation() {
  const menuButton = document.querySelector('.menu-toggle');
  const navigation = document.querySelector('.primary-navigation');
  if (!menuButton || !navigation) return;
  menuButton.addEventListener('click', () => {
    const open = navigation.classList.toggle('is-open');
    menuButton.setAttribute('aria-expanded', String(open));
  });
  navigation.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => {
    navigation.classList.remove('is-open'); menuButton.setAttribute('aria-expanded', 'false');
  }));
}

function setupHomeHeader() {
  /* v2: 全站保持透明 overlay 顶栏，不再切换暖白 solid */
}

function setupDisplayPrefs() {
  const form = document.querySelector('[data-display-prefs-form]');
  if (!form || typeof window.LANCUN_getPrefs !== 'function') return;
  const videoInput = form.querySelector('[name="videoBackground"]');
  const motionInput = form.querySelector('[name="reduceMotion"]');
  const prefs = window.LANCUN_getPrefs();
  if (videoInput) videoInput.checked = prefs.videoBackground !== false;
  if (motionInput) motionInput.checked = Boolean(prefs.reduceMotion);

  form.addEventListener('change', () => {
    window.LANCUN_setPrefs({
      videoBackground: videoInput?.checked ?? true,
      reduceMotion: motionInput?.checked ?? false,
    });
    if (typeof window.LANCUN_applyHeroPrefs === 'function') window.LANCUN_applyHeroPrefs();
    window.LANCUN_homeGlobe?.applyMotion?.();
    const status = form.querySelector('[data-display-prefs-status]');
    if (status) {
      status.textContent = '偏好已保存，返回首页即可看到效果。';
      status.className = 'status-message is-success';
    }
  });
}

function renderProfile() {
  const account = getAccount(); const loggedIn = isLoggedIn(); const actions = getActions(); const points = getPoints();
  const name = loggedIn ? account.displayName : '未登录守护者';
  const avatar = loggedIn ? name.slice(0, 1) : '澜';
  const username = loggedIn ? account.username : null;
  let monthCheckins = 0;
  if (username && window.LANCUN_actionCheckins) {
    window.LANCUN_actionCheckins.migrateLegacyCheckins?.();
    monthCheckins = window.LANCUN_actionCheckins.countMonthCheckins(username);
  }

  document.querySelectorAll('[data-profile-name]').forEach((node) => { node.textContent = name; });
  document.querySelectorAll('[data-profile-role]').forEach((node) => { node.textContent = loggedIn ? account.role : '请先登录'; });
  document.querySelectorAll('[data-profile-actions]').forEach((node) => { node.textContent = `累计 ${actions.length} 次行动`; });
  document.querySelectorAll('[data-profile-points]').forEach((node) => { node.textContent = points; });
  document.querySelectorAll('[data-avatar]').forEach((node) => { node.textContent = avatar; });
  document.querySelectorAll('[data-stat="actions"]').forEach((node) => { node.textContent = actions.length; });
  document.querySelectorAll('[data-stat="points"]').forEach((node) => { node.textContent = points; });
  document.querySelectorAll('[data-stat="checkins"]').forEach((node) => { node.textContent = monthCheckins; });

  const trigger = document.querySelector('[data-user-menu-trigger]');
  const triggerAvatar = document.querySelector('[data-user-menu-avatar]');
  const srLabel = document.querySelector('[data-user-menu-sr]');

  if (trigger) {
    trigger.classList.toggle('is-authenticated', loggedIn);
    trigger.setAttribute('aria-label', loggedIn ? `${name}，打开账户菜单` : '登录或注册，打开登录窗口');
  }
  if (triggerAvatar) triggerAvatar.textContent = avatar;
  if (srLabel) srLabel.textContent = loggedIn ? `${name}，账户菜单` : '登录或注册';

  document.querySelectorAll('[data-menu-profile-name]').forEach((node) => { node.textContent = name; });
  document.querySelectorAll('[data-menu-profile-role]').forEach((node) => { node.textContent = loggedIn ? account.role : ''; });
  document.querySelectorAll('[data-menu-avatar]').forEach((node) => { node.textContent = avatar; });

  if (loggedIn) {
    forceCloseAuthModal();
    if (document.body.dataset.page === 'profile') closeUserDropdown();
  }

  if (document.body.dataset.page === 'profile') {
    renderProfilePage();
  }
}

function setFieldError(input, message) {
  const error = document.getElementById(`${input.id}-error`);
  input.classList.toggle('is-invalid', Boolean(message));
  input.classList.toggle('is-valid', !message && input.value.length > 0);
  if (error) error.textContent = message;
  return Boolean(message);
}

function clearFormErrors(form) {
  form.querySelectorAll('.field-error').forEach((node) => { node.textContent = ''; });
  form.querySelectorAll('.is-invalid, .is-valid').forEach((node) => node.classList.remove('is-invalid', 'is-valid'));
}

function showAuthView(view, root = document) {
  root.querySelectorAll('[data-auth-tab]').forEach((tab) => {
    const active = tab.dataset.authTab === view;
    tab.classList.toggle('is-active', active);
    tab.setAttribute('aria-selected', String(active));
  });
  root.querySelectorAll('[data-auth-panel]').forEach((panel) => {
    panel.hidden = panel.dataset.authPanel !== view;
  });
}

function formatActionDate(iso) {
  try {
    return new Date(iso).toLocaleString('zh-CN', { dateStyle: 'medium', timeStyle: 'short' });
  } catch {
    return iso;
  }
}

function renderProfilePage() {
  const guest = document.querySelector('[data-profile-guest]');
  const app = document.querySelector('[data-profile-app]');
  if (!guest && !app) return;
  const loggedIn = isLoggedIn();
  if (guest) guest.hidden = loggedIn;
  if (app) app.hidden = !loggedIn;
  if (loggedIn) renderProfileDashboard();
}

function showDashboardView(viewId) {
  document.querySelectorAll('[data-dashboard-nav]').forEach((item) => {
    item.classList.toggle('is-active', item.dataset.dashboardNav === viewId);
  });
  document.querySelectorAll('[data-dashboard-view]').forEach((panel) => {
    panel.classList.toggle('is-active', panel.dataset.dashboardView === viewId);
  });
}

function renderProfileDashboard() {
  const account = getAccount();
  const actions = getActions();

  const tableBody = document.querySelector('[data-actions-table-body]');
  if (tableBody) {
    if (!actions.length) {
      tableBody.innerHTML = '<tr><td colspan="2">还没有行动记录，去行动中心完成第一次打卡吧。</td></tr>';
    } else {
      tableBody.innerHTML = actions.slice().reverse().map((item) => `<tr><td>${item.type || '保护行动'}</td><td>${formatActionDate(item.date)}</td></tr>`).join('');
    }
  }

  const username = document.querySelector('[data-profile-username]');
  const email = document.querySelector('[data-profile-email]');
  const created = document.querySelector('[data-profile-created]');
  if (username) username.textContent = account?.username || '—';
  if (email) email.textContent = account?.email || '未填写';
  if (created && account?.createdAt) created.textContent = formatActionDate(account.createdAt);

  renderCalendar('[data-profile-calendar]');
}

function setupProfileDashboard() {
  if (document.body.dataset.page !== 'profile') return;
  document.querySelectorAll('[data-dashboard-nav]').forEach((item) => {
    item.addEventListener('click', () => {
      if (item.dataset.dashboardNav) showDashboardView(item.dataset.dashboardNav);
    });
  });
  const initial = document.querySelector('[data-dashboard-nav].is-active');
  showDashboardView(initial?.dataset.dashboardNav || 'overview');
}

function setupAuth() {
  document.querySelectorAll('[data-auth-tab]').forEach((tab) => {
    tab.addEventListener('click', () => showAuthView(tab.dataset.authTab, tab.closest('[data-user-menu-guest]') || document));
  });

  document.querySelectorAll('[data-register-form]').forEach((register) => {
    register.addEventListener('submit', (event) => {
      event.preventDefault();
      clearFormErrors(register);
      const fields = register.elements;
      const username = fields.username.value.trim();
      const displayName = fields.displayName.value.trim();
      const password = fields.password.value;
      const confirmation = fields.confirmPassword.value;
      const email = fields.email.value.trim();
      let invalid = false;
      invalid = setFieldError(fields.username, username.length < 2 || username.length > 16 ? '用户名应为 2–16 个字符。' : '') || invalid;
      invalid = setFieldError(fields.displayName, displayName.length < 1 ? '请填写显示昵称。' : '') || invalid;
      invalid = setFieldError(fields.password, password.length < 6 ? '密码至少需要 6 位。' : '') || invalid;
      invalid = setFieldError(fields.confirmPassword, password !== confirmation ? '两次输入的密码不一致。' : '') || invalid;
      invalid = setFieldError(fields.email, email && !fields.email.validity.valid ? '请输入有效的邮箱地址。' : '') || invalid;
      const existing = getAccount();
      if (!invalid && existing?.username === username) invalid = setFieldError(fields.username, '该用户名已注册，请直接登录。');
      if (invalid) return;
      const account = { username, displayName, password, role: fields.role.value, email, createdAt: new Date().toISOString() };
      setStored(storageKeys.account, account);
      setStored(storageKeys.session, { username, loggedIn: true });
      register.reset();
      renderProfile();
      const status = register.querySelector('[data-register-result]');
      if (status) { status.textContent = '注册成功，已登录。'; status.className = 'status-message is-success'; }
      forceCloseAuthModal();
      closeUserDropdown();
    });
  });

  document.querySelectorAll('[data-login-form]').forEach((login) => {
    login.addEventListener('submit', (event) => {
      event.preventDefault();
      clearFormErrors(login);
      const fields = login.elements;
      const username = fields.username.value.trim();
      const password = fields.password.value;
      let invalid = false;
      invalid = setFieldError(fields.username, username ? '' : '请输入用户名。') || invalid;
      invalid = setFieldError(fields.password, password.length >= 6 ? '' : '密码至少需要 6 位。') || invalid;
      const account = getAccount();
      const status = login.querySelector('[data-login-result]');
      if (!invalid && !account) { setFieldError(fields.username, '尚未注册，请先创建本地账户。'); return; }
      if (!invalid && account.username !== username) { setFieldError(fields.username, '用户名不存在。'); return; }
      if (!invalid && account.password !== password) { setFieldError(fields.password, '密码不正确。'); return; }
      setStored(storageKeys.session, { username, loggedIn: true });
      login.reset();
      renderProfile();
      if (status) { status.textContent = '登录成功。'; status.className = 'status-message is-success'; }
      forceCloseAuthModal();
      closeUserDropdown();
    });
  });

  document.querySelectorAll('[data-logout]').forEach((button) => {
    button.addEventListener('click', () => {
      setStored(storageKeys.session, { username: '', loggedIn: false });
      renderProfile();
      showAuthView('login');
      closeUserDropdown();
    });
  });

  document.querySelectorAll('[data-profile-clear]').forEach((button) => {
    button.addEventListener('click', () => {
      if (!window.confirm('确定清除本地账户、积分与全部行动记录吗？此操作不可恢复。')) return;
      Object.values(storageKeys).forEach((key) => localStorage.removeItem(key));
      renderProfile();
      showAuthView('register');
    });
  });
}

function setupGlobe() {
  const globe = document.querySelector('[data-globe]'); if (!globe) return;
  let startX = 0; let rotation = 0;
  globe.addEventListener('pointerdown', (event) => { startX = event.clientX; globe.setPointerCapture(event.pointerId); });
  globe.addEventListener('pointermove', (event) => { if (!globe.hasPointerCapture(event.pointerId)) return; rotation += (event.clientX - startX) * .35; startX = event.clientX; globe.style.setProperty('--globe-rotate', `${rotation}deg`); });
  document.querySelectorAll('[data-map-pin]').forEach((button) => button.addEventListener('click', () => {
    const story = window.LANCUN_DATA.oceanStories[button.dataset.mapPin]; const panel = document.querySelector('[data-map-detail]');
    if (story && panel) panel.innerHTML = `<h2>${story.title}</h2><p>${story.text}</p>`;
    document.querySelectorAll('[data-map-pin]').forEach((item) => item.classList.toggle('is-active', item.dataset.mapPin === button.dataset.mapPin));
  }));
}

function setupDashboard() {
  const chart = document.querySelector('[data-pollution-chart]'); if (!chart) return;
  const drawChart = (rows) => { chart.innerHTML = rows.map((row) => `<div class="chart-row"><span>${row.label}</span><div class="chart-track"><div class="chart-fill" style="width:${row.value}%"></div></div><strong>${row.value}%</strong></div>`).join(''); };
  drawChart(window.LANCUN_DATA.pollution);
  document.querySelectorAll('[data-dashboard-filter]').forEach((button) => button.addEventListener('click', () => {
    document.querySelectorAll('[data-dashboard-filter]').forEach((item) => item.classList.toggle('is-active', item === button));
    const solution = [{ label: '源头减量', value: 74 }, { label: '回收再利用', value: 58 }, { label: '海岸清洁', value: 44 }, { label: '公众教育', value: 66 }];
    const rows = button.dataset.dashboardFilter === 'solution' ? solution : window.LANCUN_DATA.pollution; drawChart(rows);
    document.querySelector('[data-dashboard-note]').textContent = button.dataset.dashboardFilter === 'solution' ? '当前展示：解决路径的示例优先级。' : '当前展示：污染来源分类的示例比例。';
  }));
}


function renderCalendar(...selectors) {
  const list = selectors.length ? selectors : ['[data-profile-calendar]'];
  if (window.LANCUN_actionCheckins?.renderProfileCalendar) {
    window.LANCUN_actionCheckins.migrateLegacyCheckins?.();
    window.LANCUN_actionCheckins.renderProfileCalendar(list);
    return;
  }
  list.forEach((selector) => {
    document.querySelectorAll(selector).forEach((calendar) => {
      calendar.innerHTML = '';
    });
  });
}

function setupPageBgVideo() {
  const wrap = document.querySelector('.page-bg-video');
  const video = document.querySelector('.page-bg-video__media');
  if (!wrap || !video) return;

  const prefsReduce = typeof window.LANCUN_getPrefs === 'function' && Boolean(window.LANCUN_getPrefs().reduceMotion);
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    || document.documentElement.dataset.reducedMotion === 'true'
    || prefsReduce;

  if (reduceMotion) {
    video.pause();
    video.removeAttribute('src');
    video.load();
    video.hidden = true;
    wrap.hidden = true;
    document.body.classList.add('is-bg-video-failed');
    return;
  }

  const fail = () => {
    video.pause();
    video.hidden = true;
    wrap.classList.add('is-failed');
    document.body.classList.add('is-bg-video-failed');
  };

  video.addEventListener('error', fail);
  const playPromise = video.play();
  if (playPromise?.catch) playPromise.catch(() => { /* autoplay blocked: muted loop usually ok */ });
}

document.addEventListener('DOMContentLoaded', () => {
  mountUserMenu();
  setupNavigation();
  setupHomeHeader();
  setupDisplayPrefs();
  setupPageBgVideo();
  window.addEventListener('lancun-home-globe-ready', () => {
    window.LANCUN_homeGlobe?.applyMotion?.();
  });
  setupUserMenu();
  setupAuth();
  renderProfile();
  setupProfileDashboard();
  setupGlobe();
  setupDashboard();
});

window.renderProfile = renderProfile;
