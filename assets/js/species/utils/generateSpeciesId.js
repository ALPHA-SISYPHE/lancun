/**
 * 生成用户新增物种唯一 ID
 * @param {string} [prefix='user-species']
 * @returns {string}
 */
window.LancunGenerateSpeciesId = function generateSpeciesId(prefix = 'user-species') {
  const safe = String(prefix || 'user-species')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]/g, '') || 'user-species';
  return `${safe}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
};
