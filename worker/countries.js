// Shared country metadata for the Worker.
//
// The app addresses countries by ISO 3166-1 alpha-2 code everywhere. The
// curated list below is the "popular countries" whitelist: it is intersected
// with Nager's live AvailableCountries list at request time, so a code that
// Nager drops (or never supported) disappears on its own.

export const POPULAR_COUNTRY_CODES = [
  // Americas
  'US', 'CA', 'MX', 'BR', 'AR', 'CL', 'CO', 'PE',
  // Western Europe
  'GB', 'IE', 'FR', 'DE', 'IT', 'ES', 'PT', 'NL', 'BE', 'LU', 'CH', 'AT',
  // Northern Europe
  'SE', 'NO', 'DK', 'FI', 'IS',
  // Central & Eastern Europe
  'PL', 'CZ', 'SK', 'HU', 'RO', 'BG', 'GR', 'HR', 'SI', 'RS', 'UA', 'RU', 'TR',
  // Asia
  'CN', 'JP', 'KR', 'IN', 'ID', 'SG', 'VN', 'PH', 'MY', 'TH', 'HK', 'TW',
  // Oceania & Africa
  'AU', 'NZ', 'ZA', 'MA', 'EG', 'NG'
];

// English fallback names. Clients localize with Intl.DisplayNames; this map
// only has to keep server-rendered pages and .ics feeds readable.
export const COUNTRY_NAMES = {
  US: 'United States', CA: 'Canada', MX: 'Mexico', BR: 'Brazil', AR: 'Argentina',
  CL: 'Chile', CO: 'Colombia', PE: 'Peru', GB: 'United Kingdom', IE: 'Ireland',
  FR: 'France', DE: 'Germany', IT: 'Italy', ES: 'Spain', PT: 'Portugal',
  NL: 'Netherlands', BE: 'Belgium', LU: 'Luxembourg', CH: 'Switzerland',
  AT: 'Austria', SE: 'Sweden', NO: 'Norway', DK: 'Denmark', FI: 'Finland',
  IS: 'Iceland', PL: 'Poland', CZ: 'Czechia', SK: 'Slovakia', HU: 'Hungary',
  RO: 'Romania', BG: 'Bulgaria', GR: 'Greece', HR: 'Croatia', SI: 'Slovenia',
  RS: 'Serbia', UA: 'Ukraine', RU: 'Russia', TR: 'Türkiye', CN: 'China',
  JP: 'Japan', KR: 'South Korea', IN: 'India', ID: 'Indonesia', SG: 'Singapore',
  VN: 'Vietnam', PH: 'Philippines', MY: 'Malaysia', TH: 'Thailand',
  HK: 'Hong Kong', TW: 'Taiwan', AU: 'Australia', NZ: 'New Zealand',
  ZA: 'South Africa', MA: 'Morocco', EG: 'Egypt', NG: 'Nigeria'
};

// Legacy display names that older clients (and shared links) may still send.
const LEGACY_NAME_TO_CODE = {
  'usa': 'US', 'united states': 'US', 'united states of america': 'US',
  'uk': 'GB', 'united kingdom': 'GB', 'great britain': 'GB', 'britain': 'GB',
  'south korea': 'KR', 'korea': 'KR', 'czech republic': 'CZ',
  'turkey': 'TR', 'türkiye': 'TR', 'russia': 'RU', 'russian federation': 'RU'
};

const NAME_TO_CODE = Object.entries(COUNTRY_NAMES).reduce((map, [code, name]) => {
  map[name.toLowerCase()] = code;
  return map;
}, { ...LEGACY_NAME_TO_CODE });

/**
 * Accept either an ISO code or a (legacy) display name and return an ISO code.
 */
export function getCountryCode(country) {
  const raw = String(country || '').trim();
  if (!raw) return '';
  if (/^[A-Za-z]{2}$/.test(raw)) return raw.toUpperCase();
  return NAME_TO_CODE[raw.toLowerCase()] || raw.toUpperCase();
}

export function getCountryName(code) {
  const normalized = String(code || '').toUpperCase();
  return COUNTRY_NAMES[normalized] || normalized;
}

export function isValidCountryCode(code) {
  return /^[A-Z]{2}$/.test(String(code || '').toUpperCase());
}

/**
 * Parse the `country` / `countries` query parameters into a de-duplicated,
 * length-capped list of ISO codes.
 */
export function parseCountryParams(searchParams, { max = 12, fallback = 'US' } = {}) {
  const raw = searchParams.get('countries') || searchParams.get('country') || fallback;
  const codes = String(raw)
    .split(',')
    .map(value => getCountryCode(value))
    .filter(isValidCountryCode);

  return [...new Set(codes)].slice(0, max);
}

const NAGER_COUNTRIES_URL = 'https://date.nager.at/api/v3/AvailableCountries';

/**
 * Fetch Nager's supported-country list, intersected with the curated
 * whitelist. Falls back to the whitelist when the upstream call fails so the
 * country picker is never empty.
 */
export async function fetchSupportedCountries() {
  try {
    const response = await fetch(NAGER_COUNTRIES_URL, {
      headers: { 'User-Agent': 'Holiday-Calendar-Worker/1.0' },
      cf: { cacheTtl: 86400, cacheEverything: true }
    });

    if (!response.ok) {
      throw new Error(`Nager AvailableCountries error: ${response.status}`);
    }

    const data = await response.json();
    if (!Array.isArray(data) || data.length === 0) {
      throw new Error('Nager AvailableCountries returned no data');
    }

    const upstream = new Map(
      data
        .filter(entry => isValidCountryCode(entry?.countryCode))
        .map(entry => [entry.countryCode.toUpperCase(), entry.name])
    );

    // Union, not intersection: a curated country stays on the list even when
    // Nager has no data for it (India, Malaysia, Thailand and Taiwan are
    // covered by Calendarific and by the calculated observances instead).
    const popular = POPULAR_COUNTRY_CODES.map(code => ({
      code,
      name: COUNTRY_NAMES[code] || upstream.get(code) || code,
      popular: true
    }));

    const popularCodes = new Set(popular.map(entry => entry.code));
    const rest = [...upstream.entries()]
      .filter(([code]) => !popularCodes.has(code))
      .map(([code, name]) => ({ code, name: COUNTRY_NAMES[code] || name, popular: false }))
      .sort((a, b) => a.name.localeCompare(b.name));

    return { countries: [...popular, ...rest], source: 'nager' };
  } catch (error) {
    console.warn('Falling back to the built-in country list:', error.message);
    return {
      countries: POPULAR_COUNTRY_CODES.map(code => ({
        code,
        name: COUNTRY_NAMES[code] || code,
        popular: true
      })),
      source: 'fallback'
    };
  }
}
