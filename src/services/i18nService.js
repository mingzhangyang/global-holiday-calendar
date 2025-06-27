// 国际化服务

// 支持的语言列表
export const SUPPORTED_LANGUAGES = {
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
const LANGUAGE_TO_REGION = {
  'en': ['US', 'GB', 'CA', 'AU', 'NZ', 'IE'],
  'fr': ['FR', 'CA', 'BE', 'CH', 'LU'],
  'de': ['DE', 'AT', 'CH', 'LU'],
  'es': ['ES', 'MX', 'AR', 'CO', 'PE', 'VE', 'CL', 'EC', 'GT', 'CU', 'BO', 'DO', 'HN', 'PY', 'SV', 'NI', 'CR', 'PA', 'UY'],
  'zh-CN': ['CN'],
  'zh-TW': ['TW', 'HK', 'MO'],
  'ja': ['JP'],
  'ko': ['KR']
};

// 地区到语言的映射
const REGION_TO_LANGUAGE = {};
Object.entries(LANGUAGE_TO_REGION).forEach(([lang, regions]) => {
  regions.forEach(region => {
    REGION_TO_LANGUAGE[region] = lang;
  });
});

// 获取用户的首选语言
export function getUserLanguage() {
  // 首先检查localStorage中保存的语言设置
  const savedLanguage = localStorage.getItem('preferred-language');
  if (savedLanguage && SUPPORTED_LANGUAGES[savedLanguage]) {
    return savedLanguage;
  }

  // 获取浏览器语言
  const browserLanguage = navigator.language || navigator.languages?.[0] || 'en';
  
  // 尝试精确匹配
  if (SUPPORTED_LANGUAGES[browserLanguage]) {
    return browserLanguage;
  }
  
  // 尝试匹配语言部分（忽略地区）
  const languageOnly = browserLanguage.split('-')[0];
  const matchedLanguage = Object.keys(SUPPORTED_LANGUAGES).find(lang => 
    lang.split('-')[0] === languageOnly
  );
  
  if (matchedLanguage) {
    return matchedLanguage;
  }
  
  // 默认返回英语
  return 'en';
}

// 根据地理位置获取语言
export function getLanguageFromRegion(countryCode) {
  if (!countryCode) return 'en';
  
  const upperCode = countryCode.toUpperCase();
  return REGION_TO_LANGUAGE[upperCode] || 'en';
}

// 设置用户语言
export function setUserLanguage(language) {
  if (SUPPORTED_LANGUAGES[language]) {
    localStorage.setItem('preferred-language', language);
    return true;
  }
  return false;
}

// 获取当前语言
let currentLanguage = getUserLanguage();

export function getCurrentLanguage() {
  return currentLanguage;
}

// 更新当前语言
export function updateCurrentLanguage(language) {
  if (SUPPORTED_LANGUAGES[language]) {
    currentLanguage = language;
    setUserLanguage(language);
    return true;
  }
  return false;
}

// 检测用户的默认语言（基于地理位置和浏览器设置）
export async function detectUserLanguage(countryCode = null) {
  try {
    // 如果提供了国家代码，优先使用地理位置
    if (countryCode) {
      const regionLanguage = getLanguageFromRegion(countryCode);
      if (regionLanguage && SUPPORTED_LANGUAGES[regionLanguage]) {
        console.log('Using language from region:', regionLanguage);
        return regionLanguage;
      }
    }
    
    // 否则使用浏览器语言设置
    const browserLanguage = getUserLanguage();
    console.log('Using browser language:', browserLanguage);
    return browserLanguage;
    
  } catch (error) {
    console.error('Error detecting user language:', error);
    return 'en'; // 默认英语
  }
}

// 获取语言的显示名称
export function getLanguageDisplayName(languageCode) {
  return SUPPORTED_LANGUAGES[languageCode] || languageCode;
}

// 获取所有支持的语言
export function getSupportedLanguages() {
  return Object.entries(SUPPORTED_LANGUAGES).map(([code, name]) => ({
    code,
    name
  }));
}