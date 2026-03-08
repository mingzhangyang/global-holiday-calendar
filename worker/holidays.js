// Holiday API handler
export async function handleHolidays(request, env, ctx) {
  const url = new URL(request.url);

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (request.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  try {
    const yearParam = url.searchParams.get('year') || new Date().getFullYear().toString();
    const countryParam = url.searchParams.get('country') || 'US';
    const includeDescription = url.searchParams.get('description') === 'true';

    const yearNum = parseInt(yearParam);
    if (isNaN(yearNum) || yearNum < 2020 || yearNum > 2030) {
      return new Response(JSON.stringify({ error: 'Invalid year. Must be between 2020-2030' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const countryCode = getCountryCode(countryParam);

    const canonicalCacheUrl = new URL(url.origin + url.pathname);
    canonicalCacheUrl.searchParams.set('year', yearNum.toString());
    canonicalCacheUrl.searchParams.set('countryCode', countryCode);
    canonicalCacheUrl.searchParams.set('description', includeDescription.toString());

    const cacheKeyRequest = new Request(canonicalCacheUrl.toString(), { method: 'GET' });

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

    const holidays = await fetchHolidays(yearNum.toString(), countryCode, includeDescription, env);

    const responseData = {
      year: yearNum,
      country: countryParam,
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

  const culturalObservances = await getCulturalObservances(year, countryCode);
  holidays = [...holidays, ...culturalObservances];

  holidays = holidays.map(holiday => {
    if (holiday.countryCode === 'GLOBAL' && holiday.subtype === 'astronomical') {
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
    console.warn('Nager API did not return an array for', { year, countryCode });
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

async function fetchFromCalendarific(year, countryCode, apiKey) {
  const apiUrl = `https://calendarific.com/api/v2/holidays?api_key=${apiKey}&country=${countryCode}&year=${year}`;

  const response = await fetch(apiUrl, {
    headers: { 'User-Agent': 'Holiday-Calendar-Worker/1.0' }
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => `Status: ${response.status}`);
    throw new Error(`Calendarific API error: ${response.status}. ${errorText.substring(0, 200)}`);
  }

  const data = await response.json();

  if (!data.response?.holidays || !Array.isArray(data.response.holidays)) {
    if (data.meta && data.meta.error_detail) {
      console.warn(`Calendarific API returned an error for ${countryCode}, ${year}: ${data.meta.error_detail}`);
    } else {
      console.warn('Calendarific API response.holidays is missing or not an array for', { year, countryCode });
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

async function getCulturalObservances(year, countryCode) {
  let observances = [];

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

  if (countryCode !== 'CN') {
    observances = [...observances, ...getAstronomicalEvents(year)];
  }

  return observances;
}

async function getChineseSolarTerms(year) {
  try {
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
    return [];
  }
}

function calculateAccurateSolarTermDate(year, termIndex, approxMonth, approxDay) {
  const baseYear = 2020;
  const baseYearSolarTerms = [
    { month: 2, day: 4.2 },
    { month: 2, day: 18.9 },
    { month: 3, day: 5.6 },
    { month: 3, day: 20.1 },
    { month: 4, day: 4.8 },
    { month: 4, day: 19.6 },
    { month: 5, day: 5.3 },
    { month: 5, day: 20.9 },
    { month: 6, day: 5.6 },
    { month: 6, day: 21.0 },
    { month: 7, day: 6.7 },
    { month: 7, day: 22.4 },
    { month: 8, day: 7.1 },
    { month: 8, day: 22.7 },
    { month: 9, day: 7.1 },
    { month: 9, day: 22.4 },
    { month: 10, day: 8.1 },
    { month: 10, day: 23.2 },
    { month: 11, day: 7.1 },
    { month: 11, day: 22.1 },
    { month: 12, day: 7.0 },
    { month: 12, day: 21.3 }
  ];

  const baseTerm = baseYearSolarTerms[termIndex];
  const yearDiff = year - baseYear;

  const basicDrift = yearDiff * 0.242;
  const leapYearCorrection = -Math.floor((year - 1) / 4) + Math.floor((baseYear - 1) / 4) +
    Math.floor((year - 1) / 100) - Math.floor((baseYear - 1) / 100) -
    Math.floor((year - 1) / 400) + Math.floor((baseYear - 1) / 400);
  const eccentricityEffect = yearDiff * 0.000043 * Math.sin((termIndex * 15 + 90) * Math.PI / 180);
  const precessionEffect = yearDiff * yearDiff * 0.000001;

  const yearCorrection = basicDrift + leapYearCorrection + eccentricityEffect + precessionEffect;
  const correctedDay = baseTerm.day + yearCorrection;
  const month = baseTerm.month;

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
    ["立春", { origin: "Ancient Chinese astronomical observations", significance: "Beginning of Spring - marks the start of spring season", traditions: "Spring cleaning, eating spring rolls, agricultural preparations" }],
    ["春分", { origin: "Ancient Chinese astronomical observations", significance: "Spring Equinox - day and night are equal in length", traditions: "Balancing activities, eating eggs, kite flying" }],
    ["清明", { origin: "Ancient Chinese astronomical observations", significance: "Clear and Bright - time for tomb sweeping and honoring ancestors", traditions: "Tomb sweeping, ancestor worship, spring outings" }],
    ["夏至", { origin: "Ancient Chinese astronomical observations", significance: "Summer Solstice - longest day of the year", traditions: "Eating noodles, celebrating yang energy, traditional medicine" }],
    ["秋分", { origin: "Ancient Chinese astronomical observations", significance: "Autumn Equinox - harvest time and balance", traditions: "Harvest celebrations, moon viewing, family reunions" }],
    ["冬至", { origin: "Ancient Chinese astronomical observations", significance: "Winter Solstice - longest night and return of yang energy", traditions: "Eating dumplings, family gatherings, traditional medicine" }],
    ["節分", { origin: "Japanese seasonal tradition", significance: "Seasonal transition - driving away evil spirits", traditions: "Bean throwing (mamemaki), eating ehomaki rolls" }],
    ["彼岸", { origin: "Japanese Buddhist tradition", significance: "Equinox period for honoring ancestors", traditions: "Visiting graves, offering flowers, family gatherings" }],
    ["vasant ritu", { origin: "Ancient Indian Vedic tradition", significance: "Spring season in the six-season Hindu calendar", traditions: "Holi celebrations, spring festivals, agricultural activities" }],
    ["varsha ritu", { origin: "Ancient Indian Vedic tradition", significance: "Monsoon season - crucial for agriculture", traditions: "Rain celebrations, agricultural planting, Teej festivals" }],
    ["imbolc", { origin: "Ancient Celtic tradition", significance: "Beginning of spring - lambing season", traditions: "Candle lighting, Brigid's cross making, spring cleaning" }],
    ["beltane", { origin: "Ancient Celtic tradition", significance: "Beginning of summer - fertility celebration", traditions: "Maypole dancing, bonfires, flower crowns" }],
    ["samhain", { origin: "Ancient Celtic tradition", significance: "Beginning of winter - harvest end and ancestor honoring", traditions: "Bonfires, divination, ancestor remembrance" }],
    ["dísablót", { origin: "Ancient Norse tradition", significance: "Honoring female spirits and goddesses", traditions: "Offerings to dísir, community feasts, storytelling" }],
    ["vetrnáttablót", { origin: "Ancient Norse tradition", significance: "Winter Nights - beginning of winter season", traditions: "Ancestor honoring, harvest celebrations, storytelling" }],
    ["equinox", { origin: "Astronomical phenomenon", significance: "Equal day and night - seasonal balance", traditions: "Varies by culture - balance rituals, seasonal foods" }],
    ["solstice", { origin: "Astronomical phenomenon", significance: "Longest or shortest day - seasonal extremes", traditions: "Varies by culture - light celebrations, seasonal foods" }]
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

function removeDuplicates(holidays) {
  const seen = new Set();
  return holidays.filter(holiday => {
    const normalizedName = holiday.name.toLowerCase().replace(/\s+/g, ' ').trim();
    const key = `${holiday.date}-${normalizedName}`;
    return seen.has(key) ? false : seen.add(key);
  });
}

function getCountryCode(country) {
  const normalizedCountry = country.toLowerCase().trim();
  const countryMap = {
    'usa': 'US', 'united states': 'US', 'united states of america': 'US',
    'uk': 'GB', 'united kingdom': 'GB', 'great britain': 'GB', 'britain': 'GB',
    'france': 'FR', 'germany': 'DE', 'canada': 'CA', 'australia': 'AU',
    'japan': 'JP', 'india': 'IN', 'mexico': 'MX', 'brazil': 'BR',
    'italy': 'IT', 'spain': 'ES', 'netherlands': 'NL', 'china': 'CN',
    'russia': 'RU', 'south korea': 'KR', 'korea': 'KR', 'turkey': 'TR'
  };
  return countryMap[normalizedCountry] || country.toUpperCase();
}

function getCountryName(code) {
  const nameMap = {
    'US': 'United States', 'GB': 'United Kingdom', 'FR': 'France', 'DE': 'Germany',
    'CA': 'Canada', 'AU': 'Australia', 'JP': 'Japan', 'IN': 'India',
    'MX': 'Mexico', 'BR': 'Brazil', 'IT': 'Italy', 'ES': 'Spain',
    'NL': 'Netherlands', 'CN': 'China', 'RU': 'Russia', 'KR': 'South Korea', 'TR': 'Turkey'
  };
  return nameMap[code.toUpperCase()] || code;
}
