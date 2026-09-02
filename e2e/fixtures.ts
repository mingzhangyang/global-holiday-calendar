import type { Page } from '@playwright/test';

/**
 * Holidays the stubbed API serves for the United States in 2026.
 */
export const US_HOLIDAYS = [
  {
    id: 'nager-2026-01-01-new-years-day',
    name: "New Year's Day",
    localName: "New Year's Day",
    date: '2026-01-01',
    countryCode: 'US',
    country: 'United States',
    type: 'public',
    scope: 'public',
    source: 'nager',
    description: "New Year's Day is a public holiday in the United States."
  },
  {
    id: 'nager-2026-01-19-martin-luther-king-jr-day',
    name: 'Martin Luther King, Jr. Day',
    localName: 'Martin Luther King, Jr. Day',
    date: '2026-01-19',
    countryCode: 'US',
    country: 'United States',
    type: 'public',
    scope: 'public',
    source: 'nager',
    description: 'Martin Luther King, Jr. Day is a public holiday in the United States.'
  },
  {
    id: 'nager-2026-02-16-presidents-day',
    name: "Washington's Birthday",
    localName: "Washington's Birthday",
    date: '2026-02-16',
    countryCode: 'US',
    country: 'United States',
    type: 'public',
    scope: 'public',
    source: 'nager',
    description: "Washington's Birthday is a public holiday in the United States."
  }
];

/**
 * Answer every API call from fixtures so a run needs no Worker and no
 * upstream holiday provider.
 */
export async function stubHolidayApi(page: Page) {
  await page.route('**/api/geo', route =>
    route.fulfill({ json: { country: 'US' } })
  );

  await page.route('**/api/countries', route =>
    route.fulfill({
      json: {
        countries: [
          { code: 'US', name: 'United States', popular: true },
          { code: 'GB', name: 'United Kingdom', popular: true },
          { code: 'JP', name: 'Japan', popular: true }
        ],
        total: 3,
        source: 'fallback'
      }
    })
  );

  await page.route('**/api/holidays?*', route => {
    const url = new URL(route.request().url());
    const year = url.searchParams.get('year');
    const codes = (url.searchParams.get('countries') || url.searchParams.get('country') || '').split(',');

    const countries = Object.fromEntries(
      codes.map(code => [code, code === 'US' && year === '2026' ? US_HOLIDAYS : []])
    );

    return route.fulfill({ json: { year: Number(year), scope: 'public', countries, total: 0 } });
  });

  await page.route('**/api/holidays/search?*', route =>
    route.fulfill({ json: { results: US_HOLIDAYS, total: US_HOLIDAYS.length } })
  );
}

/** A deterministic starting point: January 2026, United States, English. */
export const JANUARY_2026 = '/?lang=en&view=calendar&month=2026-01&countries=US&category=public';
