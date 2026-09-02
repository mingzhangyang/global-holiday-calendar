import { useState, useEffect, useCallback } from 'react';

export const THEME_STORAGE_KEY = 'app-theme';
export type ThemeMode = 'light' | 'dark' | 'system';

export const THEMES: ThemeMode[] = ['light', 'dark', 'system'];

export function getInitialTheme(): ThemeMode {
  if (typeof window === 'undefined' || typeof window.localStorage === 'undefined') {
    return 'system';
  }

  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY) as ThemeMode | null;
    if (stored && THEMES.includes(stored)) {
      return stored;
    }
  } catch (e) {
    console.warn('Error reading theme from localStorage:', e);
  }

  return 'system';
}

export function resolveIsDark(themeMode: ThemeMode): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  if (themeMode === 'dark') return true;
  if (themeMode === 'light') return false;

  if (typeof window.matchMedia === 'function') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }

  return false;
}

export function useTheme() {
  const [theme, setThemeState] = useState(getInitialTheme);
  const [isDarkMode, setIsDarkMode] = useState(() => resolveIsDark(getInitialTheme()));

  const applyTheme = useCallback((themeMode: ThemeMode) => {
    if (typeof document === 'undefined') return;

    const isDark = resolveIsDark(themeMode);
    setIsDarkMode(isDark);

    if (isDark) {
      document.documentElement.classList.add('dark');
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.setAttribute('data-theme', 'light');
    }
  }, []);

  const setTheme = useCallback((newTheme: ThemeMode) => {
    if (!THEMES.includes(newTheme)) return;

    setThemeState(newTheme);
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(THEME_STORAGE_KEY, newTheme);
      } catch (e) {
        console.warn('Error saving theme to localStorage:', e);
      }
    }
    applyTheme(newTheme);
  }, [applyTheme]);

  useEffect(() => {
    applyTheme(theme);

    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemChange = () => {
      if (theme === 'system') {
        applyTheme('system');
      }
    };

    mediaQuery.addEventListener('change', handleSystemChange);
    return () => mediaQuery.removeEventListener('change', handleSystemChange);
  }, [theme, applyTheme]);

  return {
    theme,
    setTheme,
    isDarkMode,
    themes: THEMES
  };
}
