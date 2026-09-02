import { useEffect, useMemo, useState } from 'react';
import { fetchCountries, getCachedCountries, getCountryDisplayName } from '../services/countryService';
import { useTranslation } from './useI18n';
import type { LocalizedCountry } from '../types';

/**
 * The countries the holiday API can answer for, named in the current UI
 * language and sorted for it.
 */
export function useCountries(): LocalizedCountry[] {
  const [countries, setCountries] = useState(() => getCachedCountries());
  const { language } = useTranslation();

  useEffect(() => {
    let isActive = true;

    fetchCountries()
      .then(result => {
        if (isActive) setCountries(result);
      })
      .catch(() => {
        // fetchCountries already falls back to the built-in list.
      });

    return () => {
      isActive = false;
    };
  }, []);

  return useMemo(() => {
    const collator = new Intl.Collator(language);

    return countries
      .map(country => ({
        ...country,
        displayName: getCountryDisplayName(country.code, language)
      }))
      .sort((a, b) => collator.compare(a.displayName, b.displayName));
  }, [countries, language]);
}
