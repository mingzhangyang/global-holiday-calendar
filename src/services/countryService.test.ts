import { describe, it, expect } from 'vitest';
import {
  FALLBACK_COUNTRIES,
  getCountryDisplayName,
  getCountryFlag,
  toCountryCode,
  toCountryCodes
} from './countryService';

describe('country identity', () => {
  it('passes ISO codes through and upper-cases them', () => {
    expect(toCountryCode('us')).toBe('US');
    expect(toCountryCode('  GB ')).toBe('GB');
  });

  it('converts the display names stored by earlier releases', () => {
    expect(toCountryCode('United States')).toBe('US');
    expect(toCountryCode('south korea')).toBe('KR');
    expect(toCountryCode('Türkiye')).toBe('TR');
  });

  it('drops values that name no country', () => {
    expect(toCountryCode('')).toBeNull();
    expect(toCountryCode('Neverland')).toBeNull();
    expect(toCountryCodes(['US', 'US', 'Neverland', 'gb'])).toEqual(['US', 'GB']);
  });

  it('builds flag emoji from the code itself', () => {
    expect(getCountryFlag('US')).toBe('🇺🇸');
    expect(getCountryFlag('CN')).toBe('🇨🇳');
    expect(getCountryFlag('???')).toBe('🏳️');
  });

  it('names countries in the requested language', () => {
    expect(getCountryDisplayName('JP', 'en')).toBe('Japan');
    expect(getCountryDisplayName('JP', 'ja')).toBe('日本');
    expect(getCountryDisplayName('DE', 'zh-CN')).toBe('德国');
  });

  it('ships a fallback list so the picker is never empty', () => {
    expect(FALLBACK_COUNTRIES.length).toBeGreaterThan(40);
    FALLBACK_COUNTRIES.forEach(country => {
      expect(country.code).toMatch(/^[A-Z]{2}$/);
    });
  });
});
