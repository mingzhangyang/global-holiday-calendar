import { describe, it, expect, beforeAll } from 'vitest';
import { translations, t, getTranslations, loadLanguage, isLanguageLoaded } from './translations';

const SUPPORTED_LANGUAGES = ['en', 'fr', 'de', 'es', 'zh-CN', 'zh-TW', 'ja', 'ko'];

// Only English is bundled; the rest arrive as separate chunks.
beforeAll(async () => {
  await Promise.all(SUPPORTED_LANGUAGES.map(loadLanguage));
});

describe('language packs', () => {
  it('ships English eagerly and loads the others on demand', () => {
    expect(isLanguageLoaded('en')).toBe(true);
  });

  it('falls back to English for a language it cannot load', async () => {
    await expect(loadLanguage('xx')).resolves.toBe(translations.en);
  });
});

describe('translations dictionary', () => {
  it('contains all 8 supported languages', () => {
    SUPPORTED_LANGUAGES.forEach(lang => {
      expect(translations[lang], `Language ${lang} should be defined`).toBeDefined();
    });
  });

  it('has 100% key parity across all languages compared to English', () => {
    const enKeys = Object.keys(translations.en);
    expect(enKeys.length).toBeGreaterThan(50);

    SUPPORTED_LANGUAGES.forEach(lang => {
      const langKeys = Object.keys(translations[lang]);
      const missingKeys = enKeys.filter(k => !(k in translations[lang]));
      expect(missingKeys, `Language "${lang}" is missing keys: ${missingKeys.join(', ')}`).toEqual([]);
      expect(langKeys.length, `Key count mismatch in "${lang}"`).toBe(enKeys.length);
    });
  });

  it('ensures array-typed translation keys have matching item counts', () => {
    const arrayKeys = ['calendar.weekdays', 'calendar.months', 'about.usage', 'faq.items'];

    SUPPORTED_LANGUAGES.forEach(lang => {
      arrayKeys.forEach(key => {
        const enValue = translations.en[key];
        const langValue = translations[lang][key];

        expect(Array.isArray(langValue), `"${key}" in ${lang} should be an array`).toBe(true);
        expect(langValue.length, `"${key}" length in ${lang} should match English`).toBe(enValue.length);
      });
    });
  });
});

describe('t() translation helper', () => {
  it('translates existing keys properly', () => {
    expect(t('app.title', {}, 'en')).toBe('Global Holiday Calendar');
    expect(t('app.title', {}, 'zh-CN')).toBe('全球节日日历');
    expect(t('app.title', {}, 'fr')).toBe('Calendrier des Fêtes Mondiales');
  });

  it('interpolates parameters correctly into placeholders', () => {
    const resultEn = t('countryFilter.selectedCount', { count: 3, total: 50 }, 'en');
    expect(resultEn).toBe('3 of 50 countries selected');

    const resultFr = t('countryFilter.selectedCount', { count: 3, total: 50 }, 'fr');
    expect(resultFr).toBe('3 sur 50 pays sélectionnés');
  });

  it('falls back to the key itself when key does not exist', () => {
    expect(t('nonexistent.key.name', {}, 'en')).toBe('nonexistent.key.name');
  });

  it('falls back to English when language is unsupported', () => {
    expect(t('app.title', {}, 'unsupported-lang')).toBe('Global Holiday Calendar');
  });
});

describe('getTranslations()', () => {
  it('returns full dictionary for requested language or falls back to English', () => {
    expect(getTranslations('ja')).toBe(translations.ja);
    expect(getTranslations('invalid-lang')).toBe(translations.en);
  });
});
