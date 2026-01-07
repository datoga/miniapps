/**
 * Profession Content Translations
 *
 * Loads and provides access to translated profession content.
 * Falls back to English if Spanish translation is missing.
 */

import enTranslations from "../../content/translations/en.json";
import esTranslations from "../../content/translations/es.json";

type TranslationKey = string;
type Translations = Record<TranslationKey, string>;

const translations: Record<string, Translations> = {
  en: enTranslations as Translations,
  es: esTranslations as Translations,
};

/**
 * Get a translated string by key
 * Falls back to English if the Spanish translation is empty or missing
 */
export function t(key: TranslationKey, locale: string): string {
  const localeTranslations = translations[locale];

  // Try the requested locale first
  if (localeTranslations && localeTranslations[key]) {
    return localeTranslations[key];
  }

  // Fall back to English
  const enTranslations = translations["en"];
  if (enTranslations) {
    const fallback = enTranslations[key];
    if (fallback) {
      return fallback;
    }
  }

  // Return the key if nothing found (for debugging)
  console.warn(`Missing translation: ${key}`);
  return key;
}

/**
 * Get multiple translated strings by keys
 */
export function tMany(keys: TranslationKey[], locale: string): string[] {
  return keys.map(key => t(key, locale));
}

/**
 * Create a scoped translator for a specific locale
 */
export function createTranslator(locale: string) {
  return {
    t: (key: TranslationKey) => t(key, locale),
    tMany: (keys: TranslationKey[]) => tMany(keys, locale),
  };
}

