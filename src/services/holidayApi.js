// Holiday API service to fetch data from Cloudflare Workers

// API routes served by the same Worker
const HOLIDAYS_WORKER_URL = '/api/holidays';
const HOLIDAY_INFO_WORKER_URL = '/api/holiday-info';

function createApiUrl(path) {
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost';
  return new URL(path, baseUrl);
}

// Cache for storing fetched holiday data
const holidayCache = new Map();
const cacheExpiry = new Map();
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
const HOLIDAY_CACHE_STORAGE_PREFIX = 'holiday-cache';

// Available countries (you can expand this list based on your worker's supported countries)
const SUPPORTED_COUNTRIES = [
  'US', 'GB', 'FR', 'DE', 'CA', 'AU', 'JP', 'IN', 'MX', 'BR', 
  'IT', 'ES', 'NL', 'CN', 'RU', 'KR', 'TR'
];

const COUNTRY_NAMES = {
  'US': 'United States',
  'GB': 'United Kingdom',
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

const SORTED_COUNTRIES = SUPPORTED_COUNTRIES.map(code => COUNTRY_NAMES[code] || code).sort();

function getStorageKey(cacheKey) {
  return `${HOLIDAY_CACHE_STORAGE_PREFIX}:${cacheKey}`;
}

function readPersistedCache(cacheKey) {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const rawValue = window.localStorage.getItem(getStorageKey(cacheKey));
    if (!rawValue) {
      return null;
    }

    const parsedValue = JSON.parse(rawValue);
    if (!parsedValue?.expiry || !Array.isArray(parsedValue?.data)) {
      return null;
    }

    return parsedValue;
  } catch (error) {
    console.warn('Error reading persisted holiday cache:', error);
    return null;
  }
}

function persistCache(cacheKey, data, expiry) {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.setItem(getStorageKey(cacheKey), JSON.stringify({ data, expiry }));
  } catch (error) {
    console.warn('Error persisting holiday cache:', error);
  }
}

function setHolidayCacheEntry(cacheKey, data, expiry = Date.now() + CACHE_DURATION) {
  holidayCache.set(cacheKey, data);
  cacheExpiry.set(cacheKey, expiry);
  persistCache(cacheKey, data, expiry);
}

function normalizeCountryCode(country) {
  const code = Object.entries(COUNTRY_NAMES).find(([, name]) => name === country)?.[0];
  return code || country;
}

function normalizeHolidayName(name) {
  return name.toLowerCase().replace(/\s+/g, ' ').trim();
}

function isDuplicateHoliday(existingName, nextName) {
  return existingName === nextName || existingName.includes(nextName) || nextName.includes(existingName);
}

/**
 * Check if cached data is still valid
 */
function isCacheValid(key) {
  const expiry = cacheExpiry.get(key);
  return expiry && Date.now() < expiry;
}

/**
 * Fetch holidays for a specific year and country from the Cloudflare Worker
 */
export async function fetchHolidaysFromWorker(year, countryCode, includeDescription = false) {
  const cacheKey = `${year}-${countryCode}-${includeDescription}`;
  
  // Check cache first
  if (isCacheValid(cacheKey) && holidayCache.has(cacheKey)) {
    return holidayCache.get(cacheKey);
  }

  const persistedCache = readPersistedCache(cacheKey);
  if (persistedCache?.expiry && persistedCache.expiry > Date.now()) {
    holidayCache.set(cacheKey, persistedCache.data);
    cacheExpiry.set(cacheKey, persistedCache.expiry);
    return persistedCache.data;
  }

  try {
    const url = createApiUrl(HOLIDAYS_WORKER_URL);
    url.searchParams.set('year', year.toString());
    url.searchParams.set('country', countryCode);
    url.searchParams.set('description', includeDescription.toString());

    const response = await fetch(url.toString());
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    // Transform the worker response to match our expected format
    const transformedHolidays = data.holidays.map(holiday => ({
      name: holiday.name,
      country: holiday.country,
      color: getHolidayColor(holiday.name, holiday.type),
      description: holiday.description,
      significance: holiday.culturalInfo?.significance || `Important holiday in ${holiday.country}`,
      customs: holiday.culturalInfo?.traditions || 'Traditional celebrations and observances',
      history: holiday.culturalInfo?.origin || 'Historical significance varies by region',
      date: holiday.date,
      type: holiday.type,
      source: holiday.source
    }));

    // Cache the result
    setHolidayCacheEntry(cacheKey, transformedHolidays);

    return transformedHolidays;
  } catch (error) {
    console.error('Error fetching holidays from worker:', error);

    if (persistedCache?.data?.length) {
      holidayCache.set(cacheKey, persistedCache.data);
      cacheExpiry.set(cacheKey, persistedCache.expiry);
      return persistedCache.data;
    }

    return [];
  }
}

/**
 * Fetch detailed information about a specific holiday
 * @param {string} holidayName - The name of the holiday
 * @param {string} country - The country code or name
 * @param {string} language - The language code for the response (e.g., 'en', 'zh-CN', 'ja')
 */
export async function fetchHolidayInfo(holidayName, country, language = 'en') {
  try {
    const response = await fetch(HOLIDAY_INFO_WORKER_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        holiday: holidayName,
        country: country,
        language: language
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.background;
  } catch (error) {
    console.error('Error fetching holiday info:', error);
    return null;
  }
}

/**
 * Get a color for a holiday based on its name and type
 */
function getHolidayColor(name, type) {
  const nameColors = {
    'new year': '#3B82F6',
    'christmas': '#DC2626',
    'easter': '#8B5CF6',
    'valentine': '#EC4899',
    'independence': '#059669',
    'labor': '#F59E0B',
    'thanksgiving': '#D97706',
    'halloween': '#7C2D12'
  };

  const typeColors = {
    'public': '#3B82F6',
    'religious': '#8B5CF6',
    'observance': '#6B7280',
    'national': '#059669'
  };

  // Check for name-based colors first
  const lowerName = name.toLowerCase();
  for (const [key, color] of Object.entries(nameColors)) {
    if (lowerName.includes(key)) {
      return color;
    }
  }

  // Fall back to type-based colors
  return typeColors[type] || '#6B7280';
}

/**
 * Get list of supported countries
 */
export function getCountries() {
  return SORTED_COUNTRIES;
}

/**
 * Get holidays for a specific date
 */
export async function getHolidaysForDate(date, selectedCountries = []) {
  const year = date.getFullYear();
  const dateStr = date.toISOString().split('T')[0];
  
  // If no countries selected, return empty array (don't fetch all countries)
  if (selectedCountries.length === 0) {
    return [];
  }
  
  const countriesToFetch = [...new Set(selectedCountries.map(normalizeCountryCode))];
  const allHolidays = [];
  const holidayResponses = await Promise.all(countriesToFetch.map(countryCode => fetchHolidaysFromWorker(year, countryCode, true)));

  holidayResponses.forEach(holidays => {
    const dayHolidays = holidays.filter(holiday => holiday.date === dateStr);

    dayHolidays.forEach(holiday => {
      const normalizedName = normalizeHolidayName(holiday.name);
      const isDuplicate = allHolidays.some(existingHoliday => isDuplicateHoliday(normalizeHolidayName(existingHoliday.name), normalizedName));

      if (!isDuplicate) {
        allHolidays.push(holiday);
      }
    });
  });

  return allHolidays;
}

/**
 * Get all holidays for a specific month
 */
export async function getHolidaysForMonth(year, month, selectedCountries = []) {
  // If no countries selected, return empty object (don't fetch all countries)
  if (selectedCountries.length === 0) {
    return {};
  }
  
  const countriesToFetch = [...new Set(selectedCountries.map(normalizeCountryCode))];

  const monthHolidays = {};

  const holidayResponses = await Promise.all(countriesToFetch.map(countryCode => fetchHolidaysFromWorker(year, countryCode, true)));

  holidayResponses.forEach(holidays => {
    holidays.forEach(holiday => {
      const holidayDate = new Date(holiday.date);
      if (holidayDate.getFullYear() === year && holidayDate.getMonth() === month) {
        const dateStr = holiday.date;
        if (!monthHolidays[dateStr]) {
          monthHolidays[dateStr] = [];
        }

        const normalizedName = normalizeHolidayName(holiday.name);
        const isDuplicate = monthHolidays[dateStr].some(existingHoliday => isDuplicateHoliday(normalizeHolidayName(existingHoliday.name), normalizedName));

        if (!isDuplicate) {
          monthHolidays[dateStr].push(holiday);
        }
      }
    });
  });

  return monthHolidays;
}

/**
 * Clear the holiday cache (useful for testing or forcing refresh)
 */
export function clearCache() {
  holidayCache.clear();
  cacheExpiry.clear();

  if (typeof window !== 'undefined') {
    Object.keys(window.localStorage)
      .filter(key => key.startsWith(`${HOLIDAY_CACHE_STORAGE_PREFIX}:`))
      .forEach(key => window.localStorage.removeItem(key));
  }
}