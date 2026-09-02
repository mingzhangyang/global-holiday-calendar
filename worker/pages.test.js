import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { handleCountryMonthPage, handleSitemap, matchCountryMonthPath } from './pages.js';
import { handleIcsFeed } from './ics.js';
import { TEST_CONTEXT as CONTEXT, stubEmptyCache, stubNagerResponse } from './test-helpers.js';

function stubEdge(holidays = []) {
  stubEmptyCache();
  stubNagerResponse(holidays);
}

describe('country/month page routing', () => {
  it('matches the indexable path shape', () => {
    expect(matchCountryMonthPath('/us/2026-01')).toEqual({ code: 'US', year: 2026, month: 1 });
    expect(matchCountryMonthPath('/JP/2026-12/')).toEqual({ code: 'JP', year: 2026, month: 12 });
  });

  it('ignores paths that are not a country and month', () => {
    expect(matchCountryMonthPath('/')).toBeNull();
    expect(matchCountryMonthPath('/usa/2026-01')).toBeNull();
    expect(matchCountryMonthPath('/us/2026-13')).toBeNull();
    expect(matchCountryMonthPath('/us/1999-01')).toBeNull();
    expect(matchCountryMonthPath('/api/holidays')).toBeNull();
  });
});

describe('rendered country/month page', () => {
  beforeEach(() => {
    stubEdge([
      { date: '2026-01-01', localName: 'Neujahr', name: "New Year's Day", types: ['Public'] },
      { date: '2026-02-01', localName: 'Later', name: 'Later Holiday', types: ['Public'] }
    ]);
  });

  afterEach(() => vi.unstubAllGlobals());

  it('serves indexable HTML for the requested month only', async () => {
    const match = matchCountryMonthPath('/de/2026-01');
    const response = await handleCountryMonthPage(
      match,
      new Request('https://example.com/de/2026-01'),
      {},
      CONTEXT
    );
    const html = await response.text();

    expect(response.headers.get('Content-Type')).toContain('text/html');
    expect(html).toContain("New Year's Day");
    expect(html).not.toContain('Later Holiday');
    expect(html).toContain('<link rel="canonical" href="https://holidays.orangely.xyz/de/2026-01">');
    expect(html).toContain('"@type":"Event"');
    expect(html).toContain('/de/2025-12');
    expect(html).toContain('/de/2026-02');
  });

  it('redirects a non-canonical spelling', async () => {
    const match = matchCountryMonthPath('/DE/2026-01');
    const response = await handleCountryMonthPage(
      match,
      new Request('https://example.com/DE/2026-01'),
      {},
      CONTEXT
    );

    expect(response.status).toBe(301);
    expect(response.headers.get('Location')).toBe('https://example.com/de/2026-01');
  });

  it('escapes upstream text instead of injecting it', async () => {
    vi.unstubAllGlobals();
    stubEdge([{ date: '2026-01-05', localName: '<script>x</script>', name: '<script>alert(1)</script>', types: ['Public'] }]);

    const response = await handleCountryMonthPage(
      matchCountryMonthPath('/de/2026-01'),
      new Request('https://example.com/de/2026-01'),
      {},
      CONTEXT
    );
    const html = await response.text();

    expect(html).not.toContain('<script>alert(1)</script>');
    expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
  });
});

describe('sitemap', () => {
  it('lists the home page and country/month pages', () => {
    const response = handleSitemap(new Request('https://example.com/sitemap.xml'));
    return response.text().then(xml => {
      expect(response.headers.get('Content-Type')).toContain('application/xml');
      expect(xml).toContain('<loc>https://example.com/</loc>');
      expect(xml).toMatch(/<loc>https:\/\/example\.com\/us\/\d{4}-\d{2}<\/loc>/);
      expect((xml.match(/<url>/g) || []).length).toBeGreaterThan(100);
    });
  });
});

describe('ICS feed', () => {
  beforeEach(() => {
    stubEdge([{ date: '2026-01-01', localName: 'Neujahr', name: "New Year's Day", types: ['Public'] }]);
  });

  afterEach(() => vi.unstubAllGlobals());

  it('serves a subscribable calendar', async () => {
    const response = await handleIcsFeed(
      new Request('https://example.com/api/holidays.ics?country=DE&years=1'),
      {},
      CONTEXT
    );
    const body = await response.text();

    expect(response.headers.get('Content-Type')).toBe('text/calendar; charset=utf-8');
    expect(response.headers.get('Content-Disposition')).toContain('holidays-de.ics');
    expect(body).toContain('BEGIN:VCALENDAR');
    expect(body).toContain('SUMMARY:New Year\'s Day (Neujahr)');
    expect(body).toContain('DTSTART;VALUE=DATE:20260101');
    expect(body.endsWith('END:VCALENDAR')).toBe(true);
    // RFC 5545 requires CRLF line endings.
    expect(body).toContain('\r\n');
  });

  it('rejects a request without a usable country', async () => {
    const response = await handleIcsFeed(
      new Request('https://example.com/api/holidays.ics?country=zzz1'),
      {},
      CONTEXT
    );

    expect(response.status).toBe(400);
  });
});
