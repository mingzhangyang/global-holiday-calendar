import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getCountryCodeByName, getCountryNameByCode } from '../services/holidayApi';
import { getUserDefaultCountry } from '../services/locationService';
import { useI18n } from './useI18n';

const SUPPORTED_LANGUAGE_CODES = ['en', 'fr', 'de', 'es', 'zh-CN', 'zh-TW', 'ja', 'ko'];
const SELECTED_COUNTRIES_STORAGE_KEY = 'selectedCountries';

function getInitialCountriesFromUrl() {
  if (typeof window === 'undefined') {
    return null;
  }

  const countriesParam = new URLSearchParams(window.location.search).get('countries');
  if (!countriesParam) {
    return null;
  }

  const parsedCountries = countriesParam
    .split(',')
    .map(code => getCountryNameByCode(code.trim().toUpperCase()))
    .filter(Boolean);

  return parsedCountries.length > 0 ? parsedCountries : null;
}

function getInitialLanguageFromUrl() {
  if (typeof window === 'undefined') {
    return null;
  }

  const langParam = new URLSearchParams(window.location.search).get('lang');
  return SUPPORTED_LANGUAGE_CODES.includes(langParam) ? langParam : null;
}

function getStoredCountries() {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const savedCountries = window.localStorage.getItem(SELECTED_COUNTRIES_STORAGE_KEY);
    const parsedCountries = savedCountries ? JSON.parse(savedCountries) : [];
    return Array.isArray(parsedCountries) ? parsedCountries : [];
  } catch (error) {
    console.error('Error loading saved countries:', error);
    return [];
  }
}

function persistCountries(countries) {
  if (typeof window === 'undefined') {
    return;
  }

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

  const [selectedCountries, setSelectedCountries] = useState(() => {
    if (initialCountriesFromUrl) {
      return initialCountriesFromUrl;
    }

    return getStoredCountries();
  });
  const [isLoadingLocation, setIsLoadingLocation] = useState(true);
  const [locationDetected, setLocationDetected] = useState(false);

  const updateSelectedCountries = useCallback((countries) => {
    setSelectedCountries(countries);
    persistCountries(countries);
  }, []);

  useEffect(() => {
    if (hasInitializedDefaults.current) {
      return;
    }

    hasInitializedDefaults.current = true;
    let isActive = true;

    const applyDetectedCountry = (country) => {
      if (!country || initialCountriesFromUrl) {
        return;
      }

      const storedCountries = getStoredCountries();
      if (storedCountries.length > 0) {
        return;
      }

      updateSelectedCountries([country]);
    };

    const initializeDefaults = async () => {
      let defaultCountry = null;

      try {
        setIsLoadingLocation(true);

        if (initialLanguageFromUrl) {
          await changeLanguage(initialLanguageFromUrl);
        }

        defaultCountry = await getUserDefaultCountry();

        if (defaultCountry) {
          applyDetectedCountry(defaultCountry);
          setLocationDetected(true);
          console.log('Default country set to:', defaultCountry);
        }
      } catch (error) {
        console.error('Error initializing defaults:', error);
      } finally {
        setIsLoadingLocation(false);
      }

      if (!initialLanguageFromUrl) {
        const countryCode = defaultCountry ? getCountryCodeByName(defaultCountry) : null;
        await detectLanguage(countryCode);
      }
    };

    initializeDefaults();

    return () => {
      isActive = false;
    };
  }, [changeLanguage, detectLanguage, initialCountriesFromUrl, initialLanguageFromUrl, updateSelectedCountries]);

  return {
    selectedCountries,
    updateSelectedCountries,
    isLoadingLocation,
    locationDetected
  };
}
