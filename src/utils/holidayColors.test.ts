import { describe, it, expect } from 'vitest';
import {
  HOLIDAY_TYPES,
  HOLIDAY_TYPE_COLORS,
  HOLIDAY_TYPE_LABEL_KEYS,
  getHolidayColor,
  getHolidayType,
  normalizeHolidayType
} from './holidayColors';
import { translations } from '../locales/translations';
import { HOLIDAY_TYPES as CANONICAL_TYPES } from '../../shared/holiday-taxonomy.js';

describe('holiday taxonomy', () => {
  it('gives every canonical type a colour and a label', () => {
    HOLIDAY_TYPES.forEach(type => {
      expect(HOLIDAY_TYPE_COLORS[type], `${type} needs a colour`).toMatch(/^#[0-9a-f]{6}$/);
      const labels = translations.en as Record<string, unknown>;
      expect(labels[HOLIDAY_TYPE_LABEL_KEYS[type]], `${type} needs a label`).toBeTruthy();
    });
  });

  it('uses a distinct colour per type so the legend stays readable', () => {
    const colors = HOLIDAY_TYPES.map(type => HOLIDAY_TYPE_COLORS[type]);
    expect(new Set(colors).size).toBe(colors.length);
  });

  it('normalizes provider type strings onto canonical types', () => {
    expect(normalizeHolidayType('Public')).toBe('public');
    expect(normalizeHolidayType('National holiday')).toBe('public');
    expect(normalizeHolidayType('Christian')).toBe('religious');
    expect(normalizeHolidayType('Season')).toBe('seasonal');
    expect(normalizeHolidayType('Local holiday')).toBe('cultural');
    expect(normalizeHolidayType('United Nations observance')).toBe('observance');
  });

  it('claims nothing for unknown types', () => {
    expect(normalizeHolidayType('something new')).toBe('observance');
    expect(normalizeHolidayType(undefined)).toBe('observance');
  });

  it('reads pre-taxonomy cache entries by their subtype', () => {
    expect(getHolidayType({ type: 'cultural-observance', subtype: 'solar-term' })).toBe('seasonal');
    expect(getHolidayType({ type: 'cultural-observance', subtype: 'astronomical' })).toBe('seasonal');
    expect(getHolidayColor({ type: 'public' })).toBe(HOLIDAY_TYPE_COLORS.public);
  });

  // The Worker files Imbolc, the Indian Ritus, Setsubun and the Nordic blóts
  // as cultural. Their subtypes contain the word "season", so a substring
  // test used to move all of them into the astronomical bucket, where the
  // Cultural filter could no longer find them.
  it('keeps regional seasonal markers cultural', () => {
    const regional = [
      { type: 'cultural', subtype: 'celtic-season' },
      { type: 'cultural', subtype: 'indian-season' },
      { type: 'cultural', subtype: 'nordic-season' },
      { type: 'cultural', subtype: 'japanese-season' },
      { type: 'cultural', subtype: 'seasonal-transition' },
      { type: 'cultural', subtype: 'seasonal' }
    ];

    regional.forEach(holiday => {
      expect(getHolidayType(holiday), holiday.subtype).toBe('cultural');
    });
  });

  it('displays exactly the canonical set the Worker classifies into', () => {
    expect([...HOLIDAY_TYPES].sort()).toEqual([...CANONICAL_TYPES].sort());
  });
});
