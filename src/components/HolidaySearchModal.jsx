import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Search, X, Calendar, MapPin, ArrowRight, Sparkles, Globe, Loader2 } from 'lucide-react';
import { useTranslation } from '../hooks/useI18n';
import { fetchHolidays, searchHolidays } from '../services/holidayApi';
import { parseDateKey } from '../utils/dateUtils';
import { getLocaleFromLanguage } from '../services/i18nService';
import { getHolidayColor } from '../utils/holidayColors';
import { getHolidayCountryLabel, getHolidayDisplayName } from '../utils/holidayDisplay';
import { useFocusTrap } from '../hooks/useFocusTrap';
import { useStableCountries } from '../hooks/useStableCountries';

const DEBOUNCE_MS = 250;

// A stable empty array: `selectedCountries || []` would hand a new value to
// the memo below on every render.
const EMPTY_COUNTRIES = [];
const MAX_LOCAL_RESULTS = 15;

/**
 * Search over the countries the visitor actually selected — data already in
 * cache — and reach for the rest of the world only when they ask for it.
 */
const HolidaySearchModal = ({ isOpen, onClose, onSelectHoliday, currentYear, selectedCountries, scope }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedTerm, setDebouncedTerm] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [localHolidays, setLocalHolidays] = useState([]);
  const [globalResults, setGlobalResults] = useState(null);
  const [isSearchingGlobally, setIsSearchingGlobally] = useState(false);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);
  const resultsRef = useRef(null);
  const containerRef = useFocusTrap(isOpen, onClose);
  const { t, language } = useTranslation();
  const locale = getLocaleFromLanguage(language);

  const countries = useStableCountries(selectedCountries || EMPTY_COUNTRIES);

  useEffect(() => {
    if (!isOpen) return;

    setSearchTerm('');
    setDebouncedTerm('');
    setSelectedIndex(0);
    setGlobalResults(null);
    const timeoutId = window.setTimeout(() => inputRef.current?.focus(), 50);
    return () => window.clearTimeout(timeoutId);
  }, [isOpen]);

  // Debounce so typing does not re-filter (or re-request) on every keystroke.
  useEffect(() => {
    const timeoutId = window.setTimeout(() => setDebouncedTerm(searchTerm.trim().toLowerCase()), DEBOUNCE_MS);
    return () => window.clearTimeout(timeoutId);
  }, [searchTerm]);

  // The selected countries' year is already cached by the month views, so
  // opening search normally costs no requests at all.
  useEffect(() => {
    if (!isOpen) return undefined;

    if (countries.length === 0) {
      setLocalHolidays([]);
      return undefined;
    }

    let isActive = true;
    setLoading(true);

    fetchHolidays({ year: currentYear, countries, scope })
      .then(({ byCountry }) => {
        if (isActive) setLocalHolidays(Object.values(byCountry).flat());
      })
      .catch(error => console.warn('Error loading search index:', error))
      .finally(() => {
        if (isActive) setLoading(false);
      });

    return () => {
      isActive = false;
    };
  }, [isOpen, currentYear, countries, scope]);

  const filteredHolidays = useMemo(() => {
    if (!debouncedTerm) return localHolidays.slice(0, 8);

    return localHolidays
      .filter(holiday =>
        holiday.name?.toLowerCase().includes(debouncedTerm) ||
        holiday.localName?.toLowerCase().includes(debouncedTerm) ||
        holiday.description?.toLowerCase().includes(debouncedTerm)
      )
      .slice(0, MAX_LOCAL_RESULTS);
  }, [debouncedTerm, localHolidays]);

  const results = globalResults ?? filteredHolidays;

  useEffect(() => {
    setSelectedIndex(0);
    setGlobalResults(null);
  }, [debouncedTerm]);

  const handleGlobalSearch = useCallback(async () => {
    if (debouncedTerm.length < 2) return;

    setIsSearchingGlobally(true);
    try {
      const found = await searchHolidays(debouncedTerm, { year: currentYear, scope });
      setGlobalResults(found);
    } catch (error) {
      console.warn('Global holiday search failed:', error);
      setGlobalResults([]);
    } finally {
      setIsSearchingGlobally(false);
    }
  }, [currentYear, debouncedTerm, scope]);

  const handleItemClick = useCallback((holiday) => {
    onSelectHoliday({ holiday, date: parseDateKey(holiday.date) });
    onClose();
  }, [onSelectHoliday, onClose]);

  useEffect(() => {
    if (!isOpen) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        setSelectedIndex(previous => (previous + 1) % (results.length || 1));
      } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        setSelectedIndex(previous => (previous - 1 + results.length) % (results.length || 1));
      } else if (event.key === 'Enter' && results[selectedIndex]) {
        event.preventDefault();
        handleItemClick(results[selectedIndex]);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, results, selectedIndex, handleItemClick]);

  useEffect(() => {
    resultsRef.current?.children[selectedIndex]?.scrollIntoView({ block: 'nearest' });
  }, [selectedIndex, results]);

  if (!isOpen) return null;

  const canSearchGlobally = debouncedTerm.length >= 2 && globalResults === null;

  return createPortal(
    <div
      className="fixed inset-0 z-[99999] flex items-start justify-center bg-slate-950/60 p-3 sm:p-6 backdrop-blur-sm animate-fade-in-up"
      onClick={onClose}
    >
      <div
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-label={t('search.searchHolidays')}
        className="surface-card-strong mt-10 sm:mt-16 w-full max-w-xl overflow-hidden rounded-3xl shadow-2xl border border-slate-200/90 dark:border-slate-700/90"
        onClick={(event) => event.stopPropagation()}
      >
        {/* Search Header Input */}
        <div className="flex items-center gap-3 border-b border-slate-200/80 dark:border-slate-800 p-4">
          <Search size={20} className="text-teal-600 dark:text-teal-400 shrink-0" aria-hidden="true" />
          <input
            ref={inputRef}
            type="text"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder={t('search.placeholder')}
            className="w-full bg-transparent text-base sm:text-lg text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none"
            aria-label={t('search.placeholder')}
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="rounded-full p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              aria-label={t('common.close')}
            >
              <X size={16} />
            </button>
          )}
          <kbd className="hidden sm:inline-block rounded-md border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-xs text-slate-500 font-mono">
            ESC
          </kbd>
        </div>

        {/* Search Results List */}
        <div
          ref={resultsRef}
          className="max-h-80 overflow-y-auto p-2 divide-y divide-slate-100 dark:divide-slate-800/60"
        >
          {loading && localHolidays.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-sm">
              <div className="animate-spin rounded-full h-6 w-6 border border-teal-500 border-t-transparent mx-auto mb-2" />
              <span>{t('calendar.loading')}</span>
            </div>
          ) : results.length === 0 ? (
            <div className="p-8 text-center text-slate-500 dark:text-slate-400 text-sm">
              <Sparkles size={24} className="mx-auto mb-2 opacity-50 text-teal-500" aria-hidden="true" />
              <p>{t('search.noResults')}</p>
            </div>
          ) : (
            results.map((holiday, index) => {
              const isSelected = index === selectedIndex;
              const formatted = parseDateKey(holiday.date).toLocaleDateString(locale, {
                month: 'short',
                day: 'numeric'
              });

              return (
                <button
                  key={`${holiday.date}-${holiday.countryCode}-${holiday.name}`}
                  type="button"
                  onClick={() => handleItemClick(holiday)}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`w-full flex items-center justify-between gap-3 p-3 rounded-2xl text-left transition-all ${
                    isSelected
                      ? 'bg-teal-50/90 dark:bg-teal-950/60 text-teal-950 dark:text-teal-100 ring-1 ring-teal-200 dark:ring-teal-800'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-800 dark:text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className="h-2.5 w-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: getHolidayColor(holiday) }}
                      aria-hidden="true"
                    />
                    <div className="min-w-0">
                      <div className="text-sm font-semibold truncate">
                        {getHolidayDisplayName(holiday, language)}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                        <span className="flex items-center gap-1">
                          <MapPin size={12} aria-hidden="true" />
                          <span>{getHolidayCountryLabel(holiday, language)}</span>
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Calendar size={12} aria-hidden="true" />
                          <span>{formatted}</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  <ArrowRight
                    size={16}
                    className={`shrink-0 transition-transform ${
                      isSelected ? 'translate-x-0.5 text-teal-600 dark:text-teal-400' : 'opacity-0'
                    }`}
                    aria-hidden="true"
                  />
                </button>
              );
            })
          )}
        </div>

        {/* Footer: scope hint and the opt-in worldwide search */}
        <div className="border-t border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 px-4 py-2.5 text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between gap-3">
          {canSearchGlobally ? (
            <button
              type="button"
              onClick={handleGlobalSearch}
              disabled={isSearchingGlobally}
              className="inline-flex items-center gap-1.5 rounded-full bg-white dark:bg-slate-800 px-3 py-1 font-semibold text-teal-700 dark:text-teal-300 ring-1 ring-slate-200 dark:ring-slate-700 hover:bg-teal-50 dark:hover:bg-slate-700 disabled:opacity-60"
            >
              {isSearchingGlobally ? (
                <Loader2 size={12} className="animate-spin" aria-hidden="true" />
              ) : (
                <Globe size={12} aria-hidden="true" />
              )}
              <span>{t('search.searchAllCountries')}</span>
            </button>
          ) : (
            <span>{t('search.shortcutHint')}</span>
          )}
          <span className="font-semibold text-teal-600 dark:text-teal-400 shrink-0">
            {t('search.resultCount', { count: results.length })}
          </span>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default React.memo(HolidaySearchModal);
