/**
 * 多选筛选：类间 AND，类内 OR
 * selectedHabitats 过滤数据字段 ocean[]
 * @param {{
 *   speciesList: object[],
 *   selectedGroups?: string[],
 *   selectedStatuses?: string[],
 *   selectedHabitats?: string[],
 *   selectedThreats?: string[],
 * }} params
 * @returns {object[]}
 */
window.LancunFilterSpecies = function filterSpecies({
  speciesList = [],
  selectedGroups = [],
  selectedStatuses = [],
  selectedHabitats = [],
  selectedThreats = [],
} = {}) {
  return (speciesList || []).filter((item) => {
    if (selectedGroups.length && !selectedGroups.includes(item.group)) return false;
    if (selectedStatuses.length && !selectedStatuses.includes(item.iucnStatus)) return false;
    if (selectedHabitats.length && !(item.ocean || []).some((o) => selectedHabitats.includes(o))) {
      return false;
    }
    if (selectedThreats.length && !(item.threats || []).some((t) => selectedThreats.includes(t))) {
      return false;
    }
    return true;
  });
};
