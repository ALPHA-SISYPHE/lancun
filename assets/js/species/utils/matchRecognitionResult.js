/**
 * AI 识别结果与本地库匹配
 */
window.LancunMatchRecognitionResult = function matchRecognitionResult(result, speciesDatabase) {
  const db = speciesDatabase || [];
  const confidence = Number(result?.confidence) || 0;

  const norm = (v) => String(v || '').trim().toLowerCase().replace(/\s+/g, ' ');

  const sci = norm(result?.scientificName || result?.latinName);
  const cn = norm(result?.chineseName || result?.name || result?.guessedName);
  const en = norm(result?.englishName);

  if (sci) {
    const hit = db.find((s) => norm(s.scientificName) === sci);
    if (hit) return { matched: true, matchType: 'exact', species: hit, confidence };
  }

  if (cn) {
    const hit = db.find((s) => norm(s.chineseName) === cn);
    if (hit) return { matched: true, matchType: 'exact', species: hit, confidence };
  }

  if (en) {
    const hit = db.find((s) => norm(s.englishName) === en);
    if (hit) return { matched: true, matchType: 'exact', species: hit, confidence };
  }

  const fuzzyNeedle = cn || en || sci;
  if (fuzzyNeedle) {
    const hit = db.find((s) => {
      const fields = [s.chineseName, s.englishName, s.scientificName].map(norm);
      return fields.some((f) => f.includes(fuzzyNeedle) || fuzzyNeedle.includes(f));
    });
    if (hit) return { matched: true, matchType: 'fuzzy', species: hit, confidence };
  }

  return { matched: false, matchType: 'none', species: null, confidence };
};
