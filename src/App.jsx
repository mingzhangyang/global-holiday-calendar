import React, { useState, useEffect, useMemo } from 'react';
import { Globe, Info, MapPin, Calendar as CalendarViewIcon, List, Menu, X } from 'lucide-react';
import Calendar from './components/Calendar';
import HolidayListView from './components/HolidayListView';
import CountryFilter from './components/CountryFilter';
import Legend from './components/Legend';
import LanguageSelector from './components/LanguageSelector';
import AboutModal from './components/AboutModal';
import Logo from './components/Logo';
import { useTranslation } from './hooks/useI18n';
import { useAppInitialization } from './hooks/useAppInitialization';
import { useUrlStateSync } from './hooks/useUrlStateSync';
import { useViewState } from './hooks/useViewState';
import { useSeo } from './hooks/useSeo';
import { getLocaleFromLanguage } from './services/i18nService';

const SUPPORTED_LANGUAGE_CODES = ['en', 'fr', 'de', 'es', 'zh-CN', 'zh-TW', 'ja', 'ko'];

function App() {
  const {
    selectedCountries,
    updateSelectedCountries,
    isLoadingLocation,
    locationDetected
  } = useAppInitialization();
  const {
    currentView,
    changeView,
    currentDate,
    setCurrentDate
  } = useViewState();
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const { t, language } = useTranslation();

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
    updateSelectedCountries(countries);
  };

  const handleDateClick = (dayInfo) => {
    // Optional: Add any additional date click handling here
    console.log('Date clicked:', dayInfo);
  };

  const handleViewChange = (view) => {
    changeView(view);
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

  const currentMonthKey = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
  const { canonicalUrl, buildLocalizedUrl } = useUrlStateSync({
    language,
    currentView,
    currentMonthKey,
    selectedCountries
  });

  const faqItems = useMemo(() => {
    const items = t('faq.items');
    return Array.isArray(items) ? items : [];
  }, [t]);

  const monthLabel = useMemo(() => {
    const months = t('calendar.months');
    return Array.isArray(months) ? months[currentDate.getMonth()] : '';
  }, [currentDate, t]);

  const localizedLocale = getLocaleFromLanguage(language);
  const seoTitle = `${t('app.title')} | ${currentView === 'calendar' ? t('listView.calendarView') : t('listView.listView')}`;
  const seoDescription = `${t('app.subtitle')}. ${monthLabel ? `${monthLabel} ${new Date().getFullYear()}. ` : ''}${selectionSummary}. ${t('legend.note')}`;
  const seoImage = `${typeof window !== 'undefined' ? window.location.origin : 'https://holidays.orangely.xyz'}/logo.png`;
  const alternateLinks = useMemo(() => ([
    ...SUPPORTED_LANGUAGE_CODES.map(code => ({
      hreflang: code.toLowerCase(),
      href: buildLocalizedUrl(code)
    })),
    {
      hreflang: 'x-default',
      href: buildLocalizedUrl('en')
    }
  ]), [currentMonthKey, currentView, selectedCountries]);
  const structuredData = useMemo(() => ({
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        name: seoTitle,
        description: seoDescription,
        url: buildLocalizedUrl(language),
        inLanguage: language,
        primaryImageOfPage: seoImage
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: t('app.title'),
            item: buildLocalizedUrl(language)
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: monthLabel || currentMonthKey,
            item: buildLocalizedUrl(language)
          }
        ]
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
  }), [faqItems, language, monthLabel, seoDescription, seoImage, seoTitle, t]);

  useSeo({
    title: seoTitle,
    description: seoDescription,
    language,
    canonical: buildLocalizedUrl(language),
    image: seoImage,
    locale: localizedLocale,
    structuredData,
    alternateLinks
  });

  const renderHeaderControls = (isMobile = false) => (
    <div className={isMobile ? 'flex flex-col gap-3' : 'flex items-center gap-3 w-full sm:w-auto'}>
      <div
        className="flex items-center rounded-2xl border border-slate-200 bg-slate-50/90 p-1.5"
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
              ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200'
              : 'text-slate-600 hover:bg-white hover:text-slate-900'
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
              ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200'
              : 'text-slate-600 hover:bg-white hover:text-slate-900'
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
        className={`flex items-center justify-center space-x-2 rounded-2xl border border-slate-200 bg-white text-slate-700 shadow-sm transition-colors duration-200 text-sm hover:bg-slate-50 ${
          isMobile
            ? 'w-full px-4 py-3'
            : 'px-3 md:px-4 py-2'
        }`}
        aria-label={t('about.button')}
      >
        <Info size={18} aria-hidden="true" />
        <span className={isMobile ? 'inline' : 'hidden sm:inline'}>{t('about.button')}</span>
      </button>
    </div>
  );

  return (
    <div className="app-shell min-h-screen text-slate-900">
      {/* Header */}
      <header 
        className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/92 px-3 py-3 text-slate-900 backdrop-blur-xl sm:px-6 md:px-8 md:py-4"
        role="banner"
        aria-label="Site header"
      >
        <div className="mx-auto max-w-7xl relative z-10">
          <div className="flex flex-col gap-3 sm:gap-4">
            <div className="flex items-center justify-between gap-4">
              {/* Logo and Title Section */}
              <div className="flex min-w-0 items-center gap-3">
                <Logo 
                  size="medium"
                  showText={true}
                  useImage={true}
                  logoFormat="svg"
                  titleAs="h1"
                  variant="light"
                  className="min-w-0 text-left"
                />
              </div>

              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(open => !open)}
                className="sm:hidden inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white p-3 text-slate-700 shadow-sm transition-colors duration-200 hover:bg-slate-50"
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
                  className="sm:hidden fixed inset-0 top-[88px] bg-slate-950/15 backdrop-blur-sm"
                  aria-label="Close navigation menu"
                  onClick={() => setIsMobileMenuOpen(false)}
                />
                <div
                  id="mobile-header-menu"
                  className="sm:hidden rounded-[24px] border border-slate-200 bg-white p-4 shadow-xl"
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
      <main className="relative z-10 mx-auto max-w-7xl px-3 py-4 sm:px-6 sm:py-8 lg:px-8">
        <section className="surface-card-strong mb-5 overflow-hidden rounded-[28px] p-5 sm:mb-8 sm:p-8 animate-fade-in-up" aria-label="Introduction">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-orange-200/70 bg-orange-50/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-orange-700">
                <span className="h-2 w-2 rounded-full bg-orange-500" aria-hidden="true" />
                {monthLabel} {currentDate.getFullYear()}
              </div>
              <div>
                <h2 className="text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl lg:text-4xl">
                  {t('app.title')}
                </h2>
                <p className="mt-3 text-sm leading-7 text-slate-600 sm:text-base">
                  {t('app.subtitle')}. {t('legend.note')}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:min-w-[24rem]">
              <div className="surface-card-muted rounded-2xl p-4">
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">{t('listView.calendarView')}</div>
                <div className="mt-2 text-lg font-semibold text-slate-900">{monthLabel} {currentDate.getFullYear()}</div>
                <div className="mt-1 text-sm text-slate-500">{currentView === 'calendar' ? t('listView.calendarView') : t('listView.listView')}</div>
              </div>
              <div className="surface-card-muted rounded-2xl p-4">
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">{locationDetected ? t('countryFilter.locationBased', { count: selectedCountries.length || 1 }) : t('countryFilter.title')}</div>
                <div className="mt-2 truncate text-lg font-semibold text-slate-900">{selectionSummary}</div>
                <div className="mt-1 text-sm text-slate-500">{selectedCountries.length || t('countryFilter.allCountries')}</div>
              </div>
            </div>
          </div>
        </section>

        <div className="mb-5 flex flex-wrap items-center gap-3 sm:mb-8">
          <div className="pill-chip max-w-full border-teal-200/70 bg-teal-50/65 text-teal-800 text-sm">
            {currentView === 'calendar' ? <CalendarViewIcon size={16} aria-hidden="true" /> : <List size={16} aria-hidden="true" />}
            <span>{currentView === 'calendar' ? t('listView.calendarView') : t('listView.listView')}</span>
          </div>
          <div className="pill-chip max-w-full border-fuchsia-200/70 bg-fuchsia-50/65 text-fuchsia-800 text-sm">
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

            <Legend />
          </aside>

          {/* Main View Area */}
          <section className="lg:col-span-3 space-y-5 sm:space-y-8" id="main-view" aria-live="polite" aria-label="Holiday results">
            {currentView === 'calendar' ? (
              <Calendar
                currentDate={currentDate}
                onCurrentDateChange={setCurrentDate}
                selectedCountries={selectedCountries}
                onDateClick={handleDateClick}
              />
            ) : (
              <HolidayListView
                currentDate={currentDate}
                onCurrentDateChange={setCurrentDate}
                selectedCountries={selectedCountries}
              />
            )}
            
            {/* Quick Stats */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4 mb-2">
              <div className="surface-card-strong rounded-[24px] p-4 sm:p-5">
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-500">01</div>
                <div className="mt-3 text-2xl font-bold text-slate-950 sm:text-3xl">50+</div>
                <div className="mt-1 text-sm leading-relaxed text-slate-600">{t('stats.globalHolidays')}</div>
              </div>
              <div className="surface-card-strong rounded-[24px] p-4 sm:p-5">
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-fuchsia-500">02</div>
                <div className="mt-3 text-2xl font-bold text-slate-950 sm:text-3xl">15+</div>
                <div className="mt-1 text-sm leading-relaxed text-slate-600">{t('stats.countries')}</div>
              </div>
              <div className="surface-card-strong rounded-[24px] p-4 sm:p-5">
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-500">03</div>
                <div className="mt-3 text-2xl font-bold text-slate-950 sm:text-3xl">12</div>
                <div className="mt-1 text-sm leading-relaxed text-slate-600">{t('stats.months')}</div>
              </div>
            </div>

            {faqItems.length > 0 && (
              <section className="surface-card rounded-[28px] p-4 sm:p-6 animate-fade-in-up" aria-labelledby="faq-heading">
                <h2 id="faq-heading" className="text-lg sm:text-xl font-semibold text-slate-900 mb-4">
                  {t('faq.title')}
                </h2>
                <div className="space-y-3">
                  {faqItems.map((item, index) => (
                    <details key={index} className="group rounded-2xl border border-slate-200/80 bg-white/70 px-4 py-3 shadow-sm">
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
        className="relative mt-10 overflow-hidden border-t border-white/20 sm:mt-16"
        role="contentinfo"
        aria-label="Site footer"
      >
        <div className="absolute inset-0 hero-gradient opacity-95" aria-hidden="true" />
        <div className="absolute inset-0 bg-slate-950/45" aria-hidden="true" />
        
        <div className="relative z-10 mx-auto max-w-7xl px-4 py-8 sm:px-6 md:py-12 lg:px-8">
          <div className="text-center">
            {/* Footer Brand */}
            <div className="flex items-center justify-center mb-4 sm:mb-6">
              <Logo
                size="small"
                showText={true}
                useImage={true}
                logoFormat="svg"
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