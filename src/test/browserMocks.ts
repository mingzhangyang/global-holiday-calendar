import { vi } from 'vitest';

/**
 * A localStorage stand-in for the unit suites. Vitest runs in Node, so the
 * modules that persist preferences need a store to talk to.
 */
export function createMockStorage(): Storage {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = String(value); },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
    key: (index: number) => Object.keys(store)[index] ?? null,
    get length() { return Object.keys(store).length; }
  };
}

/**
 * Install a minimal `window` with storage, an origin, and an optional
 * prefers-color-scheme matcher. Returns the storage so a test can seed it.
 */
export function installBrowserGlobals({
  origin = 'http://localhost',
  prefersDark = true
}: { origin?: string; prefersDark?: boolean } = {}): Storage {
  const storage = createMockStorage();

  globalThis.window = {
    localStorage: storage,
    location: { origin },
    matchMedia: vi.fn().mockImplementation((query: string) => ({
      matches: prefersDark && query.includes('dark'),
      media: query
    }))
  } as unknown as Window & typeof globalThis;

  globalThis.localStorage = storage;

  return storage;
}
