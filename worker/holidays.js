// Holiday API handler.
//
// Contract:
//   GET /api/holidays?year=2026&country=US               → statutory days only
//   GET /api/holidays?year=2026&countries=US,GB&scope=all → batch, everything
//
// `scope` defaults to `public`: only days that actually close offices. Every
// other observance (Calendarific's observances, solar terms, equinoxes,
// regional seasonal markers) is `extended` and is returned only on request.

import { getCountryCode, getCountryName, isValidCountryCode, parseCountryParams } from './countries.js';
import {
  SCOPE_EXTENDED,
  SCOPE_PUBLIC,
  getScopeForType,
  normalizeHolidayType,
  normalizeNagerType,
  normalizeScopeParam
} from '../shared/holiday-taxonomy.js';
import { MAX_BATCH_COUNTRIES } from '../shared/api-limits.js';
import { getCulturalObservances } from './observances.js';

const MIN_YEAR = 2015;
const MAX_YEAR = 2035;
// Bumped whenever the shape or the content of a cached payload changes, so
// a deployed edge cache cannot keep serving the previous version for a day.
// v3: corrected solar-term dates.
const CACHE_VERSION = '3';

export const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Max-Age': '86400'
};

function jsonResponse(data, { status = 200, cacheControl = 'public, max-age=86400' } = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...CORS_HEADERS,
      'Content-Type': 'application/json',
      'Cache-Control': cacheControl
    }
  });
}

function errorResponse(message, status) {
  return jsonResponse({ error: message }, { status, cacheControl: 'no-store' });
}

export function parseYear(value) {
  const year = parseInt(value ?? '', 10);
  if (Number.isNaN(year)) return null;
  if (year < MIN_YEAR || year > MAX_YEAR) return null;
  return year;
}

export async function handleHolidays(request, env, ctx) {
  const url = new URL(request.url);

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  if (request.method !== 'GET') {
    return errorResponse('Method not allowed', 405);
  }

  try {
    const year = parseYear(url.searchParams.get('year') || new Date().getUTCFullYear().toString());
    if (year === null) {
      return errorResponse(`Invalid year. Must be between ${MIN_YEAR}-${MAX_YEAR}`, 400);
    }

    const isBatch = url.searchParams.has('countries');
    const countryCodes = parseCountryParams(url.searchParams, { max: MAX_BATCH_COUNTRIES });
    if (countryCodes.length === 0) {
      return errorResponse('Invalid country. Use ISO 3166-1 alpha-2 codes, e.g. country=US', 400);
    }

    const scope = normalizeScopeParam(url.searchParams.get('scope'));
    // `description=false` trims prose from the payload; the search index uses it.
    const includeDescription = url.searchParams.get('description') !== 'false';

    // One country failing must not blank the rest of the batch: a code we
    // could not answer for is reported in `failed` and left out of
    // `countries`, so the client can tell "no data" from "no holidays".
    const results = await Promise.all(
      countryCodes.map(code =>
        getCountryHolidays(year, code, env, ctx).then(
          holidays => ({ code, holidays }),
          error => {
            console.error(`Holiday lookup failed for ${code} ${year}:`, error.stack || error);
            return { code, holidays: null };
          }
        )
      )
    );

    const byCountry = {};
    const failed = [];
    let total = 0;
    results.forEach(({ code, holidays }) => {
      if (holidays === null) {
        failed.push(code);
        return;
      }
      const shaped = shapeHolidays(holidays, scope, includeDescription);
      byCountry[code] = shaped;
      total += shaped.length;
    });

    // Nothing resolved: that is a server problem, not a partial answer.
    if (failed.length === countryCodes.length) {
      return errorResponse('Holiday lookup failed', 502);
    }

    // A partial answer must not sit in the edge cache for a day.
    const responseOptions = failed.length > 0 ? { cacheControl: 'no-store' } : undefined;

    if (isBatch || countryCodes.length > 1) {
      return jsonResponse(
        { year, scope, countries: byCountry, total, ...(failed.length > 0 ? { failed } : {}) },
        responseOptions
      );
    }

    const code = countryCodes[0];
    return jsonResponse({
      year,
      scope,
      country: getCountryName(code),
      countryCode: code,
      holidays: byCountry[code],
      total
    });
  } catch (error) {
    console.error('Worker error:', error.stack || error);
    return jsonResponse(
      {
        error: 'Internal server error',
        message: error.message,
        timestamp: new Date().toISOString()
      },
      { status: 500, cacheControl: 'no-store' }
    );
  }
}

/**
 * Strip the prose fields from a holiday record (the search index does not
 * need them and they dominate the payload).
 */
export function omitProse(holiday) {
  const trimmed = { ...holiday };
  delete trimmed.description;
  delete trimmed.culturalInfo;
  return trimmed;
}

function shapeHolidays(holidays, scope, includeDescription) {
  const scoped = scope === 'all'
    ? holidays
    : holidays.filter(holiday => holiday.scope === SCOPE_PUBLIC);

  if (includeDescription) {
    return scoped;
  }

  return scoped.map(omitProse);
}

/**
 * All known holidays for one country and year, normalized and de-duplicated.
 *
 * The edge cache always holds the full (public + extended) set so switching
 * scope in the UI is a filter, not another origin fetch.
 */
export async function getCountryHolidays(year, countryCode, env, ctx) {
  const code = getCountryCode(countryCode);
  if (!isValidCountryCode(code)) {
    return [];
  }

  const cache = caches.default;
  const cacheKey = new Request(
    `https://holiday-cache.internal/holidays?year=${year}&country=${code}&v=${CACHE_VERSION}`,
    { method: 'GET' }
  );

  const cached = await cache.match(cacheKey);
  if (cached) {
    try {
      return await cached.json();
    } catch (error) {
      console.warn('Discarding unreadable holiday cache entry:', error.message);
    }
  }

  const holidays = await fetchHolidays(year, code, env);

  const cacheable = new Response(JSON.stringify(holidays), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=86400'
    }
  });

  if (ctx?.waitUntil) {
    ctx.waitUntil(cache.put(cacheKey, cacheable));
  } else {
    await cache.put(cacheKey, cacheable);
  }

  return holidays;
}

async function fetchHolidays(year, countryCode, env) {
  const sources = [
    fetchFromNager(year, countryCode).catch(error => {
      console.error('Nager API failed:', error.message);
      return [];
    })
  ];

  if (env?.CALENDARIFIC_API_KEY) {
    sources.push(
      fetchFromCalendarific(year, countryCode, env.CALENDARIFIC_API_KEY).catch(error => {
        console.error('Calendarific API failed:', error.message);
        return [];
      })
    );
  }

  const [nagerHolidays, calendarificHolidays = []] = await Promise.all(sources);
  const observances = getCulturalObservances(year, countryCode);

  const holidays = mergeHolidays([...nagerHolidays, ...calendarificHolidays, ...observances]);

  return holidays
    .map(holiday => withCulturalInfo(holiday, getCountryName(countryCode)))
    .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
}

async function fetchFromNager(year, countryCode) {
  const apiUrl = `https://date.nager.at/api/v3/PublicHolidays/${year}/${countryCode}`;

  const response = await fetch(apiUrl, {
    headers: { 'User-Agent': 'Holiday-Calendar-Worker/1.0' },
    cf: { cacheTtl: 86400, cacheEverything: true }
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => `Status: ${response.status}`);
    throw new Error(`Nager API error: ${response.status}. ${errorText.substring(0, 200)}`);
  }

  // Nager answers 204 with an empty body for countries it does not cover
  // (India, Malaysia, Thailand, Taiwan …). That is an answer, not a failure:
  // those countries are served by Calendarific and the calculated observances.
  const body = await response.text();
  if (!body.trim()) {
    return [];
  }

  const data = JSON.parse(body);
  if (!Array.isArray(data)) {
    console.warn('Nager API did not return an array for', { year, countryCode });
    return [];
  }

  const countryName = getCountryName(countryCode);

  return data.map(holiday => {
    const type = normalizeNagerType(holiday.types);
    const date = toDateOnly(holiday.date);

    return {
      id: `nager-${date}-${slug(holiday.name)}`,
      name: holiday.name,
      localName: holiday.localName || holiday.name,
      date,
      country: countryName,
      countryCode,
      type,
      scope: getScopeForType(type),
      source: 'nager',
      global: holiday.global,
      fixed: holiday.fixed,
      description: `${holiday.name} is a ${type === 'public' ? 'public holiday' : 'day observed'} in ${countryName}.`
    };
  });
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
    if (data.meta?.error_detail) {
      console.warn(`Calendarific API error for ${countryCode}, ${year}: ${data.meta.error_detail}`);
    } else {
      console.warn('Calendarific response.holidays missing or not an array for', { year, countryCode });
    }
    return [];
  }

  const countryName = getCountryName(countryCode);

  return data.response.holidays.map(holiday => {
    // Astronomical events come back as full ISO datetimes
    // ("2026-06-21T08:24:00+08:00"); keep only the calendar date.
    const date = toDateOnly(holiday.date?.iso);
    const rawType = holiday.primary_type || holiday.type;
    const type = normalizeHolidayType(rawType);

    return {
      id: `calendarific-${date}-${slug(holiday.name)}`,
      name: holiday.name,
      localName: holiday.name,
      date,
      country: countryName,
      countryCode,
      type,
      subtype: typeof holiday.primary_type === 'string' ? holiday.primary_type : undefined,
      scope: getScopeForType(type),
      source: 'calendarific',
      description: holiday.description || `${holiday.name} is observed in ${countryName}.`,
      canonical_url: holiday.canonical_url
    };
  });
}

function toDateOnly(value) {
  return typeof value === 'string' ? value.split('T')[0] : String(value ?? '');
}

function slug(value) {
  return String(value ?? '')
    .toLowerCase()
    .replace(/\s+/g, '-');
}

function normalizeName(name) {
  return String(name ?? '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

// Nager is authoritative for statutory days; Calendarific fills in the rest;
// calculated observances come last and never displace a real holiday.
const SOURCE_PRIORITY = { nager: 3, calendarific: 2 };

function sourceRank(holiday) {
  return SOURCE_PRIORITY[holiday.source] ?? 1;
}

/**
 * Overlay `winner` onto `loser`, ignoring keys the winner only declares.
 *
 * Object spread skips *missing* keys but not keys present with the value
 * `undefined`, so a plain `{...loser, ...winner}` lets a source that merely
 * mentions a field (Calendarific always writes `subtype`, sometimes as
 * undefined) erase the other source's real value.
 */
function mergeDefined(loser, winner) {
  const merged = { ...loser };

  Object.entries(winner).forEach(([key, value]) => {
    if (value !== undefined) merged[key] = value;
  });

  return merged;
}

/**
 * Collapse the same day reported by several sources into one entry, keeping
 * the highest-priority record and backfilling fields the winner lacks.
 */
export function mergeHolidays(holidays) {
  const byKey = new Map();

  holidays
    .filter(holiday => /^\d{4}-\d{2}-\d{2}$/.test(holiday.date))
    .forEach(holiday => {
      const key = `${holiday.date}-${normalizeName(holiday.name)}`;
      const existing = byKey.get(key);

      if (!existing) {
        byKey.set(key, holiday);
        return;
      }

      const winner = sourceRank(holiday) > sourceRank(existing) ? holiday : existing;
      const loser = winner === holiday ? existing : holiday;

      byKey.set(key, {
        ...mergeDefined(loser, winner),
        // A statutory classification from any source wins: Calendarific often
        // knows a day is national when Nager files it as an observance.
        type: winner.type === 'public' || loser.type === 'public' ? 'public' : winner.type,
        scope:
          winner.scope === SCOPE_PUBLIC || loser.scope === SCOPE_PUBLIC
            ? SCOPE_PUBLIC
            : SCOPE_EXTENDED,
        localName: winner.localName || loser.localName,
        description: winner.description || loser.description,
        culturalInfo: winner.culturalInfo || loser.culturalInfo
      });
    });

  return [...byKey.values()];
}

// Curated context for the handful of holidays where a generic sentence would
// be worse than nothing. Anything not listed simply has no culturalInfo and
// the client shows its own fallback copy.
const CULTURAL_INFO = new Map([
  ["new year's day", {
    origin: 'Ancient Babylonian new-year rites, fixed to 1 January by the Julian calendar',
    significance: 'Marks the beginning of the Gregorian calendar year',
    traditions: 'Fireworks, resolutions, parties, family gatherings'
  }],
  ['christmas day', {
    origin: 'Christian tradition',
    significance: 'Celebrates the birth of Jesus Christ',
    traditions: 'Gift-giving, family meals, Christmas trees, church services'
  }],
  ['independence day', {
    origin: 'National liberation movements',
    significance: 'Commemorates national independence',
    traditions: 'Parades, fireworks, patriotic displays, national flags'
  }],
  ['labour day', {
    origin: "International workers' movement",
    significance: 'Honours workers and labour rights',
    traditions: "Parades, demonstrations, workers' rallies"
  }],
  ['labor day', {
    origin: "International workers' movement",
    significance: 'Honours workers and labour rights',
    traditions: "Parades, demonstrations, workers' rallies"
  }],
  ['easter sunday', {
    origin: 'Christian tradition',
    significance: 'Celebrates the resurrection of Jesus Christ',
    traditions: 'Easter eggs, church services, family gatherings'
  }],
  ['立春', {
    origin: 'Ancient Chinese astronomical observations',
    significance: 'Beginning of Spring — the first of the 24 solar terms',
    traditions: 'Spring cleaning, eating spring rolls, agricultural preparations'
  }],
  ['春分', {
    origin: 'Ancient Chinese astronomical observations',
    significance: 'Spring Equinox — day and night are equal in length',
    traditions: 'Balancing eggs, kite flying, spring outings'
  }],
  ['清明', {
    origin: 'Ancient Chinese astronomical observations',
    significance: 'Clear and Bright — tomb sweeping and honouring ancestors',
    traditions: 'Tomb sweeping, ancestor worship, spring outings'
  }],
  ['夏至', {
    origin: 'Ancient Chinese astronomical observations',
    significance: 'Summer Solstice — the longest day of the year',
    traditions: 'Eating cold noodles, celebrating yang energy'
  }],
  ['秋分', {
    origin: 'Ancient Chinese astronomical observations',
    significance: 'Autumn Equinox — harvest time and balance',
    traditions: 'Harvest celebrations, moon viewing, family reunions'
  }],
  ['冬至', {
    origin: 'Ancient Chinese astronomical observations',
    significance: 'Winter Solstice — the longest night and the return of yang',
    traditions: 'Eating dumplings or tangyuan, family gatherings'
  }],
  ['節分', {
    origin: 'Japanese seasonal tradition',
    significance: 'Seasonal transition — driving away misfortune',
    traditions: 'Bean throwing (mamemaki), eating ehomaki rolls'
  }],
  ['imbolc', {
    origin: 'Ancient Celtic tradition',
    significance: 'Beginning of spring — the lambing season',
    traditions: "Candle lighting, Brigid's cross making, spring cleaning"
  }],
  ['beltane', {
    origin: 'Ancient Celtic tradition',
    significance: 'Beginning of summer — a fertility celebration',
    traditions: 'Maypole dancing, bonfires, flower crowns'
  }],
  ['samhain', {
    origin: 'Ancient Celtic tradition',
    significance: 'Beginning of winter — the harvest ends and ancestors are honoured',
    traditions: 'Bonfires, divination, ancestor remembrance'
  }]
]);

function withCulturalInfo(holiday, countryName) {
  if (holiday.culturalInfo) {
    return holiday;
  }

  const name = normalizeName(holiday.name);
  const localName = normalizeName(holiday.localName);

  const match =
    CULTURAL_INFO.get(name) ||
    CULTURAL_INFO.get(localName) ||
    [...CULTURAL_INFO.entries()].find(([key]) => name.includes(key) || localName.includes(key))?.[1];

  if (!match) {
    return holiday;
  }

  return { ...holiday, culturalInfo: match, country: holiday.country || countryName };
}
