import { handleHolidays } from './holidays.js';
import { handleHolidayInfo } from './holiday-info.js';

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const pathname = url.pathname;

    // Route API requests to the appropriate handlers
    if (pathname === '/api/holidays') {
      return handleHolidays(request, env, ctx);
    }

    if (pathname === '/api/holiday-info') {
      return handleHolidayInfo(request, env);
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
