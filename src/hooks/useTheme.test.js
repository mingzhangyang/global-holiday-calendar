import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getInitialTheme, resolveIsDark, THEMES, THEME_STORAGE_KEY } from './useTheme';

describe('theme helpers', () => {
  beforeEach(() => {
    let store = {};
    const mockStorage = {
      getItem: (key) => store[key] || null,
      setItem: (key, value) => { store[key] = String(value); },
      removeItem: (key) => { delete store[key]; },
      clear: () => { store = {}; }
    };

    globalThis.window = {
      localStorage: mockStorage,
      matchMedia: vi.fn().mockImplementation((query) => ({
        matches: query.includes('dark'),
        media: query
      }))
    };
    globalThis.localStorage = mockStorage;
  });

  it('supports light, dark, and system themes', () => {
    expect(THEMES).toEqual(['light', 'dark', 'system']);
    expect(THEME_STORAGE_KEY).toBe('app-theme');
  });

  it('defaults getInitialTheme to system when nothing is stored', () => {
    expect(getInitialTheme()).toBe('system');
  });

  it('reads stored theme from localStorage if valid', () => {
    globalThis.window.localStorage.setItem(THEME_STORAGE_KEY, 'dark');
    expect(getInitialTheme()).toBe('dark');

    globalThis.window.localStorage.setItem(THEME_STORAGE_KEY, 'light');
    expect(getInitialTheme()).toBe('light');

    globalThis.window.localStorage.setItem(THEME_STORAGE_KEY, 'invalid-theme');
    expect(getInitialTheme()).toBe('system');
  });

  it('resolves isDark correctly for explicit dark/light and system preferences', () => {
    expect(resolveIsDark('dark')).toBe(true);
    expect(resolveIsDark('light')).toBe(false);
    expect(resolveIsDark('system')).toBe(true); // matches our mock
  });
});
