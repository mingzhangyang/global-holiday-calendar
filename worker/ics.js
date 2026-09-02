// GET /api/holidays.ics?country=CN&scope=public&years=2
//
// A subscribable calendar feed. Calendar clients poll this URL, so holidays
// keep showing up in someone's calendar long after they last opened the site.

import { getCountryHolidays, CORS_HEADERS, parseYear } from './holidays.js';
import { getCountryName, parseCountryParams } from './countries.js';
import { SCOPE_PUBLIC, normalizeScopeParam } from '../shared/holiday-taxonomy.js';
import { compactDate, escapeIcsText, foldLine, nextDayCompact } from '../shared/ics-format.js';

const MAX_YEARS = 3;
const DEFAULT_YEARS = 2;

export async function handleIcsFeed(request, env, ctx) {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  const url = new URL(request.url);
  const countryCodes = parseCountryParams(url.searchParams, { max: 5 });

  if (countryCodes.length === 0) {
    return new Response('Missing or invalid country. Example: /api/holidays.ics?country=CN', {
      status: 400,
      headers: { 'Content-Type': 'text/plain; charset=utf-8', ...CORS_HEADERS }
    });
  }

  const scope = normalizeScopeParam(url.searchParams.get('scope'));
  const startYear = parseYear(url.searchParams.get('year')) ?? new Date().getUTCFullYear();
  const yearCount = Math.min(
    Math.max(parseInt(url.searchParams.get('years') ?? DEFAULT_YEARS, 10) || DEFAULT_YEARS, 1),
    MAX_YEARS
  );
  const years = Array.from({ length: yearCount }, (_, offset) => startYear + offset);

  const collected = await Promise.all(
    years.flatMap(year =>
      countryCodes.map(code =>
        getCountryHolidays(year, code, env, ctx).catch(error => {
          console.warn(`ICS feed skipped ${code} ${year}:`, error.message);
          return [];
        })
      )
    )
  );

  const holidays = collected
    .flat()
    .filter(holiday => (scope === 'all' ? true : holiday.scope === SCOPE_PUBLIC))
    .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));

  const calendarName = `${countryCodes.map(getCountryName).join(', ')} holidays`;
  const body = buildCalendar(holidays, calendarName);
  const filename = `holidays-${countryCodes.join('-').toLowerCase()}.ics`;

  return new Response(body, {
    headers: {
      ...CORS_HEADERS,
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': `inline; filename="${filename}"`,
      // Calendar clients re-poll on their own schedule; a day of edge cache
      // keeps that cheap without going stale in any way that matters.
      'Cache-Control': 'public, max-age=86400'
    }
  });
}

export function buildCalendar(holidays, calendarName) {
  const stamp = `${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z`;

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Global Holiday Calendar//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${escapeIcsText(calendarName)}`,
    'X-PUBLISHED-TTL:PT24H',
    'REFRESH-INTERVAL;VALUE=DURATION:PT24H'
  ];

  holidays.forEach(holiday => {
    const summary = holiday.localName && holiday.localName !== holiday.name
      ? `${holiday.name} (${holiday.localName})`
      : holiday.name;

    lines.push(
      'BEGIN:VEVENT',
      `UID:${compactDate(holiday.date)}-${encodeURIComponent(String(holiday.name).trim())}-${holiday.countryCode}@global-holiday-calendar`,
      `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${compactDate(holiday.date)}`,
      `DTEND;VALUE=DATE:${nextDayCompact(holiday.date)}`,
      `SUMMARY:${escapeIcsText(summary)}`,
      `DESCRIPTION:${escapeIcsText(holiday.description || summary)}`,
      `LOCATION:${escapeIcsText(holiday.country || holiday.countryCode)}`,
      `CATEGORIES:${escapeIcsText(holiday.type || 'holiday')}`,
      'STATUS:CONFIRMED',
      'TRANSP:TRANSPARENT',
      'END:VEVENT'
    );
  });

  lines.push('END:VCALENDAR');

  return lines.map(foldLine).join('\r\n');
}
