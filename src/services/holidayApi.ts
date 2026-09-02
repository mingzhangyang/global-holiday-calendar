// Holiday data access: one request per (year, country, scope), shared by
// every view. The month grid, the list, the widgets and the search index all
// read through this module, so a month is fetched once no matter how many
// components need it.

import { toDateKey, toMonthPrefix } from '../utils/dateUtils';
import { getHolidayType } from '../utils/holidayColors';
import { toCountryCode, toCountryCodes } from './countryService';
import { MAX_BATCH_COUNTRIES } from '../../shared/api-limits.js';
import type { Holiday, HolidayLike, HolidaysByDate, RequestScope } from '../types';

interface CacheEntry {
  data: Holiday[];
  expiry: number;
}

interface FetchOptions {
  scope?: RequestScope;
  includeDescription?: boolean;
}

export interface HolidayFetchResult {
  byCountry: Record<string, Holiday[]>;
  failedCountries: string[];
}

const HOLIDAYS_WORKER_URL = '/api/holidays';
const HOLIDAY_INFO_WORKER_URL = '/api/holiday-info';

const CACHE_DURATION = 24 * 60 * 60 * 1000;
const CACHE_STORAGE_PREFIX = 'holiday-cache-v2';

const memoryCache = new Map<string, CacheEntry>();
const inFlightRequests = new Map<string, Promise<Holiday[]>>();

function createApiUrl(path: string): URL {
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost';
  return new URL(path, baseUrl);
}

// `includeDescription` is part of the key: a prose-free payload and a full
// one are different data, and sharing an entry would let a search-index fetch
// serve description-less records to the modal for the next 24 hours.
function getCacheKey(
  year: number,
  countryCode: string,
  scope: RequestScope,
  includeDescription: boolean
): string {
  return `${year}:${countryCode}:${scope}:${includeDescription ? 'full' : 'lean'}`;
}

function getStorageKey(cacheKey: string): string {
  return `${CACHE_STORAGE_PREFIX}:${cacheKey}`;
}

function readPersistedEntry(cacheKey: string): CacheEntry | null {
  if (typeof window === 'undefined') return null;

  try {
    const raw = window.localStorage.getItem(getStorageKey(cacheKey));
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed?.data) || !parsed?.expiry) return null;

    return parsed;
  } catch (error) {
    console.warn('Error reading persisted holiday cache:', error);
    return null;
  }
}

function persistEntry(cacheKey: string, data: Holiday[], expiry: number): void {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.setItem(getStorageKey(cacheKey), JSON.stringify({ data, expiry }));
  } catch (error) {
    console.warn('Error persisting holiday cache:', error);
  }
}

function setCacheEntry(cacheKey: string, data: Holiday[]): void {
  const expiry = Date.now() + CACHE_DURATION;
  memoryCache.set(cacheKey, { data, expiry });
  persistEntry(cacheKey, data, expiry);
}

function readCacheEntry(
  year: number,
  countryCode: string,
  scope: RequestScope,
  includeDescription: boolean
): Holiday[] | null {
  // Preference order: the exact payload first, then anything that is a
  // superset of it. A full-prose entry answers a prose-free request as-is,
  // and an extended entry answers a `public` one once filtered.
  const candidates: { key: string; publicOnly: boolean }[] = [
    { key: getCacheKey(year, countryCode, scope, includeDescription), publicOnly: false }
  ];

  if (!includeDescription) {
    candidates.push({ key: getCacheKey(year, countryCode, scope, true), publicOnly: false });
  }

  if (scope === 'public') {
    candidates.push({ key: getCacheKey(year, countryCode, 'all', includeDescription), publicOnly: true });

    if (!includeDescription) {
      candidates.push({ key: getCacheKey(year, countryCode, 'all', true), publicOnly: true });
    }
  }

  for (const { key, publicOnly } of candidates) {
    const cached = memoryCache.get(key) || readPersistedEntry(key);
    if (!cached || cached.expiry <= Date.now()) continue;

    memoryCache.set(key, cached);
    return publicOnly ? cached.data.filter(holiday => holiday.scope === 'public') : cached.data;
  }

  return null;
}

function normalizeScope(scope: string | undefined): RequestScope {
  return scope === 'all' || scope === 'extended' ? 'all' : 'public';
}

/**
 * Bring an API record (or a stale cache entry from an older release) into the
 * shape the UI expects.
 */
function normalizeHoliday(holiday: HolidayLike, countryCode: string): Holiday {
  const code = String(holiday.countryCode || countryCode || '').toUpperCase();
  const type = getHolidayType(holiday);

  return {
    ...holiday,
    name: holiday.name ?? holiday.localName ?? '',
    date: String(holiday.date || '').split('T')[0],
    type,
    scope: holiday.scope || (type === 'public' ? 'public' : 'extended'),
    countryCode: code,
    countryCodes: holiday.countryCodes || [code],
    localName: holiday.localName || holiday.name
  };
}

async function requestBatch(
  year: number,
  countryCodes: string[],
  scope: RequestScope,
  includeDescription: boolean
): Promise<Record<string, Holiday[]>> {
  const url = createApiUrl(HOLIDAYS_WORKER_URL);
  url.searchParams.set('year', String(year));
  url.searchParams.set('countries', countryCodes.join(','));
  url.searchParams.set('scope', scope);
  if (!includeDescription) {
    url.searchParams.set('description', 'false');
  }

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`Holiday API responded with ${response.status}`);
  }

  const data = await response.json();
  const countries = data.countries || (data.countryCode ? { [data.countryCode]: data.holidays } : {});
  const failed = new Set<string>(Array.isArray(data.failed) ? data.failed : []);

  // A country the Worker could not answer for is left out entirely rather
  // than mapped to `[]`, so the caller's partial-failure path can tell "no
  // data" apart from "no holidays this year".
  return countryCodes.reduce<Record<string, Holiday[]>>((result, code) => {
    const holidays = countries[code];
    if (failed.has(code) || !Array.isArray(holidays)) return result;

    result[code] = holidays.map((holiday: HolidayLike) => normalizeHoliday(holiday, code));
    return result;
  }, {});
}

function chunk<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
}

/**
 * Holidays for a year, keyed by country code. Cached per country, batched
 * per request, and de-duplicated across concurrent callers.
 *
 * Returns `{ byCountry, failedCountries }` — a partial failure keeps the
 * countries that did resolve instead of blanking the whole view.
 */
export async function fetchHolidays({
  year,
  countries,
  scope = 'public',
  includeDescription = true
}: FetchOptions & { year: number; countries: unknown }): Promise<HolidayFetchResult> {
  const codes = toCountryCodes(countries);
  const normalizedScope = normalizeScope(scope);
  const byCountry: Record<string, Holiday[]> = {};
  const missing: string[] = [];

  codes.forEach(code => {
    const cached = readCacheEntry(year, code, normalizedScope, includeDescription);
    if (cached) {
      byCountry[code] = cached;
    } else {
      missing.push(code);
    }
  });

  if (missing.length === 0) {
    return { byCountry, failedCountries: [] };
  }

  const failedCountries: string[] = [];
  const pending: Promise<void>[] = [];
  const toRequest: string[] = [];

  missing.forEach(code => {
    const requestKey = getCacheKey(year, code, normalizedScope, includeDescription);
    const existing = inFlightRequests.get(requestKey);

    if (existing) {
      pending.push(
        existing
          .then(holidays => {
            byCountry[code] = holidays;
          })
          .catch(() => {
            failedCountries.push(code);
          })
      );
    } else {
      toRequest.push(code);
    }
  });

  chunk(toRequest, MAX_BATCH_COUNTRIES).forEach(batch => {
    const request = requestBatch(year, batch, normalizedScope, includeDescription);

    batch.forEach(code => {
      const requestKey = getCacheKey(year, code, normalizedScope, includeDescription);
      const countryRequest = request.then(result => {
        const holidays = result[code];
        if (!holidays) {
          throw new Error(`No holiday data returned for ${code}`);
        }

        setCacheEntry(requestKey, holidays);
        return holidays;
      });

      inFlightRequests.set(requestKey, countryRequest);

      pending.push(
        countryRequest
          .then(holidays => {
            byCountry[code] = holidays;
          })
          .catch(error => {
            console.error(`Error fetching holidays for ${code}:`, error);
            const stale = readPersistedEntry(requestKey);
            if (stale?.data?.length) {
              byCountry[code] = stale.data;
            } else {
              failedCountries.push(code);
            }
          })
          .finally(() => {
            inFlightRequests.delete(requestKey);
          })
      );
    });
  });

  await Promise.all(pending);

  return { byCountry, failedCountries };
}

/**
 * Single-country helper kept for shared links and the .ics/search paths.
 */
export async function fetchHolidaysForCountry(
  year: number,
  countryCode: string,
  options: FetchOptions = {}
): Promise<Holiday[]> {
  const code = toCountryCode(countryCode);
  if (!code) return [];

  const { byCountry } = await fetchHolidays({ year, countries: [code], ...options });
  return byCountry[code] || [];
}

function normalizeName(name: unknown): string {
  return String(name || '').toLowerCase().replace(/\s+/g, ' ').trim();
}

/**
 * Collapse the same holiday reported for several selected countries into one
 * entry that remembers every country it belongs to.
 */
export function mergeAcrossCountries(holidays: Holiday[]): Holiday[] {
  const byKey = new Map<string, Holiday>();

  holidays.forEach(holiday => {
    const key = `${holiday.date}:${normalizeName(holiday.name)}`;
    const existing = byKey.get(key);

    if (!existing) {
      byKey.set(key, { ...holiday, countryCodes: [...new Set(holiday.countryCodes || [holiday.countryCode])] });
      return;
    }

    existing.countryCodes = [...new Set([...existing.countryCodes, ...(holiday.countryCodes || [holiday.countryCode])])];
    existing.description = existing.description || holiday.description;
    existing.culturalInfo = existing.culturalInfo || holiday.culturalInfo;
  });

  return [...byKey.values()];
}

function groupByDate(
  holidaysByCountry: Record<string, Holiday[]>,
  predicate?: (holiday: Holiday) => boolean
): HolidaysByDate {
  const flattened = Object.values(holidaysByCountry)
    .flat()
    .filter(holiday => (predicate ? predicate(holiday) : true));

  const byDate: HolidaysByDate = {};
  mergeAcrossCountries(flattened).forEach(holiday => {
    if (!byDate[holiday.date]) {
      byDate[holiday.date] = [];
    }
    byDate[holiday.date].push(holiday);
  });

  return byDate;
}

/**
 * Every holiday in a month, keyed by YYYY-MM-DD.
 */
export async function getHolidaysForMonth(
  year: number,
  month: number,
  countries: unknown = [],
  options: FetchOptions = {}
): Promise<{ holidaysByDate: HolidaysByDate; failedCountries: string[] }> {
  const codes = toCountryCodes(countries);
  if (codes.length === 0) {
    return { holidaysByDate: {}, failedCountries: [] };
  }

  const monthPrefix = toMonthPrefix(year, month);
  const { byCountry, failedCountries } = await fetchHolidays({ year, countries: codes, ...options });

  return {
    holidaysByDate: groupByDate(byCountry, holiday => holiday.date.startsWith(monthPrefix)),
    failedCountries
  };
}

/**
 * The next holidays on or after a date, looking past the end of the month —
 * and past the end of the year — so late December never shows "nothing
 * upcoming" while New Year's Day sits days away.
 */
export async function getUpcomingHolidays({
  fromDate = new Date(),
  countries = [],
  scope = 'public',
  limit = 5
}: {
  fromDate?: Date;
  countries?: unknown;
  scope?: RequestScope;
  limit?: number;
} = {}): Promise<Holiday[]> {
  const codes = toCountryCodes(countries);
  if (codes.length === 0) return [];

  const fromKey = toDateKey(fromDate);
  const year = fromDate.getFullYear();

  const collect = async (targetYear: number): Promise<Holiday[]> => {
    const { byCountry } = await fetchHolidays({ year: targetYear, countries: codes, scope });
    return mergeAcrossCountries(Object.values(byCountry).flat());
  };

  let candidates = (await collect(year)).filter(holiday => holiday.date >= fromKey);

  // Within the last weeks of a year the answer usually lives in the next one.
  if (candidates.length < limit) {
    const nextYear = await collect(year + 1).catch(() => []);
    candidates = [...candidates, ...nextYear.filter(holiday => holiday.date >= fromKey)];
  }

  return candidates
    .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0))
    .slice(0, limit);
}

/**
 * Cross-country search, executed at the edge.
 *
 * The alternative — downloading every supported country's year and filtering
 * in the browser — cost dozens of requests before the visitor had typed
 * anything.
 */
export async function searchHolidays(
  query: string,
  { year, scope = 'public', signal }: { year: number; scope?: RequestScope; signal?: AbortSignal }
): Promise<Holiday[]> {
  const term = String(query || '').trim();
  if (term.length < 2) return [];

  const url = createApiUrl('/api/holidays/search');
  url.searchParams.set('q', term);
  url.searchParams.set('year', String(year));
  url.searchParams.set('scope', normalizeScope(scope));

  const response = await fetch(url.toString(), { signal });
  if (!response.ok) {
    throw new Error(`Search API responded with ${response.status}`);
  }

  const data = await response.json();
  return (data.results || []).map((holiday: HolidayLike) => normalizeHoliday(holiday, holiday.countryCode ?? ''));
}

/**
 * Fetch AI-written background for a holiday.
 */
export async function fetchHolidayInfo(
  holidayName: string,
  country: string,
  language = 'en'
): Promise<string | null> {
  try {
    const response = await fetch(HOLIDAY_INFO_WORKER_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ holiday: holidayName, country, language })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.background;
  } catch (error) {
    console.error('Error fetching holiday info:', error);
    return null;
  }
}

const INFO_CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days

function getInfoCacheKey(holidayName: string, country: string, language: string): string {
  return `holiday-info-${holidayName}-${country}-${language}`;
}

/**
 * Read cached AI-generated holiday info from localStorage, or null if absent/expired.
 */
export function readCachedHolidayInfo(holidayName: string, country: string, language: string): string | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const cacheKey = getInfoCacheKey(holidayName, country, language);
    const cachedData = window.localStorage.getItem(cacheKey);
    const cachedTimestamp = window.localStorage.getItem(`${cacheKey}-timestamp`);
    const isExpired = cachedTimestamp && (Date.now() - parseInt(cachedTimestamp)) > INFO_CACHE_DURATION;
    return cachedData && !isExpired ? cachedData : null;
  } catch (error) {
    console.warn('Error reading cached holiday info:', error);
    return null;
  }
}

/**
 * Persist AI-generated holiday info to localStorage.
 */
export function writeCachedHolidayInfo(
  holidayName: string,
  country: string,
  language: string,
  info: string
): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    const cacheKey = getInfoCacheKey(holidayName, country, language);
    window.localStorage.setItem(cacheKey, info);
    window.localStorage.setItem(`${cacheKey}-timestamp`, Date.now().toString());
  } catch (error) {
    console.warn('Error caching holiday info:', error);
  }
}

export function clearCache(): void {
  memoryCache.clear();
  inFlightRequests.clear();

  if (typeof window !== 'undefined') {
    Object.keys(window.localStorage)
      .filter(key => key.startsWith(`${CACHE_STORAGE_PREFIX}:`))
      .forEach(key => window.localStorage.removeItem(key));
  }
}
