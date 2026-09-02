// 地理位置和语言检测服务
//
// 对外一律返回 ISO 3166-1 alpha-2 国家代码，与 App 其余部分保持一致。

// 语言代码到默认国家代码的映射
const LANGUAGE_TO_DEFAULT_COUNTRY: Record<string, string> = {
  'en': 'US', 'en-US': 'US', 'en-GB': 'GB', 'en-CA': 'CA', 'en-AU': 'AU',
  'en-NZ': 'NZ', 'en-IE': 'IE', 'en-IN': 'IN', 'en-ZA': 'ZA',
  'fr': 'FR', 'fr-FR': 'FR', 'fr-CA': 'CA', 'fr-BE': 'BE', 'fr-CH': 'CH',
  'de': 'DE', 'de-DE': 'DE', 'de-AT': 'AT', 'de-CH': 'CH',
  'es': 'ES', 'es-ES': 'ES', 'es-MX': 'MX', 'es-AR': 'AR', 'es-CL': 'CL',
  'es-CO': 'CO', 'es-PE': 'PE',
  'it': 'IT', 'it-IT': 'IT',
  'ja': 'JP', 'ja-JP': 'JP',
  'zh': 'CN', 'zh-CN': 'CN', 'zh-SG': 'SG', 'zh-TW': 'TW', 'zh-HK': 'HK',
  'ko': 'KR', 'ko-KR': 'KR',
  'ru': 'RU', 'ru-RU': 'RU',
  'pt': 'PT', 'pt-PT': 'PT', 'pt-BR': 'BR',
  'nl': 'NL', 'nl-NL': 'NL', 'nl-BE': 'BE',
  'tr': 'TR', 'tr-TR': 'TR',
  'pl': 'PL', 'sv': 'SE', 'nb': 'NO', 'no': 'NO', 'da': 'DK', 'fi': 'FI',
  'cs': 'CZ', 'sk': 'SK', 'hu': 'HU', 'ro': 'RO', 'bg': 'BG', 'el': 'GR',
  'uk': 'UA', 'hr': 'HR', 'sl': 'SI', 'sr': 'RS', 'is': 'IS',
  'hi': 'IN', 'hi-IN': 'IN', 'id': 'ID', 'vi': 'VN', 'th': 'TH', 'ms': 'MY',
  'fil': 'PH', 'ar': 'MA'
};

/**
 * 通过 Worker 的 /api/geo 端点获取用户所在国家
 * （基于 Cloudflare 的请求元数据，无需浏览器定位权限）
 * @returns {Promise<string|null>} 国家代码或 null
 */
export async function getUserCountryFromLocation(): Promise<string | null> {
  try {
    const response = await fetch('/api/geo');
    if (!response.ok) {
      console.warn('Failed to get country from /api/geo:', response.status);
      return null;
    }

    const data = await response.json();
    const code = String(data.country || '').toUpperCase();
    return /^[A-Z]{2}$/.test(code) ? code : null;
  } catch (error) {
    console.warn('Error getting country from /api/geo:', error);
    return null;
  }
}

/**
 * 从浏览器语言设置获取用户的首选语言
 * @returns {string} 语言代码
 */
export function getUserLanguage(): string {
  if (typeof navigator === 'undefined') return 'en-US';
  return navigator.language || navigator.languages?.[0] || 'en-US';
}

/**
 * 根据语言代码获取默认国家代码
 * @param {string} language 语言代码
 * @returns {string} 国家代码
 */
export function getDefaultCountryFromLanguage(language: string): string {
  if (LANGUAGE_TO_DEFAULT_COUNTRY[language]) {
    return LANGUAGE_TO_DEFAULT_COUNTRY[language];
  }

  const languageOnly = String(language || '').split('-')[0];
  return LANGUAGE_TO_DEFAULT_COUNTRY[languageOnly] || 'US';
}

/**
 * 获取用户的默认国家代码
 * 优先级：Cloudflare 地理位置 > 浏览器语言 > US
 * @returns {Promise<string>} 国家代码
 */
export async function getUserDefaultCountry(): Promise<string> {
  try {
    const countryCode = await getUserCountryFromLocation();
    if (countryCode) {
      return countryCode;
    }

    return getDefaultCountryFromLanguage(getUserLanguage());
  } catch (error) {
    console.warn('Error getting user default country:', error);
    return 'US';
  }
}
