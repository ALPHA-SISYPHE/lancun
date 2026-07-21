/**
 * 海洋行动中心 · 志愿报名 localStorage
 * Key: ocean-action-volunteer-registrations
 */
(function volunteerStorageModule() {
  const REG_KEY = 'ocean-action-volunteer-registrations';

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

  function getActivities() {
    return window.VOLUNTEER_ACTIVITIES ?? [];
  }

  function findActivity(id) {
    return getActivities().find((item) => item.id === id) ?? null;
  }

  function getRegistrations() {
    return getStored(REG_KEY, []);
  }

  function saveRegistrations(list) {
    setStored(REG_KEY, list);
  }

  function getRegistrationsForUser(username) {
    if (!username) return [];
    return getRegistrations().filter((item) => item.username === username);
  }

  function getRegistrationsForActivity(activityId) {
    return getRegistrations().filter((item) => item.activityId === activityId);
  }

  function hasDuplicateRegistration(activityId, phone, email, excludeId) {
    const normalizedPhone = String(phone || '').trim();
    const normalizedEmail = String(email || '').trim().toLowerCase();
    return getRegistrationsForActivity(activityId).some((item) => {
      if (excludeId && item.id === excludeId) return false;
      const samePhone = normalizedPhone && item.phone === normalizedPhone;
      const sameEmail = normalizedEmail && item.email?.toLowerCase() === normalizedEmail;
      return samePhone || sameEmail;
    });
  }

  function getEffectiveRegistered(activity) {
    if (!activity) return 0;
    const extra = getRegistrationsForActivity(activity.id).length;
    return activity.registered + extra;
  }

  function isActivityFull(activity) {
    if (!activity) return true;
    return getEffectiveRegistered(activity) >= activity.capacity;
  }

  function saveRegistration(record) {
    if (!record?.activityId) return null;
    const list = getRegistrations();
    const payload = {
      ...record,
      id: record.id || `vol-reg-${Date.now()}`,
      createdAt: record.createdAt || new Date().toISOString(),
    };
    list.push(payload);
    saveRegistrations(list);
    return payload;
  }

  function deleteRegistration(id) {
    const list = getRegistrations();
    const index = list.findIndex((item) => item.id === id);
    if (index < 0) return null;
    const removed = list[index];
    list.splice(index, 1);
    saveRegistrations(list);
    return removed;
  }

  function userHasRegistration(username, activityId) {
    return getRegistrationsForUser(username).some((item) => item.activityId === activityId);
  }

  window.OceanActionVolunteer = {
    REG_KEY,
    findActivity,
    getActivities,
    getRegistrations,
    getRegistrationsForUser,
    getRegistrationsForActivity,
    hasDuplicateRegistration,
    getEffectiveRegistered,
    isActivityFull,
    saveRegistration,
    deleteRegistration,
    userHasRegistration,
  };
})();
