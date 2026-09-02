// Date helpers for working with date-only values (YYYY-MM-DD).
// Never round-trip date-only values through Date/toISOString: local dates
// shift to the previous/next UTC day depending on the user's timezone.

/**
 * Format a Date as a YYYY-MM-DD key using its local date components.
 */
export function toDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Parse a YYYY-MM-DD key into a Date at local midnight.
 *
 * Tolerates date keys that carry a trailing time/timezone (e.g.
 * "2026-06-21T08:24:00+08:00"), which some upstream APIs return for
 * astronomical events, by reading only the leading calendar date.
 */
export function parseDateKey(dateKey: string): Date {
  const datePart = String(dateKey).split('T')[0];
  const [year, month, day] = datePart.split('-').map(Number);
  return new Date(year, month - 1, day);
}

/**
 * Convert a date-only key into a UTC day number.
 *
 * Using UTC here keeps date differences at exactly one day across local DST
 * transitions; the value represents a calendar day, not an instant in time.
 */
export function getDateOnlyDayNumber(dateKey: string): number {
  const datePart = String(dateKey).split('T')[0];
  const [year, month, day] = datePart.split('-').map(Number);
  return Date.UTC(year, month - 1, day) / (24 * 60 * 60 * 1000);
}

/**
 * Build the YYYY-MM- prefix for a given year and zero-based month,
 * for matching date keys against a month without parsing them.
 */
export function toMonthPrefix(year: number, month: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-`;
}

// Locales that do not start the week on Monday. Used as the fallback when
// Intl.Locale#getWeekInfo is unavailable (Firefox, older Safari).
const SUNDAY_FIRST_LOCALES = new Set([
  'en-US', 'en-CA', 'en-AU', 'en-NZ', 'en-ZA', 'en-IL', 'en-PH',
  'ja-JP', 'ko-KR', 'zh-TW', 'zh-HK', 'pt-BR', 'es-MX', 'he-IL', 'th-TH'
]);

/**
 * First day of the week for a locale, as a JS day index (0 = Sunday).
 *
 * Most of the world starts on Monday; hardcoding Sunday put the weekend in
 * the wrong place for every European and Chinese visitor.
 */
export function getFirstDayOfWeek(locale: string = 'en-US'): number {
  try {
    // getWeekInfo() is newer than the DOM lib's Intl typings.
    const intlLocale = new Intl.Locale(locale) as Intl.Locale & {
      getWeekInfo?: () => { firstDay: number };
      weekInfo?: { firstDay: number };
    };
    const weekInfo = intlLocale.getWeekInfo?.() ?? intlLocale.weekInfo;
    if (weekInfo?.firstDay) {
      // Intl uses 1 = Monday … 7 = Sunday.
      return weekInfo.firstDay % 7;
    }
  } catch {
    // Fall through to the static table.
  }

  return SUNDAY_FIRST_LOCALES.has(locale) ? 0 : 1;
}

/**
 * Rotate a Sunday-first array (weekday names) to start at `firstDay`.
 */
export function rotateToWeekStart<T>(items: T[], firstDay: number): T[] {
  if (!Array.isArray(items) || items.length === 0 || !firstDay) return items;
  return [...items.slice(firstDay), ...items.slice(0, firstDay)];
}

/**
 * How many leading blank cells a month needs for a given week start.
 */
export function getLeadingDayCount(firstDayOfMonth: number, firstDayOfWeek: number): number {
  return (firstDayOfMonth - firstDayOfWeek + 7) % 7;
}
