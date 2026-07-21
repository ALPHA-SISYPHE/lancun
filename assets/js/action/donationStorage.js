/**
 * 海洋行动中心 · 捐款 localStorage
 * Key: ocean-action-donations
 */
(function donationStorageModule() {
  const REG_KEY = 'ocean-action-donations';

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

  function getProjects() {
    return window.DONATION_PROJECTS ?? [];
  }

  function findProject(id) {
    return getProjects().find((item) => item.id === id) ?? null;
  }

  function getDonations() {
    return getStored(REG_KEY, []);
  }

  function saveDonations(list) {
    setStored(REG_KEY, list);
  }

  function getDonationsForUser(username) {
    if (!username) return [];
    return getDonations().filter((item) => item.username === username);
  }

  function getDonationsForProject(projectId) {
    return getDonations().filter((item) => item.projectId === projectId);
  }

  function getEffectiveRaised(project) {
    if (!project) return 0;
    const extra = getDonationsForProject(project.id).reduce((sum, item) => sum + (item.amount || 0), 0);
    return project.raisedAmount + extra;
  }

  function saveDonation(record) {
    if (!record?.projectId || !record?.amount) return null;
    const list = getDonations();
    const payload = {
      ...record,
      id: record.id || `don-${Date.now()}`,
      createdAt: record.createdAt || new Date().toISOString(),
    };
    list.push(payload);
    saveDonations(list);
    return payload;
  }

  function deleteDonation(id) {
    const list = getDonations();
    const index = list.findIndex((item) => item.id === id);
    if (index < 0) return null;
    const removed = list[index];
    list.splice(index, 1);
    saveDonations(list);
    return removed;
  }

  window.OceanActionDonation = {
    REG_KEY,
    findProject,
    getProjects,
    getDonations,
    getDonationsForUser,
    getDonationsForProject,
    getEffectiveRaised,
    saveDonation,
    deleteDonation,
  };
})();
