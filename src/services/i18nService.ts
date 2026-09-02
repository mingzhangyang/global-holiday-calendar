// 国际化服务

// 支持的语言列表
export const SUPPORTED_LANGUAGES: Record<string, string> = {
  'en': 'English',
  'fr': 'Français',
  'de': 'Deutsch',
  'es': 'Español',
  'zh-CN': '简体中文',
  'zh-TW': '繁體中文',
  'ja': '日本語',
  'ko': '한국어'
};

// 语言到地区的映射
const LANGUAGE_TO_REGION: Record<string, string[]> = {
  'en': ['US', 'GB', 'CA', 'AU', 'NZ', 'IE'],
  'fr': ['FR', 'CA', 'BE', 'CH', 'LU'],
  'de': ['DE', 'AT', 'CH', 'LU'],
  'es': ['ES', 'MX', 'AR', 'CO', 'PE', 'VE', 'CL', 'EC', 'GT', 'CU', 'BO', 'DO', 'HN', 'PY', 'SV', 'NI', 'CR', 'PA', 'UY'],
  'zh-CN': ['CN'],
  'zh-TW': ['TW', 'HK', 'MO'],
  'ja': ['JP'],
  'ko': ['KR']
};

// 多语言国家的首选语言。
// Several countries appear under more than one language above, and
// declaration order is not a fact about a country — it has to be stated.
const REGION_PRIMARY_LANGUAGE: Record<string, string> = {
  CA: 'en', // roughly three quarters anglophone
  CH: 'de', // roughly two thirds German-speaking
  LU: 'fr'  // the language Luxembourg legislates in
};

// 地区到语言的映射（首选语言优先，其余按声明顺序取第一个）
const REGION_TO_LANGUAGE: Record<string, string> = { ...REGION_PRIMARY_LANGUAGE };
Object.entries(LANGUAGE_TO_REGION).forEach(([lang, regions]) => {
  regions.forEach(region => {
    if (!REGION_TO_LANGUAGE[region]) {
      REGION_TO_LANGUAGE[region] = lang;
    }
  });
});

// 读取用户显式保存的语言偏好
function getStoredLanguage(): string | null {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return null;
  }

  try {
    const savedLanguage = localStorage.getItem('preferred-language');
    return savedLanguage && SUPPORTED_LANGUAGES[savedLanguage] ? savedLanguage : null;
  } catch (e) {
    console.warn('Error reading preferred-language from localStorage:', e);
    return null;
  }
}

/**
 * The best supported match for the browser's own language settings, or null
 * when the browser asks for nothing this app speaks. The null matters: it is
 * what lets the caller fall back to geolocation instead of silently
 * defaulting to English.
 */
function getBrowserLanguage(): string | null {
  if (typeof navigator === 'undefined') return null;

  const tags = [navigator.language, ...(navigator.languages || [])].filter(Boolean);

  for (const tag of tags) {
    if (SUPPORTED_LANGUAGES[tag]) return tag;

    const base = tag.split('-')[0];
    const matched = Object.keys(SUPPORTED_LANGUAGES).find(lang => lang.split('-')[0] === base);
    if (matched) return matched;
  }

  return null;
}

// 获取用户的首选语言
export function getUserLanguage(): string {
  return getStoredLanguage() ?? getBrowserLanguage() ?? 'en';
}

// 根据地理位置获取语言
export function getLanguageFromRegion(countryCode?: string | null): string {
  if (!countryCode) return 'en';
  
  const upperCode = countryCode.toUpperCase();
  return REGION_TO_LANGUAGE[upperCode] || 'en';
}

// 设置用户语言
export function setUserLanguage(language: string): boolean {
  if (!SUPPORTED_LANGUAGES[language]) {
    return false;
  }

  if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
    try {
      localStorage.setItem('preferred-language', language);
    } catch (e) {
      console.warn('Error saving preferred-language to localStorage:', e);
    }
  }
  return true;
}

// 获取当前语言
let currentLanguage = getUserLanguage();

export function getCurrentLanguage(): string {
  return currentLanguage;
}

// 更新当前语言
export function updateCurrentLanguage(language: string): boolean {
  if (SUPPORTED_LANGUAGES[language]) {
    currentLanguage = language;
    setUserLanguage(language);
    return true;
  }
  return false;
}

/**
 * 检测用户的默认语言（浏览器设置优先，地理位置兜底）。
 *
 * The visitor's own settings outrank where they happen to be: an
 * English-speaking Canadian must not get a French interface because Canada is
 * also a francophone country. Geolocation only answers when the browser asks
 * for a language this app does not speak.
 */
export async function detectUserLanguage(countryCode: string | null = null): Promise<string> {
  try {
    const preferred = getStoredLanguage() ?? getBrowserLanguage();
    if (preferred) return preferred;

    return getLanguageFromRegion(countryCode);
  } catch (error) {
    console.error('Error detecting user language:', error);
    return 'en'; // 默认英语
  }
}

// 获取语言的显示名称
export function getLanguageDisplayName(languageCode: string): string {
  return SUPPORTED_LANGUAGES[languageCode] || languageCode;
}

export function getLocaleFromLanguage(languageCode = 'en'): string {
  const localeMap: Record<string, string> = {
    'en': 'en-US',
    'fr': 'fr-FR',
    'de': 'de-DE',
    'es': 'es-ES',
    'zh-CN': 'zh-CN',
    'zh-TW': 'zh-TW',
    'ja': 'ja-JP',
    'ko': 'ko-KR'
  };

  return localeMap[languageCode] || 'en-US';
}

// 获取所有支持的语言
export function getSupportedLanguages(): { code: string; name: string }[] {
  return Object.entries(SUPPORTED_LANGUAGES).map(([code, name]) => ({
    code,
    name
  }));
}