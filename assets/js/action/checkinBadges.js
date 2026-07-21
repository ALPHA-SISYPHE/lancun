/**
 * 海洋行动中心 · 打卡勋章
 * Key: ocean-action-badges.{username}
 */
(function checkinBadgesModule() {
  const KEY_PREFIX = 'ocean-action-badges.';

  const BADGES = [
    {
      id: 'streak-3',
      name: '潮汐初心者',
      requiredStreak: 3,
      description: '连续 3 天完成海洋环保行动',
      level: 'bronze',
      icon: '◎',
    },
    {
      id: 'streak-5',
      name: '蓝色守护者',
      requiredStreak: 5,
      description: '连续 5 天坚持蓝色行动',
      level: 'silver',
      icon: '◆',
    },
    {
      id: 'streak-7',
      name: '珊瑚之友',
      requiredStreak: 7,
      description: '连续 7 天与海洋同行',
      level: 'gold',
      icon: '❋',
    },
    {
      id: 'streak-14',
      name: '海岸行动者',
      requiredStreak: 14,
      description: '连续 14 天海岸级坚持',
      level: 'gold',
      icon: '▣',
    },
    {
      id: 'streak-30',
      name: '蓝色星球守望者',
      requiredStreak: 30,
      description: '连续 30 天守望蓝色星球',
      level: 'gold',
      icon: '★',
    },
  ];

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

  function emptyStore() {
    return { unlockedIds: [], unlockedAt: {} };
  }

  function getBadgeStore(username) {
    if (!username) return emptyStore();
    return { ...emptyStore(), ...getStored(storageKey(username), emptyStore()) };
  }

  function saveBadgeStore(username, store) {
    setStored(storageKey(username), store);
  }

  function getUnlockedBadges(username) {
    const store = getBadgeStore(username);
    return BADGES.filter((badge) => store.unlockedIds.includes(badge.id));
  }

  function syncBadges(username, currentStreak) {
    if (!username) return [];
    const store = getBadgeStore(username);
    const newlyUnlocked = [];
    const today = new Date().toISOString();

    BADGES.forEach((badge) => {
      if (currentStreak >= badge.requiredStreak && !store.unlockedIds.includes(badge.id)) {
        store.unlockedIds.push(badge.id);
        store.unlockedAt[badge.id] = today;
        newlyUnlocked.push(badge);
      }
    });

    if (newlyUnlocked.length) saveBadgeStore(username, store);
    return newlyUnlocked;
  }

  function getNextBadge(currentStreak) {
    const next = BADGES.find((badge) => currentStreak < badge.requiredStreak);
    if (!next) {
      return { badge: null, progress: 100, remaining: 0 };
    }
    const prevRequired = BADGES.filter((b) => b.requiredStreak < next.requiredStreak).pop()?.requiredStreak || 0;
    const span = next.requiredStreak - prevRequired;
    const done = Math.max(0, currentStreak - prevRequired);
    const progress = Math.min(100, Math.round((done / span) * 100));
    return {
      badge: next,
      progress,
      remaining: Math.max(0, next.requiredStreak - currentStreak),
    };
  }

  window.OceanActionBadges = {
    BADGES,
    getUnlockedBadges,
    syncBadges,
    getNextBadge,
    getBadgeStore,
  };
})();
