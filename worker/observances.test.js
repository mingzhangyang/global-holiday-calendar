import { describe, it, expect } from 'vitest';
import {
  formatDateParts,
  getAstronomicalEvents,
  getChineseSolarTerms,
  getCulturalObservances,
  getSolarTermDay,
  julianDayToDateParts
} from './observances.js';

// The suite runs under TZ=Pacific/Kiritimati (UTC+14) and TZ=Pacific/Niue
// (UTC−11): a date built through Date/toISOString shifts a day in one of them.
describe('solar terms', () => {
  it('produces the 24 terms with China-time dates', () => {
    const terms = getChineseSolarTerms(2026);
    expect(terms).toHaveLength(24);

    const byName = Object.fromEntries(terms.map(term => [term.localName, term.date]));
    expect(byName['小寒']).toBe('2026-01-05');
    expect(byName['立春']).toBe('2026-02-04');
    expect(byName['春分']).toBe('2026-03-20');
    expect(byName['清明']).toBe('2026-04-05');
    expect(byName['夏至']).toBe('2026-06-21');
    expect(byName['冬至']).toBe('2026-12-22');
  });

  it('tracks the leap-year drift across years', () => {
    const lichun = year => getChineseSolarTerms(year).find(term => term.localName === '立春').date;

    expect(lichun(2024)).toBe('2024-02-04');
    expect(lichun(2025)).toBe('2025-02-03');
    expect(lichun(2027)).toBe('2027-02-04');
  });

  // 立春 and 雨水 fall before their own year's 29 February, so they count one
  // leap day fewer than every term after them. Using the January correction
  // all year round put every later term a day late in leap years.
  it('applies the leap-day correction from 惊蛰 onward, not before', () => {
    const dates = year => Object.fromEntries(
      getChineseSolarTerms(year).map(term => [term.localName, term.date])
    );

    const leap2024 = dates(2024);
    expect(leap2024['立春']).toBe('2024-02-04');
    expect(leap2024['雨水']).toBe('2024-02-19');
    expect(leap2024['春分']).toBe('2024-03-20');
    expect(leap2024['清明']).toBe('2024-04-04');
    expect(leap2024['夏至']).toBe('2024-06-21');
    expect(leap2024['秋分']).toBe('2024-09-22');
    expect(leap2024['冬至']).toBe('2024-12-21');

    const leap2028 = dates(2028);
    expect(leap2028['春分']).toBe('2028-03-20');
    expect(leap2028['冬至']).toBe('2028-12-21');
  });

  // The formula is a linear fit; a few terms land within minutes of midnight
  // CST and need the published correction to fall on the right side of it.
  it('corrects the terms the formula misses by minutes', () => {
    const dateOf = (year, name) =>
      getChineseSolarTerms(year).find(term => term.localName === name).date;

    expect(dateOf(2019, '小寒')).toBe('2019-01-05'); // 23:40 CST
    expect(dateOf(2021, '冬至')).toBe('2021-12-21'); // 23:51 CST
    expect(dateOf(2026, '雨水')).toBe('2026-02-18'); // 23:46 CST
  });

  it('keeps every date in the calendar year it belongs to', () => {
    [2020, 2025, 2026, 2030].forEach(year => {
      getChineseSolarTerms(year).forEach(term => {
        expect(term.date.startsWith(String(year)), `${term.localName} ${term.date}`).toBe(true);
        expect(getSolarTermDay(year, { name: '小寒', month: 1, c: 5.4055 })).toBeGreaterThan(0);
      });
    });
  });

  it('classifies solar terms as extended-scope seasonal observances', () => {
    getChineseSolarTerms(2026).forEach(term => {
      expect(term.type).toBe('seasonal');
      expect(term.scope).toBe('extended');
    });
  });
});

describe('equinoxes and solstices', () => {
  it('resolves the event to the local calendar date of the country', () => {
    // The March 2026 equinox falls at 2026-03-20 14:46 UTC.
    const inUs = getAstronomicalEvents(2026, 'US').find(event => event.name === 'Spring Equinox');
    const inJapan = getAstronomicalEvents(2026, 'JP').find(event => event.name === 'Spring Equinox');
    const inAustralia = getAstronomicalEvents(2026, 'AU').find(event => event.name === 'Autumn Equinox');

    expect(inUs.date).toBe('2026-03-20');
    expect(inJapan.date).toBe('2026-03-20');
    // UTC+10 pushes it past midnight.
    expect(inAustralia.date).toBe('2026-03-21');
  });

  it('names the seasons for the southern hemisphere', () => {
    const december = getAstronomicalEvents(2026, 'AU').find(event => event.date.startsWith('2026-12'));
    expect(december.name).toBe('Summer Solstice');
  });

  it('agrees with published solstice dates', () => {
    const events = getAstronomicalEvents(2026, 'GB').map(event => event.date);
    expect(events).toEqual(['2026-03-20', '2026-06-21', '2026-09-23', '2026-12-21']);
  });
});

describe('observance assembly', () => {
  it('does not duplicate solstices for China, whose solar terms include them', () => {
    const dates = getCulturalObservances(2026, 'CN').map(observance => observance.date);
    expect(new Set(dates).size).toBe(dates.length);
    expect(getCulturalObservances(2026, 'CN')).toHaveLength(24);
  });

  it('marks every calculated observance as extended scope', () => {
    ['JP', 'IN', 'GB', 'NO', 'US'].forEach(code => {
      getCulturalObservances(2026, code).forEach(observance => {
        expect(observance.scope).toBe('extended');
        expect(observance.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      });
    });
  });
});

describe('date helpers', () => {
  it('zero-pads date parts', () => {
    expect(formatDateParts(2026, 1, 5)).toBe('2026-01-05');
    expect(formatDateParts(2026, 12, 31)).toBe('2026-12-31');
  });

  it('converts Julian days to Gregorian dates', () => {
    expect(julianDayToDateParts(2451545.0)).toEqual({ year: 2000, month: 1, day: 1 });
  });
});
