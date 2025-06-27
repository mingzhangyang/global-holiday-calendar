// Holiday API service to fetch data from Cloudflare Workers

// Cloudflare Worker URLs
const HOLIDAYS_WORKER_URL = import.meta.env.VITE_HOLIDAYS_WORKER_URL || 'https://holidays.orangely.workers.dev';
const HOLIDAY_INFO_WORKER_URL = import.meta.env.VITE_HOLIDAY_INFO_WORKER_URL || 'https://holiday-info.orangely.workers.dev';

// Cache for storing fetched holiday data
const holidayCache = new Map();
const cacheExpiry = new Map();
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

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

  try {
    const url = new URL(HOLIDAYS_WORKER_URL);
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
    holidayCache.set(cacheKey, transformedHolidays);
    cacheExpiry.set(cacheKey, Date.now() + CACHE_DURATION);

    return transformedHolidays;
  } catch (error) {
    console.error('Error fetching holidays from worker:', error);
    return [];
  }
}

/**
 * Fetch detailed information about a specific holiday
 */
export async function fetchHolidayInfo(holidayName, country) {
  try {
    const response = await fetch(HOLIDAY_INFO_WORKER_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        holiday: holidayName,
        country: country
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
  return SUPPORTED_COUNTRIES.map(code => COUNTRY_NAMES[code] || code).sort();
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
  
  const countriesToFetch = selectedCountries.map(country => {
    // Convert country name back to code if needed
    const code = Object.entries(COUNTRY_NAMES).find(([, name]) => name === country)?.[0];
    return code || country;
  });

  const allHolidays = [];
  
  // Fetch holidays for each country
  for (const countryCode of countriesToFetch) {
    try {
      const holidays = await fetchHolidaysFromWorker(year, countryCode, true);
      const dayHolidays = holidays.filter(holiday => holiday.date === dateStr);
      
      // Add holidays with deduplication
      dayHolidays.forEach(holiday => {
        const normalizedName = holiday.name.toLowerCase().replace(/\s+/g, ' ').trim();
        const isDuplicate = allHolidays.some(existingHoliday => {
          const existingNormalizedName = existingHoliday.name.toLowerCase().replace(/\s+/g, ' ').trim();
          // Check for exact match or if one name contains the other (e.g., "Spring Equinox" vs "春分 (Spring Equinox)")
          return existingNormalizedName === normalizedName || 
                 existingNormalizedName.includes(normalizedName) || 
                 normalizedName.includes(existingNormalizedName);
        });
        
        if (!isDuplicate) {
          allHolidays.push(holiday);
        }
      });
    } catch (error) {
      console.error(`Error fetching holidays for ${countryCode}:`, error);
    }
  }

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
  
  const countriesToFetch = selectedCountries.map(country => {
    // Convert country name back to code if needed
    const code = Object.entries(COUNTRY_NAMES).find(([, name]) => name === country)?.[0];
    return code || country;
  });

  const monthHolidays = {};
  
  // Fetch holidays for each country
  for (const countryCode of countriesToFetch) {
    try {
      const holidays = await fetchHolidaysFromWorker(year, countryCode, true);
      
      holidays.forEach(holiday => {
        const holidayDate = new Date(holiday.date);
        if (holidayDate.getFullYear() === year && holidayDate.getMonth() === month) {
          const dateStr = holiday.date;
          if (!monthHolidays[dateStr]) {
            monthHolidays[dateStr] = [];
          }
          
          // Check for duplicates based on normalized name and date
          const normalizedName = holiday.name.toLowerCase().replace(/\s+/g, ' ').trim();
          const isDuplicate = monthHolidays[dateStr].some(existingHoliday => {
            const existingNormalizedName = existingHoliday.name.toLowerCase().replace(/\s+/g, ' ').trim();
            // Check for exact match or if one name contains the other (e.g., "Spring Equinox" vs "春分 (Spring Equinox)")
            return existingNormalizedName === normalizedName || 
                   existingNormalizedName.includes(normalizedName) || 
                   normalizedName.includes(existingNormalizedName);
          });
          
          if (!isDuplicate) {
            monthHolidays[dateStr].push(holiday);
          }
        }
      });
    } catch (error) {
      console.error(`Error fetching holidays for ${countryCode}:`, error);
    }
  }

  return monthHolidays;
}

/**
 * Clear the holiday cache (useful for testing or forcing refresh)
 */
export function clearCache() {
  holidayCache.clear();
  cacheExpiry.clear();
}