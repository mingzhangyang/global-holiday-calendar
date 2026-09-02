import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { handleHolidays, mergeHolidays, omitProse, parseYear } from './holidays.js';
import {
  TEST_CONTEXT as CONTEXT,
  stubBrokenCache,
  stubCacheFailingFor,
  stubEmptyCache,
  stubNagerFailure,
  stubNagerResponse
} from './test-helpers.js';

describe('parseYear', () => {
  it('accepts years the upstream providers cover and rejects the rest', () => {
    expect(parseYear('2026')).toBe(2026);
    expect(parseYear('1999')).toBeNull();
    expect(parseYear('2999')).toBeNull();
    expect(parseYear('not-a-year')).toBeNull();
  });
});

describe('mergeHolidays', () => {
  it('prefers the authoritative source but keeps a statutory classification', () => {
    const [merged] = mergeHolidays([
      { date: '2026-01-01', name: 'New Year', source: 'calendarific', type: 'observance', scope: 'extended', description: 'from calendarific' },
      { date: '2026-01-01', name: 'new year', source: 'nager', type: 'public', scope: 'public', localName: 'Neujahr' }
    ]);

    expect(merged.source).toBe('nager');
    expect(merged.type).toBe('public');
    expect(merged.scope).toBe('public');
    expect(merged.localName).toBe('Neujahr');
    expect(merged.description).toBe('from calendarific');
  });

  it('drops records without a usable calendar date', () => {
    expect(mergeHolidays([{ date: 'not-a-date', name: 'Broken' }])).toHaveLength(0);
  });

  // Calendarific always writes `subtype`, sometimes as undefined. A plain
  // object spread would let that erase the calculated record's real subtype,
  // and with it the day's seasonal classification on the client.
  it('does not let a field the winner merely declares erase the loser\'s value', () => {
    const [merged] = mergeHolidays([
      {
        date: '2026-03-20',
        name: 'Spring Equinox',
        source: 'astronomical-calculation',
        type: 'seasonal',
        subtype: 'astronomical',
        scope: 'extended'
      },
      {
        date: '2026-03-20',
        name: 'spring equinox',
        source: 'calendarific',
        type: 'seasonal',
        subtype: undefined,
        canonical_url: undefined,
        scope: 'extended'
      }
    ]);

    expect(merged.source).toBe('calendarific');
    expect(merged.subtype).toBe('astronomical');
  });
});

describe('omitProse', () => {
  it('removes the prose fields without mutating the original', () => {
    const holiday = { name: 'X', description: 'long', culturalInfo: {} };
    const trimmed = omitProse(holiday);

    expect(trimmed).toEqual({ name: 'X' });
    expect(holiday.description).toBe('long');
  });
});

describe('GET /api/holidays', () => {
  beforeEach(() => {
    stubEmptyCache();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns only statutory days by default', async () => {
    stubNagerResponse([
      { date: '2026-01-01', localName: 'Neujahr', name: "New Year's Day", types: ['Public'] },
      { date: '2026-02-14', localName: 'Valentinstag', name: "Valentine's Day", types: ['Observance'] }
    ]);

    const response = await handleHolidays(
      new Request('https://example.com/api/holidays?year=2026&country=DE'),
      {},
      CONTEXT
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.scope).toBe('public');
    expect(body.holidays.map(holiday => holiday.name)).toEqual(["New Year's Day"]);
  });

  it('returns the extended set on request, including calculated observances', async () => {
    stubNagerResponse([{ date: '2026-01-01', localName: '元旦', name: "New Year's Day", types: ['Public'] }]);

    const response = await handleHolidays(
      new Request('https://example.com/api/holidays?year=2026&country=CN&scope=all'),
      {},
      CONTEXT
    );
    const body = await response.json();

    expect(body.scope).toBe('all');
    expect(body.holidays.filter(holiday => holiday.type === 'seasonal')).toHaveLength(24);
    expect(body.holidays[0].date <= body.holidays[1].date).toBe(true);
  });

  it('answers a batch request keyed by country', async () => {
    stubNagerResponse([{ date: '2026-01-01', localName: 'New Year', name: "New Year's Day", types: ['Public'] }]);

    const response = await handleHolidays(
      new Request('https://example.com/api/holidays?year=2026&countries=US,GB'),
      {},
      CONTEXT
    );
    const body = await response.json();

    expect(Object.keys(body.countries)).toEqual(['US', 'GB']);
    expect(body.total).toBe(2);
  });

  it('serves compact JSON', async () => {
    stubNagerResponse([{ date: '2026-01-01', localName: 'New Year', name: "New Year's Day", types: ['Public'] }]);

    const response = await handleHolidays(
      new Request('https://example.com/api/holidays?year=2026&country=US'),
      {},
      CONTEXT
    );

    expect(await response.text()).not.toContain('\n');
  });

  it('rejects unusable parameters', async () => {
    const badYear = await handleHolidays(
      new Request('https://example.com/api/holidays?year=1900&country=US'),
      {},
      CONTEXT
    );
    expect(badYear.status).toBe(400);

    const badCountry = await handleHolidays(
      new Request('https://example.com/api/holidays?year=2026&country=123'),
      {},
      CONTEXT
    );
    expect(badCountry.status).toBe(400);
  });

  it('degrades to calculated observances when the upstream API fails', async () => {
    stubNagerFailure();

    const response = await handleHolidays(
      new Request('https://example.com/api/holidays?year=2026&country=US&scope=all'),
      {},
      CONTEXT
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.holidays.length).toBeGreaterThan(0);
    expect(body.holidays.every(holiday => holiday.source === 'astronomical-calculation')).toBe(true);
  });
});

describe('unsupported countries', () => {
  beforeEach(() => {
    stubEmptyCache();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('treats an empty 204 body as "no data", not as a failure', async () => {
    // Nager answers 204 with no body for India, Malaysia, Thailand, Taiwan.
    vi.stubGlobal('fetch', vi.fn(async () => ({
      ok: true,
      status: 204,
      text: async () => '',
      json: async () => {
        throw new Error('Unexpected end of JSON input');
      }
    })));

    const response = await handleHolidays(
      new Request('https://example.com/api/holidays?year=2026&country=IN&scope=all'),
      {},
      CONTEXT
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    // Only the calculated observances remain.
    expect(body.holidays.every(holiday => holiday.scope === 'extended')).toBe(true);
    expect(body.holidays.length).toBeGreaterThan(0);
  });
});

describe('batch requests', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('keeps the countries that resolved when one of them fails', async () => {
    stubCacheFailingFor('JP');
    stubNagerResponse([
      { date: '2026-01-01', localName: 'Neujahr', name: "New Year's Day", types: ['Public'] }
    ]);

    const response = await handleHolidays(
      new Request('https://example.com/api/holidays?year=2026&countries=DE,JP'),
      {},
      CONTEXT
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.failed).toEqual(['JP']);
    expect(body.countries.DE.length).toBeGreaterThan(0);
    // Absent, not empty: the client must be able to tell a failure from a
    // country that genuinely has no holidays.
    expect(body.countries.JP).toBeUndefined();
    expect(response.headers.get('Cache-Control')).toBe('no-store');
  });

  it('fails the request when nothing at all resolved', async () => {
    stubBrokenCache();
    stubNagerResponse([]);

    const response = await handleHolidays(
      new Request('https://example.com/api/holidays?year=2026&countries=DE,JP'),
      {},
      CONTEXT
    );

    expect(response.status).toBe(502);
  });
});

describe('scope parsing', () => {
  beforeEach(() => {
    stubEmptyCache();
    stubNagerResponse([
      { date: '2026-01-01', localName: 'Neujahr', name: "New Year's Day", types: ['Public'] },
      { date: '2026-02-14', localName: 'Valentinstag', name: "Valentine's Day", types: ['Observance'] }
    ]);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('treats scope=extended the same as scope=all', async () => {
    const read = async scope => {
      const response = await handleHolidays(
        new Request(`https://example.com/api/holidays?year=2026&country=DE&scope=${scope}`),
        {},
        CONTEXT
      );
      return response.json();
    };

    const [all, extended] = await Promise.all([read('all'), read('extended')]);

    expect(extended.scope).toBe('all');
    expect(extended.total).toBe(all.total);
  });
});
