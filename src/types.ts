// Shared shapes for holiday data, used by the services and the components
// that render them.

/** The canonical holiday taxonomy. Every provider type is mapped onto one. */
export type HolidayType = 'public' | 'religious' | 'seasonal' | 'cultural' | 'observance';

/**
 * `public` is the statutory set the API returns by default; `extended` covers
 * observances, festivals and calculated seasonal markers.
 */
export type HolidayScope = 'public' | 'extended';

/** What the client asks the API for. `all` means public + extended. */
export type RequestScope = 'public' | 'all';

/** The category chips in the UI. */
export type HolidayCategory = 'all' | 'public' | 'cultural' | 'astronomical';

export interface CulturalInfo {
  origin?: string;
  significance?: string;
  traditions?: string;
}

export interface Holiday {
  id?: string;
  name: string;
  localName?: string;
  /** Calendar date, always YYYY-MM-DD. */
  date: string;
  type: HolidayType;
  scope: HolidayScope;
  subtype?: string;
  source?: string;
  description?: string;
  culturalInfo?: CulturalInfo;
  /** ISO 3166-1 alpha-2 code of the country this record came from. */
  countryCode: string;
  /** Every country this holiday applies to, once merged across a selection. */
  countryCodes: string[];
  /** English country name; display names are resolved per language. */
  country?: string;
  global?: boolean;
  fixed?: boolean;
  canonical_url?: string;
}

/**
 * A holiday record that has not been normalized yet: API payloads and cache
 * entries written by earlier releases carry free-form `type` strings.
 */
export type HolidayLike = Omit<Partial<Holiday>, 'type'> & {
  type?: string;
  subtype?: string;
};

export interface Country {
  code: string;
  name: string;
  popular?: boolean;
}

export interface LocalizedCountry extends Country {
  displayName: string;
}

/** Holidays for a month, keyed by YYYY-MM-DD. */
export type HolidaysByDate = Record<string, Holiday[]>;
