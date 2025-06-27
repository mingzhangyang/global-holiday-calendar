import React, { useState } from 'react';
import { Filter, X, Globe, MapPin, Languages } from 'lucide-react';
import { getCountries } from '../services/holidayApi';
import { useTranslation } from '../hooks/useI18n';

const CountryFilter = ({ selectedCountries, onCountriesChange, isLoadingLocation, locationDetected }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const allCountries = getCountries();
  const { t } = useTranslation();

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
      'Global': '🌍'
    };
    return flags[country] || '🏳️';
  };

  const selectedCount = selectedCountries.length;
  const totalCount = allCountries.length;
  const isAllSelected = selectedCount === 0; // Empty array means all countries

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Filter Header */}
      <div className="bg-gradient-to-r from-green-600 to-blue-600 text-white p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Filter size={20} />
            <h3 className="text-lg font-semibold">{t('countryFilter.title')}</h3>
          </div>
          <button
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
        <div className="p-4">
          {/* Control Buttons */}
          <div className="flex flex-wrap gap-2 mb-4">
            <button
              onClick={handleSelectAll}
              className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200 transition-colors duration-200"
            >
              {t('countryFilter.showAll')}
            </button>
            {selectedCount > 0 && (
              <button
                onClick={handleClearAll}
                className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors duration-200"
              >
                {t('countryFilter.clearSelection')}
              </button>
            )}
            {!locationDetected && !isLoadingLocation && (
              <button
                onClick={() => window.location.reload()}
                className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded-full hover:bg-green-200 transition-colors duration-200 flex items-center space-x-1"
                title={t('countryFilter.smartRecommendTooltip')}
              >
                <MapPin size={12} />
                <span>{t('countryFilter.smartRecommend')}</span>
              </button>
            )}
          </div>

          {/* Country List */}
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {allCountries.map(country => {
              const isSelected = selectedCountries.includes(country) || isAllSelected;
              
              return (
                <button
                  key={country}
                  onClick={() => handleCountryToggle(country)}
                  className={`
                    w-full flex items-center space-x-3 p-2 rounded-lg text-left transition-colors duration-200
                    ${
                      isSelected && !isAllSelected
                        ? 'bg-blue-100 text-blue-900 border border-blue-300'
                        : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-transparent'
                    }
                  `}
                >
                  <span className="text-lg">{getCountryFlag(country)}</span>
                  <span className="font-medium flex-1">{country}</span>
                  {isSelected && !isAllSelected && (
                    <div className="w-2 h-2 bg-blue-600 rounded-full" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Compact View */}
      {!isExpanded && (
        <div className="p-4">
          <div className="flex flex-wrap gap-2">
            {isAllSelected ? (
              <div className="flex items-center space-x-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                <Globe size={14} />
                <span>{t('countryFilter.allCountries')}</span>
              </div>
            ) : (
              selectedCountries.slice(0, 3).map(country => (
                <div
                  key={country}
                  className="flex items-center space-x-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
                >
                  <span>{getCountryFlag(country)}</span>
                  <span>{country}</span>
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

export default CountryFilter;