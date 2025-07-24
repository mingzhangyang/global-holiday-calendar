import React, { useState, useEffect } from 'react';
import { CalendarIcon, Globe, Info, Calendar as CalendarViewIcon, List } from 'lucide-react';
import Calendar from './components/Calendar';
import HolidayListView from './components/HolidayListView';
import CountryFilter from './components/CountryFilter';
import LanguageSelector from './components/LanguageSelector';
import AboutModal from './components/AboutModal';
import Logo from './components/Logo';
import { getUserDefaultCountry } from './services/locationService';
import { useI18n, useTranslation } from './hooks/useI18n';
import { getLanguageFromRegion } from './services/i18nService';

function App() {
  // Load saved countries from localStorage or use empty array as default
  const [selectedCountries, setSelectedCountries] = useState(() => {
    try {
      const savedCountries = localStorage.getItem('selectedCountries');
      return savedCountries ? JSON.parse(savedCountries) : [];
    } catch (error) {
      console.error('Error loading saved countries:', error);
      return [];
    }
  });
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [isLoadingLocation, setIsLoadingLocation] = useState(true);
  const [locationDetected, setLocationDetected] = useState(false);
  const [currentView, setCurrentView] = useState('calendar'); // 'calendar' or 'list'
  
  // 国际化
  const { detectLanguage } = useI18n();
  const { t } = useTranslation();

  // 在组件挂载时检测用户位置并设置默认国家和语言
  useEffect(() => {
    const initializeDefaults = async () => {
      try {
        setIsLoadingLocation(true);
        const defaultCountry = await getUserDefaultCountry();
        
        if (defaultCountry) {
          // Only set default country if no saved countries exist
          const savedCountries = localStorage.getItem('selectedCountries');
          if (!savedCountries || JSON.parse(savedCountries).length === 0) {
            setSelectedCountries([defaultCountry]);
            localStorage.setItem('selectedCountries', JSON.stringify([defaultCountry]));
          }
          setLocationDetected(true);
          console.log('Default country set to:', defaultCountry);
          
          // 根据检测到的国家设置语言
          // 这里需要将国家名称转换为国家代码
          // 简化处理：根据国家名称推断语言
          let countryCode = null;
          if (defaultCountry === 'China') countryCode = 'CN';
          else if (defaultCountry === 'France') countryCode = 'FR';
          else if (defaultCountry === 'Germany') countryCode = 'DE';
          else if (defaultCountry === 'Spain') countryCode = 'ES';
          else if (defaultCountry === 'Japan') countryCode = 'JP';
          else if (defaultCountry === 'South Korea') countryCode = 'KR';
          
          // 检测并设置语言
          await detectLanguage(countryCode);
        } else {
          // 如果没有检测到国家，仍然检测语言
          await detectLanguage();
        }
      } catch (error) {
        console.error('Error initializing defaults:', error);
        // 即使出错也要检测语言
        await detectLanguage();
      } finally {
        setIsLoadingLocation(false);
      }
    };

    initializeDefaults();
  }, [detectLanguage]);

  const handleCountriesChange = (countries) => {
    setSelectedCountries(countries);
    // Save selected countries to localStorage
    try {
      localStorage.setItem('selectedCountries', JSON.stringify(countries));
    } catch (error) {
      console.error('Error saving countries to localStorage:', error);
    }
  };

  const handleDateClick = (dayInfo) => {
    // Optional: Add any additional date click handling here
    console.log('Date clicked:', dayInfo);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header 
        className="text-white py-4 md:py-6 shadow-md relative" 
        style={{
          background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%)',
          backgroundSize: '400% 400%',
          animation: 'gradientShift 8s ease infinite'
        }}
        role="banner"
        aria-label="Site header"
      >
        {/* Decorative background elements */}
        <div className="absolute inset-0 opacity-10 overflow-hidden" aria-hidden="true">
          <div className="absolute top-0 left-0 w-32 h-32 bg-white rounded-full -translate-x-16 -translate-y-16"></div>
          <div className="absolute top-0 right-0 w-24 h-24 bg-white rounded-full translate-x-12 -translate-y-12"></div>
          <div className="absolute bottom-0 left-1/4 w-16 h-16 bg-white rounded-full translate-y-8"></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Logo and Title Section */}
            <Logo 
              size="medium" 
              showText={true} 
              useImage={true} 
              logoFormat="png"
              className="text-center sm:text-left"
            />
            
            {/* Controls Section */}
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
              {/* View Toggle */}
              <div className="flex items-center bg-white/20 rounded-lg p-1" role="tablist" aria-label="View selection">
                <button
                  onClick={() => setCurrentView('calendar')}
                  className={`flex items-center space-x-2 px-2 md:px-3 py-2 rounded-md transition-colors duration-200 text-sm ${
                    currentView === 'calendar'
                      ? 'bg-white/30 text-white'
                      : 'text-white/80 hover:text-white hover:bg-white/10'
                  }`}
                  role="tab"
                  aria-selected={currentView === 'calendar'}
                  aria-controls="main-view"
                >
                  <CalendarViewIcon size={16} aria-hidden="true" />
                  <span className="hidden sm:inline">{t('listView.calendarView')}</span>
                </button>
                <button
                  onClick={() => setCurrentView('list')}
                  className={`flex items-center space-x-2 px-2 md:px-3 py-2 rounded-md transition-colors duration-200 text-sm ${
                    currentView === 'list'
                      ? 'bg-white/30 text-white'
                      : 'text-white/80 hover:text-white hover:bg-white/10'
                  }`}
                  role="tab"
                  aria-selected={currentView === 'list'}
                  aria-controls="main-view"
                >
                  <List size={16} aria-hidden="true" />
                  <span className="hidden sm:inline">{t('listView.listView')}</span>
                </button>
              </div>
              
              <LanguageSelector />
              <button
                onClick={() => setShowAboutModal(true)}
                className="flex items-center space-x-2 bg-white/20 hover:bg-white/30 px-3 md:px-4 py-2 rounded-lg transition-colors duration-200 text-sm"
                aria-label={t('about.button')}
              >
                <Info size={18} aria-hidden="true" />
                <span className="hidden sm:inline">{t('about.button')}</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* About Modal */}
      <AboutModal 
        isOpen={showAboutModal} 
        onClose={() => setShowAboutModal(false)} 
      />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Country Filter Sidebar */}
          <div className="lg:col-span-1">
            <CountryFilter
              selectedCountries={selectedCountries}
              onCountriesChange={handleCountriesChange}
              isLoadingLocation={isLoadingLocation}
              locationDetected={locationDetected}
            />
            
            {/* Legend */}
            <div className="mt-6 bg-white rounded-lg shadow-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">{t('legend.title')}</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full" style={{backgroundColor: '#ff8c00'}} />
                <span className="text-gray-700">{t('legend.nationalHoliday')}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-600 rounded-full" />
                  <span className="text-gray-700">{t('legend.culturalFestival')}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full" style={{backgroundColor: 'rgb(243, 74, 217)'}} />
                <span className="text-gray-700">{t('legend.religiousObservance')}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full" style={{backgroundColor: '#ff8c00'}} />
                  <span className="text-gray-700">{t('legend.traditionalCelebration')}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-gray-600 rounded-full" />
                  <span className="text-gray-700">{t('legend.internationalDay')}</span>
                </div>
              </div>
              
              <div className="mt-4 pt-3 border-t border-gray-200">
                <p className="text-xs text-gray-500">
                  {t('legend.note')}
                </p>
              </div>
            </div>
          </div>

          {/* Main View Area */}
          <div className="lg:col-span-3" id="main-view" role="main" aria-live="polite">
            {currentView === 'calendar' ? (
              <Calendar
                selectedCountries={selectedCountries}
                onDateClick={handleDateClick}
              />
            ) : (
              <HolidayListView
                selectedCountries={selectedCountries}
              />
            )}
            
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 mt-8">
              <div className="text-white p-4 rounded-lg shadow-sm" style={{background: 'linear-gradient(to right, #6366f1, #5b21b6)'}}>
                <div className="text-2xl font-bold">50+</div>
                <div className="text-sm opacity-90">{t('stats.globalHolidays')}</div>
              </div>
              <div className="text-white p-4 rounded-lg shadow-sm" style={{background: 'linear-gradient(to right, #8b5cf6, #7c3aed)'}}>
                <div className="text-2xl font-bold">15+</div>
                <div className="text-sm opacity-90">{t('stats.countries')}</div>
              </div>
              <div className="text-white p-4 rounded-lg shadow-sm" style={{background: 'linear-gradient(to right, #a855f7, #9333ea)'}}>
                <div className="text-2xl font-bold">12</div>
                <div className="text-sm opacity-90">{t('stats.months')}</div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer 
        className="border-t border-gray-200 mt-16 relative overflow-hidden" 
        style={{
          background: 'linear-gradient(135deg, #64748b 0%, #475569 50%, #334155 100%)',
          backgroundSize: '400% 400%',
          animation: 'gradientShift 10s ease infinite reverse'
        }}
        role="contentinfo"
        aria-label="Site footer"
      >
        {/* Decorative background pattern */}
        <div className="absolute inset-0 opacity-5" aria-hidden="true">
          <div className="absolute top-4 left-8 w-20 h-20 bg-white rounded-full"></div>
          <div className="absolute top-8 right-16 w-12 h-12 bg-white rounded-full"></div>
          <div className="absolute bottom-4 left-1/3 w-16 h-16 bg-white rounded-full"></div>
          <div className="absolute bottom-8 right-8 w-8 h-8 bg-white rounded-full"></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 relative z-10">
          <div className="text-center">
            {/* Footer Brand */}
            <div className="flex items-center justify-center mb-6">
              <Logo 
                size="small" 
                showText={true} 
                useImage={true} 
                logoFormat="png"
                className="text-white"
              />
            </div>
            
            {/* Footer Description */}
            <p className="text-white/90 text-sm md:text-base mb-6 max-w-2xl mx-auto leading-relaxed">
              {t('footer.description')}
            </p>
            
            {/* Footer Links/Info */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 text-sm text-white/80 mb-6">
              <span className="flex items-center">
                <Globe size={16} className="mr-2" aria-hidden="true" />
                {t('footer.builtWith')}
              </span>
              <span className="hidden sm:inline text-white/60">•</span>
              <span className="flex items-center">
                <Info size={16} className="mr-2" aria-hidden="true" />
                {t('footer.mission')}
              </span>
            </div>
            
            {/* Copyright Section */}
            <div className="border-t border-white/20 pt-6">
              <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 text-xs md:text-sm text-white/70">
                <span>© 2025 Orangely</span>
                <span className="hidden sm:inline text-white/50">•</span>
                <span>{t('footer.culturalEducation')}</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;