const storageKeys = { account: 'lancun.account', session: 'lancun.session', actions: 'lancun.actions', points: 'lancun.points', checked: 'lancun.checked-days' };

const getStored = (key, fallback) => {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
};
const setStored = (key, value) => localStorage.setItem(key, JSON.stringify(value));
const getAccount = () => {
  const current = window.OceanAuthStorage?.getCurrentUser?.() || null;
  if (current) {
    return {
      username: current.username,
      displayName: current.displayName,
      role: current.rolePreference,
      email: current.email || '',
      createdAt: current.createdAt,
    };
  }
  return getStored(storageKeys.account, null);
};
const isLoggedIn = () => {
  if (window.OceanAuthStorage?.isLoggedIn) return window.OceanAuthStorage.isLoggedIn();
  const account = getAccount();
  const session = getStored(storageKeys.session, { username: '', loggedIn: false });
  return Boolean(account && session.loggedIn && account.username === session.username);
};
const getActions = () => getStored(storageKeys.actions, []);
const getPoints = () => getStored(storageKeys.points, 0);

let accountMenuOpen = false;
let registerStep = 1;
let accountMenuToastTimer = null;

const AUTH_SUCCESS_CLOSE_MS = 1200;

function authStorage() {
  return window.OceanAuthStorage;
}

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

function getAuthModalRoot() {
  return document.querySelector('[data-auth-modal-panel]');
}

function clearAuthStatus() {
  document.querySelectorAll('[data-login-result], [data-register-result]').forEach((node) => {
    node.textContent = '';
    node.className = 'auth-modal__status';
  });
}

function clearAuthForms() {
  document.querySelectorAll('[data-login-form], [data-register-form]').forEach((form) => {
    form.reset();
    clearFormErrors(form);
  });
  clearAuthStatus();
}

function getRegisterStep() {
  return registerStep;
}

function setRegisterStep(step) {
  registerStep = step;
  document.querySelectorAll('[data-register-step]').forEach((panel) => {
    panel.hidden = Number(panel.dataset.registerStep) !== step;
  });
  document.querySelectorAll('[data-register-progress]').forEach((item) => {
    item.classList.toggle('is-active', Number(item.dataset.registerProgress) === step);
    item.classList.toggle('is-done', Number(item.dataset.registerProgress) < step);
  });
}

function resetRegisterStep(step = 1) {
  setRegisterStep(step);
}

function fillRegisterSummary() {
  const form = document.querySelector('[data-register-form]');
  if (!form) return;
  const fields = form.elements;
  const summary = document.querySelector('[data-register-summary]');
  if (!summary) return;
  const username = summary.querySelector('[data-summary-username]');
  const displayName = summary.querySelector('[data-summary-display-name]');
  const role = summary.querySelector('[data-summary-role]');
  if (username) username.textContent = fields.username.value.trim() || '—';
  if (displayName) displayName.textContent = fields.displayName.value.trim() || '—';
  if (role) role.textContent = fields.role.value || '—';
}

function focusAuthFirstInput() {
  const panel = getAuthModalRoot();
  if (!panel) return;
  const visiblePanel = panel.querySelector('[data-auth-panel]:not([hidden])');
  const firstInput = visiblePanel?.querySelector('input:not([type="checkbox"]):not([type="hidden"])');
  firstInput?.focus();
}

function showAuthSuccess(statusNode, message, onClose) {
  if (!statusNode) return;
  statusNode.textContent = message;
  statusNode.className = 'auth-modal__status is-success';
  window.setTimeout(() => {
    forceCloseAuthModal();
    onClose?.();
  }, AUTH_SUCCESS_CLOSE_MS);
}

function showAccountMenuToast(message) {
  const toast = document.querySelector('[data-account-menu-toast]');
  if (!toast) return;
  if (accountMenuToastTimer) window.clearTimeout(accountMenuToastTimer);
  toast.textContent = message;
  toast.hidden = false;
  accountMenuToastTimer = window.setTimeout(() => {
    toast.textContent = '';
    toast.hidden = true;
    accountMenuToastTimer = null;
  }, 3000);
}

function getAccountAvatarText(user) {
  if (!user) return '澜';
  if (user.avatarType === 'wave') return '~';
  return user.avatarText || user.displayName?.slice(0, 1) || '澜';
}

function validateRegisterStep(step, form) {
  const fields = form.elements;
  clearFormErrors(form);
  let invalid = false;

  if (step === 1) {
    const username = fields.username.value.trim();
    const password = fields.password.value;
    const confirmation = fields.confirmPassword.value;
    invalid = setFieldError(fields.username, username.length < 2 || username.length > 16 ? '用户名应为 2–16 个字符。' : '') || invalid;
    if (!invalid && authStorage()?.isUsernameTaken?.(username)) {
      invalid = setFieldError(fields.username, '该用户名已被使用。') || invalid;
    }
    invalid = setFieldError(fields.password, !password ? '请输入密码。' : password.length < 6 ? '密码至少需要 6 位。' : '') || invalid;
    invalid = setFieldError(fields.confirmPassword, password !== confirmation ? '两次输入的密码不一致。' : '') || invalid;
  }

  if (step === 2) {
    const displayName = fields.displayName.value.trim();
    const email = fields.email.value.trim();
    invalid = setFieldError(fields.displayName, displayName.length < 1 ? '请填写显示昵称。' : '') || invalid;
    invalid = setFieldError(fields.email, email && !fields.email.validity.valid ? '请输入有效的邮箱地址。' : '') || invalid;
  }

  return !invalid;
}

function validateRegisterAll(form) {
  const fields = form.elements;
  clearFormErrors(form);
  let invalid = false;
  const username = fields.username.value.trim();
  const password = fields.password.value;
  const confirmation = fields.confirmPassword.value;
  const displayName = fields.displayName.value.trim();
  const email = fields.email.value.trim();
  invalid = setFieldError(fields.username, username.length < 2 || username.length > 16 ? '用户名应为 2–16 个字符。' : '') || invalid;
  if (!invalid && authStorage()?.isUsernameTaken?.(username)) {
    invalid = setFieldError(fields.username, '该用户名已被使用。') || invalid;
  }
  invalid = setFieldError(fields.password, !password ? '请输入密码。' : password.length < 6 ? '密码至少需要 6 位。' : '') || invalid;
  invalid = setFieldError(fields.confirmPassword, password !== confirmation ? '两次输入的密码不一致。' : '') || invalid;
  invalid = setFieldError(fields.displayName, displayName.length < 1 ? '请填写显示昵称。' : '') || invalid;
  invalid = setFieldError(fields.email, email && !fields.email.validity.valid ? '请输入有效的邮箱地址。' : '') || invalid;
  return !invalid;
}

function openAuthModal(view = 'login') {
  const overlay = document.querySelector('[data-auth-modal]');
  const panel = getAuthModalRoot();
  if (!overlay || !panel) return;
  closeAccountMenu();
  clearAuthForms();
  resetRegisterStep(1);
  showAuthView(view, panel);
  overlay.hidden = false;
  overlay.setAttribute('aria-hidden', 'false');
  document.body.classList.add('auth-modal-open');
  focusAuthFirstInput();
}

function forceCloseAuthModal() {
  const overlay = document.querySelector('[data-auth-modal]');
  if (!overlay) return;
  overlay.hidden = true;
  overlay.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('auth-modal-open');
  resetRegisterStep(1);
  clearAuthForms();
}

function closeMobileNav() {
  const navigation = document.querySelector('.primary-navigation');
  const menuButton = document.querySelector('.menu-toggle');
  if (!navigation?.classList.contains('is-open')) return;
  navigation.classList.remove('is-open');
  menuButton?.setAttribute('aria-expanded', 'false');
}

function openAccountMenu() {
  const panel = document.querySelector('[data-account-menu]');
  const trigger = document.querySelector('[data-user-menu-trigger]');
  if (!panel || !trigger) return;
  closeMobileNav();
  renderAccountMenu();
  accountMenuOpen = true;
  panel.hidden = false;
  trigger.classList.add('is-active');
  trigger.setAttribute('aria-expanded', 'true');
}

function closeAccountMenu() {
  const panel = document.querySelector('[data-account-menu]');
  const trigger = document.querySelector('[data-user-menu-trigger]');
  if (!panel || !trigger) return;
  accountMenuOpen = false;
  panel.hidden = true;
  trigger.classList.remove('is-active');
  trigger.setAttribute('aria-expanded', 'false');
}

function toggleAccountMenu() {
  if (accountMenuOpen) closeAccountMenu();
  else openAccountMenu();
}

function renderAccountMenuStats(username) {
  const summary = window.OceanAccountMenuStats?.getSummary?.(username) || {
    checkedToday: false,
    badgeCount: 0,
    volunteerCount: 0,
    donationCount: 0,
  };

  const todayNode = document.querySelector('[data-menu-stat-today]');
  const badgesNode = document.querySelector('[data-menu-stat-badges]');
  const volunteerNode = document.querySelector('[data-menu-stat-volunteer]');
  const donationsNode = document.querySelector('[data-menu-stat-donations]');

  if (todayNode) {
    todayNode.textContent = summary.checkedToday ? '已打卡' : '未打卡';
    todayNode.classList.toggle('is-done', summary.checkedToday);
  }
  if (badgesNode) badgesNode.textContent = String(summary.badgeCount);
  if (volunteerNode) volunteerNode.textContent = String(summary.volunteerCount);
  if (donationsNode) donationsNode.textContent = String(summary.donationCount);
}

function openAccountSettingsModal() {
  const overlay = document.querySelector('[data-account-settings-modal]');
  if (!overlay) return;
  closeAccountMenu();
  overlay.hidden = false;
  overlay.setAttribute('aria-hidden', 'false');
  document.body.classList.add('account-settings-open');
  overlay.querySelector('[data-account-settings-close]')?.focus();
}

function closeAccountSettingsModal() {
  const overlay = document.querySelector('[data-account-settings-modal]');
  if (!overlay) return;
  overlay.hidden = true;
  overlay.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('account-settings-open');
}

function handleAccountMenuNav(event, nav) {
  if (nav === 'settings') {
    event.preventDefault();
    openAccountSettingsModal();
    return;
  }

  if (nav === 'logout') {
    event.preventDefault();
    authStorage()?.logoutUser?.();
    renderProfile();
    showAccountMenuToast('已退出守护者账户。');
    closeAccountMenu();
    return;
  }

  closeAccountMenu();
}

function handleAccountMenuDeepLink(retry = 0) {
  if (document.body.dataset.page === 'species' && location.hash === '#user-added') {
    if (window.LancunSpeciesRails?.setActiveRail) {
      window.LancunSpeciesRails.setActiveRail('user-added');
    } else if (retry < 20) {
      requestAnimationFrame(() => handleAccountMenuDeepLink(retry + 1));
    }
    return;
  }

  if (document.body.dataset.page !== 'action') return;

  const hash = location.hash.replace('#', '');
  if (!hash) return;

  const ready = hash === 'daily-action-dock'
    || (hash === 'open-badges' && window.OceanActionCheckinUI?.openBadgesDialog)
    || (hash === 'open-volunteer-records' && window.OceanActionVolunteerUI?.openRecordsDialog)
    || (hash === 'open-donations' && window.OceanActionDonationUI?.openRecordsDialog);

  if (!ready && retry < 20) {
    requestAnimationFrame(() => handleAccountMenuDeepLink(retry + 1));
    return;
  }

  if (hash === 'open-badges') {
    window.OceanActionCheckinUI?.openBadgesDialog?.();
  } else if (hash === 'open-volunteer-records') {
    window.OceanActionVolunteerUI?.openRecordsDialog?.();
  } else if (hash === 'open-donations') {
    window.OceanActionDonationUI?.openRecordsDialog?.();
  } else if (hash === 'daily-action-dock') {
    document.getElementById('daily-action-dock')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

function renderAccountMenu() {
  const currentUser = authStorage()?.getCurrentUser?.() || null;
  const loggedIn = Boolean(currentUser);
  const guestPanel = document.querySelector('[data-account-menu-guest]');
  const memberPanel = document.querySelector('[data-account-menu-member]');
  const trigger = document.querySelector('[data-user-menu-trigger]');
  const triggerAvatar = document.querySelector('[data-user-menu-avatar]');
  const srLabel = document.querySelector('[data-user-menu-sr]');
  const footnote = document.querySelector('[data-account-menu-member] .account-menu__footnote');

  if (guestPanel) guestPanel.hidden = loggedIn;
  if (memberPanel) memberPanel.hidden = !loggedIn;

  const avatar = loggedIn ? getAccountAvatarText(currentUser) : '澜';
  if (triggerAvatar) triggerAvatar.textContent = avatar;

  if (trigger) {
    trigger.classList.toggle('is-authenticated', loggedIn);
    trigger.setAttribute('aria-label', '打开守护者账户菜单');
  }
  if (srLabel) srLabel.textContent = '打开守护者账户菜单';

  if (loggedIn && currentUser) {
    document.querySelectorAll('[data-menu-profile-name]').forEach((node) => {
      node.textContent = currentUser.displayName;
    });
    document.querySelectorAll('[data-menu-profile-username]').forEach((node) => {
      node.textContent = currentUser.username;
    });
    document.querySelectorAll('[data-menu-profile-role]').forEach((node) => {
      node.textContent = currentUser.rolePreference;
    });
    document.querySelectorAll('[data-menu-avatar]').forEach((node) => {
      node.textContent = getAccountAvatarText(currentUser);
    });
    if (footnote) footnote.textContent = '当前登录：localStorage 模拟账户';
    renderAccountMenuStats(currentUser.username);
  }
}

/** @deprecated use openAccountMenu */
function openUserDropdown() {
  openAccountMenu();
}

/** @deprecated use closeAccountMenu */
function closeUserDropdown() {
  closeAccountMenu();
}

function setupUserMenu() {
  const menu = document.querySelector('[data-user-menu]');
  if (!menu) return;
  const trigger = menu.querySelector('[data-user-menu-trigger]');
  const accountPanel = menu.querySelector('[data-account-menu]');
  const authModal = menu.querySelector('[data-auth-modal]');
  if (!trigger) return;

  trigger.addEventListener('click', (event) => {
    event.stopPropagation();
    toggleAccountMenu();
  });

  accountPanel?.addEventListener('click', (event) => {
    event.stopPropagation();
  });

  authModal?.addEventListener('click', (event) => {
    if (event.target === authModal) forceCloseAuthModal();
  });

  menu.querySelectorAll('[data-auth-modal-close]').forEach((node) => {
    node.addEventListener('click', () => forceCloseAuthModal());
  });

  menu.querySelectorAll('[data-account-menu-dismiss]').forEach((node) => {
    node.addEventListener('click', () => closeAccountMenu());
  });

  menu.querySelectorAll('[data-account-menu-info]').forEach((node) => {
    node.addEventListener('click', () => {
      showAccountMenuToast('可保存：打卡、证书、志愿、捐款与物种档案（仅本设备）。');
      closeAccountMenu();
    });
  });

  menu.querySelectorAll('[data-account-action]').forEach((node) => {
    node.addEventListener('click', (event) => {
      event.preventDefault();
      const view = node.dataset.accountAction === 'register' ? 'register' : 'login';
      openAuthModal(view);
    });
  });

  menu.querySelectorAll('[data-account-nav]').forEach((node) => {
    node.addEventListener('click', (event) => {
      const nav = node.dataset.accountNav;
      if (nav === 'settings' || nav === 'logout') {
        handleAccountMenuNav(event, nav);
      } else {
        closeAccountMenu();
      }
    });
  });

  const settingsModal = menu.querySelector('[data-account-settings-modal]');
  settingsModal?.addEventListener('click', (event) => {
    if (event.target === settingsModal) closeAccountSettingsModal();
  });
  menu.querySelectorAll('[data-account-settings-close]').forEach((node) => {
    node.addEventListener('click', () => closeAccountSettingsModal());
  });

  document.addEventListener('click', (event) => {
    if (!menu.contains(event.target)) closeAccountMenu();
  });

  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;
    forceCloseAuthModal();
    closeAccountSettingsModal();
    closeAccountMenu();
  });

  document.querySelectorAll('[data-open-user-menu]').forEach((node) => {
    node.addEventListener('click', (event) => {
      event.preventDefault();
      openAccountMenu();
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
    if (open) closeAccountMenu();
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
    if (typeof window.LANCUN_applyOceanExploreVideo === 'function') {
      window.LANCUN_applyOceanExploreVideo();
    }
    if (typeof window.LANCUN_homeGlobe?.applyMotion === 'function') {
      window.LANCUN_homeGlobe.applyMotion();
    }
    const status = form.querySelector('[data-display-prefs-status]');
    if (status) {
      status.textContent = '偏好已保存，返回首页即可看到效果。';
      status.className = 'status-message is-success';
    }
  });
}

function renderProfile() {
  const account = getAccount(); const loggedIn = isLoggedIn(); const actions = getActions(); const points = getPoints();
  const currentUser = authStorage()?.getCurrentUser?.() || null;
  const name = loggedIn ? account.displayName : '未登录守护者';
  const avatar = loggedIn ? getAccountAvatarText(currentUser || account) : '澜';
  const username = loggedIn ? account.username : null;
  let monthCheckins = 0;
  if (username && window.OceanActionCheckins) {
    window.OceanActionCheckins.migrateLegacyCheckins?.(username);
    monthCheckins = window.OceanActionCheckins.countMonthCheckins(username);
  } else if (username && window.LANCUN_actionCheckins) {
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

  renderAccountMenu();

  if (loggedIn) {
    forceCloseAuthModal();
  }

  if (document.body.dataset.page === 'profile') {
    renderProfilePage();
  }

  window.OceanActionCheckinUI?.renderCheckinPanel?.();
  window.OceanActionVolunteerUI?.renderMissionBoard?.();
  window.OceanActionDonationUI?.renderSupportHarbor?.();
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
  if (view === 'login') resetRegisterStep(1);
  clearAuthStatus();
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
  const authRoot = getAuthModalRoot() || document;

  document.querySelectorAll('[data-auth-tab]').forEach((tab) => {
    tab.addEventListener('click', () => showAuthView(tab.dataset.authTab, tab.closest('[data-auth-modal-panel]') || authRoot));
  });

  document.querySelectorAll('[data-auth-switch]').forEach((node) => {
    node.addEventListener('click', () => {
      const view = node.dataset.authSwitch;
      showAuthView(view, getAuthModalRoot() || document);
      focusAuthFirstInput();
    });
  });

  document.querySelectorAll('[data-auth-guest-dismiss]').forEach((node) => {
    node.addEventListener('click', () => forceCloseAuthModal());
  });

  document.querySelectorAll('[data-register-next]').forEach((button) => {
    button.addEventListener('click', () => {
      const form = button.closest('[data-register-form]');
      if (!form) return;
      const step = getRegisterStep();
      if (!validateRegisterStep(step, form)) return;
      if (step === 2) fillRegisterSummary();
      if (step < 3) setRegisterStep(step + 1);
      focusAuthFirstInput();
    });
  });

  document.querySelectorAll('[data-register-back]').forEach((button) => {
    button.addEventListener('click', () => {
      const step = getRegisterStep();
      if (step > 1) setRegisterStep(step - 1);
      focusAuthFirstInput();
    });
  });

  document.querySelectorAll('[data-register-form]').forEach((register) => {
    register.addEventListener('submit', (event) => {
      event.preventDefault();
      if (getRegisterStep() !== 3) return;
      clearFormErrors(register);
      if (!validateRegisterAll(register)) {
        if (!validateRegisterStep(1, register)) setRegisterStep(1);
        else if (!validateRegisterStep(2, register)) setRegisterStep(2);
        return;
      }
      fillRegisterSummary();
      const fields = register.elements;
      const result = authStorage()?.registerUser?.({
        username: fields.username.value.trim(),
        password: fields.password.value,
        displayName: fields.displayName.value.trim(),
        rolePreference: fields.role.value,
        email: fields.email.value.trim(),
      });
      const status = register.querySelector('[data-register-result]');
      if (!result?.ok) {
        if (result?.field && fields[result.field]) {
          setFieldError(fields[result.field], result.error || '注册失败，请检查表单。');
          if (result.field === 'username' || result.field === 'password' || result.field === 'confirmPassword') {
            setRegisterStep(1);
          } else if (result.field === 'displayName' || result.field === 'email') {
            setRegisterStep(2);
          }
        } else if (status) {
          status.textContent = result?.error || '注册失败，请稍后再试。';
          status.className = 'auth-modal__status';
        }
        return;
      }
      const displayName = result.user?.displayName || fields.displayName.value.trim();
      showAuthSuccess(
        status,
        `欢迎加入，${displayName}\n你的守护者账户已经创建。`,
        () => renderProfile(),
      );
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
      invalid = setFieldError(fields.password, !password ? '请输入密码。' : password.length < 6 ? '密码至少需要 6 位。' : '') || invalid;
      if (invalid) return;

      const result = authStorage()?.loginUser?.(username, password);
      const status = login.querySelector('[data-login-result]');
      if (!result?.ok) {
        if (result?.field === 'username') setFieldError(fields.username, result.error);
        else if (result?.field === 'password') setFieldError(fields.password, result.error);
        else if (status) {
          status.textContent = result?.error || '登录失败，请稍后再试。';
          status.className = 'auth-modal__status';
        }
        return;
      }

      showAuthSuccess(status, '登录成功。', () => renderProfile());
    });
  });

  document.querySelectorAll('[data-logout]').forEach((button) => {
    button.addEventListener('click', () => {
      authStorage()?.logoutUser?.();
      renderProfile();
      showAuthView('login');
      closeAccountMenu();
      showAccountMenuToast('已退出守护者账户。');
    });
  });

  document.querySelectorAll('[data-profile-clear]').forEach((button) => {
    button.addEventListener('click', () => {
      if (!window.confirm('确定清除本地账户、积分与全部行动记录吗？此操作不可恢复。')) return;
      Object.values(storageKeys).forEach((key) => localStorage.removeItem(key));
      authStorage()?.clearAllAuthData?.();
      renderProfile();
      showAuthView('register');
    });
  });
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
  setupUserMenu();
  setupAuth();
  renderProfile();
  setupProfileDashboard();
  setupDashboard();
  handleAccountMenuDeepLink();
});

window.addEventListener('hashchange', () => handleAccountMenuDeepLink());

window.renderProfile = renderProfile;
