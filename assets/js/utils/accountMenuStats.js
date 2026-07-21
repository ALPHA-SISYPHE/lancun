/**
 * 账户菜单 · 行动记录摘要（只读 localStorage）
 * 不依赖行动中心页面脚本是否已加载
 */
window.OceanAccountMenuStats = (function accountMenuStats() {
  const KEYS = {
    checkinsPrefix: 'ocean-action-checkins.',
    badgesPrefix: 'ocean-action-badges.',
    volunteer: 'ocean-action-volunteer-registrations',
    donations: 'ocean-action-donations',
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

  function toIsoDate(date = new Date()) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  function getSummary(username) {
    const empty = {
      checkedToday: false,
      checkinCount: 0,
      badgeCount: 0,
      volunteerCount: 0,
      donationCount: 0,
    };
    if (!username) return empty;

    const checkins = readJson(`${KEYS.checkinsPrefix}${username}`, []);
    const today = toIsoDate();
    const checkedToday = Array.isArray(checkins) && checkins.some((item) => item.date === today);

    const badgeStore = readJson(`${KEYS.badgesPrefix}${username}`, { unlockedIds: [] });
    const badgeCount = Array.isArray(badgeStore?.unlockedIds) ? badgeStore.unlockedIds.length : 0;

    const volunteers = readJson(KEYS.volunteer, []);
    const volunteerCount = Array.isArray(volunteers)
      ? volunteers.filter((item) => item.username === username).length
      : 0;

    const donations = readJson(KEYS.donations, []);
    const donationCount = Array.isArray(donations)
      ? donations.filter((item) => item.username === username).length
      : 0;

    return {
      checkedToday,
      checkinCount: Array.isArray(checkins) ? checkins.length : 0,
      badgeCount,
      volunteerCount,
      donationCount,
    };
  }

  return { getSummary, toIsoDate };
}());
