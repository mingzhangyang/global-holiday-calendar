import { useCallback, useEffect, useMemo } from 'react';
import { getCountryCodeByName } from '../services/holidayApi';

function createStateSearchParams({ language, currentView, currentMonthKey, selectedCountries }) {
  const params = new URLSearchParams();
  params.set('lang', language);
  params.set('view', currentView);
  params.set('month', currentMonthKey);

  if (selectedCountries.length > 0) {
    params.set('countries', selectedCountries.map(getCountryCodeByName).join(','));
  }

  return params;
}

export function useUrlStateSync({ language, currentView, currentMonthKey, selectedCountries }) {
  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const params = createStateSearchParams({
      language,
      currentView,
      currentMonthKey,
      selectedCountries
    });

    const nextUrl = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState({}, '', nextUrl);
  }, [currentMonthKey, currentView, language, selectedCountries]);

  const canonicalUrl = useMemo(() => {
    if (typeof window === 'undefined') {
      return 'https://holidays.orangely.xyz/';
    }

    return `${window.location.origin}${window.location.pathname}`;
  }, []);

  const buildLocalizedUrl = useCallback((langCode) => {
    const baseUrl = typeof window !== 'undefined'
      ? window.location.origin
      : 'https://holidays.orangely.xyz';

    const params = createStateSearchParams({
      language: langCode,
      currentView,
      currentMonthKey,
      selectedCountries
    });

    return `${baseUrl}/?${params.toString()}`;
  }, [currentMonthKey, currentView, selectedCountries]);

  return {
    canonicalUrl,
    buildLocalizedUrl
  };
}
