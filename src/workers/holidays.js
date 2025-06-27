// Cloudflare Worker - Complete Holiday API
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url); // 'url' is the URL object

    // CORS headers for all responses
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
    };

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: corsHeaders
      });
    }

    // Only allow GET requests
    if (request.method !== 'GET') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    try {
      // Parse query parameters
      const yearParam = url.searchParams.get('year') || new Date().getFullYear().toString();
      const countryParam = url.searchParams.get('country') || 'US';
      const includeDescription = url.searchParams.get('description') === 'true';

      // Validate year
      const yearNum = parseInt(yearParam);
      if (isNaN(yearNum) || yearNum < 2020 || yearNum > 2030) {
        return new Response(JSON.stringify({ error: 'Invalid year. Must be between 2020-2030' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Normalize country code
      const countryCode = getCountryCode(countryParam);

      // --- FIXED CACHE KEY GENERATION ---
      // Use the 'url' object (which is a URL instance) not 'request.url' (which is a string)
      const canonicalCacheUrl = new URL(url.origin + url.pathname);
      // --- END FIX ---
      
      canonicalCacheUrl.searchParams.set('year', yearNum.toString());
      canonicalCacheUrl.searchParams.set('countryCode', countryCode);
      canonicalCacheUrl.searchParams.set('description', includeDescription.toString());
      
      const cacheKeyRequest = new Request(canonicalCacheUrl.toString(), { method: 'GET' });
      // --- END FIXED CACHE KEY GENERATION ---

      // Try to get from cache first
      const cache = caches.default;
      let response = await cache.match(cacheKeyRequest);

      if (response) {
        const newResponse = new Response(response.body, response);
        Object.entries(corsHeaders).forEach(([key, value]) => {
          newResponse.headers.set(key, value);
        });
        newResponse.headers.set('X-Cache-Hit', 'true');
        return newResponse;
      }

      // Fetch holiday data
      const holidays = await fetchHolidays(yearNum.toString(), countryCode, includeDescription, env);

      // Create response
      const responseData = {
        year: yearNum,
        country: countryParam, // Original country input
        holidays: holidays,
        total: holidays.length
      };

      response = new Response(JSON.stringify(responseData, null, 2), {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=86400'
        }
      });

      ctx.waitUntil(cache.put(cacheKeyRequest, response.clone()));

      return response;

    } catch (error) {
      console.error('Worker error:', error.stack || error);
      
      return new Response(JSON.stringify({ 
        error: 'Internal server error',
        message: error.message,
        timestamp: new Date().toISOString()
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  }
};

// Main function to fetch holidays from multiple sources
async function fetchHolidays(year, countryCode, includeDescription, env) {
  const apiPromises = [
    fetchFromNager(year, countryCode).catch(e => {
      console.error('Nager API failed:', e.message);
      return [];
    })
  ];

  if (env.CALENDARIFIC_API_KEY) {
    apiPromises.push(
      fetchFromCalendarific(year, countryCode, env.CALENDARIFIC_API_KEY).catch(e => {
        console.error('Calendarific API failed:', e.message);
        return [];
      })
    );
  }

  const results = await Promise.all(apiPromises);
  const nagerHolidays = results[0] || [];
  const calendarificHolidays = results[1] || [];
  
  let holidays = [...nagerHolidays, ...calendarificHolidays];
  
  if (includeDescription && holidays.length > 0) {
    const countryName = getCountryName(countryCode);
    for (let holiday of holidays) {
      holiday.culturalInfo = getCulturalInfo(holiday.name, countryName);
    }
  }

  return removeDuplicates(holidays).sort((a, b) => 
    new Date(a.date) - new Date(b.date)
  );
}

// Fetch from Nager.Date API
async function fetchFromNager(year, countryCode) {
  const apiUrl = `https://date.nager.at/api/v3/PublicHolidays/${year}/${countryCode}`;
  
  const response = await fetch(apiUrl, {
    headers: { 'User-Agent': 'Holiday-Calendar-Worker/1.0' }
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => `Status: ${response.status}`);
    throw new Error(`Nager API error: ${response.status}. ${errorText.substring(0, 200)}`);
  }

  const data = await response.json();
  if (!Array.isArray(data)) {
      console.warn('Nager API did not return an array for', {year, countryCode});
      return [];
  }
  
  return data.map(holiday => ({
    id: `nager-${holiday.date}-${holiday.name.replace(/\s+/g, '-').toLowerCase()}`,
    name: holiday.name,
    date: holiday.date,
    country: getCountryName(countryCode),
    countryCode: countryCode,
    type: 'public',
    source: 'nager',
    localName: holiday.localName,
    global: holiday.global,
    fixed: holiday.fixed,
    description: `${holiday.name} is a public holiday in ${getCountryName(countryCode)}.`
  }));
}

// Fetch from Calendarific API
async function fetchFromCalendarific(year, countryCode, apiKey) {
  const apiUrl = `https://calendarific.com/api/v2/holidays?api_key=${apiKey}&country=${countryCode}&year=${year}`;
  
  const response = await fetch(apiUrl, {
    headers: { 'User-Agent': 'Holiday-Calendar-Worker/1.0' }
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => `Status: ${response.status}`);
    throw new Error(`Calendarific API error: ${response.status}. ${errorText.substring(0,200)}`);
  }

  const data = await response.json();
  
  if (!data.response?.holidays || !Array.isArray(data.response.holidays)) {
    if (data.meta && data.meta.error_detail) {
        console.warn(`Calendarific API returned an error for ${countryCode}, ${year}: ${data.meta.error_detail}`);
    } else {
        console.warn('Calendarific API response.holidays is missing or not an array for', {year, countryCode});
    }
    return [];
  }

  return data.response.holidays.map(holiday => ({
    id: `calendarific-${holiday.date.iso}-${holiday.name.replace(/\s+/g, '-').toLowerCase()}`,
    name: holiday.name,
    date: holiday.date.iso,
    country: getCountryName(countryCode),
    countryCode: countryCode,
    type: Array.isArray(holiday.type) ? holiday.type.join(', ') : (holiday.type || 'unknown'),
    source: 'calendarific',
    description: holiday.description || `${holiday.name} is celebrated in ${getCountryName(countryCode)}.`,
    primary_type: holiday.primary_type,
    canonical_url: holiday.canonical_url
  }));
}

// Get cultural information for holidays
function getCulturalInfo(holidayName, countryName) {
  const culturalData = new Map([
    ["new year's day", {
      origin: "Ancient Babylonian",
      significance: "Marks the beginning of the Gregorian calendar year",
      traditions: "Fireworks, resolutions, parties, family gatherings"
    }],
    ["christmas day", {
      origin: "Christian tradition",
      significance: "Celebrates the birth of Jesus Christ",
      traditions: "Gift-giving, family meals, Christmas trees, church services"
    }],
    ["independence day", {
      origin: "National liberation movements",
      significance: "Commemorates national independence",
      traditions: "Parades, fireworks, patriotic displays, national flags"
    }],
    ["labor day", {
      origin: "International workers' movement",
      significance: "Honors workers and labor rights",
      traditions: "Parades, demonstrations, workers' rallies"
    }],
    ["easter", {
      origin: "Christian tradition",
      significance: "Celebrates resurrection of Jesus Christ",
      traditions: "Easter eggs, church services, family gatherings, Easter bunny"
    }]
  ]);

  const normalizedHoliday = holidayName.toLowerCase();

  if (culturalData.has(normalizedHoliday)) {
    return culturalData.get(normalizedHoliday);
  }

  for (const [key, info] of culturalData.entries()) {
    if (normalizedHoliday.includes(key) || key.includes(normalizedHoliday)) {
      return info;
    }
  }

  return {
    origin: "Local or specific tradition",
    significance: `Important cultural or observed event in ${countryName}`,
    traditions: "Varies by region and local customs"
  };
}

// Remove duplicate holidays
function removeDuplicates(holidays) {
  const seen = new Set();
  return holidays.filter(holiday => {
    const normalizedName = holiday.name.toLowerCase().replace(/\s+/g, ' ').trim();
    const key = `${holiday.date}-${normalizedName}`;
    return seen.has(key) ? false : seen.add(key);
  });
}

// Country code mapping
function getCountryCode(country) {
  const normalizedCountry = country.toLowerCase().trim();
  const countryMap = {
    'usa': 'US',
    'united states': 'US',
    'united states of america': 'US',
    'uk': 'GB',
    'united kingdom': 'GB',
    'great britain': 'GB',
    'britain': 'GB',
    'france': 'FR',
    'germany': 'DE',
    'canada': 'CA',
    'australia': 'AU',
    'japan': 'JP',
    'india': 'IN',
    'mexico': 'MX',
    'brazil': 'BR',
    'italy': 'IT',
    'spain': 'ES',
    'netherlands': 'NL',
    'china': 'CN',
    'russia': 'RU',
    'south korea': 'KR',
    'korea': 'KR',
    'turkey': 'TR'
  };
  return countryMap[normalizedCountry] || country.toUpperCase();
}

// Country name mapping
function getCountryName(code) {
  const normalizedCode = code.toUpperCase();
  const nameMap = {
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
  return nameMap[normalizedCode] || code;
}