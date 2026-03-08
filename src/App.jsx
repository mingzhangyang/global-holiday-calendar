import React, { useState, useEffect, useMemo } from 'react';
import { Globe, Info, MapPin, Calendar as CalendarViewIcon, List, Menu, X } from 'lucide-react';
import Calendar from './components/Calendar';
import HolidayListView from './components/HolidayListView';
import CountryFilter from './components/CountryFilter';
import LanguageSelector from './components/LanguageSelector';
import AboutModal from './components/AboutModal';
import Logo from './components/Logo';
import { getUserDefaultCountry } from './services/locationService';
import { useI18n, useTranslation } from './hooks/useI18n';
import { useSeo } from './hooks/useSeo';
import { getLocaleFromLanguage } from './services/i18nService';

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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // 国际化
  const { detectLanguage } = useI18n();
  const { t, language } = useTranslation();

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

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 640) {
        setIsMobileMenuOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setIsMobileMenuOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    document.addEventListener('keydown', handleEscape);

    return () => {
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  useEffect(() => {
    if (!isMobileMenuOpen) {
      document.body.style.overflow = '';
      return;
    }

    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen]);

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

  const handleViewChange = (view) => {
    setCurrentView(view);
    setIsMobileMenuOpen(false);
  };

  const handleOpenAboutModal = () => {
    setShowAboutModal(true);
    setIsMobileMenuOpen(false);
  };

  const selectionSummary = selectedCountries.length === 0
    ? t('countryFilter.allCountries')
    : selectedCountries.length <= 2
    ? selectedCountries.join(', ')
    : `${selectedCountries.slice(0, 2).join(', ')} +${selectedCountries.length - 2}`;

  const faqItems = useMemo(() => {
    const items = t('faq.items');
    return Array.isArray(items) ? items : [];
  }, [t]);

  const monthLabel = useMemo(() => {
    const months = t('calendar.months');
    return Array.isArray(months) ? months[new Date().getMonth()] : '';
  }, [t]);

  const canonicalUrl = typeof window !== 'undefined'
    ? `${window.location.origin}${window.location.pathname}`
    : 'https://holidays.orangely.xyz/';
  const localizedLocale = getLocaleFromLanguage(language);
  const seoTitle = `${t('app.title')} | ${currentView === 'calendar' ? t('listView.calendarView') : t('listView.listView')}`;
  const seoDescription = `${t('app.subtitle')}. ${monthLabel ? `${monthLabel} ${new Date().getFullYear()}. ` : ''}${selectionSummary}. ${t('legend.note')}`;
  const seoImage = `${typeof window !== 'undefined' ? window.location.origin : 'https://holidays.orangely.xyz'}/logo.png`;
  const structuredData = useMemo(() => ({
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        name: seoTitle,
        description: seoDescription,
        url: canonicalUrl,
        inLanguage: language,
        primaryImageOfPage: seoImage
      },
      {
        '@type': 'FAQPage',
        mainEntity: faqItems.map(item => ({
          '@type': 'Question',
          name: item.question,
          acceptedAnswer: {
            '@type': 'Answer',
            text: item.answer
          }
        }))
      }
    ]
  }), [canonicalUrl, faqItems, language, seoDescription, seoImage, seoTitle]);

  useSeo({
    title: seoTitle,
    description: seoDescription,
    language,
    canonical: canonicalUrl,
    image: seoImage,
    locale: localizedLocale,
    structuredData
  });

  const renderHeaderControls = (isMobile = false) => (
    <div className={isMobile ? 'flex flex-col gap-3' : 'flex items-center gap-3 w-full sm:w-auto'}>
      <div
        className={isMobile ? 'flex items-center bg-white/10 rounded-xl p-1.5 backdrop-blur-sm' : 'flex items-center bg-white/20 rounded-lg p-1'}
        role="tablist"
        aria-label="View selection"
      >
        <button
          type="button"
          onClick={() => handleViewChange('calendar')}
          className={`flex items-center justify-center space-x-2 rounded-lg transition-colors duration-200 text-sm ${
            isMobile ? 'flex-1 px-4 py-2.5' : 'px-2 md:px-3 py-2'
          } ${
            currentView === 'calendar'
              ? 'bg-white/30 text-white shadow-sm'
              : 'text-white/80 hover:text-white hover:bg-white/10'
          }`}
          role="tab"
          aria-selected={currentView === 'calendar'}
          aria-controls="main-view"
        >
          <CalendarViewIcon size={16} aria-hidden="true" />
          <span className={isMobile ? 'inline' : 'hidden sm:inline'}>{t('listView.calendarView')}</span>
        </button>
        <button
          type="button"
          onClick={() => handleViewChange('list')}
          className={`flex items-center justify-center space-x-2 rounded-lg transition-colors duration-200 text-sm ${
            isMobile ? 'flex-1 px-4 py-2.5' : 'px-2 md:px-3 py-2'
          } ${
            currentView === 'list'
              ? 'bg-white/30 text-white shadow-sm'
              : 'text-white/80 hover:text-white hover:bg-white/10'
          }`}
          role="tab"
          aria-selected={currentView === 'list'}
          aria-controls="main-view"
        >
          <List size={16} aria-hidden="true" />
          <span className={isMobile ? 'inline' : 'hidden sm:inline'}>{t('listView.listView')}</span>
        </button>
      </div>

      <div className={isMobile ? 'w-full' : ''}>
        <LanguageSelector fullWidth={isMobile} />
      </div>

      <button
        type="button"
        onClick={handleOpenAboutModal}
        className={`flex items-center justify-center space-x-2 rounded-lg transition-colors duration-200 text-sm ${
          isMobile
            ? 'w-full bg-white/10 hover:bg-white/20 px-4 py-3 backdrop-blur-sm'
            : 'bg-white/20 hover:bg-white/30 px-3 md:px-4 py-2'
        }`}
        aria-label={t('about.button')}
      >
        <Info size={18} aria-hidden="true" />
        <span className={isMobile ? 'inline' : 'hidden sm:inline'}>{t('about.button')}</span>
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header 
        className="sticky top-0 z-40 text-white py-4 md:py-6 shadow-md" 
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
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between gap-4">
              {/* Logo and Title Section */}
              <Logo 
                size="medium" 
                showText={true} 
                useImage={true} 
                logoFormat="png"
                titleAs="h1"
                className="text-left"
              />

              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(open => !open)}
                className="sm:hidden inline-flex items-center justify-center rounded-xl bg-white/15 p-3 text-white shadow-lg backdrop-blur-sm transition-colors duration-200 hover:bg-white/25"
                aria-label={isMobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
                aria-expanded={isMobileMenuOpen}
                aria-controls="mobile-header-menu"
              >
                {isMobileMenuOpen ? <X size={20} aria-hidden="true" /> : <Menu size={20} aria-hidden="true" />}
              </button>
            </div>

            <div className="hidden sm:flex sm:items-center sm:justify-end">
              {renderHeaderControls(false)}
            </div>

            {isMobileMenuOpen && (
              <>
                <button
                  type="button"
                  className="sm:hidden fixed inset-0 top-[88px] bg-slate-950/25"
                  aria-label="Close navigation menu"
                  onClick={() => setIsMobileMenuOpen(false)}
                />
                <div
                  id="mobile-header-menu"
                  className="sm:hidden rounded-2xl border border-white/20 bg-white/10 p-4 shadow-xl backdrop-blur-md"
                >
                  {renderHeaderControls(true)}
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* About Modal */}
      <AboutModal 
        isOpen={showAboutModal} 
        onClose={() => setShowAboutModal(false)} 
      />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
        <section className="mb-4 sm:mb-6 animate-fade-in-up" aria-label="Introduction">
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-4xl">
            {t('app.subtitle')}. {t('legend.note')}
          </p>
        </section>

        <div className="mb-4 sm:mb-6 flex flex-wrap items-center gap-2">
          <div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-2 text-sm text-slate-700 shadow-sm ring-1 ring-slate-200/80">
            {currentView === 'calendar' ? <CalendarViewIcon size={16} aria-hidden="true" /> : <List size={16} aria-hidden="true" />}
            <span>{currentView === 'calendar' ? t('listView.calendarView') : t('listView.listView')}</span>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-2 text-sm text-slate-700 shadow-sm ring-1 ring-slate-200/80 max-w-full">
            {locationDetected ? <MapPin size={16} aria-hidden="true" /> : <Globe size={16} aria-hidden="true" />}
            <span className="truncate max-w-[16rem]">{selectionSummary}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
          {/* Country Filter Sidebar */}
          <aside className="lg:col-span-1 space-y-4 sm:space-y-6 lg:sticky lg:top-28 self-start" aria-label="Country filters and legend">
            <CountryFilter
              selectedCountries={selectedCountries}
              onCountriesChange={handleCountriesChange}
              isLoadingLocation={isLoadingLocation}
              locationDetected={locationDetected}
            />
            
            {/* Legend */}
            <div className="bg-white rounded-2xl shadow-sm ring-1 ring-slate-200/70 p-4 sm:p-5">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3">{t('legend.title')}</h3>
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
          </aside>

          {/* Main View Area */}
          <section className="lg:col-span-3 space-y-5 sm:space-y-8" id="main-view" aria-live="polite" aria-label="Holiday results">
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
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-2">
              <div className="text-white p-4 rounded-2xl shadow-sm" style={{background: 'linear-gradient(to right, #6366f1, #5b21b6)'}}>
                <div className="text-xl sm:text-2xl font-bold">50+</div>
                <div className="text-xs sm:text-sm opacity-90 leading-relaxed">{t('stats.globalHolidays')}</div>
              </div>
              <div className="text-white p-4 rounded-2xl shadow-sm" style={{background: 'linear-gradient(to right, #8b5cf6, #7c3aed)'}}>
                <div className="text-xl sm:text-2xl font-bold">15+</div>
                <div className="text-xs sm:text-sm opacity-90 leading-relaxed">{t('stats.countries')}</div>
              </div>
              <div className="text-white p-4 rounded-2xl shadow-sm" style={{background: 'linear-gradient(to right, #a855f7, #9333ea)'}}>
                <div className="text-xl sm:text-2xl font-bold">12</div>
                <div className="text-xs sm:text-sm opacity-90 leading-relaxed">{t('stats.months')}</div>
              </div>
            </div>

            {faqItems.length > 0 && (
              <section className="bg-white rounded-2xl shadow-sm ring-1 ring-slate-200/70 p-4 sm:p-6 animate-fade-in-up" aria-labelledby="faq-heading">
                <h2 id="faq-heading" className="text-lg sm:text-xl font-semibold text-slate-900 mb-4">
                  {t('faq.title')}
                </h2>
                <div className="space-y-3">
                  {faqItems.map((item, index) => (
                    <details key={index} className="group rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-3">
                      <summary className="cursor-pointer list-none font-medium text-slate-900 flex items-center justify-between gap-3">
                        <span>{item.question}</span>
                        <span className="text-slate-400 transition-transform group-open:rotate-45" aria-hidden="true">+</span>
                      </summary>
                      <p className="mt-3 text-sm sm:text-base leading-relaxed text-slate-600">
                        {item.answer}
                      </p>
                    </details>
                  ))}
                </div>
              </section>
            )}
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer 
        className="border-t border-gray-200 mt-10 sm:mt-16 relative overflow-hidden" 
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
            <div className="flex items-center justify-center mb-4 sm:mb-6">
              <Logo 
                size="small" 
                showText={true} 
                useImage={true} 
                logoFormat="png"
                titleAs="div"
                className="text-white"
              />
            </div>
            
            {/* Footer Description */}
            <p className="text-white/90 text-sm md:text-base mb-5 sm:mb-6 max-w-2xl mx-auto leading-relaxed px-2 sm:px-0">
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