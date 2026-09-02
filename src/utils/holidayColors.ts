// The client half of the canonical holiday taxonomy: what colour each type
// wears, and what a holiday record's type is.
//
// The classification rules themselves live in shared/holiday-taxonomy.js so
// the Worker and the bundle cannot drift; this module adds only the things
// that are purely presentational. A dot in the calendar, a row in the list
// and a swatch in the legend all read from here, so the legend actually
// explains the grid.
//
// The palette is validated for both themes: every adjacent pair clears the
// colour-vision-deficiency separation floor and every step clears 3:1
// contrast on the light and dark chart surfaces. Colour is never the only
// signal — each swatch ships with its label.

import type { HolidayLike, HolidayType } from '../types';
import { isSeasonalSubtype, normalizeHolidayType } from '../../shared/holiday-taxonomy.js';

export { normalizeHolidayType };

// Legend display order — deliberately not the declaration order in
// shared/holiday-taxonomy.js: it keeps the two blue-greens (public, seasonal)
// apart so neighbouring swatches stay separable. A test asserts this stays a
// permutation of the canonical set.
export const HOLIDAY_TYPES: HolidayType[] = ['public', 'religious', 'seasonal', 'cultural', 'observance'];

export const HOLIDAY_TYPE_COLORS: Record<HolidayType, string> = {
  public: '#0d9488',
  religious: '#7c3aed',
  seasonal: '#0891b2',
  cultural: '#ea580c',
  observance: '#c026d3'
};

export const HOLIDAY_TYPE_LABEL_KEYS: Record<HolidayType, string> = {
  public: 'legend.nationalHoliday',
  religious: 'legend.religiousObservance',
  seasonal: 'legend.seasonal',
  cultural: 'legend.culturalFestival',
  observance: 'legend.internationalDay'
};

const FALLBACK_COLOR = HOLIDAY_TYPE_COLORS.observance;

/**
 * The canonical type of a holiday record, tolerating pre-taxonomy entries
 * still sitting in a visitor's localStorage cache.
 */
export function getHolidayType(holiday: HolidayLike | null | undefined): HolidayType {
  if (!holiday) return 'observance';

  // Calculated observances carry an explicit subtype. Only the astronomical
  // ones are seasonal: regional markers such as `celtic-season` or
  // `indian-season` are cultural despite the word in their name.
  if (isSeasonalSubtype(holiday.subtype)) return 'seasonal';

  return normalizeHolidayType(holiday.type);
}

export function getHolidayColor(holiday: HolidayLike | null | undefined): string {
  return HOLIDAY_TYPE_COLORS[getHolidayType(holiday)] || FALLBACK_COLOR;
}
