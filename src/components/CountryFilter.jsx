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
    <div className="bg-white rounded-2xl shadow-sm ring-1 ring-slate-200/70 overflow-hidden">
      {/* Filter Header */}
      <div className="text-white p-4" style={{backgroundColor: '#ff8c00'}}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Filter size={20} />
            <h3 className="text-lg font-semibold">{t('countryFilter.title')}</h3>
          </div>
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 hover:bg-white/20 rounded-full transition-colors duration-200"
            aria-label={isExpanded ? t('countryFilter.collapse') : t('countryFilter.expand')}
          >
            {isExpanded ? <X size={20} /> : <Filter size={20} />}
          </button>
        </div>
        
        <div className="mt-2 text-sm opacity-90">
          {isLoadingLocation ? (
            <span className="flex items-center space-x-1">
              <div className="animate-spin rounded-full h-3 w-3 border border-white border-t-transparent" />
              <span>{t('countryFilter.detecting')}</span>
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
              {t('countryFilter.selected', { selected: selectedCount, total: totalCount })}
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
              className="px-3 py-2 text-sm rounded-xl transition-colors duration-200 text-center" style={{backgroundColor: '#fff5e6', color: '#cc7000'}} onMouseEnter={(e) => e.target.style.backgroundColor = '#ffe6cc'} onMouseLeave={(e) => e.target.style.backgroundColor = '#fff5e6'}
            >
              {t('countryFilter.showAll')}
            </button>
            {selectedCount > 0 && (
              <button
                type="button"
                onClick={handleClearAll}
                className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors duration-200"
              >
                {t('countryFilter.clearSelection')}
              </button>
            )}
            {!locationDetected && !isLoadingLocation && (
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="px-3 py-2 text-sm bg-green-100 text-green-700 rounded-xl hover:bg-green-200 transition-colors duration-200 flex items-center justify-center space-x-1"
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
                    w-full flex items-center space-x-3 p-3 rounded-xl text-left transition-colors duration-200
                    ${
                      isSelected && !isAllSelected
                        ? 'border'
              : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-transparent'
                    }
                  `}
                  style={isSelected && !isAllSelected ? {backgroundColor: '#fff5e6', color: '#b35f00', borderColor: '#ffcc99'} : {}}
                >
                  <span className="text-lg">{getCountryFlag(country)}</span>
                  <span className="font-medium flex-1">{country}</span>
                  {isSelected && !isAllSelected && (
                    <div className="w-2 h-2 rounded-full" style={{backgroundColor: '#ff8c00'}} />
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
              <div className="flex items-center space-x-2 px-3 py-1.5 rounded-full text-sm" style={{backgroundColor: '#fff5e6', color: '#cc7000'}}>
                <Globe size={14} />
                <span>{t('countryFilter.allCountries')}</span>
              </div>
            ) : (
              selectedCountries.slice(0, 3).map(country => (
                <div
                  key={country}
                  className="flex items-center space-x-1 px-2.5 py-1.5 rounded-full text-sm max-w-full" style={{backgroundColor: '#fff5e6', color: '#cc7000'}}
                >
                  <span>{getCountryFlag(country)}</span>
                  <span className="truncate max-w-[10rem]">{country}</span>
                </div>
              ))
            )}
            {selectedCount > 3 && (
              <div className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-sm">
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