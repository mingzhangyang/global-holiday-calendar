// How a holiday is named and attributed on screen.

import { getCountryDisplayName } from '../services/countryService';
import type { HolidayLike } from '../types';

type NamedHoliday = HolidayLike | null | undefined;

// The languages a country's `localName` is actually written in. When the UI
// language is one of them, the local name is the name a visitor expects;
// otherwise the English name is the only one they can read.
const COUNTRY_LANGUAGES: Record<string, string[]> = {
  CN: ['zh-CN'], TW: ['zh-TW'], HK: ['zh-TW', 'zh-CN'], SG: ['zh-CN', 'en'],
  JP: ['ja'], KR: ['ko'],
  FR: ['fr'], BE: ['fr', 'de'], LU: ['fr', 'de'], CH: ['de', 'fr'], CA: ['en', 'fr'],
  DE: ['de'], AT: ['de'],
  ES: ['es'], MX: ['es'], AR: ['es'], CL: ['es'], CO: ['es'], PE: ['es'],
  US: ['en'], GB: ['en'], IE: ['en'], AU: ['en'], NZ: ['en'], ZA: ['en'],
  IN: ['en'], PH: ['en'], MY: ['en'], NG: ['en'], SI: [], HR: []
};

/**
 * The name to show for a holiday in the current UI language.
 *
 * Falls back to the provider's English name whenever the local name would be
 * unreadable to the visitor.
 */
export function getHolidayDisplayName(holiday: NamedHoliday, language = 'en'): string {
  if (!holiday) return '';

  const localName = holiday.localName?.trim();
  const name = holiday.name?.trim() || localName || '';
  if (!localName || localName === name) return name;

  const languages = COUNTRY_LANGUAGES[String(holiday.countryCode || '').toUpperCase()];

  // Unknown country: prefer the local name only when it matches the script
  // the visitor reads, which we cannot tell — so stay with the English name.
  if (!languages) return name;

  return languages.includes(language) ? localName : name;
}

/**
 * A secondary name worth showing beside the primary one (e.g. "元旦" under
 * "New Year's Day"), or an empty string when it would just repeat.
 */
export function getHolidaySecondaryName(holiday: NamedHoliday, language = 'en'): string {
  if (!holiday) return '';

  const primary = getHolidayDisplayName(holiday, language);
  const alternatives = [holiday.localName, holiday.name]
    .map(value => value?.trim())
    .filter(Boolean);

  const secondary = alternatives.find(value => value !== primary);
  return secondary || '';
}

/**
 * Localized, comma-joined list of the countries a holiday belongs to.
 */
export function getHolidayCountryLabel(holiday: NamedHoliday, language = 'en'): string {
  if (!holiday) return '';

  const codes = holiday.countryCodes?.length ? holiday.countryCodes : [holiday.countryCode];
  const names = codes
    .filter((code): code is string => Boolean(code))
    .map(code => getCountryDisplayName(code, language));

  if (names.length === 0) return holiday.country || '';
  if (names.length <= 2) return names.join(', ');

  return `${names.slice(0, 2).join(', ')} +${names.length - 2}`;
}

/**
 * The translated label for a holiday type.
 *
 * `t` echoes the key back when a language pack has no entry for it, which is
 * how an unrecognised type falls through to the generic label.
 */
export function getHolidayTypeLabel(
  type: string | undefined,
  t: (key: string) => string
): string {
  const translation = t(`holidayType.${type || 'default'}`);
  return translation.startsWith('holidayType.') ? t('holidayType.default') : translation;
}
