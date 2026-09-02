import React, { useMemo, useState } from 'react';
import { Filter, X, Globe, MapPin, Search } from 'lucide-react';
import { useTranslation } from '../hooks/useI18n';
import { getCountryFlag } from '../services/countryService';
import { MAX_BATCH_COUNTRIES } from '../../shared/api-limits.js';

// The picker enforces the API's own batch ceiling, so a selection can always
// be answered in one round trip.
export const MAX_SELECTED_COUNTRIES = MAX_BATCH_COUNTRIES;

const CountryFilter = ({
  countries,
  selectedCountries,
  onCountriesChange,
  isLoadingLocation,
  locationDetected
}) => {
  const [isExpanded, setIsExpanded] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth >= 1024;
  });
  const [query, setQuery] = useState('');
  const [showAll, setShowAll] = useState(false);
  const { t } = useTranslation();

  const selectedSet = useMemo(() => new Set(selectedCountries), [selectedCountries]);
  const hasMoreThanPopular = useMemo(
    () => countries.some(country => !country.popular),
    [countries]
  );

  const visibleCountries = useMemo(() => {
    const term = query.trim().toLowerCase();

    return countries.filter(country => {
      if (term) {
        return (
          country.displayName.toLowerCase().includes(term) ||
          country.name.toLowerCase().includes(term) ||
          country.code.toLowerCase() === term
        );
      }

      // Selected countries stay visible even when they sit outside the
      // curated short list.
      return showAll || country.popular || selectedSet.has(country.code);
    });
  }, [countries, query, showAll, selectedSet]);

  const selectedCount = selectedCountries.length;
  const isAtLimit = selectedCount >= MAX_SELECTED_COUNTRIES;

  const handleCountryToggle = (code) => {
    if (selectedSet.has(code)) {
      onCountriesChange(selectedCountries.filter(selected => selected !== code));
      return;
    }

    if (isAtLimit) return;
    onCountriesChange([...selectedCountries, code]);
  };

  return (
    <div className="surface-card overflow-hidden rounded-[24px]">
      {/* Filter Header */}
      <div className="bg-cyan-600 p-4 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Filter size={20} />
            <h3 className="text-lg font-semibold">{t('countryFilter.title')}</h3>
          </div>
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="focus-ring rounded-full border border-white/10 bg-white/10 p-2 hover:bg-white/15"
            aria-label={isExpanded ? t('countryFilter.collapse') : t('countryFilter.expand')}
            aria-expanded={isExpanded}
          >
            {isExpanded ? <X size={20} /> : <Filter size={20} />}
          </button>
        </div>

        <div className="mt-2 text-sm opacity-90">
          {isLoadingLocation ? (
            <span className="flex items-center space-x-1">
              <span className="animate-spin rounded-full h-3 w-3 border border-white border-t-transparent" />
              <span>{t('countryFilter.detectingLocation')}</span>
            </span>
          ) : locationDetected && selectedCount > 0 ? (
            <span className="flex items-center space-x-1">
              <MapPin size={16} />
              <span>{t('countryFilter.locationBased', { count: selectedCount })}</span>
            </span>
          ) : (
            <span>
              {t('countryFilter.selectedCount', { count: selectedCount, total: countries.length })}
            </span>
          )}
        </div>
      </div>

      {/* Filter Content */}
      {isExpanded ? (
        <div className="p-3 sm:p-4">
          <label className="mb-3 flex items-center gap-2 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2">
            <Search size={16} className="text-slate-400 shrink-0" aria-hidden="true" />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t('countryFilter.searchPlaceholder')}
              className="w-full bg-transparent text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none"
              aria-label={t('countryFilter.searchPlaceholder')}
            />
          </label>

          <div className="mb-3 flex flex-wrap gap-2">
            {selectedCount > 0 && (
              <button
                type="button"
                onClick={() => onCountriesChange([])}
                className="focus-ring rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700"
              >
                {t('countryFilter.clearSelection')}
              </button>
            )}
            {hasMoreThanPopular && !query && (
              <button
                type="button"
                onClick={() => setShowAll(value => !value)}
                className="accent-button-soft focus-ring rounded-2xl px-3 py-2 text-sm font-medium"
              >
                {showAll ? t('countryFilter.showPopular') : t('countryFilter.showAllCountries')}
              </button>
            )}
          </div>

          {isAtLimit && (
            <p className="mb-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 px-3 py-2 text-xs text-amber-800 dark:text-amber-200">
              {t('countryFilter.limitReached', { max: MAX_SELECTED_COUNTRIES })}
            </p>
          )}

          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {visibleCountries.length === 0 && (
              <p className="px-3 py-6 text-center text-sm text-slate-500 dark:text-slate-400">
                {t('countryFilter.noMatches')}
              </p>
            )}

            {visibleCountries.map(country => {
              const isSelected = selectedSet.has(country.code);
              const isDisabled = !isSelected && isAtLimit;

              return (
                <button
                  key={country.code}
                  type="button"
                  onClick={() => handleCountryToggle(country.code)}
                  disabled={isDisabled}
                  aria-pressed={isSelected}
                  className={`
                    focus-ring w-full flex items-center space-x-3 rounded-2xl border p-3 text-left transition-all duration-200
                    ${
                      isSelected
                        ? 'border-teal-200 dark:border-teal-800/70 bg-teal-50/80 dark:bg-teal-950/50 text-teal-900 dark:text-teal-200 shadow-sm'
                        : isDisabled
                        ? 'border-transparent bg-white/40 dark:bg-slate-800/30 text-slate-400 dark:text-slate-600 cursor-not-allowed'
                        : 'border-transparent bg-white/65 dark:bg-slate-800/50 text-slate-700 dark:text-slate-200 hover:border-slate-200 dark:hover:border-slate-700 hover:bg-white dark:hover:bg-slate-800'
                    }
                  `}
                >
                  <span className="text-lg" aria-hidden="true">{getCountryFlag(country.code)}</span>
                  <span className="font-medium flex-1 truncate">{country.displayName}</span>
                  {isSelected && (
                    <span className="h-2.5 w-2.5 rounded-full bg-teal-500 shadow-[0_0_0_4px_rgba(20,184,166,0.15)]" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        /* Compact View */
        <div className="p-3 sm:p-4">
          <div className="flex flex-wrap gap-2">
            {selectedCount === 0 ? (
              <div className="rounded-full border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 px-3 py-1.5 text-sm text-slate-500 dark:text-slate-400">
                <span>{t('countryFilter.selectedCount', { count: 0, total: countries.length })}</span>
              </div>
            ) : (
              selectedCountries.slice(0, 3).map(code => {
                const country = countries.find(entry => entry.code === code);

                return (
                  <div
                    key={code}
                    className="accent-button-soft flex max-w-full items-center space-x-1 rounded-full px-2.5 py-1.5 text-sm font-medium"
                  >
                    <span aria-hidden="true">{getCountryFlag(code)}</span>
                    <span className="truncate max-w-[10rem]">{country?.displayName || code}</span>
                  </div>
                );
              })
            )}
            {selectedCount > 3 && (
              <div className="rounded-full bg-slate-100 dark:bg-slate-800 px-2.5 py-1.5 text-sm text-slate-600 dark:text-slate-300">
                {t('countryFilter.moreCountries', { count: selectedCount - 3 })}
              </div>
            )}
            {selectedCount === 0 && (
              <div className="flex items-center gap-1 text-sm text-slate-500 dark:text-slate-400">
                <Globe size={14} aria-hidden="true" />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default React.memo(CountryFilter);
