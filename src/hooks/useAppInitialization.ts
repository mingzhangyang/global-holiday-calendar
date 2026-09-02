import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toCountryCodes } from '../services/countryService';
import { getUserDefaultCountry } from '../services/locationService';
import { useI18n } from './useI18n';

const SUPPORTED_LANGUAGE_CODES = ['en', 'fr', 'de', 'es', 'zh-CN', 'zh-TW', 'ja', 'ko'];
const SELECTED_COUNTRIES_STORAGE_KEY = 'selectedCountries';

function readQueryParam(name: string): string | null {
  if (typeof window === 'undefined') return null;
  return new URLSearchParams(window.location.search).get(name);
}

function getInitialCountriesFromUrl(): string[] | null {
  const countriesParam = readQueryParam('countries');
  if (!countriesParam) return null;

  const codes = toCountryCodes(countriesParam.split(','));
  return codes.length > 0 ? codes : null;
}

function getInitialLanguageFromUrl(): string | null {
  const langParam = readQueryParam('lang');
  return langParam && SUPPORTED_LANGUAGE_CODES.includes(langParam) ? langParam : null;
}

/**
 * Read stored country preferences, converting the display names written by
 * releases before the ISO-code migration.
 */
function getStoredCountries(): string[] {
  if (typeof window === 'undefined') return [];

  try {
    const saved = window.localStorage.getItem(SELECTED_COUNTRIES_STORAGE_KEY);
    const parsed = saved ? JSON.parse(saved) : [];
    if (!Array.isArray(parsed)) return [];

    return toCountryCodes(parsed);
  } catch (error) {
    console.error('Error loading saved countries:', error);
    return [];
  }
}

function persistCountries(countries: string[]): void {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.setItem(SELECTED_COUNTRIES_STORAGE_KEY, JSON.stringify(countries));
  } catch (error) {
    console.error('Error saving countries to localStorage:', error);
  }
}

export function useAppInitialization() {
  const initialCountriesFromUrl = useMemo(() => getInitialCountriesFromUrl(), []);
  const initialLanguageFromUrl = useMemo(() => getInitialLanguageFromUrl(), []);
  const hasInitializedDefaults = useRef(false);
  const { detectLanguage, changeLanguage } = useI18n();

  const [selectedCountries, setSelectedCountries] = useState(
    () => initialCountriesFromUrl || getStoredCountries()
  );
  const [isLoadingLocation, setIsLoadingLocation] = useState(true);
  const [locationDetected, setLocationDetected] = useState(false);

  const updateSelectedCountries = useCallback((countries: string[]) => {
    const codes = toCountryCodes(countries);
    setSelectedCountries(codes);
    persistCountries(codes);
  }, []);

  useEffect(() => {
    if (hasInitializedDefaults.current) return;
    hasInitializedDefaults.current = true;

    const applyDetectedCountry = (code: string | null) => {
      if (!code || initialCountriesFromUrl) return;
      if (getStoredCountries().length > 0) return;

      updateSelectedCountries([code]);
    };

    const initializeDefaults = async () => {
      let defaultCountry: string | null = null;

      try {
        setIsLoadingLocation(true);

        if (initialLanguageFromUrl) {
          await changeLanguage(initialLanguageFromUrl);
        }

        defaultCountry = await getUserDefaultCountry();

        if (defaultCountry) {
          applyDetectedCountry(defaultCountry);
          setLocationDetected(true);
        }
      } catch (error) {
        console.error('Error initializing defaults:', error);
      } finally {
        setIsLoadingLocation(false);
      }

      if (!initialLanguageFromUrl) {
        await detectLanguage(defaultCountry);
      }
    };

    initializeDefaults();
  }, [changeLanguage, detectLanguage, initialCountriesFromUrl, initialLanguageFromUrl, updateSelectedCountries]);

  return {
    selectedCountries,
    updateSelectedCountries,
    isLoadingLocation,
    locationDetected
  };
}
