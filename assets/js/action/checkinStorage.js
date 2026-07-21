/**
 * 海洋行动中心 · 打卡 localStorage
 * Key: ocean-action-checkins.{username}
 */
(function checkinStorageModule() {
  const KEY_PREFIX = 'ocean-action-checkins.';
  const LEGACY_PREFIX = 'lancun.action.checkins.';

  function getStored(key, fallback) {
    try {
      return JSON.parse(localStorage.getItem(key)) ?? fallback;
    } catch {
      return fallback;
    }
  }

  function setStored(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function storageKey(username) {
    return `${KEY_PREFIX}${username}`;
  }

  function toIsoDate(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  function parseIso(iso) {
    const [y, m, d] = iso.split('-').map(Number);
    return new Date(y, m - 1, d);
  }

  function addDays(date, days) {
    const next = new Date(date);
    next.setDate(next.getDate() + days);
    return next;
  }

  function uniqueSortedDates(checkins) {
    return [...new Set(checkins.map((c) => c.date))].sort();
  }

  function streakFromAnchor(dateSet, anchorIso) {
    if (!dateSet.has(anchorIso)) return 0;
    let streak = 0;
    let cursor = parseIso(anchorIso);
    while (dateSet.has(toIsoDate(cursor))) {
      streak += 1;
      cursor = addDays(cursor, -1);
    }
    return streak;
  }

  function longestStreakFromDates(sortedDates) {
    if (!sortedDates.length) return 0;
    let longest = 1;
    let run = 1;
    for (let i = 1; i < sortedDates.length; i += 1) {
      const prev = parseIso(sortedDates[i - 1]);
      const curr = parseIso(sortedDates[i]);
      const diff = Math.round((curr - prev) / 86400000);
      if (diff === 1) {
        run += 1;
        longest = Math.max(longest, run);
      } else if (diff > 0) {
        run = 1;
      }
    }
    return longest;
  }

  function migrateLegacyCheckins(username) {
    if (!username) return;
    const key = storageKey(username);
    const existing = getStored(key, null);
    if (existing && existing.length) return;

    const legacy = getStored(`${LEGACY_PREFIX}${username}`, null);
    if (!legacy?.dates?.length) return;

    const migrated = legacy.dates.map((iso, index) => ({
      id: `legacy-${iso}-${index}`,
      date: iso,
      actionType: '每日环保打卡',
      description: '自旧版打卡记录迁移',
      duration: 10,
      mood: '平静',
      createdAt: new Date(iso).toISOString(),
    }));
    setStored(key, migrated);
  }

  function getCheckins(username) {
    if (!username) return [];
    migrateLegacyCheckins(username);
    return getStored(storageKey(username), []);
  }

  function saveCheckin(username, checkin) {
    if (!username || !checkin?.date) return null;
    const list = getCheckins(username);
    const index = list.findIndex((item) => item.date === checkin.date);
    const payload = {
      ...checkin,
      id: checkin.id || `chk-${Date.now()}`,
      createdAt: checkin.createdAt || new Date().toISOString(),
    };
    if (index >= 0) {
      list[index] = { ...list[index], ...payload, id: list[index].id };
    } else {
      list.push(payload);
    }
    list.sort((a, b) => a.date.localeCompare(b.date));
    setStored(storageKey(username), list);
    return payload;
  }

  function deleteCheckin(username, id) {
    if (!username || !id) return;
    const list = getCheckins(username).filter((item) => item.id !== id);
    setStored(storageKey(username), list);
  }

  function getTodayCheckin(username) {
    const today = toIsoDate(new Date());
    return getCheckins(username).find((item) => item.date === today) || null;
  }

  function hasCheckedToday(username) {
    return Boolean(getTodayCheckin(username));
  }

  function calculateStreak(checkins) {
    const dates = uniqueSortedDates(checkins);
    if (!dates.length) return { currentStreak: 0, longestStreak: 0 };
    const dateSet = new Set(dates);
    const today = toIsoDate(new Date());
    const yesterday = toIsoDate(addDays(new Date(), -1));

    let anchor = today;
    if (!dateSet.has(today)) {
      anchor = dates[dates.length - 1];
      if (anchor !== yesterday && parseIso(anchor) < parseIso(yesterday)) {
        const yesterdayStreak = streakFromAnchor(dateSet, yesterday);
        if (yesterdayStreak === 0) {
          anchor = dates[dates.length - 1];
        }
      }
    }

    const currentStreak = streakFromAnchor(dateSet, anchor);
    const longestStreak = longestStreakFromDates(dates);
    return { currentStreak, longestStreak };
  }

  function calculateTotalDays(checkins) {
    return uniqueSortedDates(checkins).length;
  }

  function calculateTotalDuration(checkins) {
    return checkins.reduce((sum, item) => sum + (Number(item.duration) || 0), 0);
  }

  function getMonthlyCheckins(checkins, year, month) {
    return checkins.filter((item) => {
      const d = parseIso(item.date);
      return d.getFullYear() === year && d.getMonth() === month;
    });
  }

  function countMonthCheckins(username, year = new Date().getFullYear(), month = new Date().getMonth()) {
    return getMonthlyCheckins(getCheckins(username), year, month).length;
  }

  window.OceanActionCheckins = {
    toIsoDate,
    parseIso,
    migrateLegacyCheckins,
    getCheckins,
    saveCheckin,
    deleteCheckin,
    getTodayCheckin,
    hasCheckedToday,
    calculateStreak,
    calculateTotalDays,
    calculateTotalDuration,
    getMonthlyCheckins,
    countMonthCheckins,
  };
})();
