// 地理位置和语言检测服务

// 国家代码到国家名称的映射
const COUNTRY_CODE_TO_NAME = {
  'US': 'United States',
  'GB': 'United Kingdom', 
  'UK': 'United Kingdom',
  'FR': 'France',
  'DE': 'Germany',
  'CA': 'Canada',
  'AU': 'Australia',
  'JP': 'Japan',
  'IN': 'India',
  'MX': 'Mexico',
  'BR': 'Brazil',
  'IT': 'Italy',
  'ES': 'Spain',
  'NL': 'Netherlands',
  'CN': 'China',
  'RU': 'Russia',
  'KR': 'South Korea',
  'TR': 'Turkey'
};

// 语言代码到默认国家的映射
const LANGUAGE_TO_DEFAULT_COUNTRY = {
  'en': 'United States',
  'en-US': 'United States',
  'en-GB': 'United Kingdom',
  'en-CA': 'Canada',
  'en-AU': 'Australia',
  'fr': 'France',
  'fr-FR': 'France',
  'fr-CA': 'Canada',
  'de': 'Germany',
  'de-DE': 'Germany',
  'es': 'Spain',
  'es-ES': 'Spain',
  'es-MX': 'Mexico',
  'it': 'Italy',
  'it-IT': 'Italy',
  'ja': 'Japan',
  'ja-JP': 'Japan',
  'zh': 'China',
  'zh-CN': 'China',
  'zh-TW': 'China',
  'ko': 'South Korea',
  'ko-KR': 'South Korea',
  'ru': 'Russia',
  'ru-RU': 'Russia',
  'pt': 'Brazil',
  'pt-BR': 'Brazil',
  'nl': 'Netherlands',
  'nl-NL': 'Netherlands',
  'tr': 'Turkey',
  'tr-TR': 'Turkey',
  'hi': 'India',
  'hi-IN': 'India'
};

/**
 * 使用浏览器API获取用户的地理位置
 * @returns {Promise<string|null>} 国家代码或null
 */
export async function getUserCountryFromLocation() {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      console.log('Geolocation is not supported by this browser.');
      resolve(null);
      return;
    }

    const options = {
      enableHighAccuracy: false,
      timeout: 10000,
      maximumAge: 600000 // 10分钟缓存
    };

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          
          // 使用免费的地理编码API获取国家信息
          // 这里使用BigDataCloud的免费API
          const response = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
          );
          
          if (response.ok) {
            const data = await response.json();
            const countryCode = data.countryCode;
            console.log('Detected country from location:', countryCode);
            resolve(countryCode);
          } else {
            console.error('Failed to get country from coordinates');
            resolve(null);
          }
        } catch (error) {
          console.error('Error getting country from location:', error);
          resolve(null);
        }
      },
      (error) => {
        console.log('Geolocation error:', error.message);
        resolve(null);
      },
      options
    );
  });
}

/**
 * 从浏览器语言设置获取用户的首选语言
 * @returns {string} 语言代码
 */
export function getUserLanguage() {
  // 获取用户的首选语言
  const language = navigator.language || navigator.languages?.[0] || 'en-US';
  console.log('Detected user language:', language);
  return language;
}

/**
 * 根据语言代码获取默认国家
 * @param {string} language 语言代码
 * @returns {string} 国家名称
 */
export function getDefaultCountryFromLanguage(language) {
  // 首先尝试完整的语言代码匹配
  if (LANGUAGE_TO_DEFAULT_COUNTRY[language]) {
    return LANGUAGE_TO_DEFAULT_COUNTRY[language];
  }
  
  // 如果没有找到，尝试只匹配语言部分（忽略地区）
  const languageOnly = language.split('-')[0];
  if (LANGUAGE_TO_DEFAULT_COUNTRY[languageOnly]) {
    return LANGUAGE_TO_DEFAULT_COUNTRY[languageOnly];
  }
  
  // 默认返回美国
  return 'United States';
}

/**
 * 将国家代码转换为国家名称
 * @param {string} countryCode 国家代码
 * @returns {string|null} 国家名称或null
 */
export function getCountryNameFromCode(countryCode) {
  if (!countryCode) return null;
  
  const upperCode = countryCode.toUpperCase();
  return COUNTRY_CODE_TO_NAME[upperCode] || null;
}

/**
 * 检查国家是否在支持列表中
 * @param {string} countryName 国家名称
 * @returns {boolean} 是否支持
 */
export function isCountrySupported(countryName) {
  return Object.values(COUNTRY_CODE_TO_NAME).includes(countryName);
}

/**
 * 获取用户的默认国家选择
 * 优先级：地理位置 > 语言设置 > 默认美国
 * @returns {Promise<string>} 国家名称
 */
export async function getUserDefaultCountry() {
  try {
    // 首先尝试从地理位置获取
    const countryCode = await getUserCountryFromLocation();
    if (countryCode) {
      const countryName = getCountryNameFromCode(countryCode);
      if (countryName && isCountrySupported(countryName)) {
        console.log('Using country from geolocation:', countryName);
        return countryName;
      }
    }
    
    // 如果地理位置失败或国家不支持，使用语言设置
    const language = getUserLanguage();
    const defaultCountry = getDefaultCountryFromLanguage(language);
    console.log('Using country from language:', defaultCountry);
    return defaultCountry;
    
  } catch (error) {
    console.error('Error getting user default country:', error);
    // 出错时返回默认国家
    return 'United States';
  }
}

/**
 * 获取所有支持的国家列表
 * @returns {string[]} 国家名称数组
 */
export function getSupportedCountries() {
  return Object.values(COUNTRY_CODE_TO_NAME);
}