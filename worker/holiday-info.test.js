import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { handleHolidayInfo } from './holiday-info.js';

function makeRequest() {
  return new Request('https://example.com/api/holiday-info', {
    method: 'POST',
    body: JSON.stringify({
      holiday: 'Diwali',
      country: 'India',
      language: 'en'
    })
  });
}

describe('handleHolidayInfo provider models', () => {
  let fetchMock;

  beforeEach(() => {
    vi.stubGlobal('caches', {
      default: {
        match: vi.fn().mockResolvedValue(undefined),
        put: vi.fn().mockResolvedValue(undefined)
      }
    });
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('uses the supported Gemini default and accepts a model override', async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({
      candidates: [{ content: { parts: [{ text: 'background' }] } }]
    }), { status: 200 }));

    await handleHolidayInfo(makeRequest(), { GEMINI_API_KEY: 'test-key' }, { waitUntil() {} });
    expect(fetchMock.mock.calls[0][0]).toContain('/models/gemini-3.5-flash-lite:generateContent');
    expect(JSON.parse(fetchMock.mock.calls[0][1].body).generationConfig)
      .toEqual({ thinkingConfig: { thinkingLevel: 'minimal' } });

    fetchMock.mockClear();
    await handleHolidayInfo(
      makeRequest(),
      { GEMINI_API_KEY: 'test-key', GEMINI_MODEL: 'custom-flash' },
      { waitUntil() {} }
    );
    expect(fetchMock.mock.calls[0][0]).toContain('/models/custom-flash:generateContent');
  });

  it('uses the supported Zhipu fallback default', async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({
      choices: [{ message: { content: 'background' } }]
    }), { status: 200 }));

    await handleHolidayInfo(makeRequest(), { ZHIPU_API_KEY: 'id.secret' }, { waitUntil() {} });

    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.model).toBe('glm-4.7-flash');
    expect(body.thinking).toEqual({ type: 'disabled' });
  });
});
