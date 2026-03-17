export type Locale = 'ro' | 'en' | 'es';

export type WidenStrings<T> = T extends string
  ? string
  : T extends number
    ? number
    : T extends boolean
      ? boolean
      : T extends Array<infer U>
        ? Array<WidenStrings<U>>
        : T extends object
          ? { [K in keyof T]: WidenStrings<T[K]> }
          : T;

export const defineTranslations = <T extends Record<string, unknown>>(
  translations: Record<Locale, T>
): Record<Locale, WidenStrings<T>> =>
  translations as Record<Locale, WidenStrings<T>>;

export const normalizeLocale = (locale?: string): Locale => {
  if (!locale) return 'ro';
  const lower = locale.toLowerCase();
  if (lower.startsWith('es')) return 'es';
  if (lower.startsWith('en')) return 'en';
  return 'ro';
};

export const getLocaleTranslations = <T>(
  translations: Partial<Record<Locale, T>>,
  locale?: string
): T => {
  const normalized = normalizeLocale(locale);
  return (translations[normalized] || translations.ro || translations.en) as T;
};

export const pickTranslations = (
  translations: Partial<Record<Locale, any>>,
  locale?: string
): Record<string, unknown> => getLocaleTranslations(translations, locale);
