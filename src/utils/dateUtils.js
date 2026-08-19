// Date helpers for working with date-only values (YYYY-MM-DD).
// Never round-trip date-only values through Date/toISOString: local dates
// shift to the previous/next UTC day depending on the user's timezone.

/**
 * Format a Date as a YYYY-MM-DD key using its local date components.
 */
export function toDateKey(date) {
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
export function parseDateKey(dateKey) {
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
export function getDateOnlyDayNumber(dateKey) {
  const datePart = String(dateKey).split('T')[0];
  const [year, month, day] = datePart.split('-').map(Number);
  return Date.UTC(year, month - 1, day) / (24 * 60 * 60 * 1000);
}

/**
 * Build the YYYY-MM- prefix for a given year and zero-based month,
 * for matching date keys against a month without parsing them.
 */
export function toMonthPrefix(year, month) {
  return `${year}-${String(month + 1).padStart(2, '0')}-`;
}
