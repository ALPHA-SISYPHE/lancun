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

function getAccountAvatarText(user) {
  if (!user) return '澜';
  if (user.avatarType === 'wave') return '~';
  return user.avatarText || user.username?.slice(0, 1) || '澜';
}

function validateRegisterAll(form) {
  const fields = form.elements;
  clearFormErrors(form);
  let invalid = false;
  const username = fields.username.value.trim();
  const password = fields.password.value;
  const confirmation = fields.confirmPassword.value;
  invalid = setFieldError(fields.username, username.length < 2 || username.length > 16 ? '用户名应为 2–16 个字符。' : '') || invalid;
  if (!invalid && authStorage()?.isUsernameTaken?.(username)) {
    invalid = setFieldError(fields.username, '该用户名已被使用。') || invalid;
  }
  invalid = setFieldError(fields.password, !password ? '请输入密码。' : password.length < 6 ? '密码至少需要 6 位。' : '') || invalid;
  invalid = setFieldError(fields.confirmPassword, password !== confirmation ? '两次输入的密码不一致。' : '') || invalid;
  return !invalid;
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

function openAuthModal(view = 'login') {
  const overlay = document.querySelector('[data-auth-modal]');
  const panel = getAuthModalRoot();
  if (!overlay || !panel) return;
  closeAccountMenu();
  clearAuthForms();
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

function handleAccountMenuNav(event, nav) {
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
      node.textContent = currentUser.username;
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
      if (nav === 'logout') {
        handleAccountMenuNav(event, nav);
      } else {
        closeAccountMenu();
      }
    });
  });

  document.addEventListener('click', (event) => {
    if (!menu.contains(event.target)) closeAccountMenu();
  });

  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;
    forceCloseAuthModal();
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
  if (document.body.dataset.page !== 'home') return;

  const header = document.querySelector('[data-site-header]');
  const hero = document.querySelector('#hero-intro');
  if (!header || !hero || typeof IntersectionObserver === 'undefined') return;

  const syncHeader = (isHeroVisible) => {
    header.classList.toggle('site-header--scrolled', !isHeroVisible);
  };

  const observer = new IntersectionObserver(
    (entries) => {
      const entry = entries[0];
      if (!entry) return;
      syncHeader(entry.isIntersecting);
    },
    { threshold: 0, rootMargin: '0px' },
  );

  observer.observe(hero);
}

function setupDisplayPrefs() {
  const form = document.querySelector('[data-display-prefs-form]');
  if (!form || document.body.dataset.page !== 'profile') return;
  const account = getAccount();
  const preferences = getProfileUserPreferences(account);
  syncDisplayPreferenceForm(form, preferences);
  applyProfilePreferences(preferences);

  form.addEventListener('change', () => {
    const next = {
      videoBackground: Boolean(form.elements.videoBackground?.checked),
      backgroundAudio: Boolean(form.elements.backgroundAudio?.checked),
      reduceMotion: Boolean(form.elements.reduceMotion?.checked),
      theme: form.elements.theme?.value || 'deep',
      fontSize: form.elements.fontSize?.value || 'standard',
      globeSpeed: form.elements.globeSpeed?.value || 'normal',
    };
    saveProfileUserPreferences(getAccount(), next);
    applyProfilePreferences(next);
    window.LANCUN_applyAmbientAudio?.();
    const status = form.querySelector('[data-display-prefs-status]');
    if (status) {
      status.textContent = '显示偏好已保存到当前浏览器。';
      status.className = 'status-message is-success';
    }
  });
}

function renderProfile() {
  const account = getAccount(); const loggedIn = isLoggedIn(); const actions = getActions(); const points = getPoints();
  const profile = loggedIn ? getProfileUserProfile(account) : null;
  const name = loggedIn ? account.username : '未登录守护者';
  const avatar = loggedIn ? profile.avatarText : '澜';
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
  document.querySelectorAll('[data-profile-role]').forEach((node) => { node.textContent = loggedIn ? profile.role : '请先登录'; });
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

function setProfileDashboardActive(viewId) {
  document.querySelectorAll('[data-dashboard-nav]').forEach((item) => {
    const active = item.dataset.dashboardNav === viewId;
    item.classList.toggle('is-active', active);
    item.toggleAttribute('aria-current', active);
  });
  document.querySelectorAll('[data-dashboard-view]').forEach((panel) => {
    panel.classList.toggle('is-active', panel.dataset.dashboardView === viewId);
  });
  document.querySelectorAll('[data-dashboard-select]').forEach((select) => {
    select.value = viewId;
  });
}

function showDashboardView(viewId, options = {}) {
  const { scroll = true, focus = false } = options;
  setProfileDashboardActive(viewId);
  if (!scroll) return;

  const target = document.querySelector(`[data-dashboard-view="${viewId}"]`);
  const scrollRoot = document.querySelector('[data-profile-scroll-root]');
  if (!target || !scrollRoot) return;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    || document.body.dataset.profileReducedMotion === 'true';
  const behavior = reducedMotion ? 'auto' : 'smooth';
  const mobileLayout = window.matchMedia('(max-width: 58rem)').matches;

  if (mobileLayout) {
    target.scrollIntoView({ behavior, block: 'start' });
  } else {
    scrollRoot.dataset.profileScrollTarget = viewId;
    scrollRoot.scrollTo({
      top: Math.max(0, target.offsetTop - 18),
      behavior,
    });
    window.setTimeout(() => {
      if (scrollRoot.dataset.profileScrollTarget === viewId) {
        delete scrollRoot.dataset.profileScrollTarget;
        setProfileDashboardActive(viewId);
      }
    }, reducedMotion ? 0 : 650);
  }

  if (focus) {
    target.tabIndex = -1;
    target.focus({ preventScroll: true });
  }
}

function setupProfileScrollLayout() {
  if (!isProfilePage() || typeof ResizeObserver !== 'function') return;
  const sidebar = document.querySelector('.profile-sidebar');
  const scrollRoot = document.querySelector('[data-profile-scroll-root]');
  if (!sidebar || !scrollRoot) return;
  const compactLayout = window.matchMedia('(max-width: 58rem)');
  const sections = [...scrollRoot.querySelectorAll('[data-dashboard-view]')];

  const syncHeight = () => {
    if (compactLayout.matches) {
      scrollRoot.style.removeProperty('--profile-scroll-height');
      return;
    }
    scrollRoot.style.setProperty('--profile-scroll-height', `${Math.ceil(sidebar.getBoundingClientRect().height)}px`);
  };

  const syncActiveSection = () => {
    if (compactLayout.matches || scrollRoot.dataset.profileScrollTarget) return;
    const rootTop = scrollRoot.getBoundingClientRect().top;
    const nearest = sections.reduce((current, section) => {
      const distance = Math.abs(section.getBoundingClientRect().top - rootTop - 22);
      return !current || distance < current.distance ? { section, distance } : current;
    }, null);
    if (nearest?.section) setProfileDashboardActive(nearest.section.dataset.dashboardView);
  };

  const resizeObserver = new ResizeObserver(syncHeight);
  resizeObserver.observe(sidebar);
  scrollRoot.addEventListener('scroll', () => window.requestAnimationFrame(syncActiveSection), { passive: true });
  compactLayout.addEventListener?.('change', syncHeight);
  syncHeight();
}

function renderProfileDashboard() {
  const account = getAccount();
  const profile = getProfileUserProfile(account);

  const username = document.querySelector('[data-profile-username]');
  const email = document.querySelector('[data-profile-email]');
  const created = document.querySelector('[data-profile-created]');
  if (username) username.textContent = account?.username || '—';
  if (email) email.textContent = profile.email || '未填写';
  if (created && account?.createdAt) created.textContent = formatActionDate(account.createdAt);

  renderCalendar('[data-profile-calendar]');
  renderProfileOverview(account);
  renderProfileRecords(account);
  renderProfileAchievements(account);
  renderProfileSettings(account);
  renderProfileDataManagement(account);
  renderProfileSecurity(account);
}

function readProfileStorage(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

const PROFILE_DATA_KEYS = {
  profile: 'ocean-user-profile',
  preferences: 'ocean-user-preferences',
  checkinsPrefix: 'ocean-action-checkins.',
  badgesPrefix: 'ocean-action-badges.',
  volunteers: 'ocean-action-volunteer-registrations',
  donations: 'ocean-action-donations',
};

function getProfileStorageMap(key) {
  const value = readProfileStorage(key, {});
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
}

function getProfileUserProfile(account) {
  const username = String(account?.username || '').trim();
  const stored = username ? getProfileStorageMap(PROFILE_DATA_KEYS.profile)[username] : null;
  const allowedRoles = ['公益守护者', '学生观察员', '海洋志愿者', '数据记录者'];
  const candidateRole = String(stored?.role || account?.rolePreference || account?.role || '');
  return {
    role: allowedRoles.includes(candidateRole) ? candidateRole : '公益守护者',
    motto: String(stored?.motto || ''),
    avatarText: String(stored?.avatarText || getAccountAvatarText(account || {})).slice(0, 1) || '澜',
    email: String(stored?.email ?? account?.email ?? ''),
  };
}

function saveProfileUserProfile(account, next) {
  const username = String(account?.username || '').trim();
  if (!username) return null;
  const profiles = getProfileStorageMap(PROFILE_DATA_KEYS.profile);
  const payload = {
    role: String(next?.role || '公益守护者'),
    motto: String(next?.motto || '').trim().slice(0, 120),
    avatarText: String(next?.avatarText || '').trim().slice(0, 1) || username.slice(0, 1),
    email: String(next?.email || '').trim().slice(0, 120),
    updatedAt: new Date().toISOString(),
  };
  profiles[username] = payload;
  localStorage.setItem(PROFILE_DATA_KEYS.profile, JSON.stringify(profiles));
  authStorage()?.updateCurrentUserProfile?.({
    rolePreference: payload.role,
    email: payload.email,
    avatarText: payload.avatarText,
  });
  return payload;
}

function getProfileUserPreferences(account) {
  const username = String(account?.username || '').trim();
  const stored = username ? getProfileStorageMap(PROFILE_DATA_KEYS.preferences)[username] : null;
  const legacy = typeof window.LANCUN_getPrefs === 'function' ? window.LANCUN_getPrefs() : {};
  return {
    videoBackground: stored?.videoBackground ?? legacy.videoBackground ?? true,
    backgroundAudio: stored?.backgroundAudio ?? legacy.backgroundAudio ?? true,
    reduceMotion: stored?.reduceMotion ?? legacy.reduceMotion ?? false,
    theme: stored?.theme === 'frost' ? 'frost' : 'deep',
    fontSize: stored?.fontSize === 'large' ? 'large' : 'standard',
    globeSpeed: ['slow', 'normal', 'off'].includes(stored?.globeSpeed) ? stored.globeSpeed : 'normal',
  };
}

function saveProfileUserPreferences(account, next) {
  const username = String(account?.username || '').trim();
  if (!username) return null;
  const preferences = getProfileStorageMap(PROFILE_DATA_KEYS.preferences);
  const payload = {
    videoBackground: next?.videoBackground !== false,
    backgroundAudio: next?.backgroundAudio !== false,
    reduceMotion: Boolean(next?.reduceMotion),
    theme: next?.theme === 'frost' ? 'frost' : 'deep',
    fontSize: next?.fontSize === 'large' ? 'large' : 'standard',
    globeSpeed: ['slow', 'normal', 'off'].includes(next?.globeSpeed) ? next.globeSpeed : 'normal',
    updatedAt: new Date().toISOString(),
  };
  preferences[username] = payload;
  localStorage.setItem(PROFILE_DATA_KEYS.preferences, JSON.stringify(preferences));
  if (typeof window.LANCUN_setPrefs === 'function') {
    window.LANCUN_setPrefs({
      videoBackground: payload.videoBackground,
      backgroundAudio: payload.backgroundAudio,
      reduceMotion: payload.reduceMotion,
    });
  }
  return payload;
}

function syncDisplayPreferenceForm(form, preferences) {
  if (!form) return;
  if (form.elements.videoBackground) form.elements.videoBackground.checked = preferences.videoBackground;
  if (form.elements.backgroundAudio) form.elements.backgroundAudio.checked = preferences.backgroundAudio;
  if (form.elements.reduceMotion) form.elements.reduceMotion.checked = preferences.reduceMotion;
  if (form.elements.theme) form.elements.theme.value = preferences.theme;
  if (form.elements.fontSize) form.elements.fontSize.value = preferences.fontSize;
  if (form.elements.globeSpeed) form.elements.globeSpeed.value = preferences.globeSpeed;
}

function applyProfilePreferences(preferences) {
  if (document.body.dataset.page !== 'profile') return;
  document.body.dataset.profileTheme = preferences.theme;
  document.body.dataset.profileFont = preferences.fontSize;
  document.body.dataset.profileGlobeSpeed = preferences.globeSpeed;
  document.body.dataset.profileReducedMotion = String(preferences.reduceMotion);
  const video = document.querySelector('.page-bg-video__media');
  if (video) {
    video.classList.toggle('is-preference-disabled', !preferences.videoBackground);
    if (!preferences.videoBackground) video.pause();
    else video.play?.().catch(() => {});
  }
}

function renderProfileSettings(account) {
  const profile = getProfileUserProfile(account);
  const preferences = getProfileUserPreferences(account);
  const form = document.querySelector('[data-profile-settings-form]');
  if (form) {
    form.elements.role.value = profile.role;
    form.elements.motto.value = profile.motto;
    form.elements.avatarText.value = profile.avatarText;
    form.elements.email.value = profile.email;
  }
  document.querySelectorAll('[data-profile-preview-avatar]').forEach((node) => { node.textContent = profile.avatarText; });
  document.querySelectorAll('[data-profile-preview-name]').forEach((node) => { node.textContent = account.username; });
  document.querySelectorAll('[data-profile-preview-role]').forEach((node) => { node.textContent = profile.role; });
  document.querySelectorAll('[data-profile-preview-motto]').forEach((node) => {
    node.textContent = profile.motto ? `“${profile.motto}”` : '“守护海洋，从每一次微小行动开始。”';
  });
  syncDisplayPreferenceForm(document.querySelector('[data-display-prefs-form]'), preferences);
  applyProfilePreferences(preferences);
}

function createProfileDataSummary(label, value) {
  const card = document.createElement('article');
  card.className = 'data-summary-card';
  const count = document.createElement('strong');
  count.textContent = String(value);
  const title = document.createElement('span');
  title.textContent = label;
  card.append(count, title);
  return card;
}

function renderProfileDataManagement(account) {
  const container = document.querySelector('[data-profile-data-summary]');
  if (!container) return;
  const data = getProfileOverviewData(account);
  const profileMap = getProfileStorageMap(PROFILE_DATA_KEYS.profile);
  const preferencesMap = getProfileStorageMap(PROFILE_DATA_KEYS.preferences);
  const username = String(account?.username || '').trim();
  const badgeStore = readProfileStorage(`${PROFILE_DATA_KEYS.badgesPrefix}${username}`, { unlockedIds: [] });
  container.replaceChildren(
    createProfileDataSummary('打卡记录', data.checkins.length),
    createProfileDataSummary('已获勋章', Array.isArray(badgeStore?.unlockedIds) ? badgeStore.unlockedIds.length : 0),
    createProfileDataSummary('志愿报名', data.volunteers.length),
    createProfileDataSummary('公益支持', data.donations.length),
    createProfileDataSummary('个人资料', profileMap[username] ? '已保存' : '默认'),
    createProfileDataSummary('显示偏好', preferencesMap[username] ? '已保存' : '默认'),
  );
}

function createProfileSecurityInfo(label, value, detail, tone = '') {
  const card = document.createElement('article');
  card.className = `security-info-card${tone ? ` is-${tone}` : ''}`;
  const labelNode = document.createElement('span');
  labelNode.textContent = label;
  const valueNode = document.createElement('strong');
  valueNode.textContent = value;
  const detailNode = document.createElement('p');
  detailNode.textContent = detail;
  card.append(labelNode, valueNode, detailNode);
  return card;
}

function renderProfileSecurity(account) {
  const container = document.querySelector('[data-profile-security-info]');
  if (!container) return;
  const profile = getProfileUserProfile(account);
  container.replaceChildren(
    createProfileSecurityInfo('当前身份', account.username, profile.role, 'identity'),
    createProfileSecurityInfo('本地登录状态', '已在当前浏览器启用本地身份', '只用于本项目的页面展示与交互模拟。', 'active'),
    createProfileSecurityInfo('数据保存位置', 'localStorage', '数据不会上传到服务器，也不会跨浏览器同步。'),
    createProfileSecurityInfo('隐私说明', '不上传服务器', '不产生真实报名、支付或公益交易。'),
  );
}

function clearProfileLocalIdentity(account) {
  const username = String(account?.username || '').trim();
  if (!username) return false;

  [PROFILE_DATA_KEYS.profile, PROFILE_DATA_KEYS.preferences].forEach((key) => {
    const map = getProfileStorageMap(key);
    delete map[username];
    localStorage.setItem(key, JSON.stringify(map));
  });

  const storage = authStorage();
  const users = storage?.getUsers?.();
  if (Array.isArray(users) && typeof storage?.saveUsers === 'function') {
    storage.saveUsers(users.filter((user) => String(user?.username || '').toLowerCase() !== username.toLowerCase()));
  }
  storage?.clearCurrentUser?.();
  return true;
}

function buildProfileExport(account) {
  const username = String(account?.username || '').trim();
  const data = getProfileOverviewData(account);
  const profileMap = getProfileStorageMap(PROFILE_DATA_KEYS.profile);
  const preferencesMap = getProfileStorageMap(PROFILE_DATA_KEYS.preferences);
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    username,
    data: {
      'ocean-action-checkins': data.checkins,
      'ocean-action-badges': readProfileStorage(`${PROFILE_DATA_KEYS.badgesPrefix}${username}`, { unlockedIds: [], unlockedAt: {} }),
      'ocean-action-volunteer-registrations': data.volunteers,
      'ocean-action-donations': data.donations,
      'ocean-user-profile': profileMap[username] || {},
      'ocean-user-preferences': preferencesMap[username] || {},
    },
  };
}

function downloadProfileExport(account) {
  const payload = buildProfileExport(account);
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `ocean-guardian-${payload.username || 'archive'}-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

function isProfileImportValid(payload, username) {
  if (!payload || payload.version !== 1 || payload.username !== username || !payload.data || typeof payload.data !== 'object') return false;
  const data = payload.data;
  if (!Array.isArray(data['ocean-action-checkins'])
    || !Array.isArray(data['ocean-action-volunteer-registrations'])
    || !Array.isArray(data['ocean-action-donations'])) return false;
  const badges = data['ocean-action-badges'];
  if (badges !== undefined && (!badges || typeof badges !== 'object' || Array.isArray(badges)
    || (badges.unlockedIds !== undefined && !Array.isArray(badges.unlockedIds))
    || (badges.unlockedAt !== undefined && (!badges.unlockedAt || typeof badges.unlockedAt !== 'object' || Array.isArray(badges.unlockedAt))))) return false;
  if (!data['ocean-action-checkins'].every((item) => item && typeof item === 'object' && typeof item.date === 'string')) return false;
  return data['ocean-action-volunteer-registrations'].every((item) => item && typeof item === 'object' && (!item.username || item.username === username))
    && data['ocean-action-donations'].every((item) => item && typeof item === 'object' && (!item.username || item.username === username));
}

function importProfileArchive(account, payload) {
  const username = String(account?.username || '').trim();
  if (!isProfileImportValid(payload, username)) return false;
  const data = payload.data;
  localStorage.setItem(`${PROFILE_DATA_KEYS.checkinsPrefix}${username}`, JSON.stringify(data['ocean-action-checkins']));
  localStorage.setItem(`${PROFILE_DATA_KEYS.badgesPrefix}${username}`, JSON.stringify(data['ocean-action-badges'] || { unlockedIds: [], unlockedAt: {} }));

  const volunteerStore = readProfileStorage(PROFILE_DATA_KEYS.volunteers, []);
  const donationStore = readProfileStorage(PROFILE_DATA_KEYS.donations, []);
  localStorage.setItem(PROFILE_DATA_KEYS.volunteers, JSON.stringify([
    ...(Array.isArray(volunteerStore) ? volunteerStore.filter((item) => item?.username !== username) : []),
    ...data['ocean-action-volunteer-registrations'].map((item) => ({ ...item, username })),
  ]));
  localStorage.setItem(PROFILE_DATA_KEYS.donations, JSON.stringify([
    ...(Array.isArray(donationStore) ? donationStore.filter((item) => item?.username !== username) : []),
    ...data['ocean-action-donations'].map((item) => ({ ...item, username })),
  ]));

  saveProfileUserProfile(account, data['ocean-user-profile']);
  saveProfileUserPreferences(account, data['ocean-user-preferences']);
  return true;
}

function clearProfileArchiveData(account, section) {
  const username = String(account?.username || '').trim();
  if (!username) return;
  if (section === 'checkins' || section === 'all') {
    localStorage.removeItem(`${PROFILE_DATA_KEYS.checkinsPrefix}${username}`);
    localStorage.removeItem(`${PROFILE_DATA_KEYS.badgesPrefix}${username}`);
  }
  if (section === 'volunteers' || section === 'all') {
    const records = readProfileStorage(PROFILE_DATA_KEYS.volunteers, []);
    localStorage.setItem(PROFILE_DATA_KEYS.volunteers, JSON.stringify(
      Array.isArray(records) ? records.filter((item) => item?.username !== username) : [],
    ));
  }
  if (section === 'donations' || section === 'all') {
    const records = readProfileStorage(PROFILE_DATA_KEYS.donations, []);
    localStorage.setItem(PROFILE_DATA_KEYS.donations, JSON.stringify(
      Array.isArray(records) ? records.filter((item) => item?.username !== username) : [],
    ));
  }
  if (section === 'all') {
    const profiles = getProfileStorageMap(PROFILE_DATA_KEYS.profile);
    const preferences = getProfileStorageMap(PROFILE_DATA_KEYS.preferences);
    delete profiles[username];
    delete preferences[username];
    localStorage.setItem(PROFILE_DATA_KEYS.profile, JSON.stringify(profiles));
    localStorage.setItem(PROFILE_DATA_KEYS.preferences, JSON.stringify(preferences));
  }
}

function setupProfileSettings() {
  if (document.body.dataset.page !== 'profile') return;
  const form = document.querySelector('[data-profile-settings-form]');
  if (!form) return;
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const account = getAccount();
    const username = String(account?.username || '').trim();
    saveProfileUserProfile(account, {
      role: form.elements.role?.value,
      motto: form.elements.motto?.value,
      avatarText: form.elements.avatarText?.value || username.slice(0, 1),
      email: form.elements.email?.value,
    });
    renderProfile();
    const status = document.querySelector('[data-profile-settings-status]');
    if (status) {
      status.textContent = '个人资料已保存到当前浏览器。';
      status.className = 'status-message is-success';
    }
  });
}

function setProfileDataStatus(message, tone = '') {
  const status = document.querySelector('[data-profile-data-status]');
  if (!status) return;
  status.textContent = message;
  status.className = tone ? `status-message is-${tone}` : 'status-message';
}

function setupProfileDataManagement() {
  if (document.body.dataset.page !== 'profile') return;
  const exportButton = document.querySelector('[data-profile-data-export]');
  const importButton = document.querySelector('[data-profile-data-import]');
  const fileInput = document.querySelector('[data-profile-data-file]');
  exportButton?.addEventListener('click', () => {
    downloadProfileExport(getAccount());
    setProfileDataStatus('已导出当前用户的本地档案数据。', 'success');
  });
  importButton?.addEventListener('click', () => fileInput?.click());
  fileInput?.addEventListener('change', async () => {
    const file = fileInput.files?.[0];
    if (!file) return;
    try {
      const payload = JSON.parse(await file.text());
      if (!isProfileImportValid(payload, String(getAccount()?.username || '').trim())) {
        setProfileDataStatus('导入文件无效，或不属于当前登录用户。', 'warning');
        return;
      }
      if (!window.confirm('导入会覆盖当前用户已有的档案数据。确定继续吗？')) return;
      if (!importProfileArchive(getAccount(), payload)) {
        setProfileDataStatus('导入失败，请检查文件内容。', 'warning');
        return;
      }
      renderProfile();
      setProfileDataStatus('本地档案数据已导入。', 'success');
    } catch {
      setProfileDataStatus('无法读取 JSON 文件，请选择有效的导出档案。', 'warning');
    } finally {
      fileInput.value = '';
    }
  });
  document.querySelectorAll('[data-profile-data-clear]').forEach((button) => {
    button.addEventListener('click', () => {
      const section = button.dataset.profileDataClear;
      const labels = {
        checkins: '清空当前用户的打卡记录与勋章',
        volunteers: '清空当前用户的报名记录',
        donations: '清空当前用户的公益支持记录',
        all: '清空当前用户的全部本地档案数据（不会删除登录账户）',
      };
      if (!window.confirm(`确定${labels[section] || '执行此操作'}吗？此操作不可恢复。`)) return;
      clearProfileArchiveData(getAccount(), section);
      renderProfile();
      setProfileDataStatus('本地档案数据已清理。', 'success');
    });
  });
}

function setupProfileSecurity() {
  if (document.body.dataset.page !== 'profile') return;
  document.querySelector('[data-profile-security-data]')?.addEventListener('click', () => {
    showDashboardView('data');
  });
}

function getProfileOverviewData(account) {
  const username = String(account?.username || '').trim();
  const checkins = username
    ? readProfileStorage(`ocean-action-checkins.${username}`, [])
    : [];
  const badgeStore = username
    ? readProfileStorage(`ocean-action-badges.${username}`, { unlockedIds: [] })
    : { unlockedIds: [] };
  const volunteerStore = readProfileStorage('ocean-action-volunteer-registrations', []);
  const donationStore = readProfileStorage('ocean-action-donations', []);
  const safeCheckins = Array.isArray(checkins) ? checkins : [];
  const safeBadges = Array.isArray(badgeStore?.unlockedIds) ? badgeStore.unlockedIds : [];
  const volunteers = Array.isArray(volunteerStore)
    ? volunteerStore.filter((item) => item?.username === username)
    : [];
  const donations = Array.isArray(donationStore)
    ? donationStore.filter((item) => item?.username === username)
    : [];
  const now = new Date();
  const monthCheckins = safeCheckins.filter((item) => {
    const date = new Date(`${item?.date || ''}T00:00:00`);
    return !Number.isNaN(date.valueOf())
      && date.getFullYear() === now.getFullYear()
      && date.getMonth() === now.getMonth();
  });

  return {
    username,
    checkins: safeCheckins,
    badges: safeBadges,
    badgeUnlocks: badgeStore?.unlockedAt && typeof badgeStore.unlockedAt === 'object'
      ? badgeStore.unlockedAt
      : {},
    volunteers,
    donations,
    monthCheckins,
    points: getPoints(),
  };
}

function getProfileLevel(badgeIds) {
  const ranks = [
    ['streak-30', '蓝色星球守望者'],
    ['streak-14', '海岸行动者'],
    ['streak-7', '珊瑚之友'],
    ['streak-5', '蓝色守护者'],
    ['streak-3', '潮汐初心者'],
  ];
  return ranks.find(([id]) => badgeIds.includes(id))?.[1] || '潮汐初心者';
}

function profileActivityDate(item, fallbackDate = '') {
  const candidate = item?.createdAt || item?.registeredAt || item?.donatedAt || fallbackDate;
  const date = new Date(candidate);
  return Number.isNaN(date.valueOf()) ? null : date;
}

function renderProfileOverview(account) {
  const root = document.querySelector('[data-dashboard-view="overview"]');
  if (!root) return;

  const data = getProfileOverviewData(account);
  const totalActions = data.checkins.length + data.volunteers.length + data.donations.length;
  const stats = {
    points: data.points,
    actions: totalActions,
    checkins: data.monthCheckins.length,
    volunteers: data.volunteers.length,
    support: data.donations.length,
    badges: data.badges.length,
  };

  Object.entries(stats).forEach(([key, value]) => {
    const selector = key === 'volunteers' || key === 'support' || key === 'badges'
      ? `[data-overview-stat="${key}"]`
      : `[data-stat="${key}"]`;
    root.querySelectorAll(selector).forEach((node) => { node.textContent = String(value); });
  });

  const level = root.querySelector('[data-overview-level]');
  if (level) level.textContent = getProfileLevel(data.badges);

  const metricsHint = root.querySelector('[data-overview-metrics-hint]');
  if (metricsHint) metricsHint.hidden = totalActions > 0;

  renderProfileActivityTimeline(root.querySelector('[data-overview-activity-timeline]'), data);
  renderProfileNextSteps(root.querySelector('[data-overview-next-steps]'), data);
}

function renderProfileActivityTimeline(container, data) {
  if (!container) return;
  const activities = [
    ...data.checkins.map((item) => ({
      type: '每日环保打卡',
      detail: item?.description || item?.actionType || '完成一次海洋守护行动',
      date: profileActivityDate(item, item?.date),
      tone: 'checkin',
    })),
    ...data.volunteers.map((item) => ({
      type: '志愿报名',
      detail: item?.activityTitle || item?.projectTitle || '提交志愿活动报名',
      date: profileActivityDate(item),
      tone: 'volunteer',
    })),
    ...data.donations.map((item) => ({
      type: '公益支持',
      detail: item?.projectTitle || item?.projectName || '支持海洋公益项目',
      date: profileActivityDate(item),
      tone: 'support',
    })),
  ].filter((item) => item.date).sort((a, b) => b.date - a.date).slice(0, 5);

  container.replaceChildren();
  if (!activities.length) {
    const empty = document.createElement('div');
    empty.className = 'profile-activity-empty';
    const title = document.createElement('h3');
    title.textContent = '你还没有留下行动记录。';
    const text = document.createElement('p');
    text.textContent = '去行动中心完成一次环保打卡，开启你的海洋守护档案。';
    const link = document.createElement('a');
    link.className = 'button button-primary';
    link.href = 'action.html';
    link.textContent = '前往行动中心';
    empty.append(title, text, link);
    container.append(empty);
    return;
  }

  activities.forEach((item) => {
    const row = document.createElement('article');
    row.className = `activity-timeline__item is-${item.tone}`;
    const marker = document.createElement('span');
    marker.className = 'activity-timeline__marker';
    marker.setAttribute('aria-hidden', 'true');
    const copy = document.createElement('div');
    const type = document.createElement('strong');
    type.textContent = item.type;
    const detail = document.createElement('p');
    detail.textContent = item.detail;
    const date = document.createElement('time');
    date.dateTime = item.date.toISOString();
    date.textContent = formatActionDate(item.date.toISOString());
    copy.append(type, detail, date);
    row.append(marker, copy);
    container.append(row);
  });
}

function renderProfileNextSteps(container, data) {
  if (!container) return;
  const steps = [
    {
      title: data.checkins.length ? '延续每日守护' : '今天完成一次环保打卡',
      description: data.checkins.length ? '保持节奏，让连续行动成为新的潮汐。' : '从一次简单打卡开始留下海洋守护足迹。',
      complete: data.checkins.length > 0,
    },
    {
      title: data.volunteers.length ? '继续关注志愿活动' : '浏览一个志愿活动',
      description: data.volunteers.length ? '你的报名记录已经归入守护档案。' : '选择一项海岸或科普任务，迈出参与的一步。',
      complete: data.volunteers.length > 0,
    },
    {
      title: data.donations.length ? '持续关注公益项目' : '了解一个公益支持项目',
      description: data.donations.length ? '你的支持记录已沉淀在本地档案中。' : '了解项目方向，再决定如何表达支持。',
      complete: data.donations.length > 0,
    },
    {
      title: data.badges.length ? '解锁下一枚勋章' : '连续打卡 3 天解锁第一枚勋章',
      description: data.badges.length ? '保持连续行动，下一段守护荣誉正在等待。' : '连续三天完成环保打卡，即可解锁「潮汐初心者」。',
      complete: data.badges.length > 0,
    },
  ];

  container.replaceChildren();
  steps.forEach((step) => {
    const card = document.createElement('article');
    card.className = `next-step-card${step.complete ? ' is-complete' : ''}`;
    const status = document.createElement('span');
    status.className = 'next-step-card__status';
    status.textContent = step.complete ? '已建立' : '下一步';
    const title = document.createElement('h3');
    title.textContent = step.title;
    const copy = document.createElement('p');
    copy.textContent = step.description;
    const link = document.createElement('a');
    link.href = 'action.html';
    link.textContent = step.complete ? '前往行动中心' : '开始行动';
    card.append(status, title, copy, link);
    container.append(card);
  });
}

let profileActionFilter = 'all';

function getProfileRecordDate(record) {
  return profileActivityDate(record, record?.date) || new Date(0);
}

function isProfileCertificateRecord(record) {
  return Boolean(record?.certificate || record?.certificateSaved || record?.certificateId);
}

function getMonday(date) {
  const copy = new Date(date);
  const day = copy.getDay() || 7;
  copy.setHours(0, 0, 0, 0);
  copy.setDate(copy.getDate() - day + 1);
  return copy;
}

function filterProfileCheckins(checkins) {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const weekStart = getMonday(now);
  return checkins.filter((record) => {
    const date = getProfileRecordDate(record);
    if (profileActionFilter === 'month') return date >= monthStart;
    if (profileActionFilter === 'week') return date >= weekStart;
    if (profileActionFilter === 'certificate') return isProfileCertificateRecord(record);
    return true;
  });
}

function createProfileRecordEmpty(title, description) {
  const empty = document.createElement('article');
  empty.className = 'profile-record-empty profile-card';
  const heading = document.createElement('h3');
  heading.textContent = title;
  const text = document.createElement('p');
  text.textContent = description;
  const link = document.createElement('a');
  link.className = 'button button-primary';
  link.href = 'action.html';
  link.textContent = '前往行动中心';
  empty.append(heading, text, link);
  return empty;
}

function createProfileRecordMeta(label, value) {
  const item = document.createElement('div');
  const term = document.createElement('span');
  term.textContent = label;
  const detail = document.createElement('strong');
  detail.textContent = value || '—';
  item.append(term, detail);
  return item;
}

function maskProfilePhone(phone) {
  const value = String(phone || '').trim();
  if (!value) return '未填写';
  if (value.length <= 4) return '***';
  const visibleStart = value.slice(0, Math.min(3, value.length - 2));
  const visibleEnd = value.slice(-Math.min(4, value.length - visibleStart));
  return `${visibleStart}${'*'.repeat(Math.max(3, value.length - visibleStart.length - visibleEnd.length))}${visibleEnd}`;
}

function formatProfileMoney(amount) {
  const value = Number(amount);
  if (!Number.isFinite(value)) return '￥0';
  return `￥${value.toLocaleString('zh-CN', { maximumFractionDigits: 2 })}`;
}

function renderProfileRecords(account) {
  const data = getProfileOverviewData(account);
  renderProfileCheckinRecords(document.querySelector('[data-profile-actions-list]'), data);
  renderProfileVolunteerRecords(document.querySelector('[data-profile-volunteer-list]'), data);
  renderProfileSupportRecords(document.querySelector('[data-profile-support-list]'), data);
}

function renderProfileCheckinRecords(container, data) {
  if (!container) return;
  container.replaceChildren();
  const records = filterProfileCheckins(data.checkins)
    .slice()
    .sort((a, b) => getProfileRecordDate(b) - getProfileRecordDate(a));

  if (!records.length) {
    const isFiltered = profileActionFilter !== 'all';
    container.append(createProfileRecordEmpty(
      isFiltered ? '当前筛选条件下没有行动记录。' : '还没有行动记录。',
      isFiltered ? '试试切换筛选条件，或前往行动中心完成新的环保打卡。' : '完成一次环保打卡后，你的行动会出现在这里。',
    ));
    return;
  }

  records.forEach((record) => {
    const card = document.createElement('article');
    card.className = 'profile-record-card profile-record-card--checkin';
    const header = document.createElement('div');
    header.className = 'profile-record-card__header';
    const titleGroup = document.createElement('div');
    const eyebrow = document.createElement('p');
    eyebrow.textContent = '每日环保打卡';
    const title = document.createElement('h3');
    title.textContent = record.actionType || '海洋守护行动';
    titleGroup.append(eyebrow, title);
    const date = document.createElement('time');
    date.dateTime = getProfileRecordDate(record).toISOString();
    date.textContent = formatActionDate(getProfileRecordDate(record).toISOString());
    header.append(titleGroup, date);

    const description = document.createElement('p');
    description.className = 'profile-record-card__description';
    description.textContent = record.description || '已完成一次海洋守护行动。';
    const meta = document.createElement('div');
    meta.className = 'profile-record-card__meta';
    meta.append(
      createProfileRecordMeta('行动时长', `${Number(record.duration) || 0} 分钟`),
      createProfileRecordMeta('证书状态', isProfileCertificateRecord(record) ? '已保存' : '可前往行动中心查看'),
    );
    const actions = document.createElement('div');
    actions.className = 'profile-record-card__actions';
    const certificate = document.createElement('a');
    certificate.href = 'action.html#daily-action-dock';
    certificate.textContent = '查看证书';
    const remove = document.createElement('button');
    remove.type = 'button';
    remove.className = 'text-button';
    remove.dataset.profileRecordDelete = 'checkin';
    remove.dataset.recordId = record.id || '';
    remove.textContent = '删除本地记录';
    actions.append(certificate, remove);
    card.append(header, description, meta, actions);
    container.append(card);
  });
}

function renderProfileVolunteerRecords(container, data) {
  if (!container) return;
  container.replaceChildren();
  const records = data.volunteers.slice().sort((a, b) => getProfileRecordDate(b) - getProfileRecordDate(a));
  if (!records.length) {
    container.append(createProfileRecordEmpty('还没有志愿报名记录。', '从行动中心选择一项志愿任务，记录会保存在当前浏览器。'));
    return;
  }

  records.forEach((record) => {
    const card = document.createElement('article');
    card.className = 'profile-record-card profile-record-card--volunteer';
    const header = document.createElement('div');
    header.className = 'profile-record-card__header';
    const titleGroup = document.createElement('div');
    const status = document.createElement('p');
    status.className = 'profile-record-status';
    status.textContent = '已记录';
    const title = document.createElement('h3');
    title.textContent = record.activityTitle || '志愿活动';
    titleGroup.append(status, title);
    const date = document.createElement('time');
    date.dateTime = getProfileRecordDate(record).toISOString();
    date.textContent = `报名于 ${formatActionDate(getProfileRecordDate(record).toISOString())}`;
    header.append(titleGroup, date);
    const meta = document.createElement('div');
    meta.className = 'profile-record-card__meta';
    meta.append(
      createProfileRecordMeta('报名姓名', record.name || '未填写'),
      createProfileRecordMeta('联系电话', maskProfilePhone(record.phone)),
      createProfileRecordMeta('邮箱', record.email || '未填写'),
    );
    const actions = document.createElement('div');
    actions.className = 'profile-record-card__actions';
    const detail = document.createElement('button');
    detail.type = 'button';
    detail.className = 'button button-secondary';
    detail.dataset.profileRecordDetail = 'volunteer';
    detail.dataset.recordId = record.id || '';
    detail.textContent = '查看活动详情';
    const remove = document.createElement('button');
    remove.type = 'button';
    remove.className = 'text-button';
    remove.dataset.profileRecordDelete = 'volunteer';
    remove.dataset.recordId = record.id || '';
    remove.textContent = '取消本地记录';
    actions.append(detail, remove);
    card.append(header, meta, actions);
    container.append(card);
  });
}

function renderProfileSupportRecords(container, data) {
  if (!container) return;
  container.replaceChildren();
  const records = data.donations.slice().sort((a, b) => getProfileRecordDate(b) - getProfileRecordDate(a));
  if (!records.length) {
    container.append(createProfileRecordEmpty('还没有公益支持记录。', '了解行动中心中的公益项目，再选择适合你的支持方向。'));
    return;
  }

  records.forEach((record) => {
    const card = document.createElement('article');
    card.className = 'profile-record-card profile-record-card--support';
    const header = document.createElement('div');
    header.className = 'profile-record-card__header';
    const titleGroup = document.createElement('div');
    const status = document.createElement('p');
    status.className = 'profile-record-status';
    status.textContent = record.anonymous ? '匿名支持' : '已记录';
    const title = document.createElement('h3');
    title.textContent = record.projectTitle || '海洋公益项目';
    titleGroup.append(status, title);
    const date = document.createElement('time');
    date.dateTime = getProfileRecordDate(record).toISOString();
    date.textContent = formatActionDate(getProfileRecordDate(record).toISOString());
    header.append(titleGroup, date);
    const meta = document.createElement('div');
    meta.className = 'profile-record-card__meta';
    meta.append(
      createProfileRecordMeta('支持金额', formatProfileMoney(record.amount)),
      createProfileRecordMeta('支持方式', record.anonymous ? '匿名' : '实名'),
      createProfileRecordMeta('留言', record.message || '未留言'),
    );
    const actions = document.createElement('div');
    actions.className = 'profile-record-card__actions';
    const thanks = document.createElement('button');
    thanks.type = 'button';
    thanks.className = 'button button-secondary';
    thanks.dataset.profileRecordThanks = 'support';
    thanks.dataset.recordId = record.id || '';
    thanks.textContent = '查看感谢卡';
    const remove = document.createElement('button');
    remove.type = 'button';
    remove.className = 'text-button';
    remove.dataset.profileRecordDelete = 'support';
    remove.dataset.recordId = record.id || '';
    remove.textContent = '删除本地记录';
    actions.append(thanks, remove);
    card.append(header, meta, actions);
    container.append(card);
  });
}

function deleteProfileRecord(type, id) {
  const account = getAccount();
  const username = String(account?.username || '').trim();
  if (!username || !id) return;
  if (type === 'checkin') {
    const key = `ocean-action-checkins.${username}`;
    const records = readProfileStorage(key, []);
    if (Array.isArray(records)) localStorage.setItem(key, JSON.stringify(records.filter((record) => record?.id !== id)));
  } else {
    const key = type === 'volunteer' ? 'ocean-action-volunteer-registrations' : 'ocean-action-donations';
    const records = readProfileStorage(key, []);
    if (Array.isArray(records)) {
      localStorage.setItem(key, JSON.stringify(records.filter((record) => !(record?.id === id && record?.username === username))));
    }
  }
  renderProfile();
}

function populateProfileDialog(container, pairs) {
  if (!container) return;
  container.replaceChildren();
  const list = document.createElement('dl');
  list.className = 'profile-dialog-details';
  pairs.forEach(([label, value]) => {
    const row = document.createElement('div');
    const term = document.createElement('dt');
    term.textContent = label;
    const detail = document.createElement('dd');
    detail.textContent = value || '—';
    row.append(term, detail);
    list.append(row);
  });
  container.append(list);
}

function openProfileVolunteerDetail(id) {
  const data = getProfileOverviewData(getAccount());
  const record = data.volunteers.find((item) => item?.id === id);
  const dialog = document.querySelector('[data-profile-volunteer-detail]');
  if (!record || !dialog) return;
  populateProfileDialog(dialog.querySelector('[data-profile-volunteer-detail-content]'), [
    ['活动名称', record.activityTitle || '志愿活动'],
    ['报名时间', formatActionDate(getProfileRecordDate(record).toISOString())],
    ['报名姓名', record.name || '未填写'],
    ['联系电话', maskProfilePhone(record.phone)],
    ['邮箱', record.email || '未填写'],
    ['参与经验', record.experience || '未填写'],
    ['备注', record.note || '未填写'],
  ]);
  dialog.showModal();
}

function openProfileSupportThanks(id) {
  const data = getProfileOverviewData(getAccount());
  const record = data.donations.find((item) => item?.id === id);
  const dialog = document.querySelector('[data-profile-support-thanks]');
  if (!record || !dialog) return;
  populateProfileDialog(dialog.querySelector('[data-profile-support-thanks-content]'), [
    ['感谢你支持', record.projectTitle || '海洋公益项目'],
    ['支持金额', formatProfileMoney(record.amount)],
    ['支持方式', record.anonymous ? '匿名支持' : record.donorName || '实名支持'],
    ['留言', record.message || '未留言'],
    ['记录日期', formatActionDate(getProfileRecordDate(record).toISOString())],
    ['说明', '此记录仅保存在当前浏览器，不产生真实支付行为。'],
  ]);
  dialog.showModal();
}

const PROFILE_BADGES = [
  { id: 'streak-3', name: '潮汐初心者', required: 3, level: 'bronze', mark: '◎', declaration: '从连续三天开始，让守护成为日常。' },
  { id: 'streak-5', name: '蓝色守护者', required: 5, level: 'silver', mark: '◆', declaration: '坚持五天，把关心化为稳定的行动。' },
  { id: 'streak-7', name: '珊瑚之友', required: 7, level: 'gold', mark: '❋', declaration: '七日同行，为脆弱的生命留下温柔力量。' },
  { id: 'streak-14', name: '海岸行动者', required: 14, level: 'gold', mark: '▣', declaration: '两周守望，让每一次行动靠近真实海岸。' },
  { id: 'streak-30', name: '蓝色星球守望者', required: 30, level: 'cyan', mark: '★', declaration: '三十日守护，成为蓝色星球的长期同行者。' },
];

function profileIsoDate(date) {
  const value = new Date(date);
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function profileDateFromIso(iso) {
  const [year, month, day] = String(iso || '').split('-').map(Number);
  if (!year || !month || !day) return null;
  const date = new Date(year, month - 1, day);
  return Number.isNaN(date.valueOf()) ? null : date;
}

function getProfileCheckinStats(checkins) {
  const uniqueDates = [...new Set(checkins.map((item) => item?.date).filter((iso) => profileDateFromIso(iso)))]
    .sort();
  const dateSet = new Set(uniqueDates);
  const today = profileIsoDate(new Date());
  const yesterday = profileIsoDate(new Date(Date.now() - 86400000));
  const countRun = (anchor) => {
    let streak = 0;
    let cursor = profileDateFromIso(anchor);
    while (cursor && dateSet.has(profileIsoDate(cursor))) {
      streak += 1;
      cursor.setDate(cursor.getDate() - 1);
    }
    return streak;
  };
  const currentAnchor = dateSet.has(today) ? today : (dateSet.has(yesterday) ? yesterday : '');
  let longestStreak = 0;
  let run = 0;
  let previous = null;
  uniqueDates.forEach((iso) => {
    const date = profileDateFromIso(iso);
    if (previous && Math.round((date - previous) / 86400000) === 1) run += 1;
    else run = 1;
    longestStreak = Math.max(longestStreak, run);
    previous = date;
  });
  const now = new Date();
  const monthDays = uniqueDates.filter((iso) => {
    const date = profileDateFromIso(iso);
    return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
  });
  return {
    dateSet,
    currentStreak: currentAnchor ? countRun(currentAnchor) : 0,
    longestStreak,
    monthDays,
    totalDays: uniqueDates.length,
    totalDuration: checkins.reduce((sum, item) => sum + (Number(item?.duration) || 0), 0),
    checkedToday: dateSet.has(today),
  };
}

function renderProfileAchievements(account) {
  const data = getProfileOverviewData(account);
  const stats = getProfileCheckinStats(data.checkins);
  const checkinRoot = document.querySelector('[data-dashboard-view="checkin"]');
  if (checkinRoot) {
    const values = {
      'current-streak': stats.currentStreak,
      'longest-streak': stats.longestStreak,
      'month-days': stats.monthDays.length,
      'total-days': stats.totalDays,
      duration: stats.totalDuration,
      'today-status': stats.checkedToday ? '已打卡' : '待打卡',
    };
    Object.entries(values).forEach(([key, value]) => {
      checkinRoot.querySelectorAll(`[data-checkin-stat="${key}"]`).forEach((node) => {
        node.textContent = String(value);
        node.classList.toggle('is-done', key === 'today-status' && stats.checkedToday);
      });
    });
    renderProfileCheckinWeek(checkinRoot.querySelector('[data-profile-checkin-week]'), data.checkins, stats.dateSet);
    renderProfileCheckinHeatmap(checkinRoot.querySelector('[data-profile-checkin-heatmap]'), data.checkins, stats.dateSet);
  }
  renderProfileBadgeGrid(document.querySelector('[data-profile-badge-grid]'), data, stats);
}

function renderProfileCheckinWeek(container, checkins, dateSet) {
  if (!container) return;
  container.replaceChildren();
  const byDate = new Map(checkins.map((item) => [item?.date, item]));
  for (let offset = 6; offset >= 0; offset -= 1) {
    const date = new Date();
    date.setDate(date.getDate() - offset);
    const iso = profileIsoDate(date);
    const item = document.createElement('div');
    item.className = `checkin-week-day${dateSet.has(iso) ? ' is-checked' : ''}${offset === 0 ? ' is-today' : ''}`;
    item.title = dateSet.has(iso)
      ? `${iso} · ${byDate.get(iso)?.actionType || '已完成海洋行动'}`
      : `${iso} · 未打卡`;
    const weekday = document.createElement('span');
    weekday.textContent = ['日', '一', '二', '三', '四', '五', '六'][date.getDay()];
    const day = document.createElement('strong');
    day.textContent = String(date.getDate());
    item.append(weekday, day);
    container.append(item);
  }
}

function renderProfileCheckinHeatmap(container, checkins, dateSet) {
  if (!container) return;
  container.replaceChildren();
  const byDate = new Map(checkins.map((item) => [item?.date, item]));
  const now = new Date();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const today = profileIsoDate(now);
  for (let day = 1; day <= daysInMonth; day += 1) {
    const date = new Date(now.getFullYear(), now.getMonth(), day);
    const iso = profileIsoDate(date);
    const record = byDate.get(iso);
    const cell = document.createElement('span');
    cell.className = `checkin-heatmap__cell${dateSet.has(iso) ? ' is-checked' : ''}${iso === today ? ' is-today' : ''}`;
    cell.title = record
      ? `${iso} · ${record.actionType || '已完成海洋行动'}${record.description ? `：${record.description}` : ''}`
      : `${iso} · 未打卡`;
    cell.setAttribute('aria-label', cell.title);
    container.append(cell);
  }
}

function renderProfileBadgeGrid(container, data, stats) {
  if (!container) return;
  container.replaceChildren();
  PROFILE_BADGES.forEach((badge) => {
    const unlocked = data.badges.includes(badge.id);
    const progress = Math.min(100, Math.round((stats.currentStreak / badge.required) * 100));
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `profile-badge is-${badge.level}${unlocked ? ' is-unlocked' : ''}`;
    button.dataset.profileBadgeId = badge.id;
    const mark = document.createElement('span');
    mark.className = 'profile-badge__mark';
    mark.textContent = badge.mark;
    const name = document.createElement('strong');
    name.textContent = badge.name;
    const condition = document.createElement('small');
    condition.textContent = `连续 ${badge.required} 天`;
    const status = document.createElement('em');
    status.textContent = unlocked ? '已解锁' : '未解锁';
    const meter = document.createElement('span');
    meter.className = 'profile-badge__meter';
    const fill = document.createElement('i');
    fill.style.width = `${progress}%`;
    meter.append(fill);
    const unlockedAt = document.createElement('time');
    const date = data.badgeUnlocks?.[badge.id];
    unlockedAt.textContent = unlocked && date ? `解锁于 ${formatActionDate(date)}` : `当前进度 ${progress}%`;
    button.append(mark, name, condition, status, meter, unlockedAt);
    container.append(button);
  });
}

function openProfileBadgeDetail(id) {
  const badge = PROFILE_BADGES.find((item) => item.id === id);
  const dialog = document.querySelector('[data-profile-badge-detail]');
  if (!badge || !dialog) return;
  const data = getProfileOverviewData(getAccount());
  const stats = getProfileCheckinStats(data.checkins);
  const unlocked = data.badges.includes(badge.id);
  const unlockDate = data.badgeUnlocks?.[badge.id];
  const progress = Math.min(100, Math.round((stats.currentStreak / badge.required) * 100));
  populateProfileDialog(dialog.querySelector('[data-profile-badge-detail-content]'), [
    ['勋章名称', badge.name],
    ['解锁条件', `连续完成 ${badge.required} 天海洋环保打卡`],
    ['当前进度', `${stats.currentStreak} / ${badge.required} 天（${progress}%）`],
    ['当前状态', unlocked ? '已解锁' : `距离解锁还差 ${Math.max(0, badge.required - stats.currentStreak)} 天`],
    ['解锁日期', unlocked && unlockDate ? formatActionDate(unlockDate) : '尚未解锁'],
    ['行动宣言', badge.declaration],
  ]);
  dialog.showModal();
}

function setupProfileDashboard() {
  if (document.body.dataset.page !== 'profile') return;
  document.querySelectorAll('[data-dashboard-nav]').forEach((item) => {
    item.addEventListener('click', () => {
      if (item.dataset.dashboardNav) showDashboardView(item.dataset.dashboardNav, { focus: true });
    });
  });
  document.querySelectorAll('[data-dashboard-select]').forEach((select) => {
    select.addEventListener('change', () => {
      if (select.value) showDashboardView(select.value, { focus: true });
    });
  });
  document.querySelectorAll('[data-profile-overview-target]').forEach((button) => {
    button.addEventListener('click', () => showDashboardView(button.dataset.profileOverviewTarget, { focus: true }));
  });
  document.querySelectorAll('[data-profile-action-filter]').forEach((button) => {
    button.addEventListener('click', () => {
      profileActionFilter = button.dataset.profileActionFilter || 'all';
      document.querySelectorAll('[data-profile-action-filter]').forEach((item) => {
        item.classList.toggle('is-active', item === button);
      });
      renderProfileRecords(getAccount());
    });
  });
  document.addEventListener('click', (event) => {
    const target = event.target instanceof Element ? event.target : null;
    const deleteButton = target?.closest('[data-profile-record-delete]');
    if (deleteButton) {
      const type = deleteButton.dataset.profileRecordDelete;
      const id = deleteButton.dataset.recordId;
      const label = type === 'volunteer' ? '取消这条本地报名记录' : '删除这条本地记录';
      if (window.confirm(`确定${label}吗？此操作不可恢复。`)) deleteProfileRecord(type, id);
      return;
    }
    const detailButton = target?.closest('[data-profile-record-detail="volunteer"]');
    if (detailButton) {
      openProfileVolunteerDetail(detailButton.dataset.recordId);
      return;
    }
    const thanksButton = target?.closest('[data-profile-record-thanks="support"]');
    if (thanksButton) {
      openProfileSupportThanks(thanksButton.dataset.recordId);
      return;
    }
    const badgeButton = target?.closest('[data-profile-badge-id]');
    if (badgeButton) openProfileBadgeDetail(badgeButton.dataset.profileBadgeId);
  });
  document.querySelectorAll('[data-profile-dialog-close]').forEach((button) => {
    button.addEventListener('click', () => button.closest('dialog')?.close());
  });
  const initial = document.querySelector('[data-dashboard-nav].is-active');
  setupProfileScrollLayout();
  showDashboardView(initial?.dataset.dashboardNav || 'overview', { scroll: false });
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

  document.querySelectorAll('[data-register-form]').forEach((register) => {
    register.addEventListener('submit', (event) => {
      event.preventDefault();
      clearFormErrors(register);
      if (!validateRegisterAll(register)) return;
      const fields = register.elements;
      const result = authStorage()?.registerUser?.({
        username: fields.username.value.trim(),
        password: fields.password.value,
        rolePreference: fields.role.value,
      });
      const status = register.querySelector('[data-register-result]');
      if (!result?.ok) {
        if (result?.field && fields[result.field]) {
          setFieldError(fields[result.field], result.error || '注册失败，请检查表单。');
        } else if (status) {
          status.textContent = result?.error || '注册失败，请稍后再试。';
          status.className = 'auth-modal__status';
        }
        return;
      }
      const username = result.user?.username || fields.username.value.trim();
      showAuthSuccess(
        status,
        `欢迎加入，${username}\n你的守护者账户已经创建。`,
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
      const isProfileSecurityAction = Boolean(button.closest('[data-dashboard-view="security"]'));
      if (isProfileSecurityAction && !window.confirm('确认退出当前浏览器中的本地身份吗？行动档案会保留在本机。')) return;
      authStorage()?.logoutUser?.();
      renderProfile();
      showAuthView('login');
      closeAccountMenu();
      showAccountMenuToast('已退出守护者账户。');
    });
  });

  document.querySelectorAll('[data-profile-clear]').forEach((button) => {
    button.addEventListener('click', () => {
      const account = getAccount();
      if (!window.confirm('确定删除当前浏览器中的本地模拟账户吗？这会同时移除个人资料和显示偏好。')) return;
      if (!window.confirm('请再次确认：该本地账户无法恢复，行动记录、报名和公益支持会保留。继续吗？')) return;
      if (!clearProfileLocalIdentity(account)) return;
      renderProfile();
      showAuthView('register');
      showAccountMenuToast('当前浏览器中的本地身份资料已清空。');
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

function bootstrapTurtleCursor() {
  if (typeof window.initTurtleCursor === 'function') {
    window.initTurtleCursor();
    return;
  }
  const appScript = document.querySelector('script[src*="app.js"]');
  if (!appScript?.src) return;
  const turtleSrc = appScript.src.replace(/app\.js(\?.*)?$/, 'turtle-cursor.js');
  const script = document.createElement('script');
  script.src = turtleSrc;
  script.defer = true;
  script.onload = () => window.initTurtleCursor?.();
  document.head.appendChild(script);
}

document.addEventListener('DOMContentLoaded', () => {
  mountUserMenu();
  bootstrapTurtleCursor();
  setupNavigation();
  setupHomeHeader();
  setupDisplayPrefs();
  setupPageBgVideo();
  setupUserMenu();
  setupAuth();
  renderProfile();
  setupProfileDashboard();
  setupProfileSettings();
  setupProfileDataManagement();
  setupProfileSecurity();
  setupDashboard();
  handleAccountMenuDeepLink();
});

window.addEventListener('hashchange', () => handleAccountMenuDeepLink());

window.renderProfile = renderProfile;
