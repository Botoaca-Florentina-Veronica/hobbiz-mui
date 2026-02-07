export type SearchIndexItem = {
  _id: string;
  title?: string;
  description?: string;
  category?: string;
  location?: string;
  price?: number;
  images?: string[];
};

export function normalizeForSearch(value: string): string {
  const s = String(value ?? '')
    .trim()
    .toLowerCase();

  // NFD splits base chars + diacritics; then strip combining marks.
  // Works well for Romanian (ăâîșț) and is lightweight for mobile.
  return s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ');
}

export function tokenizeForSearch(value: string): string[] {
  const normalized = normalizeForSearch(value);
  if (!normalized) return [];

  // Split on non-alphanumeric after diacritic folding.
  // This keeps it fast and predictable across platforms.
  return normalized
    .split(/[^a-z0-9]+/g)
    .map(t => t.trim())
    .filter(Boolean);
}

function levenshteinDistance(a: string, b: string, maxDistance: number): number {
  if (a === b) return 0;
  const aLen = a.length;
  const bLen = b.length;
  if (aLen === 0) return bLen;
  if (bLen === 0) return aLen;
  if (Math.abs(aLen - bLen) > maxDistance) return maxDistance + 1;

  // Ensure a is the shorter string.
  if (aLen > bLen) return levenshteinDistance(b, a, maxDistance);

  let prev = new Array(aLen + 1);
  let curr = new Array(aLen + 1);

  for (let i = 0; i <= aLen; i++) prev[i] = i;

  for (let j = 1; j <= bLen; j++) {
    curr[0] = j;
    const bj = b.charCodeAt(j - 1);

    let rowMin = curr[0];
    for (let i = 1; i <= aLen; i++) {
      const cost = a.charCodeAt(i - 1) === bj ? 0 : 1;
      const del = prev[i] + 1;
      const ins = curr[i - 1] + 1;
      const sub = prev[i - 1] + cost;
      const v = del < ins ? (del < sub ? del : sub) : (ins < sub ? ins : sub);
      curr[i] = v;
      if (v < rowMin) rowMin = v;
    }

    if (rowMin > maxDistance) return maxDistance + 1;

    const tmp = prev;
    prev = curr;
    curr = tmp;
  }

  return prev[aLen];
}

function tokenMaxEdits(token: string): number {
  const len = token.length;
  if (len <= 3) return 0;
  if (len <= 5) return 1;
  if (len <= 8) return 2;
  return 3;
}

export function rankSearchSuggestions<T extends SearchIndexItem>(
  items: T[],
  query: string,
  options?: { limit?: number }
): T[] {
  const limit = Math.max(1, Math.min(options?.limit ?? 20, 50));
  const qNorm = normalizeForSearch(query);
  const qTokens = tokenizeForSearch(query);
  if (!qNorm || qTokens.length === 0) return [];

  const scored: Array<{ item: T; score: number }> = [];

  for (const item of items) {
    const title = item.title || item.description || '';
    const category = item.category || '';
    const location = item.location || '';

    const titleNorm = normalizeForSearch(title);
    const categoryNorm = normalizeForSearch(category);
    const locationNorm = normalizeForSearch(location);

    const titleTokens = tokenizeForSearch(title);
    const categoryTokens = tokenizeForSearch(category);

    // Must match all query tokens (AND), like popular apps.
    let total = 0;
    let matchedAll = true;

    for (const token of qTokens) {
      let tokenScore = -1;

      if (titleNorm.startsWith(token)) tokenScore = Math.max(tokenScore, 55);
      else if (titleTokens.some(t => t.startsWith(token))) tokenScore = Math.max(tokenScore, 48);
      else if (titleNorm.includes(token)) tokenScore = Math.max(tokenScore, 34);

      if (categoryNorm.includes(token)) tokenScore = Math.max(tokenScore, 26);
      if (locationNorm.includes(token)) tokenScore = Math.max(tokenScore, 14);

      if (tokenScore < 0) {
        // Fuzzy match: compare token to candidate tokens and accept small edit distance.
        const maxEdits = tokenMaxEdits(token);
        if (maxEdits > 0) {
          let best = maxEdits + 1;
          for (const cand of titleTokens) {
            if (Math.abs(cand.length - token.length) > maxEdits) continue;
            const d = levenshteinDistance(token, cand, maxEdits);
            if (d < best) best = d;
            if (best === 0) break;
          }
          for (const cand of categoryTokens) {
            if (Math.abs(cand.length - token.length) > maxEdits) continue;
            const d = levenshteinDistance(token, cand, maxEdits);
            if (d < best) best = d;
            if (best === 0) break;
          }

          if (best <= maxEdits) {
            tokenScore = 18 - best * 4;
          }
        }
      }

      if (tokenScore < 0) {
        matchedAll = false;
        break;
      }

      total += tokenScore;
    }

    if (!matchedAll) continue;

    // Small extra boost for matching the whole phrase early in title.
    if (titleNorm.startsWith(qNorm)) total += 20;
    else if (titleNorm.includes(qNorm)) total += 10;

    scored.push({ item, score: total });
  }

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map(s => s.item);
}
