import { vi } from 'vitest';

/** An execution context whose waitUntil does nothing, for handler tests. */
export const TEST_CONTEXT = { waitUntil: () => {} };

/** A cache that never hits, so every test exercises the fetch path. */
export function stubEmptyCache() {
  vi.stubGlobal('caches', {
    default: {
      match: vi.fn().mockResolvedValue(undefined),
      put: vi.fn().mockResolvedValue(undefined)
    }
  });
}

/**
 * Stub the upstream Nager call. The handler reads the body as text before
 * parsing (Nager answers 204 with no body for unsupported countries), so the
 * stub has to offer both.
 */
export function stubNagerResponse(holidays) {
  const body = JSON.stringify(holidays);

  vi.stubGlobal('fetch', vi.fn(async () => ({
    ok: true,
    status: 200,
    text: async () => body,
    json: async () => JSON.parse(body)
  })));
}

/** Stub an upstream failure. */
export function stubNagerFailure(status = 502) {
  vi.stubGlobal('fetch', vi.fn(async () => ({
    ok: false,
    status,
    text: async () => 'upstream down',
    json: async () => {
      throw new Error('not json');
    }
  })));
}

/**
 * A cache that rejects for one country and misses for every other, so a test
 * can exercise a per-country failure inside a batch.
 */
export function stubCacheFailingFor(countryCode) {
  vi.stubGlobal('caches', {
    default: {
      match: vi.fn(async request => {
        if (String(request.url).includes(`country=${countryCode}`)) {
          throw new Error('cache unavailable');
        }
        return undefined;
      }),
      put: vi.fn().mockResolvedValue(undefined)
    }
  });
}

/** A cache that rejects for every lookup. */
export function stubBrokenCache() {
  vi.stubGlobal('caches', {
    default: {
      match: vi.fn(async () => {
        throw new Error('cache unavailable');
      }),
      put: vi.fn().mockResolvedValue(undefined)
    }
  });
}
