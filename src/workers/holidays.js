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

      // Enable caching for all years
      const cacheControl = 'public, max-age=86400';
      
      response = new Response(JSON.stringify(responseData, null, 2), {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          'Cache-Control': cacheControl
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
  
  // Add cultural observances (non-holiday cultural dates)
  const culturalObservances = await getCulturalObservances(year, countryCode);
  holidays = [...holidays, ...culturalObservances];
  
  // Convert global astronomical events to country-specific events
  // This prevents duplicates when multiple countries are selected in the frontend
  holidays = holidays.map(holiday => {
    if (holiday.countryCode === 'GLOBAL' && holiday.subtype === 'astronomical') {
      // Convert global astronomical events to country-specific events
      return {
        ...holiday,
        countryCode: countryCode,
        country: getCountryName(countryCode),
        id: `astronomical-${holiday.date.split('-')[0]}-${holiday.name.replace(/\s+/g, '-').toLowerCase()}-${countryCode}`
      };
    }
    return holiday;
  });
  
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

// Get cultural observances for different countries
async function getCulturalObservances(year, countryCode) {
  let observances = [];
  
  // Add country-specific cultural observances
  switch (countryCode) {
    case 'CN':
      observances = [...observances, ...await getChineseSolarTerms(year)];
      break;
    case 'JP':
      observances = [...observances, ...getJapaneseSeasons(year)];
      break;
    case 'IN':
      observances = [...observances, ...getIndianSeasons(year)];
      break;
    case 'GB':
    case 'IE':
      observances = [...observances, ...getCelticSeasons(year)];
      break;
    case 'NO':
    case 'SE':
    case 'DK':
    case 'IS':
      observances = [...observances, ...getNordicSeasons(year)];
      break;
  }
  
  // Add global astronomical events for all countries (except those that have their own solar terms)
  // Skip astronomical events for countries that have their own detailed solar term systems
  if (countryCode !== 'CN') {
    observances = [...observances, ...getAstronomicalEvents(year)];
  }
  
  return observances;
}

// Get Chinese solar terms (二十四节气) using consistent astronomical calculations
async function getChineseSolarTerms(year) {
  try {
    // Use consistent astronomical calculation to avoid cache inconsistencies
    // This ensures the same calculation method is always used regardless of CDN availability
    const solarTermsData = [
      { name: '立春', englishName: 'Beginning of Spring', approxMonth: 2, approxDay: 4 },
      { name: '雨水', englishName: 'Rain Water', approxMonth: 2, approxDay: 19 },
      { name: '惊蛰', englishName: 'Awakening of Insects', approxMonth: 3, approxDay: 6 },
      { name: '春分', englishName: 'Spring Equinox', approxMonth: 3, approxDay: 21 },
      { name: '清明', englishName: 'Clear and Bright', approxMonth: 4, approxDay: 5 },
      { name: '谷雨', englishName: 'Grain Rain', approxMonth: 4, approxDay: 20 },
      { name: '立夏', englishName: 'Beginning of Summer', approxMonth: 5, approxDay: 6 },
      { name: '小满', englishName: 'Grain Buds', approxMonth: 5, approxDay: 21 },
      { name: '芒种', englishName: 'Grain in Ear', approxMonth: 6, approxDay: 6 },
      { name: '夏至', englishName: 'Summer Solstice', approxMonth: 6, approxDay: 21 },
      { name: '小暑', englishName: 'Slight Heat', approxMonth: 7, approxDay: 7 },
      { name: '大暑', englishName: 'Great Heat', approxMonth: 7, approxDay: 23 },
      { name: '立秋', englishName: 'Beginning of Autumn', approxMonth: 8, approxDay: 8 },
      { name: '处暑', englishName: 'Stopping the Heat', approxMonth: 8, approxDay: 23 },
      { name: '白露', englishName: 'White Dew', approxMonth: 9, approxDay: 8 },
      { name: '秋分', englishName: 'Autumn Equinox', approxMonth: 9, approxDay: 23 },
      { name: '寒露', englishName: 'Cold Dew', approxMonth: 10, approxDay: 8 },
      { name: '霜降', englishName: 'Frost Descent', approxMonth: 10, approxDay: 24 },
      { name: '立冬', englishName: 'Beginning of Winter', approxMonth: 11, approxDay: 7 },
      { name: '小雪', englishName: 'Slight Snow', approxMonth: 11, approxDay: 22 },
      { name: '大雪', englishName: 'Great Snow', approxMonth: 12, approxDay: 7 },
      { name: '冬至', englishName: 'Winter Solstice', approxMonth: 12, approxDay: 22 }
    ];

    const solarTerms = solarTermsData.map((term, index) => {
      // Calculate accurate date using improved astronomical calculation
      const accurateDate = calculateAccurateSolarTermDate(year, index, term.approxMonth, term.approxDay);
      const dateStr = accurateDate.toISOString().split('T')[0];
      
      return {
        id: `solar-term-${year}-${term.name}`,
        name: `${term.name} (${term.englishName})`,
        date: dateStr,
        country: 'China',
        countryCode: 'CN',
        type: 'cultural-observance',
        subtype: 'solar-term',
        source: 'astronomical-calculation',
        localName: term.name,
        englishName: term.englishName,
        description: `${term.name} (${term.englishName}) is one of the 24 solar terms in the traditional Chinese calendar, marking important agricultural and seasonal transitions. This is a cultural observance, not a public holiday.`,
        culturalInfo: {
          origin: "Ancient Chinese astronomical observations",
          significance: "Marks seasonal transitions and agricultural activities in traditional Chinese culture",
          traditions: "Agricultural planning, seasonal foods, traditional medicine practices"
        }
      };
    });
    
    return solarTerms;
    
  } catch (error) {
    console.error('Error calculating solar terms:', error);
    // Return empty array if calculation fails
    return [];
  }
}

// More accurate solar term calculation based on astronomical data
function calculateAccurateSolarTermDate(year, termIndex, approxMonth, approxDay) {
  // 优化的节气计算算法 - 减少CPU使用时间
  // 使用预计算的修正值和简化的天文公式
  
  // 基准年份的精确节气日期（2020年）
  const baseYear = 2020;
  const baseYearSolarTerms = [
    { month: 2, day: 4.2 },   // 立春
    { month: 2, day: 18.9 },  // 雨水
    { month: 3, day: 5.6 },   // 惊蛰
    { month: 3, day: 20.1 },  // 春分
    { month: 4, day: 4.8 },   // 清明
    { month: 4, day: 19.6 },  // 谷雨
    { month: 5, day: 5.3 },   // 立夏
    { month: 5, day: 20.9 },  // 小满
    { month: 6, day: 5.6 },   // 芒种
    { month: 6, day: 21.0 },  // 夏至
    { month: 7, day: 6.7 },   // 小暑
    { month: 7, day: 22.4 },  // 大暑
    { month: 8, day: 7.1 },   // 立秋
    { month: 8, day: 22.7 },  // 处暑
    { month: 9, day: 7.1 },   // 白露
    { month: 9, day: 22.4 },  // 秋分
    { month: 10, day: 8.1 },  // 寒露
    { month: 10, day: 23.2 }, // 霜降
    { month: 11, day: 7.1 },  // 立冬
    { month: 11, day: 22.1 }, // 小雪
    { month: 12, day: 7.0 },  // 大雪
    { month: 12, day: 21.3 }  // 冬至
  ];
  
  const baseTerm = baseYearSolarTerms[termIndex];
  const yearDiff = year - baseYear;
  
  // 简化的年度修正公式
  // 考虑地球轨道的长期变化和闰年效应
  let yearCorrection = 0;
  
  // 基本年度漂移（约0.242天/年，但有复杂的周期性）
  const basicDrift = yearDiff * 0.242;
  
  // 闰年修正
  const leapYearCorrection = -Math.floor((year - 1) / 4) + Math.floor((baseYear - 1) / 4) +
                            Math.floor((year - 1) / 100) - Math.floor((baseYear - 1) / 100) -
                            Math.floor((year - 1) / 400) + Math.floor((baseYear - 1) / 400);
  
  // 轨道偏心率的长期变化（简化）
  const eccentricityEffect = yearDiff * 0.000043 * Math.sin((termIndex * 15 + 90) * Math.PI / 180);
  
  // 岁差效应（简化）
  const precessionEffect = yearDiff * yearDiff * 0.000001;
  
  yearCorrection = basicDrift + leapYearCorrection + eccentricityEffect + precessionEffect;
  
  // 计算修正后的日期
  const correctedDay = baseTerm.day + yearCorrection;
  const month = baseTerm.month;
  
  // 处理月份边界
  let finalMonth = month;
  let finalDay = Math.round(correctedDay);
  
  if (correctedDay < 1) {
    finalMonth = month - 1;
    if (finalMonth < 1) {
      finalMonth = 12;
      year = year - 1;
    }
    const daysInPrevMonth = new Date(year, finalMonth, 0).getDate();
    finalDay = daysInPrevMonth + Math.round(correctedDay);
  } else {
    const daysInMonth = new Date(year, month, 0).getDate();
    if (correctedDay > daysInMonth) {
      finalMonth = month + 1;
      if (finalMonth > 12) {
        finalMonth = 1;
        year = year + 1;
      }
      finalDay = Math.round(correctedDay - daysInMonth);
    }
  }
  
  return new Date(year, finalMonth - 1, finalDay);
}

// Get Japanese seasonal observances (二十四節気 + 雑節)
function getJapaneseSeasons(year) {
  const seasons = [
    { name: '節分', englishName: 'Setsubun', month: 2, day: 3, type: 'seasonal-transition' },
    { name: '彼岸の入り', englishName: 'Higan (Spring)', month: 3, day: 18, type: 'buddhist-observance' },
    { name: '八十八夜', englishName: 'Hachijuhachiya', month: 5, day: 2, type: 'agricultural' },
    { name: '入梅', englishName: 'Tsuyu (Rainy Season)', month: 6, day: 11, type: 'seasonal' },
    { name: '半夏生', englishName: 'Hangesho', month: 7, day: 2, type: 'agricultural' },
    { name: '土用の丑の日', englishName: 'Doyo no Ushi no Hi', month: 7, day: 25, type: 'seasonal' },
    { name: '彼岸の入り', englishName: 'Higan (Autumn)', month: 9, day: 20, type: 'buddhist-observance' }
  ];

  return seasons.map(season => ({
    id: `japanese-season-${year}-${season.name}`,
    name: `${season.name} (${season.englishName})`,
    date: new Date(year, season.month - 1, season.day).toISOString().split('T')[0],
    country: 'Japan',
    countryCode: 'JP',
    type: 'cultural-observance',
    subtype: season.type,
    source: 'japanese-calendar',
    localName: season.name,
    englishName: season.englishName,
    description: `${season.name} (${season.englishName}) is a traditional Japanese seasonal observance marking important transitions in nature and agriculture.`
  }));
}

// Get Indian seasonal observances (Ritu)
function getIndianSeasons(year) {
  const seasons = [
    { name: 'वसंत ऋतु', englishName: 'Vasant Ritu (Spring)', month: 3, day: 21 },
    { name: 'ग्रीष्म ऋतु', englishName: 'Grishma Ritu (Summer)', month: 6, day: 21 },
    { name: 'वर्षा ऋतु', englishName: 'Varsha Ritu (Monsoon)', month: 7, day: 15 },
    { name: 'शरद ऋतु', englishName: 'Sharad Ritu (Autumn)', month: 9, day: 23 },
    { name: 'शिशिर ऋतु', englishName: 'Shishir Ritu (Pre-winter)', month: 11, day: 15 },
    { name: 'शीत ऋतु', englishName: 'Sheet Ritu (Winter)', month: 12, day: 21 }
  ];

  return seasons.map(season => ({
    id: `indian-season-${year}-${season.englishName.replace(/\s+/g, '-').toLowerCase()}`,
    name: `${season.name} (${season.englishName})`,
    date: new Date(year, season.month - 1, season.day).toISOString().split('T')[0],
    country: 'India',
    countryCode: 'IN',
    type: 'cultural-observance',
    subtype: 'seasonal-ritu',
    source: 'indian-calendar',
    localName: season.name,
    englishName: season.englishName,
    description: `${season.name} (${season.englishName}) is one of the six seasons (Ritu) in the traditional Indian calendar system.`
  }));
}

// Get Celtic seasonal observances
function getCelticSeasons(year) {
  const seasons = [
    { name: 'Imbolc', englishName: 'Imbolc', month: 2, day: 1 },
    { name: 'Beltane', englishName: 'Beltane', month: 5, day: 1 },
    { name: 'Lughnasadh', englishName: 'Lughnasadh', month: 8, day: 1 },
    { name: 'Samhain', englishName: 'Samhain', month: 11, day: 1 }
  ];

  return seasons.map(season => ({
    id: `celtic-season-${year}-${season.name.toLowerCase()}`,
    name: season.name,
    date: new Date(year, season.month - 1, season.day).toISOString().split('T')[0],
    country: 'Celtic Regions',
    countryCode: 'GB',
    type: 'cultural-observance',
    subtype: 'celtic-season',
    source: 'celtic-calendar',
    localName: season.name,
    englishName: season.englishName,
    description: `${season.name} is one of the four traditional Celtic seasonal festivals marking important agricultural and spiritual transitions.`
  }));
}

// Get Nordic seasonal observances
function getNordicSeasons(year) {
  const seasons = [
    { name: 'Dísablót', englishName: 'Disablot', month: 2, day: 14 },
    { name: 'Sigrblót', englishName: 'Sigrblot', month: 4, day: 9 },
    { name: 'Vetrnáttablót', englishName: 'Winter Nights', month: 10, day: 14 },
    { name: 'Jólablót', englishName: 'Yule Blot', month: 12, day: 21 }
  ];

  return seasons.map(season => ({
    id: `nordic-season-${year}-${season.name.toLowerCase()}`,
    name: `${season.name} (${season.englishName})`,
    date: new Date(year, season.month - 1, season.day).toISOString().split('T')[0],
    country: 'Nordic Regions',
    countryCode: 'NO',
    type: 'cultural-observance',
    subtype: 'nordic-season',
    source: 'nordic-calendar',
    localName: season.name,
    englishName: season.englishName,
    description: `${season.name} (${season.englishName}) is a traditional Nordic seasonal observance from ancient Germanic traditions.`
  }));
}

// Get astronomical events (equinoxes and solstices) for all countries
function getAstronomicalEvents(year) {
  const events = [
    { name: 'Spring Equinox', month: 3, day: 20 },
    { name: 'Summer Solstice', month: 6, day: 21 },
    { name: 'Autumn Equinox', month: 9, day: 22 },
    { name: 'Winter Solstice', month: 12, day: 21 }
  ];

  return events.map(event => ({
    id: `astronomical-${year}-${event.name.replace(/\s+/g, '-').toLowerCase()}`,
    name: event.name,
    date: new Date(year, event.month - 1, event.day).toISOString().split('T')[0],
    country: 'Global',
    countryCode: 'GLOBAL',
    type: 'cultural-observance',
    subtype: 'astronomical',
    source: 'astronomical-calendar',
    localName: event.name,
    englishName: event.name,
    description: `${event.name} is an astronomical event marking important seasonal transitions observed globally.`
  }));
}

// Calculate more accurate solar term dates using astronomical formulas
function calculateSolarTermDate(year, termIndex) {
  // Base calculation using the mean solar longitude
  // Each solar term is 15 degrees apart (360/24 = 15)
  const baseJD = 2451545.0; // J2000.0 epoch
  const yearsSinceJ2000 = year - 2000;
  
  // Approximate Julian day for the solar term
  // This is a simplified calculation - in practice, more complex astronomical algorithms would be used
  const meanAnomaly = (357.5291 + 0.98560028 * yearsSinceJ2000 * 365.25) * Math.PI / 180;
  const equationOfCenter = 1.9148 * Math.sin(meanAnomaly) + 0.0200 * Math.sin(2 * meanAnomaly);
  
  // Calculate approximate date for each term
  const termLongitude = termIndex * 15; // degrees
  const dayOfYear = (termLongitude / 360) * 365.25 + equationOfCenter;
  
  const date = new Date(year, 0, 1);
  date.setDate(date.getDate() + Math.floor(dayOfYear));
  
  return date;
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
    }],
    // Chinese Solar Terms
    ["立春", {
      origin: "Ancient Chinese astronomical observations",
      significance: "Beginning of Spring - marks the start of spring season",
      traditions: "Spring cleaning, eating spring rolls, agricultural preparations"
    }],
    ["春分", {
      origin: "Ancient Chinese astronomical observations",
      significance: "Spring Equinox - day and night are equal in length",
      traditions: "Balancing activities, eating eggs, kite flying"
    }],
    ["清明", {
      origin: "Ancient Chinese astronomical observations",
      significance: "Clear and Bright - time for tomb sweeping and honoring ancestors",
      traditions: "Tomb sweeping, ancestor worship, spring outings"
    }],
    ["夏至", {
      origin: "Ancient Chinese astronomical observations",
      significance: "Summer Solstice - longest day of the year",
      traditions: "Eating noodles, celebrating yang energy, traditional medicine"
    }],
    ["秋分", {
      origin: "Ancient Chinese astronomical observations",
      significance: "Autumn Equinox - harvest time and balance",
      traditions: "Harvest celebrations, moon viewing, family reunions"
    }],
    ["冬至", {
      origin: "Ancient Chinese astronomical observations",
      significance: "Winter Solstice - longest night and return of yang energy",
      traditions: "Eating dumplings, family gatherings, traditional medicine"
    }],
    // Japanese seasonal observances
    ["節分", {
      origin: "Japanese seasonal tradition",
      significance: "Seasonal transition - driving away evil spirits",
      traditions: "Bean throwing (mamemaki), eating ehomaki rolls"
    }],
    ["彼岸", {
      origin: "Japanese Buddhist tradition",
      significance: "Equinox period for honoring ancestors",
      traditions: "Visiting graves, offering flowers, family gatherings"
    }],
    // Indian seasonal observances
    ["vasant ritu", {
      origin: "Ancient Indian Vedic tradition",
      significance: "Spring season in the six-season Hindu calendar",
      traditions: "Holi celebrations, spring festivals, agricultural activities"
    }],
    ["varsha ritu", {
      origin: "Ancient Indian Vedic tradition",
      significance: "Monsoon season - crucial for agriculture",
      traditions: "Rain celebrations, agricultural planting, Teej festivals"
    }],
    // Celtic seasonal observances
    ["imbolc", {
      origin: "Ancient Celtic tradition",
      significance: "Beginning of spring - lambing season",
      traditions: "Candle lighting, Brigid's cross making, spring cleaning"
    }],
    ["beltane", {
      origin: "Ancient Celtic tradition",
      significance: "Beginning of summer - fertility celebration",
      traditions: "Maypole dancing, bonfires, flower crowns"
    }],
    ["samhain", {
      origin: "Ancient Celtic tradition",
      significance: "Beginning of winter - harvest end and ancestor honoring",
      traditions: "Bonfires, divination, ancestor remembrance"
    }],
    // Nordic seasonal observances
    ["dísablót", {
      origin: "Ancient Norse tradition",
      significance: "Honoring female spirits and goddesses",
      traditions: "Offerings to dísir, community feasts, storytelling"
    }],
    ["vetrnáttablót", {
      origin: "Ancient Norse tradition",
      significance: "Winter Nights - beginning of winter season",
      traditions: "Ancestor honoring, harvest celebrations, storytelling"
    }],
    // Astronomical events
    ["equinox", {
      origin: "Astronomical phenomenon",
      significance: "Equal day and night - seasonal balance",
      traditions: "Varies by culture - balance rituals, seasonal foods"
    }],
    ["solstice", {
      origin: "Astronomical phenomenon",
      significance: "Longest or shortest day - seasonal extremes",
      traditions: "Varies by culture - light celebrations, seasonal foods"
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