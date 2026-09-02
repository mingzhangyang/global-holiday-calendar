import { describe, it, expect } from 'vitest';
import {
  formatCompactDate,
  getNextDayCompactDate,
  generateGoogleCalendarUrl,
  generateIcsContent,
  buildHolidayUid,
  escapeIcsText,
  buildHolidayShareUrl
} from './calendarExport';

describe('calendarExport - compact dates', () => {
  it('formats YYYY-MM-DD into YYYYMMDD', () => {
    expect(formatCompactDate('2026-08-19')).toBe('20260819');
    expect(formatCompactDate('2026-01-01')).toBe('20260101');
  });

  it('calculates the next day compact date correctly across month and year boundaries', () => {
    expect(getNextDayCompactDate('2026-08-19')).toBe('20260820');
    expect(getNextDayCompactDate('2026-08-31')).toBe('20260901');
    expect(getNextDayCompactDate('2026-12-31')).toBe('20270101');
  });
});

describe('calendarExport - Google Calendar link generation', () => {
  it('generates a valid Google Calendar template URL with encoded fields', () => {
    const holiday = {
      name: 'Diwali',
      country: 'India',
      date: '2026-11-08',
      description: 'Festival of Lights'
    };

    const url = generateGoogleCalendarUrl(holiday);
    expect(url).toContain('https://calendar.google.com/calendar/render?action=TEMPLATE');
    expect(url).toContain('dates=20261108/20261109');
    expect(url).toContain(encodeURIComponent('Diwali (India)'));
    expect(url).toContain(encodeURIComponent('India'));
  });
});

describe('calendarExport - iCal (.ics) file generation', () => {
  it('generates a valid RFC-compliant VCALENDAR structure', () => {
    const holiday = {
      name: 'Bastille Day',
      country: 'France',
      date: '2026-07-14',
      description: 'French National Day'
    };

    const ics = generateIcsContent(holiday);
    expect(ics).toContain('BEGIN:VCALENDAR');
    expect(ics).toContain('VERSION:2.0');
    expect(ics).toContain('BEGIN:VEVENT');
    expect(ics).toContain('SUMMARY:Bastille Day');
    expect(ics).toContain('DTSTART;VALUE=DATE:20260714');
    expect(ics).toContain('DTEND;VALUE=DATE:20260715');
    expect(ics).toContain('LOCATION:France');
    expect(ics).toContain('END:VEVENT');
    expect(ics).toContain('END:VCALENDAR');
  });

  it('uses a deterministic UID for the same holiday', () => {
    const holiday = {
      name: 'Bastille Day',
      country: 'France',
      countryCode: 'FR',
      date: '2026-07-14'
    };

    expect(buildHolidayUid(holiday)).toBe(buildHolidayUid(holiday));
    expect(generateIcsContent(holiday).match(/^UID:.*$/m)?.[0])
      .toBe(generateIcsContent(holiday).match(/^UID:.*$/m)?.[0]);
  });

  it('escapes RFC 5545 TEXT punctuation and line breaks', () => {
    const holiday = {
      name: 'Founders, Day; 2026\\edition',
      country: 'Example, Country; Region',
      date: '2026-07-14',
      description: 'Line one\nLine two, with a comma; and a slash\\.'
    };

    const ics = generateIcsContent(holiday);
    expect(ics).toContain('SUMMARY:Founders\\, Day\\; 2026\\\\edition');
    expect(ics).toContain('DESCRIPTION:Line one\\nLine two\\, with a comma\\; and a slash\\\\.');
    expect(ics).toContain('LOCATION:Example\\, Country\\; Region');
    expect(escapeIcsText('a,b;c\\d\ne')).toBe('a\\,b\\;c\\\\d\\ne');
  });
});

describe('calendarExport - sharing', () => {
  it('includes the selected holiday identity in the shared URL', () => {
    const holiday = {
      name: 'New Year\'s Day',
      country: 'United States',
      countryCode: 'US',
      date: '2026-01-01'
    };

    const url = new URL(buildHolidayShareUrl(
      holiday,
      'https://example.com/?lang=en&month=2026-01'
    ));

    expect(url.searchParams.get('lang')).toBe('en');
    expect(url.searchParams.get('month')).toBe('2026-01');
    expect(url.searchParams.get('holiday')).toBe(holiday.name);
    expect(url.searchParams.get('date')).toBe(holiday.date);
    expect(url.searchParams.get('country')).toBe('US');
  });

  it('replaces the holiday already on the URL instead of stacking parameters', () => {
    const url = new URL(buildHolidayShareUrl(
      { name: 'Bastille Day', countryCode: 'FR', date: '2026-07-14' },
      'https://example.com/?lang=en&month=2026-01&holiday=New+Year&date=2026-01-01&country=US'
    ));

    expect(url.searchParams.getAll('holiday')).toEqual(['Bastille Day']);
    expect(url.searchParams.get('country')).toBe('FR');
    // The reader lands on the month the shared holiday is actually in.
    expect(url.searchParams.get('month')).toBe('2026-07');
  });

  it('prefers the ISO code over a localized country name', () => {
    const url = new URL(buildHolidayShareUrl(
      { name: 'Christmas Day', country: '德国', countryCodes: ['DE'], date: '2026-12-25' },
      'https://example.com/'
    ));

    expect(url.searchParams.get('country')).toBe('DE');
  });
});
