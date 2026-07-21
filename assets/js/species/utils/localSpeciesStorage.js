/**
 * localStorage 用户新增物种
 * key: ocean-life-user-species
 */
window.LancunLocalSpeciesStorage = (function localSpeciesStorage() {
  const KEY = 'ocean-life-user-species';

  function readRaw() {
    try {
      if (typeof localStorage === 'undefined') return [];
      const raw = localStorage.getItem(KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  function writeRaw(list) {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(KEY, JSON.stringify(list));
  }

  function getUserAddedSpecies() {
    return readRaw().map((item) => ({ ...item, isUserAdded: true }));
  }

  function saveUserAddedSpecies(species) {
    const list = readRaw().filter((item) => item.id !== species.id);
    list.unshift({ ...species, isUserAdded: true });
    writeRaw(list);
    return list;
  }

  function deleteUserAddedSpecies(id) {
    const list = readRaw().filter((item) => item.id !== id);
    writeRaw(list);
    return list;
  }

  function mergeSpeciesDatabase(baseSpecies, userSpecies) {
    const map = new Map();
    (baseSpecies || []).forEach((item) => map.set(item.id, { ...item, isUserAdded: false }));
    (userSpecies || []).forEach((item) => map.set(item.id, { ...item, isUserAdded: true }));
    return Array.from(map.values());
  }

  return {
    KEY,
    getUserAddedSpecies,
    saveUserAddedSpecies,
    deleteUserAddedSpecies,
    mergeSpeciesDatabase,
  };
})();
