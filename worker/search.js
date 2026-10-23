// GET /api/holidays/search?q=diwali&year=2026
//
// Cross-country search runs at the edge, where the per-country holiday cache
// already lives. The client used to pull every supported country's full year
// into the browser just to filter it locally; now it sends the query instead.

import { getCountryHolidays, omitProse, CORS_HEADERS, parseYear } from './holidays.js';
import { parseCountryParams } from './countries.js';
import { normalizeScopeParam } from '../shared/holiday-taxonomy.js';

import { SEARCH_COUNTRY_CODES } from '../shared/search-countries.js';

const MAX_RESULTS = 30;
const MIN_QUERY_LENGTH = 2;

export async function handleHolidaySearch(request, env, ctx) {
  const url = new URL(request.url);

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  const query = (url.searchParams.get('q') || '').trim().toLowerCase();
  if (query.length < MIN_QUERY_LENGTH) {
    return jsonResponse({ query, results: [], total: 0 }, 'no-store');
  }

  const year = parseYear(url.searchParams.get('year') || new Date().getUTCFullYear().toString());
  if (year === null) {
    return jsonResponse({ error: 'Invalid year' }, 'no-store', 400);
  }

  const scope = normalizeScopeParam(url.searchParams.get('scope'));
  const requested = url.searchParams.has('countries')
    ? parseCountryParams(url.searchParams, { max: 20 })
    : SEARCH_COUNTRY_CODES;

  const cache = caches.default;
  const cacheKey = new Request(
    `https://holiday-cache.internal/search?v=2&q=${encodeURIComponent(query)}&year=${year}&scope=${scope}&countries=${requested.join(',')}`,
    { method: 'GET' }
  );

  const cached = await cache.match(cacheKey);
  if (cached) {
    const response = new Response(cached.body, cached);
    Object.entries(CORS_HEADERS).forEach(([key, value]) => response.headers.set(key, value));
    return response;
  }

  let degraded = false;
  const perCountry = await Promise.all(
    requested.map(code =>
      getCountryHolidays(year, code, env, ctx).catch(error => {
        degraded = true;
        console.warn(`Search skipped ${code}:`, error.message);
        return [];
      })
    )
  );

  const results = perCountry
    .flat()
    .filter(holiday => (scope === 'all' ? true : holiday.scope === 'public'))
    .filter(holiday =>
      holiday.name?.toLowerCase().includes(query) ||
      holiday.localName?.toLowerCase().includes(query)
    )
    .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0))
    .slice(0, MAX_RESULTS)
    .map(omitProse);

  const response = jsonResponse({
    query,
    year,
    scope,
    // This is the common-country list (or the caller's own selection), not
    // every country the calendar can show.
    searchedCountries: requested,
    results,
    total: results.length
  });

  if (!degraded) {
    const put = cache.put(cacheKey, response.clone());
    if (ctx?.waitUntil) ctx.waitUntil(put);
    else await put;
  }

  return response;
}

function jsonResponse(data, cacheControl = 'public, max-age=86400', status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...CORS_HEADERS,
      'Content-Type': 'application/json',
      'Cache-Control': cacheControl
    }
  });
}
