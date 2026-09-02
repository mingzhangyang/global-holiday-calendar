import { useCallback, useEffect, useMemo } from 'react';

interface UrlState {
  language: string;
  currentView: string;
  currentMonthKey: string;
  selectedCountries: string[];
  category?: string;
}

function createStateSearchParams({ language, currentView, currentMonthKey, selectedCountries, category }: UrlState): URLSearchParams {
  const params = new URLSearchParams();
  params.set('lang', language);
  params.set('view', currentView);
  params.set('month', currentMonthKey);

  if (selectedCountries.length > 0) {
    params.set('countries', selectedCountries.join(','));
  }

  if (category && category !== 'public') {
    params.set('category', category);
  }

  return params;
}

/**
 * Keep the address bar in step with what is on screen, and hand out the same
 * URL for canonical/hreflang links and for sharing.
 */
export function useUrlStateSync({ language, currentView, currentMonthKey, selectedCountries, category }: UrlState) {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const params = createStateSearchParams({
      language,
      currentView,
      currentMonthKey,
      selectedCountries,
      category
    });

    window.history.replaceState({}, '', `${window.location.pathname}?${params.toString()}`);
  }, [category, currentMonthKey, currentView, language, selectedCountries]);

  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://holidays.orangely.xyz';

  const canonicalUrl = useMemo(() => {
    if (typeof window === 'undefined') return 'https://holidays.orangely.xyz/';
    return `${window.location.origin}${window.location.pathname}`;
  }, []);

  const buildLocalizedUrl = useCallback((langCode: string) => {
    const params = createStateSearchParams({
      language: langCode,
      currentView,
      currentMonthKey,
      selectedCountries,
      category
    });

    return `${origin}/?${params.toString()}`;
  }, [category, currentMonthKey, currentView, origin, selectedCountries]);

  return {
    canonicalUrl,
    buildLocalizedUrl
  };
}
