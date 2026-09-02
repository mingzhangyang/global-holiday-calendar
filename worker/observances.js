// Cultural observances that no holiday API provides: Chinese solar terms,
// regional seasonal markers, and the equinoxes/solstices.
//
// Every date here is produced as a plain YYYY-MM-DD string. Date objects are
// only used for arithmetic, never for formatting: `new Date(y, m, d)` is
// local-time and `toISOString()` is UTC, so round-tripping a calendar date
// through them silently shifts it by a day depending on where the code runs.

import { getCountryName } from './countries.js';
import { SCOPE_EXTENDED } from '../shared/holiday-taxonomy.js';

export function formatDateParts(year, month, day) {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

// ── Chinese solar terms (24 节气) ─────────────────────────────────────────────

// 通用寿星公式 constants for the 21st century. `day = ⌊Y × 0.2422 + C⌋ − L`
// with Y = year − 2000 yields the term's date in China Standard Time (UTC+8),
// which is the timezone the solar terms are defined in. See getSolarTermDay
// for what L is — it is not the same for every term.
const SOLAR_TERMS = [
  { name: '小寒', englishName: 'Minor Cold', month: 1, c: 5.4055 },
  { name: '大寒', englishName: 'Major Cold', month: 1, c: 20.12 },
  { name: '立春', englishName: 'Beginning of Spring', month: 2, c: 3.87 },
  { name: '雨水', englishName: 'Rain Water', month: 2, c: 18.73 },
  { name: '惊蛰', englishName: 'Awakening of Insects', month: 3, c: 5.63 },
  { name: '春分', englishName: 'Spring Equinox', month: 3, c: 20.646 },
  { name: '清明', englishName: 'Clear and Bright', month: 4, c: 4.81 },
  { name: '谷雨', englishName: 'Grain Rain', month: 4, c: 20.1 },
  { name: '立夏', englishName: 'Beginning of Summer', month: 5, c: 5.52 },
  { name: '小满', englishName: 'Grain Buds', month: 5, c: 21.04 },
  { name: '芒种', englishName: 'Grain in Ear', month: 6, c: 5.678 },
  { name: '夏至', englishName: 'Summer Solstice', month: 6, c: 21.37 },
  { name: '小暑', englishName: 'Minor Heat', month: 7, c: 7.108 },
  { name: '大暑', englishName: 'Major Heat', month: 7, c: 22.83 },
  { name: '立秋', englishName: 'Beginning of Autumn', month: 8, c: 7.5 },
  { name: '处暑', englishName: 'End of Heat', month: 8, c: 23.13 },
  { name: '白露', englishName: 'White Dew', month: 9, c: 7.646 },
  { name: '秋分', englishName: 'Autumn Equinox', month: 9, c: 23.042 },
  { name: '寒露', englishName: 'Cold Dew', month: 10, c: 8.318 },
  { name: '霜降', englishName: 'Frost Descent', month: 10, c: 23.438 },
  { name: '立冬', englishName: 'Beginning of Winter', month: 11, c: 7.438 },
  { name: '小雪', englishName: 'Minor Snow', month: 11, c: 22.36 },
  { name: '大雪', englishName: 'Major Snow', month: 12, c: 7.18 },
  { name: '冬至', englishName: 'Winter Solstice', month: 12, c: 21.94 }
];

// The formula is a linear fit, so a handful of terms that fall within a few
// minutes of midnight CST land on the wrong side of it. These are the known
// corrections for the year range the API serves (2015–2035); each was checked
// against a Meeus solar-longitude solve, and each matches the published 寿星
// 公式 exception list. Widening MIN_YEAR/MAX_YEAR means extending this table.
const SOLAR_TERM_EXCEPTIONS = {
  '2019-小寒': -1, // 2019-01-05 23:40 CST
  '2021-冬至': -1, // 2021-12-21 23:51 CST
  '2026-雨水': -1  // 2026-02-18 23:46 CST
};

export function getSolarTermDay(year, term) {
  const y = year - 2000;
  // L counts the leap days that have already happened when the term falls.
  // January and February terms precede their own year's Feb 29, so they count
  // ⌊(Y−1)/4⌋; every term from 惊蛰 onward counts ⌊Y/4⌋. Using the January
  // form all year round puts every later term a day late in leap years.
  const leapDays = term.month <= 2 ? Math.floor((y - 1) / 4) : Math.floor(y / 4);
  const day = Math.floor(y * 0.2422 + term.c) - leapDays;

  return day + (SOLAR_TERM_EXCEPTIONS[`${year}-${term.name}`] || 0);
}

export function getChineseSolarTerms(year) {
  return SOLAR_TERMS.map(term => {
    const day = getSolarTermDay(year, term);
    const date = formatDateParts(year, term.month, day);

    return {
      id: `solar-term-${year}-${term.name}`,
      name: `${term.name} (${term.englishName})`,
      localName: term.name,
      englishName: term.englishName,
      date,
      country: 'China',
      countryCode: 'CN',
      type: 'seasonal',
      subtype: 'solar-term',
      scope: SCOPE_EXTENDED,
      source: 'solar-term-calculation',
      description: `${term.name} (${term.englishName}) is one of the 24 solar terms of the traditional Chinese calendar, marking a seasonal and agricultural transition. It is a cultural observance, not a public holiday.`,
      culturalInfo: {
        origin: 'Ancient Chinese astronomical observations',
        significance: 'Marks seasonal transitions and agricultural activities in traditional Chinese culture',
        traditions: 'Agricultural planning, seasonal foods, traditional medicine practices'
      }
    };
  });
}

// ── Equinoxes and solstices ──────────────────────────────────────────────────

// Meeus, *Astronomical Algorithms*, ch. 27. JDE0 gives the mean event; the
// periodic series below corrects it to within a couple of minutes, which is
// far more than a calendar date needs.
const EVENT_TERMS = {
  march: [2451623.80984, 365242.37404, 0.05169, -0.00411, -0.00057],
  june: [2451716.56767, 365241.62603, 0.00325, 0.00888, -0.00030],
  september: [2451810.21715, 365242.01767, -0.11575, 0.00337, 0.00078],
  december: [2451900.05952, 365242.74049, -0.06223, -0.00823, 0.00032]
};

const PERIODIC_TERMS = [
  [485, 324.96, 1934.136], [203, 337.23, 32964.467], [199, 342.08, 20.186],
  [182, 27.85, 445267.112], [156, 73.14, 45036.886], [136, 171.52, 22518.443],
  [77, 222.54, 65928.934], [74, 296.72, 3034.906], [70, 243.58, 9037.513],
  [58, 119.81, 33718.147], [52, 297.17, 150.678], [50, 21.02, 2281.226],
  [45, 247.54, 29929.562], [44, 325.15, 31555.956], [29, 60.93, 4443.417],
  [18, 155.12, 67555.328], [17, 288.79, 4562.452], [16, 198.04, 62894.029],
  [14, 199.76, 31436.921], [12, 95.39, 14577.848], [12, 287.11, 31931.756],
  [12, 320.81, 34777.259], [9, 227.73, 1222.114], [8, 15.45, 16859.074]
];

const DEG_TO_RAD = Math.PI / 180;

/**
 * Julian Ephemeris Day of an equinox or solstice, for years 1000–3000.
 */
export function getSeasonEventJde(year, event) {
  const [a, b, c, d, e] = EVENT_TERMS[event];
  const y = (year - 2000) / 1000;
  const jde0 = a + b * y + c * y * y + d * y * y * y + e * y * y * y * y;

  const t = (jde0 - 2451545.0) / 36525;
  const w = (35999.373 * t - 2.47) * DEG_TO_RAD;
  const deltaLambda = 1 + 0.0334 * Math.cos(w) + 0.0007 * Math.cos(2 * w);
  const s = PERIODIC_TERMS.reduce(
    (sum, [amplitude, phase, frequency]) =>
      sum + amplitude * Math.cos((phase + frequency * t) * DEG_TO_RAD),
    0
  );

  return jde0 + (0.00001 * s) / deltaLambda;
}

/**
 * Convert a Julian Day to a Gregorian calendar date, shifted by a whole-hour
 * UTC offset so the date is the one observers in that zone see.
 */
export function julianDayToDateParts(julianDay, utcOffsetHours = 0) {
  const shifted = julianDay + utcOffsetHours / 24 + 0.5;
  const z = Math.floor(shifted);
  const f = shifted - z;

  const alpha = Math.floor((z - 1867216.25) / 36524.25);
  const a = z + 1 + alpha - Math.floor(alpha / 4);
  const b = a + 1524;
  const c = Math.floor((b - 122.1) / 365.25);
  const d = Math.floor(365.25 * c);
  const e = Math.floor((b - d) / 30.6001);

  const day = Math.floor(b - d - Math.floor(30.6001 * e) + f);
  const month = e < 14 ? e - 1 : e - 13;
  const year = month > 2 ? c - 4716 : c - 4715;

  return { year, month, day };
}

// Standard (non-DST) UTC offsets. An equinox lands within an hour of local
// midnight rarely enough that ignoring summer time is an acceptable trade for
// not shipping a timezone database to the edge.
const COUNTRY_UTC_OFFSETS = {
  US: -6, CA: -6, MX: -6, BR: -3, AR: -3, CL: -4, CO: -5, PE: -5,
  GB: 0, IE: 0, PT: 0, IS: 0, MA: 1, NG: 1,
  FR: 1, DE: 1, IT: 1, ES: 1, NL: 1, BE: 1, LU: 1, CH: 1, AT: 1,
  SE: 1, NO: 1, DK: 1, PL: 1, CZ: 1, SK: 1, HU: 1, HR: 1, SI: 1, RS: 1,
  FI: 2, RO: 2, BG: 2, GR: 2, UA: 2, ZA: 2, EG: 2, TR: 3, RU: 3,
  IN: 5.5, TH: 7, VN: 7, ID: 7, CN: 8, SG: 8, MY: 8, PH: 8, HK: 8, TW: 8,
  JP: 9, KR: 9, AU: 10, NZ: 12
};

const SEASON_EVENTS = [
  { key: 'march', name: 'Spring Equinox', southernName: 'Autumn Equinox' },
  { key: 'june', name: 'Summer Solstice', southernName: 'Winter Solstice' },
  { key: 'september', name: 'Autumn Equinox', southernName: 'Spring Equinox' },
  { key: 'december', name: 'Winter Solstice', southernName: 'Summer Solstice' }
];

const SOUTHERN_HEMISPHERE = new Set(['AU', 'NZ', 'ZA', 'AR', 'CL', 'BR', 'PE']);

export function getAstronomicalEvents(year, countryCode) {
  const code = String(countryCode || '').toUpperCase();
  const offset = COUNTRY_UTC_OFFSETS[code] ?? 0;
  const isSouthern = SOUTHERN_HEMISPHERE.has(code);

  return SEASON_EVENTS.map(event => {
    const jde = getSeasonEventJde(year, event.key);
    const { year: y, month, day } = julianDayToDateParts(jde, offset);
    const name = isSouthern ? event.southernName : event.name;

    return {
      id: `astronomical-${year}-${event.key}-${code}`,
      name,
      localName: name,
      englishName: name,
      date: formatDateParts(y, month, day),
      country: getCountryName(code),
      countryCode: code,
      type: 'seasonal',
      subtype: 'astronomical',
      scope: SCOPE_EXTENDED,
      source: 'astronomical-calculation',
      description: `${name} marks an astronomical turning point of the year, observed worldwide.`
    };
  });
}

// ── Regional seasonal observances ────────────────────────────────────────────

function buildObservances(entries, { year, countryCode, subtype, source, describe }) {
  return entries.map(entry => ({
    id: `${subtype}-${year}-${entry.englishName.replace(/\s+/g, '-').toLowerCase()}`,
    name: entry.name === entry.englishName ? entry.name : `${entry.name} (${entry.englishName})`,
    localName: entry.name,
    englishName: entry.englishName,
    date: formatDateParts(year, entry.month, entry.day),
    country: getCountryName(countryCode),
    countryCode,
    type: 'cultural',
    subtype: entry.subtype || subtype,
    scope: SCOPE_EXTENDED,
    source,
    description: describe(entry)
  }));
}

export function getJapaneseSeasons(year) {
  const entries = [
    { name: '節分', englishName: 'Setsubun', month: 2, day: 3, subtype: 'seasonal-transition' },
    { name: '彼岸の入り', englishName: 'Higan (Spring)', month: 3, day: 18, subtype: 'buddhist-observance' },
    { name: '八十八夜', englishName: 'Hachijuhachiya', month: 5, day: 2, subtype: 'agricultural' },
    { name: '入梅', englishName: 'Tsuyu (Rainy Season)', month: 6, day: 11, subtype: 'seasonal' },
    { name: '半夏生', englishName: 'Hangesho', month: 7, day: 2, subtype: 'agricultural' },
    { name: '土用の丑の日', englishName: 'Doyo no Ushi no Hi', month: 7, day: 25, subtype: 'seasonal' },
    { name: '彼岸の入り', englishName: 'Higan (Autumn)', month: 9, day: 20, subtype: 'buddhist-observance' }
  ];

  return buildObservances(entries, {
    year,
    countryCode: 'JP',
    subtype: 'japanese-season',
    source: 'japanese-calendar',
    describe: entry => `${entry.name} (${entry.englishName}) is a traditional Japanese seasonal observance marking a transition in nature and agriculture.`
  });
}

export function getIndianSeasons(year) {
  const entries = [
    { name: 'वसंत ऋतु', englishName: 'Vasant Ritu (Spring)', month: 3, day: 21 },
    { name: 'ग्रीष्म ऋतु', englishName: 'Grishma Ritu (Summer)', month: 6, day: 21 },
    { name: 'वर्षा ऋतु', englishName: 'Varsha Ritu (Monsoon)', month: 7, day: 15 },
    { name: 'शरद ऋतु', englishName: 'Sharad Ritu (Autumn)', month: 9, day: 23 },
    { name: 'शिशिर ऋतु', englishName: 'Shishir Ritu (Pre-winter)', month: 11, day: 15 },
    { name: 'शीत ऋतु', englishName: 'Sheet Ritu (Winter)', month: 12, day: 21 }
  ];

  return buildObservances(entries, {
    year,
    countryCode: 'IN',
    subtype: 'indian-season',
    source: 'indian-calendar',
    describe: entry => `${entry.name} (${entry.englishName}) is one of the six seasons (Ritu) of the traditional Indian calendar.`
  });
}

export function getCelticSeasons(year, countryCode = 'GB') {
  const entries = [
    { name: 'Imbolc', englishName: 'Imbolc', month: 2, day: 1 },
    { name: 'Beltane', englishName: 'Beltane', month: 5, day: 1 },
    { name: 'Lughnasadh', englishName: 'Lughnasadh', month: 8, day: 1 },
    { name: 'Samhain', englishName: 'Samhain', month: 11, day: 1 }
  ];

  return buildObservances(entries, {
    year,
    countryCode,
    subtype: 'celtic-season',
    source: 'celtic-calendar',
    describe: entry => `${entry.name} is one of the four traditional Celtic seasonal festivals marking an agricultural and spiritual transition.`
  });
}

export function getNordicSeasons(year, countryCode = 'NO') {
  const entries = [
    { name: 'Dísablót', englishName: 'Disablot', month: 2, day: 14 },
    { name: 'Sigrblót', englishName: 'Sigrblot', month: 4, day: 9 },
    { name: 'Vetrnáttablót', englishName: 'Winter Nights', month: 10, day: 14 },
    { name: 'Jólablót', englishName: 'Yule Blot', month: 12, day: 21 }
  ];

  return buildObservances(entries, {
    year,
    countryCode,
    subtype: 'nordic-season',
    source: 'nordic-calendar',
    describe: entry => `${entry.name} (${entry.englishName}) is a traditional Nordic seasonal observance rooted in ancient Germanic custom.`
  });
}

/**
 * All calculated observances for a country, already scoped as extended.
 */
export function getCulturalObservances(year, countryCode) {
  const code = String(countryCode || '').toUpperCase();
  const observances = [];

  switch (code) {
    case 'CN':
      observances.push(...getChineseSolarTerms(year));
      break;
    case 'JP':
      observances.push(...getJapaneseSeasons(year));
      break;
    case 'IN':
      observances.push(...getIndianSeasons(year));
      break;
    case 'GB':
    case 'IE':
      observances.push(...getCelticSeasons(year, code));
      break;
    case 'NO':
    case 'SE':
    case 'DK':
    case 'IS':
      observances.push(...getNordicSeasons(year, code));
      break;
    default:
      break;
  }

  // The solar terms already include the equinoxes and solstices (春分/夏至/
  // 秋分/冬至), so China would otherwise get them twice.
  if (code !== 'CN') {
    observances.push(...getAstronomicalEvents(year, code));
  }

  return observances;
}
