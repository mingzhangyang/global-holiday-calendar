// Countries the edge search will scan when the visitor asks beyond the
// countries they already selected. One search fans out into one cached
// lookup per code, so this stays a short common-country list rather than
// every country the calendar can display.

export const SEARCH_COUNTRY_CODES = [
  'US', 'GB', 'CA', 'AU', 'IE', 'FR', 'DE', 'IT', 'ES', 'NL',
  'SE', 'PL', 'RU', 'TR', 'CN', 'JP', 'KR', 'IN', 'BR', 'MX'
];
