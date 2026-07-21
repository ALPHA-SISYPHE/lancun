/**
 * 海洋生命档案馆 · 集中状态
 */
window.LancunArchiveState = (function archiveState() {
  const listeners = new Set();

  const state = {
    searchQuery: '',
    exactSearchEnabled: false,
    selectedGroups: [],
    selectedStatuses: [],
    selectedOceans: [],
    selectedThreats: [],
    isSearchMode: false,
    searchResults: [],
    searchTotal: 0,
    visibleResultCount: 12,
    selectedSpecies: null,
    isDrawerOpen: false,
    drawerListContext: [],
    uploadedImage: null,
    uploadedFile: null,
    recognitionState: 'idle',
    recognitionResult: null,
    matchedSpecies: null,
    newRecordDraft: null,
    userAddedSpecies: [],
    toastMessage: '',
    demoMode: false,
  };

  function getState() {
    return { ...state };
  }

  function setState(partial) {
    Object.assign(state, partial);
    listeners.forEach((fn) => fn(getState()));
  }

  function subscribe(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  }

  function getMergedDatabase() {
    const base = window.LANCUN_SPECIES_DB || [];
    return window.LancunLocalSpeciesStorage.mergeSpeciesDatabase(base, state.userAddedSpecies);
  }

  function getActiveFilters() {
    return {
      groups: state.selectedGroups,
      statuses: state.selectedStatuses,
      oceans: state.selectedOceans,
      threats: state.selectedThreats,
    };
  }

  function hasActiveFilters() {
    const f = getActiveFilters();
    return (
      Boolean(state.searchQuery.trim()) ||
      f.groups.length ||
      f.statuses.length ||
      f.oceans.length ||
      f.threats.length
    );
  }

  function runSearch() {
    const db = getMergedDatabase();
    const { items, total } = window.LancunSearchSpecies(db, {
      query: state.searchQuery,
      exact: state.exactSearchEnabled,
      filters: getActiveFilters(),
    });
    setState({
      searchResults: items,
      searchTotal: total,
      visibleResultCount: 12,
      isSearchMode: hasActiveFilters(),
    });
    return items;
  }

  function resetSearch() {
    setState({
      searchQuery: '',
      exactSearchEnabled: false,
      selectedGroups: [],
      selectedStatuses: [],
      selectedOceans: [],
      selectedThreats: [],
      isSearchMode: false,
      searchResults: [],
      searchTotal: 0,
      visibleResultCount: 12,
    });
  }

  function loadUserSpecies() {
    const userAddedSpecies = window.LancunLocalSpeciesStorage.getUserAddedSpecies();
    setState({ userAddedSpecies });
  }

  function openDrawer(species, listContext = []) {
    setState({
      selectedSpecies: species,
      isDrawerOpen: true,
      drawerListContext: listContext.length ? listContext : state.drawerListContext,
    });
  }

  function closeDrawer() {
    setState({ isDrawerOpen: false, selectedSpecies: null });
  }

  function showToast(message) {
    setState({ toastMessage: message });
    window.setTimeout(() => setState({ toastMessage: '' }), 3200);
  }

  return {
    getState,
    setState,
    subscribe,
    getMergedDatabase,
    getActiveFilters,
    hasActiveFilters,
    runSearch,
    resetSearch,
    loadUserSpecies,
    openDrawer,
    closeDrawer,
    showToast,
  };
})();
