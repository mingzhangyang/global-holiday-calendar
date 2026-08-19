// Calendar Export and Share Utilities (.ics, Google Calendar, Web Share)

/**
 * Format YYYY-MM-DD into Google Calendar / iCal compact date format (YYYYMMDD).
 */
export function formatCompactDate(dateStr) {
  return String(dateStr).replace(/-/g, '');
}

/**
 * Build a stable UID from the holiday's date, name, and country.
 * URL encoding keeps the UID safe even when a holiday contains punctuation
 * or non-Latin characters.
 */
export function buildHolidayUid(holiday) {
  const date = formatCompactDate(holiday.date);
  const name = encodeURIComponent(String(holiday.name || 'Holiday').trim());
  const country = encodeURIComponent(
    String(holiday.countryCode || holiday.country || 'Global').trim()
  );

  return `holiday-${date}-${country}-${name}@global-holiday-calendar`;
}

/**
 * Escape a value for an iCalendar RFC 5545 TEXT field.
 */
export function escapeIcsText(value) {
  return String(value ?? '')
    .replace(/\\/g, '\\\\')
    .replace(/\r\n|\r|\n/g, '\\n')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,');
}

/**
 * Calculate the next day in YYYYMMDD format for all-day end dates.
 */
export function getNextDayCompactDate(dateStr) {
  const [year, month, day] = dateStr.split('-').map(Number);
  const nextDate = new Date(year, month - 1, day + 1);
  const y = nextDate.getFullYear();
  const m = String(nextDate.getMonth() + 1).padStart(2, '0');
  const d = String(nextDate.getDate()).padStart(2, '0');
  return `${y}${m}${d}`;
}

/**
 * Generate a direct link to add the holiday to Google Calendar.
 */
export function generateGoogleCalendarUrl(holiday) {
  const startDate = formatCompactDate(holiday.date);
  const endDate = getNextDayCompactDate(holiday.date);
  const title = encodeURIComponent(`${holiday.name} (${holiday.country})`);
  const details = encodeURIComponent(
    `${holiday.description || holiday.name}\n\nCultural celebration in ${holiday.country}.\nSource: Global Holiday Calendar`
  );
  const location = encodeURIComponent(holiday.country);

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startDate}/${endDate}&details=${details}&location=${location}`;
}

/**
 * Generate standard iCalendar (.ics) string content.
 */
export function generateIcsContent(holiday) {
  const startDate = formatCompactDate(holiday.date);
  const endDate = getNextDayCompactDate(holiday.date);
  const uid = buildHolidayUid(holiday);
  const nowStamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  const cleanSummary = escapeIcsText(holiday.name || 'Holiday');
  const cleanDesc = escapeIcsText(holiday.description || holiday.name || '');
  const cleanLocation = escapeIcsText(holiday.country || 'Global');

  return [
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
  ].join('\r\n');
}

/**
 * Trigger download of an .ics file in browser environments.
 */
export function downloadIcsFile(holiday) {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return;
  }

  const icsContent = generateIcsContent(holiday);
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const filename = `${holiday.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${holiday.date}.ics`;

  const link = document.createElement('a');
  link.href = window.URL.createObjectURL(blob);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(link.href);
}

/**
 * Add the selected holiday to a calendar URL so the recipient can reopen it.
 */
export function buildHolidayShareUrl(holiday, shareUrl) {
  const rawUrl = shareUrl || (typeof window !== 'undefined' ? window.location.href : '');
  if (!rawUrl) return '';

  try {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost';
    const url = new URL(rawUrl, baseUrl);
    url.searchParams.set('holiday', holiday.name || '');
    url.searchParams.set('date', String(holiday.date || '').split('T')[0]);

    const country = holiday.countryCode || holiday.country;
    if (country) {
      url.searchParams.set('country', country);
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
export async function shareHoliday(holiday, shareUrl) {
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
      if (err.name === 'AbortError') {
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
