// Countries are addressed by ISO 3166-1 alpha-2 code everywhere in the app:
// state, URLs, storage and the API all speak codes, and display names are
// derived per language at render time.

import type { Country } from '../types';

const COUNTRIES_ENDPOINT = '/api/countries';
const STORAGE_KEY = 'country-list-v1';
const STORAGE_TTL = 7 * 24 * 60 * 60 * 1000;

// Offline fallback: mirrors the Worker's curated whitelist so the picker
// still works when /api/countries is unreachable.
export const FALLBACK_COUNTRIES: Country[] = [
  { code: 'US', name: 'United States' }, { code: 'CA', name: 'Canada' },
  { code: 'MX', name: 'Mexico' }, { code: 'BR', name: 'Brazil' },
  { code: 'AR', name: 'Argentina' }, { code: 'CL', name: 'Chile' },
  { code: 'CO', name: 'Colombia' }, { code: 'PE', name: 'Peru' },
  { code: 'GB', name: 'United Kingdom' }, { code: 'IE', name: 'Ireland' },
  { code: 'FR', name: 'France' }, { code: 'DE', name: 'Germany' },
  { code: 'IT', name: 'Italy' }, { code: 'ES', name: 'Spain' },
  { code: 'PT', name: 'Portugal' }, { code: 'NL', name: 'Netherlands' },
  { code: 'BE', name: 'Belgium' }, { code: 'LU', name: 'Luxembourg' },
  { code: 'CH', name: 'Switzerland' }, { code: 'AT', name: 'Austria' },
  { code: 'SE', name: 'Sweden' }, { code: 'NO', name: 'Norway' },
  { code: 'DK', name: 'Denmark' }, { code: 'FI', name: 'Finland' },
  { code: 'IS', name: 'Iceland' }, { code: 'PL', name: 'Poland' },
  { code: 'CZ', name: 'Czechia' }, { code: 'SK', name: 'Slovakia' },
  { code: 'HU', name: 'Hungary' }, { code: 'RO', name: 'Romania' },
  { code: 'BG', name: 'Bulgaria' }, { code: 'GR', name: 'Greece' },
  { code: 'HR', name: 'Croatia' }, { code: 'SI', name: 'Slovenia' },
  { code: 'RS', name: 'Serbia' }, { code: 'UA', name: 'Ukraine' },
  { code: 'RU', name: 'Russia' }, { code: 'TR', name: 'Türkiye' },
  { code: 'CN', name: 'China' }, { code: 'JP', name: 'Japan' },
  { code: 'KR', name: 'South Korea' }, { code: 'IN', name: 'India' },
  { code: 'ID', name: 'Indonesia' }, { code: 'SG', name: 'Singapore' },
  { code: 'VN', name: 'Vietnam' }, { code: 'PH', name: 'Philippines' },
  { code: 'MY', name: 'Malaysia' }, { code: 'AU', name: 'Australia' },
  { code: 'NZ', name: 'New Zealand' }, { code: 'ZA', name: 'South Africa' },
  { code: 'MA', name: 'Morocco' }
].map(entry => ({ ...entry, popular: true }));

// Display names the app shipped before the ISO migration; used to convert
// stored preferences and old shared links.
const LEGACY_NAME_TO_CODE: Record<string, string> = {
  'united states': 'US', 'united states of america': 'US', usa: 'US',
  'united kingdom': 'GB', uk: 'GB', 'great britain': 'GB', britain: 'GB',
  france: 'FR', germany: 'DE', canada: 'CA', australia: 'AU', japan: 'JP',
  india: 'IN', mexico: 'MX', brazil: 'BR', italy: 'IT', spain: 'ES',
  netherlands: 'NL', china: 'CN', russia: 'RU', 'south korea': 'KR',
  korea: 'KR', turkey: 'TR', 'türkiye': 'TR', ireland: 'IE', global: 'US'
};

let countriesCache: Country[] | null = null;
let inFlightRequest: Promise<Country[]> | null = null;
const displayNameCache = new Map<string, string>();

function isCountryCode(value: unknown): boolean {
  return /^[A-Za-z]{2}$/.test(String(value || '').trim());
}

/**
 * Accept a code or a legacy display name and return an ISO code (or null).
 */
export function toCountryCode(value: unknown): string | null {
  const raw = String(value || '').trim();
  if (!raw) return null;
  if (isCountryCode(raw)) return raw.toUpperCase();

  const legacy = LEGACY_NAME_TO_CODE[raw.toLowerCase()];
  if (legacy) return legacy;

  const known = (countriesCache || FALLBACK_COUNTRIES).find(
    country => country.name.toLowerCase() === raw.toLowerCase()
  );

  return known ? known.code : null;
}

export function toCountryCodes(values: unknown): string[] {
  const codes = (Array.isArray(values) ? values : [values])
    .map(toCountryCode)
    .filter((code): code is string => Boolean(code));

  return [...new Set(codes)];
}

/**
 * Flag emoji from an ISO code: two regional indicator symbols.
 */
export function getCountryFlag(code: string): string {
  if (!isCountryCode(code)) return '🏳️';

  return String.fromCodePoint(
    ...[...code.toUpperCase()].map(char => 0x1f1e6 + char.charCodeAt(0) - 65)
  );
}

/**
 * Localized country name, with the API's English name as the fallback for
 * environments without Intl.DisplayNames.
 */
export function getCountryDisplayName(code: string, language = 'en'): string {
  const normalized = String(code || '').toUpperCase();
  if (!isCountryCode(normalized)) return normalized;

  const cacheKey = `${language}:${normalized}`;
  const cached = displayNameCache.get(cacheKey);
  if (cached !== undefined) {
    return cached;
  }

  let name = normalized;
  try {
    const displayNames = new Intl.DisplayNames([language], { type: 'region' });
    name = displayNames.of(normalized) || normalized;
  } catch {
    const known = (countriesCache || FALLBACK_COUNTRIES).find(country => country.code === normalized);
    name = known?.name ?? normalized;
  }

  displayNameCache.set(cacheKey, name);
  return name;
}

function readStoredCountries(): Country[] | null {
  if (typeof window === 'undefined') return null;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed?.countries) || parsed.expiry < Date.now()) return null;

    return parsed.countries;
  } catch {
    return null;
  }
}

function persistCountries(countries: Country[]): void {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ countries, expiry: Date.now() + STORAGE_TTL })
    );
  } catch {
    // A full or disabled storage quota is not worth failing the request over.
  }
}

/**
 * The list of countries the holiday API can answer for. Resolved once per
 * session, then persisted for a week.
 */
export async function fetchCountries(): Promise<Country[]> {
  if (countriesCache) return countriesCache;

  const stored = readStoredCountries();
  if (stored?.length) {
    countriesCache = stored;
    return countriesCache;
  }

  if (inFlightRequest) return inFlightRequest;

  inFlightRequest = (async (): Promise<Country[]> => {
    try {
      const response = await fetch(COUNTRIES_ENDPOINT);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const data = await response.json();
      if (!Array.isArray(data?.countries) || data.countries.length === 0) {
        throw new Error('Empty country list');
      }

      countriesCache = data.countries as Country[];
      persistCountries(countriesCache);
      return countriesCache;
    } catch (error) {
      console.warn('Falling back to the built-in country list:', error);
      countriesCache = FALLBACK_COUNTRIES;
      return countriesCache;
    } finally {
      inFlightRequest = null;
    }
  })();

  return inFlightRequest;
}

export function getCachedCountries(): Country[] {
  return countriesCache || readStoredCountries() || FALLBACK_COUNTRIES;
}
