export default function translateCategory(category, t) {
  if (!category) return '';

  // If i18n translate function is passed, try to resolve a translation key
  try {
    if (typeof t === 'function') {
      const key = `categories.${category}`;
      const translated = t(key);
      // If translation returns the key unchanged, treat as missing and fall back
      if (translated && translated !== key) return translated;
    }
  } catch (err) {
    // ignore and fall back
  }

  // Fallback: prettify the category string
  return String(category)
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
