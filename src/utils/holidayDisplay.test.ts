import { describe, it, expect } from 'vitest';
import {
  getHolidayCountryLabel,
  getHolidayDisplayName,
  getHolidaySecondaryName
} from './holidayDisplay';

const chineseNewYear = {
  name: 'Chinese New Year',
  localName: '春节',
  countryCode: 'CN',
  countryCodes: ['CN']
};

describe('holiday naming', () => {
  it('uses the local name when the reader can read it', () => {
    expect(getHolidayDisplayName(chineseNewYear, 'zh-CN')).toBe('春节');
    expect(getHolidayDisplayName({ name: 'Christmas Day', localName: 'Weihnachten', countryCode: 'DE' }, 'de'))
      .toBe('Weihnachten');
  });

  it('falls back to the English name for other languages', () => {
    expect(getHolidayDisplayName(chineseNewYear, 'en')).toBe('Chinese New Year');
    expect(getHolidayDisplayName(chineseNewYear, 'fr')).toBe('Chinese New Year');
  });

  it('offers the other name as a subtitle, and nothing when they match', () => {
    expect(getHolidaySecondaryName(chineseNewYear, 'en')).toBe('春节');
    expect(getHolidaySecondaryName({ name: 'Boxing Day', localName: 'Boxing Day', countryCode: 'GB' }, 'en')).toBe('');
  });

  it('lists the countries a merged holiday belongs to', () => {
    expect(getHolidayCountryLabel({ countryCodes: ['US', 'GB'] }, 'en')).toBe('United States, United Kingdom');
    expect(getHolidayCountryLabel({ countryCodes: ['US', 'GB', 'FR', 'DE'] }, 'en'))
      .toBe('United States, United Kingdom +2');
  });
});
