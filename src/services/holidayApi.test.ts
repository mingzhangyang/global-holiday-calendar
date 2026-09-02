import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { Holiday } from '../types';
import { installBrowserGlobals } from '../test/browserMocks';
import {
  fetchHolidays,
  readCachedHolidayInfo,
  writeCachedHolidayInfo,
  clearCache,
  mergeAcrossCountries,
  getHolidaysForMonth,
  getUpcomingHolidays
} from './holidayApi';

function mockHolidayApi(byCountry: Record<string, Partial<Holiday>[]>) {
  return vi.fn(async (url: string) => {
    const requested = (new URL(url).searchParams.get('countries') ?? '').split(',');
    const countries = Object.fromEntries(requested.map(code => [code, byCountry[code] || []]));

    return {
      ok: true,
      json: async () => ({ year: 2026, scope: 'public', countries })
    };
  });
}

describe('holidayApi - AI info caching', () => {
  beforeEach(() => {
    installBrowserGlobals();
    clearCache();
  });

  it('writes and reads cached holiday AI info successfully', () => {
    expect(readCachedHolidayInfo('Test Holiday', 'US', 'en')).toBeNull();

    writeCachedHolidayInfo('Test Holiday', 'US', 'en', 'Detailed background.');
    expect(readCachedHolidayInfo('Test Holiday', 'US', 'en')).toBe('Detailed background.');
  });

  it('returns null for expired AI info cache entries', () => {
    const cacheKey = 'holiday-info-Old Holiday-US-en';
    globalThis.localStorage.setItem(cacheKey, 'Old cached info');
    globalThis.localStorage.setItem(
      `${cacheKey}-timestamp`,
      String(Date.now() - 8 * 24 * 60 * 60 * 1000)
    );

    expect(readCachedHolidayInfo('Old Holiday', 'US', 'en')).toBeNull();
  });
});

describe('holidayApi - empty query handling', () => {
  beforeEach(() => {
    installBrowserGlobals();
    clearCache();
  });

  it('does not call the API when no country is selected', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    await expect(getHolidaysForMonth(2026, 0, [])).resolves.toEqual({
      holidaysByDate: {},
      failedCountries: []
    });
    await expect(getUpcomingHolidays({ countries: [] })).resolves.toEqual([]);

    expect(fetchMock).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });
});

describe('holidayApi - month data is fetched once per country', () => {
  beforeEach(() => {
    installBrowserGlobals();
    clearCache();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('batches countries into a single request and serves later calls from cache', async () => {
    const fetchMock = mockHolidayApi({
      US: [{ name: "New Year's Day", date: '2026-01-01', countryCode: 'US', type: 'public', scope: 'public' }],
      GB: [{ name: "New Year's Day", date: '2026-01-01', countryCode: 'GB', type: 'public', scope: 'public' }]
    });
    vi.stubGlobal('fetch', fetchMock);

    const first = await getHolidaysForMonth(2026, 0, ['US', 'GB']);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(Object.keys(first.holidaysByDate)).toEqual(['2026-01-01']);

    // The same day reported by both countries collapses into one entry that
    // remembers where it applies.
    expect(first.holidaysByDate['2026-01-01']).toHaveLength(1);
    expect(first.holidaysByDate['2026-01-01'][0].countryCodes.slice().sort()).toEqual(['GB', 'US']);

    await getHolidaysForMonth(2026, 0, ['US', 'GB']);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('keeps the countries that resolved when the request fails', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, status: 503 })));

    const { holidaysByDate, failedCountries } = await getHolidaysForMonth(2026, 0, ['US']);

    expect(holidaysByDate).toEqual({});
    expect(failedCountries).toEqual(['US']);
  });

  it('looks into the following year for upcoming holidays', async () => {
    const fetchMock = vi.fn(async (url: string) => {
      const params = new URL(url).searchParams;
      const year = params.get('year');
      const countries = (params.get('countries') ?? '').split(',');

      const holidays = year === '2027'
        ? [{ name: "New Year's Day", date: '2027-01-01', countryCode: 'US', type: 'public', scope: 'public' }]
        : [];

      return {
        ok: true,
        json: async () => ({ countries: Object.fromEntries(countries.map(code => [code, holidays])) })
      };
    });
    vi.stubGlobal('fetch', fetchMock);

    const upcoming = await getUpcomingHolidays({
      fromDate: new Date(2026, 11, 28),
      countries: ['US'],
      limit: 1
    });

    expect(upcoming).toHaveLength(1);
    expect(upcoming[0].date).toBe('2027-01-01');
  });
});

/** Test fixtures only carry the fields the merge actually reads. */
function asHolidays(records: Partial<Holiday>[]): Holiday[] {
  return records.map(record => ({ type: 'public', scope: 'public', ...record }) as Holiday);
}

describe('mergeAcrossCountries', () => {
  it('merges identical holidays and keeps every country code', () => {
    const merged = mergeAcrossCountries(asHolidays([
      { name: 'Christmas Day', date: '2026-12-25', countryCode: 'US', countryCodes: ['US'] },
      { name: 'Christmas day', date: '2026-12-25', countryCode: 'GB', countryCodes: ['GB'] },
      { name: 'Boxing Day', date: '2026-12-26', countryCode: 'GB', countryCodes: ['GB'] }
    ]));

    expect(merged).toHaveLength(2);
    expect(merged[0].countryCodes).toEqual(['US', 'GB']);
  });

  it('keeps different holidays that fall on the same date apart', () => {
    const merged = mergeAcrossCountries(asHolidays([
      { name: 'Constitution Day', date: '2026-05-03', countryCode: 'PL', countryCodes: ['PL'] },
      { name: 'Golden Week', date: '2026-05-03', countryCode: 'JP', countryCodes: ['JP'] }
    ]));

    expect(merged).toHaveLength(2);
  });
});

describe('holidayApi - cache identity', () => {
  beforeEach(() => {
    installBrowserGlobals();
    clearCache();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('does not let a prose-free payload answer a request that wants prose', async () => {
    const fetchMock = mockHolidayApi({
      DE: [{ date: '2026-01-01', name: "New Year's Day", type: 'public', scope: 'public' }]
    });
    vi.stubGlobal('fetch', fetchMock);

    await fetchHolidays({ year: 2026, countries: ['DE'], includeDescription: false });
    await fetchHolidays({ year: 2026, countries: ['DE'], includeDescription: true });

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('lets a full payload answer a prose-free request', async () => {
    const fetchMock = mockHolidayApi({
      DE: [{ date: '2026-01-01', name: "New Year's Day", type: 'public', scope: 'public' }]
    });
    vi.stubGlobal('fetch', fetchMock);

    await fetchHolidays({ year: 2026, countries: ['DE'], includeDescription: true });
    await fetchHolidays({ year: 2026, countries: ['DE'], includeDescription: false });

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});

describe('holidayApi - partial failures', () => {
  beforeEach(() => {
    installBrowserGlobals();
    clearCache();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('reports a country the Worker could not answer for instead of showing it empty', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({
      ok: true,
      json: async () => ({
        year: 2026,
        scope: 'public',
        countries: {
          DE: [{ date: '2026-01-01', name: "New Year's Day", type: 'public', scope: 'public' }]
        },
        failed: ['JP']
      })
    })));

    const { byCountry, failedCountries } = await fetchHolidays({
      year: 2026,
      countries: ['DE', 'JP']
    });

    expect(byCountry.DE).toHaveLength(1);
    expect(byCountry.JP).toBeUndefined();
    expect(failedCountries).toEqual(['JP']);
  });
});
