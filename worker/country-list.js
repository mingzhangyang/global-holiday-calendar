// GET /api/countries — the country picker's source of truth.
//
// Backed by Nager's AvailableCountries list so the picker can never offer a
// country the holiday API cannot answer for. `popular` marks the curated
// short list the UI shows first.

import { fetchSupportedCountries } from './countries.js';
import { CORS_HEADERS } from './holidays.js';

// v2: the list is now a union with the curated whitelist, not an
// intersection with Nager's coverage.
const CACHE_KEY = 'https://holiday-cache.internal/countries?v=2';

export async function handleCountries(request, env, ctx) {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  if (request.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
    });
  }

  const cache = caches.default;
  const cacheKey = new Request(CACHE_KEY, { method: 'GET' });

  const cached = await cache.match(cacheKey);
  if (cached) {
    const response = new Response(cached.body, cached);
    Object.entries(CORS_HEADERS).forEach(([key, value]) => response.headers.set(key, value));
    return response;
  }

  const { countries, source } = await fetchSupportedCountries();
  const body = JSON.stringify({ countries, total: countries.length, source });

  const response = new Response(body, {
    headers: {
      ...CORS_HEADERS,
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=604800'
    }
  });

  if (source === 'nager') {
    const put = cache.put(cacheKey, response.clone());
    if (ctx?.waitUntil) ctx.waitUntil(put);
    else await put;
  }

  return response;
}
