import { handleHolidays } from './holidays.js';
import { handleHolidayInfo } from './holiday-info.js';
import { handleCountries } from './country-list.js';
import { handleHolidaySearch } from './search.js';
import { handleIcsFeed } from './ics.js';
import { handleCountryMonthPage, handleSitemap, matchCountryMonthPath } from './pages.js';

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const pathname = url.pathname;

    // Route API requests to the appropriate handlers
    if (pathname === '/api/holidays') {
      return handleHolidays(request, env, ctx);
    }

    if (pathname === '/api/holidays/search') {
      return handleHolidaySearch(request, env, ctx);
    }

    if (pathname === '/api/holidays.ics') {
      return handleIcsFeed(request, env, ctx);
    }

    if (pathname === '/api/countries') {
      return handleCountries(request, env, ctx);
    }

    if (pathname === '/api/holiday-info') {
      return handleHolidayInfo(request, env, ctx);
    }

    // Country detection from Cloudflare's request metadata — avoids asking
    // visitors for browser geolocation permission just to pick a default filter.
    if (pathname === '/api/geo') {
      return new Response(JSON.stringify({ country: request.cf?.country ?? null }), {
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store'
        }
      });
    }

    // Indexable, edge-rendered country/month pages (/us/2026-01) and the
    // sitemap that advertises them. Both shadow static assets deliberately.
    if (pathname === '/sitemap.xml') {
      return handleSitemap(request);
    }

    const countryMonth = matchCountryMonthPath(pathname);
    if (countryMonth) {
      return handleCountryMonthPage(countryMonth, request, env, ctx);
    }

    // Fall through to static assets (the React SPA).
    // If the asset is not found (e.g. a client-side route like /about),
    // serve index.html so React Router can handle the path.
    const response = await env.ASSETS.fetch(request);
    if (response.status === 404) {
      return env.ASSETS.fetch(new Request(new URL('/', request.url).toString()));
    }
    return response;
  }
};
