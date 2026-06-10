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
 */
export function parseDateKey(dateKey) {
  const [year, month, day] = dateKey.split('-').map(Number);
  return new Date(year, month - 1, day);
}

/**
 * Build the YYYY-MM- prefix for a given year and zero-based month,
 * for matching date keys against a month without parsing them.
 */
export function toMonthPrefix(year, month) {
  return `${year}-${String(month + 1).padStart(2, '0')}-`;
}
