// 多语言翻译
//
// English ships with the app because it is the fallback for every missing
// key. The other seven packs are fetched when a visitor actually selects
// them — no one downloads eight languages to read one.

import en from './packs/en';

/** A translation value is a string, or an array for lists (weekdays, FAQ). */
export type TranslationValue = string | string[] | Record<string, string>[];
export type TranslationPack = Record<string, TranslationValue>;

const LANGUAGE_LOADERS: Record<string, () => Promise<{ default: TranslationPack }>> = {
  en: () => Promise.resolve({ default: en }),
  fr: () => import('./packs/fr'),
  de: () => import('./packs/de'),
  es: () => import('./packs/es'),
  'zh-CN': () => import('./packs/zh-CN'),
  'zh-TW': () => import('./packs/zh-TW'),
  ja: () => import('./packs/ja'),
  ko: () => import('./packs/ko')
};

// Packs that have been loaded so far. `t()` reads this synchronously and
// falls back to English until the requested pack arrives.
export const translations: Record<string, TranslationPack> = { en };

const pendingLoads = new Map<string, Promise<TranslationPack>>();

export function isLanguageLoaded(language: string): boolean {
  return Boolean(translations[language]);
}

/**
 * Load a language pack. Resolves immediately for packs already in memory,
 * and de-duplicates concurrent requests for the same language.
 */
export function loadLanguage(language: string): Promise<TranslationPack> {
  if (translations[language]) {
    return Promise.resolve(translations[language]);
  }

  const loader = LANGUAGE_LOADERS[language];
  if (!loader) {
    return Promise.resolve(translations.en);
  }

  const pending = pendingLoads.get(language);
  if (pending) {
    return pending;
  }

  const promise = loader()
    .then(module => {
      translations[language] = module.default;
      return module.default;
    })
    .catch(error => {
      console.warn(`Failed to load the ${language} translation pack:`, error);
      return translations.en;
    })
    .finally(() => {
      pendingLoads.delete(language);
    });

  pendingLoads.set(language, promise);
  return promise;
}

// 翻译函数
export function t(
  key: string,
  params: Record<string, string | number> = {},
  language = 'en'
): TranslationValue {
  const translation = translations[language]?.[key] ?? translations.en[key] ?? key;

  // 如果翻译是数组，直接返回
  if (Array.isArray(translation)) {
    return translation;
  }

  // 如果翻译不是字符串，返回原值
  if (typeof translation !== 'string') {
    return translation;
  }

  // 替换参数
  return translation.replace(/\{(\w+)\}/g, (match, paramKey: string) =>
    params[paramKey] !== undefined ? String(params[paramKey]) : match
  );
}

// 获取翻译对象
export function getTranslations(language = 'en'): TranslationPack {
  return translations[language] || translations.en;
}
