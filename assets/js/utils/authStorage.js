/**
 * 海洋守护者 · 本地模拟账户（课程 demo）
 * Keys: ocean-auth-users | ocean-auth-current-user
 *
 * 密码以明文存入 localStorage，仅用于前端演示，切勿用于真实生产环境。
 */
window.OceanAuthStorage = (function oceanAuthStorage() {
  const KEYS = {
    users: 'ocean-auth-users',
    currentUser: 'ocean-auth-current-user',
    legacyAccount: 'lancun.account',
    legacySession: 'lancun.session',
  };

  function readJson(key, fallback) {
    try {
      if (typeof localStorage === 'undefined') return fallback;
      const raw = localStorage.getItem(key);
      if (!raw) return fallback;
      return JSON.parse(raw);
    } catch {
      return fallback;
    }
  }

  function writeJson(key, value) {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(key, JSON.stringify(value));
  }

  function removeKey(key) {
    if (typeof localStorage === 'undefined') return;
    localStorage.removeItem(key);
  }

  function defaultStats() {
    return {
      checkins: 0,
      badges: 0,
      volunteerRegistrations: 0,
      donations: 0,
    };
  }

  function sanitizeUser(user) {
    if (!user) return null;
    const { password, ...safe } = user;
    return safe;
  }

  function normalizeUsername(username) {
    return String(username || '').trim().toLowerCase();
  }

  function findUserRecord(username) {
    const needle = normalizeUsername(username);
    return getUsers().find((user) => normalizeUsername(user.username) === needle) || null;
  }

  function syncLegacyAuthBridge(fullUser) {
    if (!fullUser) {
      removeKey(KEYS.legacyAccount);
      writeJson(KEYS.legacySession, { username: '', loggedIn: false });
      return;
    }

    writeJson(KEYS.legacyAccount, {
      username: fullUser.username,
      displayName: fullUser.displayName,
      role: fullUser.rolePreference,
      email: fullUser.email || '',
      createdAt: fullUser.createdAt,
      password: fullUser.password,
    });
    writeJson(KEYS.legacySession, { username: fullUser.username, loggedIn: true });
  }

  function readUsersRaw() {
    const users = readJson(KEYS.users, []);
    return Array.isArray(users) ? users : [];
  }

  function migrateLegacyAccountIfNeeded() {
    if (readUsersRaw().length > 0) return;
    const legacy = readJson(KEYS.legacyAccount, null);
    const legacySession = readJson(KEYS.legacySession, { username: '', loggedIn: false });
    if (!legacy?.username) return;

    const user = {
      id: generateUserId(),
      username: legacy.username,
      password: legacy.password || '',
      displayName: legacy.displayName || legacy.username,
      rolePreference: legacy.role || '公益守护者',
      email: legacy.email || '',
      avatarType: 'initial',
      avatarText: (legacy.displayName || legacy.username || '澜').slice(0, 1),
      createdAt: legacy.createdAt || new Date().toISOString(),
      stats: defaultStats(),
    };

    saveUsers([user]);

    if (legacySession?.loggedIn && legacySession.username === legacy.username) {
      setCurrentUser(sanitizeUser(user));
      syncLegacyAuthBridge(user);
    }
  }

  function getUsers() {
    migrateLegacyAccountIfNeeded();
    return readUsersRaw();
  }

  function saveUsers(users) {
    writeJson(KEYS.users, users);
  }

  function getCurrentUser() {
    migrateLegacyAccountIfNeeded();
    const user = readJson(KEYS.currentUser, null);
    return user && user.id ? user : null;
  }

  function setCurrentUser(user) {
    if (!user) {
      clearCurrentUser();
      return null;
    }
    const safe = sanitizeUser(user);
    writeJson(KEYS.currentUser, safe);
    return safe;
  }

  function clearCurrentUser() {
    removeKey(KEYS.currentUser);
    syncLegacyAuthBridge(null);
  }

  function updateCurrentUserProfile(next) {
    const current = getCurrentUser();
    if (!current) return null;
    const users = getUsers();
    const index = users.findIndex((user) => user?.id === current.id);
    if (index < 0) return null;

    const existing = users[index];
    const updated = {
      ...existing,
      rolePreference: String(next?.rolePreference ?? existing.rolePreference).trim() || existing.rolePreference,
      email: String(next?.email ?? existing.email ?? '').trim().slice(0, 120),
      avatarText: String(next?.avatarText ?? existing.avatarText ?? '').trim().slice(0, 1)
        || String(existing.username ?? '澜').trim().slice(0, 1),
    };
    users[index] = updated;
    saveUsers(users);
    const safe = setCurrentUser(updated);
    syncLegacyAuthBridge(updated);
    return safe;
  }

  function generateUserId() {
    return `guardian_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  }

  function isUsernameTaken(username) {
    return Boolean(findUserRecord(username));
  }

  function isLoggedIn() {
    return Boolean(getCurrentUser());
  }

  function registerUser(payload) {
    const username = String(payload?.username || '').trim();
    const password = String(payload?.password || '');
    const rolePreference = String(payload?.rolePreference || '公益守护者').trim();

    if (!username) {
      return { ok: false, error: '请输入用户名。', field: 'username' };
    }
    if (username.length < 2 || username.length > 16) {
      return { ok: false, error: '用户名应为 2–16 个字符。', field: 'username' };
    }
    if (isUsernameTaken(username)) {
      return { ok: false, error: '该用户名已被使用。', field: 'username' };
    }
    if (password.length < 6) {
      return { ok: false, error: '密码至少需要 6 位。', field: 'password' };
    }

    const user = {
      id: generateUserId(),
      username,
      password,
      displayName: username,
      rolePreference,
      email: '',
      avatarType: 'initial',
      avatarText: username.slice(0, 1),
      createdAt: new Date().toISOString(),
      stats: defaultStats(),
    };

    const users = getUsers();
    users.push(user);
    saveUsers(users);

    const current = setCurrentUser(user);
    syncLegacyAuthBridge(user);

    return { ok: true, user: current };
  }

  function loginUser(username, password) {
    const name = String(username || '').trim();
    const pass = String(password || '');

    if (!name) {
      return { ok: false, error: '请输入用户名。', field: 'username' };
    }
    if (!pass) {
      return { ok: false, error: '请输入密码。', field: 'password' };
    }
    if (pass.length < 6) {
      return { ok: false, error: '密码至少需要 6 位。', field: 'password' };
    }

    const record = findUserRecord(name);
    if (!record) {
      return { ok: false, error: '用户名不存在。', field: 'username' };
    }
    if (record.password !== pass) {
      return { ok: false, error: '密码不正确。', field: 'password' };
    }

    const current = setCurrentUser(record);
    syncLegacyAuthBridge(record);

    return { ok: true, user: current };
  }

  function logoutUser() {
    clearCurrentUser();
    return { ok: true };
  }

  function clearAllAuthData() {
    removeKey(KEYS.users);
    removeKey(KEYS.currentUser);
    syncLegacyAuthBridge(null);
  }

  migrateLegacyAccountIfNeeded();

  return {
    KEYS,
    getUsers,
    saveUsers,
    getCurrentUser,
    setCurrentUser,
    clearCurrentUser,
    updateCurrentUserProfile,
    generateUserId,
    isUsernameTaken,
    registerUser,
    loginUser,
    logoutUser,
    isLoggedIn,
    clearAllAuthData,
  };
}());
