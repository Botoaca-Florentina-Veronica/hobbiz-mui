import storage from './storage';

const KEY = 'recent_searches_v1';
const MAX_ITEMS = 8;

export async function getRecentSearches(): Promise<string[]> {
  try {
    const raw = await storage.getItemAsync(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((x): x is string => typeof x === 'string' && x.trim().length > 0);
  } catch {
    return [];
  }
}

export async function addRecentSearch(query: string): Promise<void> {
  const q = (query || '').trim();
  if (!q) return;
  try {
    const list = await getRecentSearches();
    const next = [q, ...list.filter((x) => x.toLowerCase() !== q.toLowerCase())].slice(0, MAX_ITEMS);
    await storage.setItemAsync(KEY, JSON.stringify(next));
  } catch {
    // ignore
  }
}

export async function removeRecentSearch(query: string): Promise<void> {
  try {
    const list = await getRecentSearches();
    const next = list.filter((x) => x !== query);
    await storage.setItemAsync(KEY, JSON.stringify(next));
  } catch {
    // ignore
  }
}

export async function clearRecentSearches(): Promise<void> {
  try {
    await storage.deleteItemAsync(KEY);
  } catch {
    // ignore
  }
}
