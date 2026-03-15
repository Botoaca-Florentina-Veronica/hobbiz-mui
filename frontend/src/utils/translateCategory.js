const CATEGORY_LABEL_TO_KEY = {
  fotografie: 'photography',
  prajituri: 'pastries',
  muzica: 'music',
  reparatii: 'repairs',
  dans: 'dance',
  curatenie: 'cleaning',
  gradinarit: 'gardening',
  sport: 'sports',
  arta: 'art',
  tehnologie: 'technology',
  auto: 'auto',
  meditatii: 'tutoring'
};

const normalizeCategory = (value) =>
  String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

export default function translateCategory(category, t) {
  if (!category) return '';

  // If i18n translate function is passed, try to resolve a translation key
  try {
    if (typeof t === 'function') {
      const normalized = normalizeCategory(category);
      const mappedKey = CATEGORY_LABEL_TO_KEY[normalized];
      if (mappedKey) {
        const mappedTranslation = t(`categories.${mappedKey}`);
        if (mappedTranslation && mappedTranslation !== `categories.${mappedKey}`) {
          return mappedTranslation;
        }
      }

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
