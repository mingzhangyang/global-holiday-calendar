// Indexable, edge-rendered pages: /us/2026-01
//
// The SPA renders nothing without JavaScript, so "public holidays in Japan in
// May" was invisible to search engines. These pages answer that query as
// static HTML in one round trip, and link into the app for everything else.

import { getCountryHolidays } from './holidays.js';
import { POPULAR_COUNTRY_CODES, getCountryName, isValidCountryCode } from './countries.js';

const PATH_PATTERN = /^\/([a-zA-Z]{2})\/(\d{4})-(\d{2})\/?$/;
const SITE_ORIGIN = 'https://holidays.orangely.xyz';
// Months either side of today that the sitemap advertises.
const SITEMAP_MONTHS_BACK = 6;
const SITEMAP_MONTHS_AHEAD = 18;

export function matchCountryMonthPath(pathname) {
  const match = PATH_PATTERN.exec(pathname);
  if (!match) return null;

  const [, rawCode, rawYear, rawMonth] = match;
  const code = rawCode.toUpperCase();
  const year = Number(rawYear);
  const month = Number(rawMonth);

  if (!isValidCountryCode(code) || month < 1 || month > 12 || year < 2015 || year > 2035) {
    return null;
  }

  return { code, year, month };
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Serialize JSON-LD for embedding in a <script> block.
 *
 * A holiday name containing "</script>" would otherwise close the tag and
 * everything after it would be parsed as markup.
 */
function serializeJsonLd(data) {
  return JSON.stringify(data)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
}

function monthPath(code, year, month) {
  return `/${code.toLowerCase()}/${year}-${String(month).padStart(2, '0')}`;
}

function shiftMonth(year, month, delta) {
  const index = (year * 12 + (month - 1)) + delta;
  return { year: Math.floor(index / 12), month: (index % 12) + 1 };
}

function formatMonth(year, month, options = { month: 'long', year: 'numeric' }) {
  return new Date(Date.UTC(year, month - 1, 1)).toLocaleDateString('en-US', {
    ...options,
    timeZone: 'UTC'
  });
}

function formatDay(dateStr) {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day)).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC'
  });
}

const TYPE_LABELS = {
  public: 'Public holiday',
  religious: 'Religious observance',
  cultural: 'Cultural celebration',
  seasonal: 'Seasonal observance',
  observance: 'Observance'
};

export async function handleCountryMonthPage(match, request, env, ctx) {
  const { code, year, month } = match;
  const url = new URL(request.url);

  // One canonical spelling: lower-case country code, zero-padded month.
  const canonicalPath = monthPath(code, year, month);
  if (url.pathname !== canonicalPath) {
    return Response.redirect(`${url.origin}${canonicalPath}`, 301);
  }

  const cache = caches.default;
  const cacheKey = new Request(`${url.origin}${canonicalPath}?v=1`, { method: 'GET' });
  const cached = await cache.match(cacheKey);
  if (cached) return cached;

  const holidays = (await getCountryHolidays(year, code, env, ctx))
    .filter(holiday => holiday.date.startsWith(`${year}-${String(month).padStart(2, '0')}`));

  const html = renderCountryMonthPage({ code, year, month, holidays });

  const response = new Response(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=86400'
    }
  });

  const put = cache.put(cacheKey, response.clone());
  if (ctx?.waitUntil) ctx.waitUntil(put);
  else await put;

  return response;
}

function renderCountryMonthPage({ code, year, month, holidays }) {
  const countryName = getCountryName(code);
  const monthLabel = formatMonth(year, month);
  const title = `Public holidays in ${countryName} — ${monthLabel}`;
  const publicHolidays = holidays.filter(holiday => holiday.scope === 'public');
  const otherObservances = holidays.filter(holiday => holiday.scope !== 'public');

  const description = publicHolidays.length > 0
    ? `${publicHolidays.length} public holiday${publicHolidays.length === 1 ? '' : 's'} in ${countryName} during ${monthLabel}: ${publicHolidays.slice(0, 4).map(holiday => holiday.name).join(', ')}.`
    : `No public holidays fall in ${countryName} during ${monthLabel}.`;

  const previous = shiftMonth(year, month, -1);
  const next = shiftMonth(year, month, 1);
  const appUrl = `/?countries=${code}&month=${year}-${String(month).padStart(2, '0')}&category=public`;

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: title,
    description,
    itemListElement: publicHolidays.map((holiday, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'Event',
        name: holiday.name,
        startDate: holiday.date,
        endDate: holiday.date,
        eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
        eventStatus: 'https://schema.org/EventScheduled',
        location: {
          '@type': 'Country',
          name: countryName
        }
      }
    }))
  };

  const renderRow = holiday => `
        <li class="holiday">
          <time datetime="${escapeHtml(holiday.date)}">${escapeHtml(formatDay(holiday.date))}</time>
          <div>
            <strong>${escapeHtml(holiday.name)}</strong>
            ${holiday.localName && holiday.localName !== holiday.name ? `<span class="local">${escapeHtml(holiday.localName)}</span>` : ''}
            <span class="type type-${escapeHtml(holiday.type)}">${escapeHtml(TYPE_LABELS[holiday.type] || 'Holiday')}</span>
          </div>
        </li>`;

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)} | Global Holiday Calendar</title>
<meta name="description" content="${escapeHtml(description)}">
<link rel="canonical" href="${SITE_ORIGIN}${monthPath(code, year, month)}">
<link rel="icon" type="image/svg+xml" href="/logo.svg">
<meta property="og:title" content="${escapeHtml(title)}">
<meta property="og:description" content="${escapeHtml(description)}">
<meta property="og:type" content="website">
<meta property="og:url" content="${SITE_ORIGIN}${monthPath(code, year, month)}">
<script type="application/ld+json">${serializeJsonLd(structuredData)}</script>
<style>
  :root { color-scheme: light dark; --bg:#f8fafc; --card:#ffffff; --ink:#0f172a; --muted:#64748b; --line:#e2e8f0; --accent:#0d9488; }
  @media (prefers-color-scheme: dark) {
    :root { --bg:#020617; --card:#0f172a; --ink:#e2e8f0; --muted:#94a3b8; --line:#1e293b; }
  }
  * { box-sizing: border-box; }
  body { margin:0; background:var(--bg); color:var(--ink); font:16px/1.6 system-ui, -apple-system, "Segoe UI", sans-serif; }
  main { max-width: 44rem; margin: 0 auto; padding: 2rem 1rem 4rem; }
  h1 { font-size: 1.6rem; line-height:1.25; margin: 0 0 .5rem; }
  p.lead { color: var(--muted); margin: 0 0 1.5rem; }
  nav.months { display:flex; gap:.75rem; flex-wrap:wrap; margin-bottom:1.5rem; }
  nav.months a, .cta { display:inline-block; padding:.5rem .9rem; border-radius:999px; border:1px solid var(--line); background:var(--card); color:inherit; text-decoration:none; font-size:.9rem; }
  .cta { background: var(--accent); border-color: var(--accent); color:#fff; font-weight:600; }
  h2 { font-size:1.1rem; margin:2rem 0 .75rem; }
  ul { list-style:none; margin:0; padding:0; border:1px solid var(--line); border-radius:16px; overflow:hidden; background:var(--card); }
  li.holiday { display:flex; gap:1rem; padding:.85rem 1rem; border-bottom:1px solid var(--line); }
  li.holiday:last-child { border-bottom:0; }
  li.holiday time { flex:0 0 7.5rem; color:var(--muted); font-variant-numeric: tabular-nums; }
  .local { display:block; color:var(--muted); font-size:.9rem; }
  .type { display:inline-block; margin-top:.25rem; font-size:.75rem; padding:.1rem .5rem; border-radius:999px; border:1px solid var(--line); color:var(--muted); }
  footer { margin-top:2.5rem; color:var(--muted); font-size:.85rem; }
  footer a { color: var(--accent); }
</style>
</head>
<body>
<main>
  <h1>${escapeHtml(title)}</h1>
  <p class="lead">${escapeHtml(description)}</p>

  <nav class="months" aria-label="Nearby months">
    <a href="${monthPath(code, previous.year, previous.month)}" rel="prev">← ${escapeHtml(formatMonth(previous.year, previous.month))}</a>
    <a href="${monthPath(code, next.year, next.month)}" rel="next">${escapeHtml(formatMonth(next.year, next.month))} →</a>
    <a class="cta" href="${escapeHtml(appUrl)}">Open the interactive calendar</a>
  </nav>

  <h2>Public holidays</h2>
  ${publicHolidays.length > 0
    ? `<ul>${publicHolidays.map(renderRow).join('')}</ul>`
    : `<p>No public holidays in ${escapeHtml(countryName)} this month.</p>`}

  ${otherObservances.length > 0
    ? `<h2>Other observances</h2><ul>${otherObservances.map(renderRow).join('')}</ul>`
    : ''}

  <footer>
    <p>
      Data from <a href="https://date.nager.at">Nager.Date</a> and Calendarific.
      Subscribe in your calendar app:
      <a href="/api/holidays.ics?country=${escapeHtml(code)}">holidays.ics</a>.
    </p>
    <p><a href="${escapeHtml(appUrl)}">Global Holiday Calendar</a> — holidays, festivals and traditions worldwide.</p>
  </footer>
</main>
</body>
</html>`;
}

/**
 * Sitemap covering the app plus every indexable country/month page in a
 * rolling window around today.
 *
 * This replaces the static public/sitemap.xml — a file cannot list a window
 * that moves with the calendar.
 */
export function handleSitemap(request) {
  const origin = new URL(request.url).origin;
  const today = new Date();
  const baseYear = today.getUTCFullYear();
  const baseMonth = today.getUTCMonth() + 1;

  const urls = [`${origin}/`];

  POPULAR_COUNTRY_CODES.forEach(code => {
    for (let offset = -SITEMAP_MONTHS_BACK; offset <= SITEMAP_MONTHS_AHEAD; offset++) {
      const { year, month } = shiftMonth(baseYear, baseMonth, offset);
      urls.push(`${origin}${monthPath(code, year, month)}`);
    }
  });

  const lastmod = today.toISOString().split('T')[0];
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(url => `  <url><loc>${url}</loc><lastmod>${lastmod}</lastmod><changefreq>weekly</changefreq></url>`).join('\n')}
</urlset>`;

  return new Response(body, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=86400'
    }
  });
}
