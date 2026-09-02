import { describe, it, expect, afterEach, vi } from 'vitest';
import { fetchSupportedCountries, POPULAR_COUNTRY_CODES } from './countries.js';

afterEach(() => vi.unstubAllGlobals());

describe('supported country list', () => {
  it('keeps curated countries that Nager does not cover', async () => {
    // Nager returns neither India nor Taiwan; Calendarific and the calculated
    // observances do, so the picker must still offer them.
    vi.stubGlobal('fetch', vi.fn(async () => ({
      ok: true,
      json: async () => [
        { countryCode: 'US', name: 'United States' },
        { countryCode: 'DE', name: 'Germany' },
        { countryCode: 'ZW', name: 'Zimbabwe' }
      ]
    })));

    const { countries, source } = await fetchSupportedCountries();
    const codes = countries.map(country => country.code);

    expect(source).toBe('nager');
    expect(codes).toContain('IN');
    expect(codes).toContain('TW');
    // Countries outside the curated list come along, unflagged.
    expect(countries.find(country => country.code === 'ZW')?.popular).toBe(false);
    expect(countries.filter(country => country.popular)).toHaveLength(POPULAR_COUNTRY_CODES.length);
  });

  it('falls back to the curated list when Nager is unreachable', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => {
      throw new Error('network down');
    }));

    const { countries, source } = await fetchSupportedCountries();

    expect(source).toBe('fallback');
    expect(countries).toHaveLength(POPULAR_COUNTRY_CODES.length);
  });
});
