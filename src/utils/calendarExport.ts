// Calendar Export and Share Utilities (.ics, Google Calendar, Web Share)

import type { HolidayLike } from '../types';
import { compactDate, escapeIcsText, foldLine, nextDayCompact } from '../../shared/ics-format.js';

export { escapeIcsText };

type ExportableHoliday = HolidayLike & { date: string };

/** Format YYYY-MM-DD into Google Calendar / iCal compact date format. */
export const formatCompactDate = compactDate;

/**
 * Build a stable UID from the holiday's date, name, and country.
 * URL encoding keeps the UID safe even when a holiday contains punctuation
 * or non-Latin characters.
 */
export function buildHolidayUid(holiday: ExportableHoliday): string {
  const date = formatCompactDate(holiday.date);
  const name = encodeURIComponent(String(holiday.name || 'Holiday').trim());
  const country = encodeURIComponent(
    String(holiday.countryCode || holiday.country || 'Global').trim()
  );

  return `holiday-${date}-${country}-${name}@global-holiday-calendar`;
}

/** Calculate the next day in YYYYMMDD format for all-day end dates. */
export const getNextDayCompactDate = nextDayCompact;

/**
 * Generate a direct link to add the holiday to Google Calendar.
 */
export function generateGoogleCalendarUrl(holiday: ExportableHoliday): string {
  const startDate = formatCompactDate(holiday.date);
  const endDate = getNextDayCompactDate(holiday.date);
  const country = holiday.country ?? holiday.countryCode ?? 'Global';
  const title = encodeURIComponent(`${holiday.name} (${country})`);
  const details = encodeURIComponent(
    `${holiday.description || holiday.name}\n\nCultural celebration in ${country}.\nSource: Global Holiday Calendar`
  );
  const location = encodeURIComponent(country);

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startDate}/${endDate}&details=${details}&location=${location}`;
}

/**
 * Generate standard iCalendar (.ics) string content.
 */
export function generateIcsContent(holiday: ExportableHoliday): string {
  const startDate = formatCompactDate(holiday.date);
  const endDate = getNextDayCompactDate(holiday.date);
  const uid = buildHolidayUid(holiday);
  const nowStamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  const cleanSummary = escapeIcsText(holiday.name || 'Holiday');
  const cleanDesc = escapeIcsText(holiday.description || holiday.name || '');
  const cleanLocation = escapeIcsText(holiday.country || 'Global');

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Global Holiday Calendar//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${nowStamp}`,
    `DTSTART;VALUE=DATE:${startDate}`,
    `DTEND;VALUE=DATE:${endDate}`,
    `SUMMARY:${cleanSummary}`,
    `DESCRIPTION:${cleanDesc}`,
    `LOCATION:${cleanLocation}`,
    'STATUS:CONFIRMED',
    'TRANSP:TRANSPARENT',
    'END:VEVENT',
    'END:VCALENDAR'
  ];

  return lines.map(foldLine).join('\r\n');
}

/**
 * Trigger download of an .ics file in browser environments.
 */
export function downloadIcsFile(holiday: ExportableHoliday): void {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return;
  }

  const icsContent = generateIcsContent(holiday);
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const filename = `${String(holiday.name ?? 'holiday').toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${holiday.date}.ics`;

  const link = document.createElement('a');
  link.setAttribute('download', filename);
  const objectUrl = window.URL.createObjectURL(blob);
  link.href = objectUrl;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Revoking in the same tick as the click can cancel the download before the
  // browser has read the blob (Firefox and Safari both do this); let the
  // current task finish first.
  setTimeout(() => window.URL.revokeObjectURL(objectUrl), 0);
}

/**
 * Build a link that reopens this exact holiday.
 *
 * Any holiday parameters already on the current URL are dropped first: a
 * visitor who opens a shared link and then shares a different holiday would
 * otherwise pass on a URL carrying both.
 */
export function buildHolidayShareUrl(holiday: ExportableHoliday, shareUrl?: string): string {
  const rawUrl = shareUrl || (typeof window !== 'undefined' ? window.location.href : '');
  if (!rawUrl) return '';

  try {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost';
    const url = new URL(rawUrl, baseUrl);

    url.searchParams.delete('holiday');
    url.searchParams.delete('date');
    url.searchParams.delete('country');

    const date = String(holiday.date || '').split('T')[0];
    url.searchParams.set('holiday', holiday.name || holiday.localName || '');
    url.searchParams.set('date', date);

    // Always an ISO code: a display name changes with the reader's language.
    const countryCode = holiday.countryCode || holiday.countryCodes?.[0];
    if (countryCode) {
      url.searchParams.set('country', countryCode);
    }

    // Land the reader on the month the holiday is in, not the month the
    // sharer happened to be browsing.
    if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      url.searchParams.set('month', date.slice(0, 7));
    }

    return url.toString();
  } catch (error) {
    console.warn('Failed to build holiday share URL:', error);
    return rawUrl;
  }
}

/**
 * Share a holiday via Web Share API or copy URL to clipboard.
 * Returns a promise resolving to 'shared' | 'copied' | 'failed'.
 */
export async function shareHoliday(holiday: ExportableHoliday, shareUrl?: string): Promise<string> {
  const urlToShare = buildHolidayShareUrl(holiday, shareUrl);
  const shareData = {
    title: `${holiday.name} - Global Holiday Calendar`,
    text: `Discover ${holiday.name} in ${holiday.country} on ${holiday.date}!`,
    url: urlToShare
  };

  if (typeof navigator !== 'undefined' && navigator.share && navigator.canShare && navigator.canShare(shareData)) {
    try {
      await navigator.share(shareData);
      return 'shared';
    } catch (err) {
      if ((err as Error).name === 'AbortError') {
        return 'aborted';
      }
    }
  }

  if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
    try {
      await navigator.clipboard.writeText(urlToShare);
      return 'copied';
    } catch (e) {
      console.warn('Failed to copy to clipboard:', e);
    }
  }

  return 'failed';
}
