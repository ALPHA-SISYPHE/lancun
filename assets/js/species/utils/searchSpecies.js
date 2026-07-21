/**
 * 物种检索（模糊 / 精确）
 * @param {{ speciesList: object[], query?: string, exactSearchEnabled?: boolean }} params
 * @returns {object[]}
 */
window.LancunSearchSpecies = function searchSpecies({
  speciesList = [],
  query = '',
  exactSearchEnabled = false,
} = {}) {
  const q = String(query || '').trim();
  if (!q) return [];

  const qLower = q.toLowerCase();
  const cats = window.LANCUN_SPECIES_CATEGORIES || {};

  const labelOf = (list, id) => (list || []).find((item) => item.id === id)?.label || id;

  return (speciesList || []).filter((item) => {
    const cn = String(item.chineseName || '');
    const en = String(item.englishName || '');
    const sci = String(item.scientificName || '');

    if (exactSearchEnabled) {
      return [cn, en, sci].some((s) => s.toLowerCase() === qLower);
    }

    const groupLabel = labelOf(cats.GROUPS, item.group);
    const oceanLabels = (item.ocean || []).map((id) => labelOf(cats.HABITATS || cats.OCEANS, id)).join(' ');
    const threatLabels = (item.threats || []).map((id) => labelOf(cats.THREATS, id)).join(' ');
    const habitatText = (item.habitat || []).join(' ');

    const haystack = [cn, en, sci, groupLabel, item.iucnStatus, habitatText, oceanLabels, threatLabels]
      .join(' ')
      .toLowerCase();

    return haystack.includes(qLower);
  });
};
