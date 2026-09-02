// The canonical holiday taxonomy — the one implementation, imported by both
// the Worker and the client bundle.
//
// Upstream providers disagree wildly about `type` (Nager uses "Public",
// "Bank", "Observance"; Calendarific returns free-form arrays like
// ["National holiday", "Christian"]). Everything is normalized to one of the
// five canonical types below so a legend colour, a category filter and an
// API consumer all mean the same thing by "public holiday".

/** @typedef {'public' | 'religious' | 'cultural' | 'seasonal' | 'observance'} HolidayType */

/** @type {HolidayType[]} */
export const HOLIDAY_TYPES = ['public', 'religious', 'cultural', 'seasonal', 'observance'];

// Scope decides what the API returns by default: only statutory days.
export const SCOPE_PUBLIC = 'public';
export const SCOPE_EXTENDED = 'extended';

const PUBLIC_PATTERNS = [
  'public holiday', 'national holiday', 'federal holiday', 'federal',
  'bank holiday', 'statutory', 'gazetted holiday', 'public'
];
const RELIGIOUS_PATTERNS = [
  'religious', 'christian', 'catholic', 'orthodox', 'muslim', 'islamic',
  'hebrew', 'jewish', 'hindu', 'buddhist', 'sikh', 'jain', 'bahai', 'shinto'
];
const SEASONAL_PATTERNS = [
  'season', 'solstice', 'equinox', 'solar term', 'clock change',
  'daylight saving', 'daylight', 'astronomical'
];
const CULTURAL_PATTERNS = [
  'local holiday', 'common local holiday', 'cultural', 'traditional',
  'de facto holiday', 'de facto', 'optional holiday', 'optional',
  'restricted holiday', 'half day'
];
const OBSERVANCE_PATTERNS = [
  'observance', 'united nations', 'worldwide', 'sporting event',
  'special day', 'awareness', '国际', 'unofficial'
];

function matchesAny(value, patterns) {
  return patterns.some(pattern => value.includes(pattern));
}

/**
 * Map any provider-supplied type string (or array of them) onto a canonical
 * holiday type. Unknown values fall back to `observance`, the most
 * conservative bucket: it never claims a day is statutory.
 *
 * @param {unknown} rawType
 * @returns {HolidayType}
 */
export function normalizeHolidayType(rawType) {
  const value = (Array.isArray(rawType) ? rawType.join(' ') : String(rawType || ''))
    .toLowerCase()
    .trim();

  if (!value) return 'observance';
  if (HOLIDAY_TYPES.includes(/** @type {HolidayType} */ (value))) {
    return /** @type {HolidayType} */ (value);
  }

  // Order matters: "National holiday, Christian" is statutory first.
  if (matchesAny(value, PUBLIC_PATTERNS)) return 'public';
  if (matchesAny(value, SEASONAL_PATTERNS)) return 'seasonal';
  if (matchesAny(value, RELIGIOUS_PATTERNS)) return 'religious';
  if (matchesAny(value, CULTURAL_PATTERNS)) return 'cultural';
  if (matchesAny(value, OBSERVANCE_PATTERNS)) return 'observance';

  return 'observance';
}

/**
 * Nager reports a `types` array per holiday. Only "Public" and "Bank" close
 * offices; everything else is an extended observance.
 *
 * @param {unknown} types
 * @returns {HolidayType}
 */
export function normalizeNagerType(types) {
  const values = (Array.isArray(types) ? types : [types])
    .filter(Boolean)
    .map(value => String(value).toLowerCase());

  if (values.length === 0) return 'public';
  if (values.includes('public') || values.includes('bank')) return 'public';
  if (values.includes('school') || values.includes('authorities') || values.includes('optional')) {
    return 'cultural';
  }
  return 'observance';
}

/**
 * @param {string} type
 * @returns {'public' | 'extended'}
 */
export function getScopeForType(type) {
  return type === 'public' ? SCOPE_PUBLIC : SCOPE_EXTENDED;
}

/**
 * The `scope` query parameter, normalized. Anything that is not an explicit
 * request for everything means statutory days only.
 *
 * @param {unknown} value
 * @returns {'public' | 'all'}
 */
export function normalizeScopeParam(value) {
  const normalized = String(value || '').toLowerCase();
  if (normalized === 'all' || normalized === 'extended') return 'all';
  return SCOPE_PUBLIC;
}

// The subtypes that make a calculated observance astronomical rather than
// cultural. Regional markers ('celtic-season', 'indian-season', …) are
// cultural despite the word in their name, so this is a closed set, never a
// substring test.
const SEASONAL_SUBTYPES = new Set(['solar-term', 'astronomical']);

/**
 * @param {unknown} subtype
 * @returns {boolean}
 */
export function isSeasonalSubtype(subtype) {
  return SEASONAL_SUBTYPES.has(String(subtype || '').toLowerCase());
}
