import React, { useState, useEffect, useMemo } from 'react';
import { Filter, X, Globe, MapPin } from 'lucide-react';
import { getCountries } from '../services/holidayApi';
import { useTranslation } from '../hooks/useI18n';

const CountryFilter = ({ selectedCountries, onCountriesChange, isLoadingLocation, locationDetected }) => {
  const [isExpanded, setIsExpanded] = useState(() => {
    if (typeof window === 'undefined') {
      return false;
    }

    return window.innerWidth >= 1024;
  });
  const allCountries = useMemo(() => getCountries(), []);
  const { t } = useTranslation();

  useEffect(() => {
    const syncExpandedState = () => {
      setIsExpanded(window.innerWidth >= 1024);
    };

    syncExpandedState();
    window.addEventListener('resize', syncExpandedState);

    return () => {
      window.removeEventListener('resize', syncExpandedState);
    };
  }, []);

  const handleCountryToggle = (country) => {
    const isSelected = selectedCountries.includes(country);
    
    if (isSelected) {
      // Remove country from selection
      onCountriesChange(selectedCountries.filter(c => c !== country));
    } else {
      // Add country to selection
      onCountriesChange([...selectedCountries, country]);
    }
  };

  const handleSelectAll = () => {
    onCountriesChange(allCountries);
  };

  const handleClearAll = () => {
    onCountriesChange([]);
  };

  const getCountryFlag = (country) => {
    const flags = {
      'United States': '🇺🇸',
      'United Kingdom': '🇬🇧',
      'France': '🇫🇷',
      'Germany': '🇩🇪',
      'China': '🇨🇳',
      'India': '🇮🇳',
      'Japan': '🇯🇵',
      'Mexico': '🇲🇽',
      'Brazil': '🇧🇷',
      'Canada': '🇨🇦',
      'Australia': '🇦🇺',
      'Ireland': '🇮🇪',
      'Iran': '🇮🇷',
      'Russia': '🇷🇺',
      'Italy': '🇮🇹',
      'Spain': '🇪🇸',
      'Netherlands': '🇳🇱',
      'South Korea': '🇰🇷',
      'Turkey': '🇹🇷', 
      'Global': '🌍'
    };
    return flags[country] || '🏳️';
  };

  const selectedCount = selectedCountries.length;
  const totalCount = allCountries.length;
  const isAllSelected = selectedCount === 0; // Empty array means all countries

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
          >
            {isExpanded ? <X size={20} /> : <Filter size={20} />}
          </button>
        </div>
        
        <div className="mt-2 text-sm opacity-90">
          {isLoadingLocation ? (
            <span className="flex items-center space-x-1">
              <div className="animate-spin rounded-full h-3 w-3 border border-white border-t-transparent" />
              <span>{t('countryFilter.detectingLocation')}</span>
            </span>
          ) : locationDetected && selectedCount > 0 ? (
            <span className="flex items-center space-x-1">
              <MapPin size={16} />
              <span>{t('countryFilter.locationBased', { count: selectedCount })}</span>
            </span>
          ) : isAllSelected ? (
            <span className="flex items-center space-x-1">
              <Globe size={16} />
              <span>{t('countryFilter.showingAll')}</span>
            </span>
          ) : (
            <span>
              {t('countryFilter.selectedCount', { count: selectedCount, total: totalCount })}
            </span>
          )}
        </div>
      </div>

      {/* Filter Content */}
      {isExpanded && (
        <div className="p-3 sm:p-4">
          {/* Control Buttons */}
          <div className="grid grid-cols-1 sm:flex sm:flex-wrap gap-2 mb-4">
            <button
              type="button"
              onClick={handleSelectAll}
              className="accent-button-soft focus-ring rounded-2xl px-3 py-2 text-center text-sm font-medium"
            >
              {t('countryFilter.showAll')}
            </button>
            {selectedCount > 0 && (
              <button
                type="button"
                onClick={handleClearAll}
                className="focus-ring rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                {t('countryFilter.clearSelection')}
              </button>
            )}
            {!locationDetected && !isLoadingLocation && (
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="focus-ring flex items-center justify-center space-x-1 rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-100"
                title={t('countryFilter.smartRecommendTooltip')}
              >
                <MapPin size={12} />
                <span>{t('countryFilter.smartRecommend')}</span>
              </button>
            )}
          </div>

          {/* Country List */}
          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {allCountries.map(country => {
              const isSelected = selectedCountries.includes(country) || isAllSelected;
              
              return (
                <button
                  key={country}
                  type="button"
                  onClick={() => handleCountryToggle(country)}
                  className={`
                    focus-ring w-full flex items-center space-x-3 rounded-2xl border p-3 text-left transition-all duration-200
                    ${
                      isSelected && !isAllSelected
                        ? 'border-teal-200 bg-teal-50/80 text-teal-900 shadow-sm'
              : 'border-transparent bg-white/65 text-slate-700 hover:border-slate-200 hover:bg-white'
                    }
                  `}
                >
                  <span className="text-lg">{getCountryFlag(country)}</span>
                  <span className="font-medium flex-1">{country}</span>
                  {isSelected && !isAllSelected && (
                    <div className="h-2.5 w-2.5 rounded-full bg-teal-500 shadow-[0_0_0_4px_rgba(20,184,166,0.15)]" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Compact View */}
      {!isExpanded && (
        <div className="p-3 sm:p-4">
          <div className="flex flex-wrap gap-2">
            {isAllSelected ? (
              <div className="accent-button-soft flex items-center space-x-2 rounded-full px-3 py-1.5 text-sm font-medium">
                <Globe size={14} />
                <span>{t('countryFilter.allCountries')}</span>
              </div>
            ) : (
              selectedCountries.slice(0, 3).map(country => (
                <div
                  key={country}
                  className="accent-button-soft flex max-w-full items-center space-x-1 rounded-full px-2.5 py-1.5 text-sm font-medium"
                >
                  <span>{getCountryFlag(country)}</span>
                  <span className="truncate max-w-[10rem]">{country}</span>
                </div>
              ))
            )}
            {selectedCount > 3 && (
              <div className="rounded-full bg-slate-100 px-2.5 py-1.5 text-sm text-slate-600">
                {t('countryFilter.moreCountries', { count: selectedCount - 3 })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default React.memo(CountryFilter);