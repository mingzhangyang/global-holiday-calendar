import { describe, it, expect } from 'vitest';
import {
  getDateOnlyDayNumber,
  getFirstDayOfWeek,
  getLeadingDayCount,
  parseDateKey,
  rotateToWeekStart,
  toDateKey,
  toMonthPrefix
} from './dateUtils';

// These tests run with TZ=Pacific/Kiritimati (UTC+14) and TZ=Pacific/Niue
// (UTC-11) in CI via the test script, the two extremes where the old
// toISOString()-based keys shifted dates by a day.

describe('toDateKey', () => {
  it('uses local date components, not the UTC day', () => {
    const date = new Date(2026, 0, 1); // local midnight, Jan 1
    expect(toDateKey(date)).toBe('2026-01-01');
  });

  it('pads single-digit months and days', () => {
    expect(toDateKey(new Date(2026, 8, 5))).toBe('2026-09-05');
  });

  it('handles the last day of the year', () => {
    expect(toDateKey(new Date(2025, 11, 31))).toBe('2025-12-31');
  });
});

describe('parseDateKey', () => {
  it('parses to local midnight of the same calendar day', () => {
    const date = parseDateKey('2026-02-01');
    expect(date.getFullYear()).toBe(2026);
    expect(date.getMonth()).toBe(1);
    expect(date.getDate()).toBe(1);
    expect(date.getHours()).toBe(0);
  });

  it('round-trips with toDateKey', () => {
    expect(toDateKey(parseDateKey('2026-07-14'))).toBe('2026-07-14');
  });

  it('reads only the calendar date when the key carries a time/timezone', () => {
    // Calendarific returns ISO datetimes like this for solstices/equinoxes.
    const date = parseDateKey('2026-06-21T08:24:00+08:00');
    expect(date.getFullYear()).toBe(2026);
    expect(date.getMonth()).toBe(5);
    expect(date.getDate()).toBe(21);
    expect(Number.isNaN(date.getTime())).toBe(false);
    expect(toDateKey(date)).toBe('2026-06-21');
  });
});

describe('toMonthPrefix', () => {
  it('builds a zero-padded prefix from a zero-based month', () => {
    expect(toMonthPrefix(2026, 0)).toBe('2026-01-');
    expect(toMonthPrefix(2026, 11)).toBe('2026-12-');
  });

  it('matches date keys within the month and nothing else', () => {
    const prefix = toMonthPrefix(2026, 1);
    expect('2026-02-01'.startsWith(prefix)).toBe(true);
    expect('2026-02-28'.startsWith(prefix)).toBe(true);
    expect('2026-12-02'.startsWith(prefix)).toBe(false);
    expect('2025-02-01'.startsWith(prefix)).toBe(false);
  });
});

describe('getDateOnlyDayNumber', () => {
  it('calculates calendar-day differences without local-time or DST effects', () => {
    const before = getDateOnlyDayNumber('2026-03-08');
    const after = getDateOnlyDayNumber('2026-03-09');

    expect(after - before).toBe(1);
  });

  it('ignores any time component after the calendar date', () => {
    expect(getDateOnlyDayNumber('2026-06-21T08:24:00+08:00'))
      .toBe(getDateOnlyDayNumber('2026-06-21'));
  });
});

describe('week start', () => {
  it('follows the locale rather than assuming Sunday', () => {
    expect(getFirstDayOfWeek('en-US')).toBe(0);
    expect(getFirstDayOfWeek('fr-FR')).toBe(1);
    expect(getFirstDayOfWeek('de-DE')).toBe(1);
    expect(getFirstDayOfWeek('zh-CN')).toBe(1);
  });

  it('agrees with the locales that start on Sunday', () => {
    expect(getFirstDayOfWeek('ja-JP')).toBe(0);
    expect(getFirstDayOfWeek('ko-KR')).toBe(0);
    expect(getFirstDayOfWeek('zh-TW')).toBe(0);
  });

  it('falls back to the static table for an unparseable tag', () => {
    // Intl.Locale throws on this one; the fallback must still answer.
    expect(getFirstDayOfWeek('a')).toBe(1);
    expect(getFirstDayOfWeek(undefined)).toBe(0);
  });

  it('rotates weekday headers to the week start', () => {
    const names = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    expect(rotateToWeekStart(names, 0)).toEqual(names);
    expect(rotateToWeekStart(names, 1)).toEqual(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']);
  });

  it('counts the leading blanks a month needs', () => {
    // 1 January 2026 is a Thursday (day 4).
    expect(getLeadingDayCount(4, 0)).toBe(4);
    expect(getLeadingDayCount(4, 1)).toBe(3);
    // A Sunday first-of-month needs a full week of blanks on Monday starts.
    expect(getLeadingDayCount(0, 1)).toBe(6);
  });
});
