import { describe, it, expect, beforeEach } from 'vitest';
import {
  getCountryCodeByName,
  getCountryNameByCode,
  getCountries,
  readCachedHolidayInfo,
  writeCachedHolidayInfo,
  clearCache,
  getHolidaysForMonth,
  getHolidaysForDate
} from './holidayApi';

describe('holidayApi - country code mappings', () => {
  it('maps country names to their corresponding ISO codes', () => {
    expect(getCountryCodeByName('United States')).toBe('US');
    expect(getCountryCodeByName('United Kingdom')).toBe('GB');
    expect(getCountryCodeByName('China')).toBe('CN');
    expect(getCountryCodeByName('Japan')).toBe('JP');
    expect(getCountryCodeByName('Germany')).toBe('DE');
  });

  it('maps ISO codes back to country names', () => {
    expect(getCountryNameByCode('US')).toBe('United States');
    expect(getCountryNameByCode('GB')).toBe('United Kingdom');
    expect(getCountryNameByCode('CN')).toBe('China');
    expect(getCountryNameByCode('JP')).toBe('Japan');
  });

  it('returns sorted list of supported countries', () => {
    const countries = getCountries();
    expect(countries.length).toBe(17);
    expect(countries).toContain('United States');
    expect(countries).toContain('France');
    expect(countries).toContain('Japan');
    // Verify it is sorted alphabetically
    const sortedCopy = [...countries].sort();
    expect(countries).toEqual(sortedCopy);
  });
});

describe('holidayApi - localStorage AI info caching', () => {
  beforeEach(() => {
    let store = {};
    const mockStorage = {
      getItem: (key) => store[key] || null,
      setItem: (key, value) => { store[key] = String(value); },
      removeItem: (key) => { delete store[key]; },
      clear: () => { store = {}; }
    };

    globalThis.window = {
      localStorage: mockStorage,
      location: { origin: 'http://localhost' }
    };
    globalThis.localStorage = mockStorage;

    clearCache();
  });

  it('writes and reads cached holiday AI info successfully', () => {
    const holidayName = 'Test Holiday';
    const country = 'United States';
    const language = 'en';
    const sampleBackground = 'Detailed historical background for Test Holiday.';

    expect(readCachedHolidayInfo(holidayName, country, language)).toBeNull();

    writeCachedHolidayInfo(holidayName, country, language, sampleBackground);
    expect(readCachedHolidayInfo(holidayName, country, language)).toBe(sampleBackground);
  });

  it('returns null for expired AI info cache entries', () => {
    const holidayName = 'Old Holiday';
    const country = 'United States';
    const language = 'en';
    const cacheKey = `holiday-info-${holidayName}-${country}-${language}`;

    globalThis.localStorage.setItem(cacheKey, 'Old cached info');
    // Set timestamp to 8 days ago (exceeding the 7-day TTL)
    const eightDaysAgo = Date.now() - (8 * 24 * 60 * 60 * 1000);
    globalThis.localStorage.setItem(`${cacheKey}-timestamp`, eightDaysAgo.toString());

    expect(readCachedHolidayInfo(holidayName, country, language)).toBeNull();
  });
});

describe('holidayApi - empty query handling', () => {
  it('returns empty object when getHolidaysForMonth is called with empty selectedCountries', async () => {
    const result = await getHolidaysForMonth(2026, 0, []);
    expect(result).toEqual({});
  });

  it('returns empty array when getHolidaysForDate is called with empty selectedCountries', async () => {
    const result = await getHolidaysForDate(new Date(2026, 0, 1), []);
    expect(result).toEqual([]);
  });
});
