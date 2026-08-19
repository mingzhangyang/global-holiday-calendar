import React, { useState, useEffect, useMemo, lazy, Suspense } from 'react';
import { Globe, Info, MapPin, Calendar as CalendarViewIcon, List, Menu, X, Search } from 'lucide-react';
import Calendar from './components/Calendar';
import HolidayListView from './components/HolidayListView';
import CountryFilter from './components/CountryFilter';
import Legend from './components/Legend';
import LanguageSelector from './components/LanguageSelector';
import ThemeSelector from './components/ThemeSelector';
import CategoryFilter from './components/CategoryFilter';
import HolidaySearchModal from './components/HolidaySearchModal';
import UpcomingHolidayWidget from './components/UpcomingHolidayWidget';
import HolidayBreakdownWidget from './components/HolidayBreakdownWidget';
import CulturalTriviaWidget from './components/CulturalTriviaWidget';
import MobileBottomNav from './components/MobileBottomNav';
import Logo from './components/Logo';
import { useTranslation } from './hooks/useI18n';
import { useAppInitialization } from './hooks/useAppInitialization';
import { useUrlStateSync } from './hooks/useUrlStateSync';
import { useViewState } from './hooks/useViewState';
import { useSeo } from './hooks/useSeo';
import { getLocaleFromLanguage } from './services/i18nService';
import {
  fetchHolidaysFromWorker,
  getCountries,
  getCountryCodeByName,
  getHolidaysForMonth
} from './services/holidayApi';
import { parseDateKey } from './utils/dateUtils';

const AboutModal = lazy(() => import('./components/AboutModal'));
const HolidayModal = lazy(() => import('./components/HolidayModal'));

const SUPPORTED_LANGUAGE_CODES = ['en', 'fr', 'de', 'es', 'zh-CN', 'zh-TW', 'ja', 'ko'];

function getSharedHolidayFromUrl() {
  if (typeof window === 'undefined') {
    return null;
  }

  const params = new URLSearchParams(window.location.search);
  const name = params.get('holiday')?.trim();
  const date = params.get('date')?.trim();
  const country = params.get('country')?.trim() || params.get('countries')?.split(',')[0]?.trim();

  if (!name || !date || !/^\d{4}-\d{2}-\d{2}$/.test(date) || !country) {
    return null;
  }

  return { name, date, country };
}

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
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [activeModalHoliday, setActiveModalHoliday] = useState(null);
  const [currentMonthHolidays, setCurrentMonthHolidays] = useState({});

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

  // Global search shortcut ⌘K / Ctrl+K
  useEffect(() => {
    const handleSearchKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleSearchKey);
    return () => window.removeEventListener('keydown', handleSearchKey);
  }, []);

  // Fetch monthly holidays for the upcoming holiday countdown widget
  useEffect(() => {
    let isActive = true;
    getHolidaysForMonth(currentDate.getFullYear(), currentDate.getMonth(), selectedCountries)
      .then(holidays => {
        if (isActive) setCurrentMonthHolidays(holidays);
      })
      .catch(() => {});

    return () => {
      isActive = false;
    };
  }, [currentDate, selectedCountries]);

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

  const handleDateClick = () => {
    // Optional: Add any additional date click handling here
  };

  const handleSelectHolidayFromSearch = ({ holiday, date }) => {
    setCurrentDate(date);
    setActiveModalHoliday({
      date,
      holidays: [holiday]
    });
  };

  const handleSelectUpcomingHoliday = (holiday) => {
    setCurrentDate(holiday.dateObj);
    setActiveModalHoliday({
      date: holiday.dateObj,
      holidays: [holiday]
    });
  };

  // Resolve shared holiday links after the initial page state is available.
  useEffect(() => {
    const sharedHoliday = getSharedHolidayFromUrl();
    if (!sharedHoliday) return undefined;

    let isActive = true;
    const openSharedHoliday = async () => {
      const countryCode = getCountryCodeByName(sharedHoliday.country);
      const holidays = await fetchHolidaysFromWorker(
        Number(sharedHoliday.date.slice(0, 4)),
        countryCode,
        true
      );
      const targetName = sharedHoliday.name.toLowerCase();
      const holiday = holidays.find(candidate => {
        const candidateDate = String(candidate.date || '').split('T')[0];
        const candidateNames = [candidate.name, candidate.localName]
          .filter(Boolean)
          .map(value => String(value).trim().toLowerCase());
        return candidateDate === sharedHoliday.date && candidateNames.includes(targetName);
      });

      if (!isActive || !holiday) return;

      const date = parseDateKey(sharedHoliday.date);
      setCurrentDate(date);
      setActiveModalHoliday({ date, holidays: [holiday] });
    };

    openSharedHoliday().catch(error => {
      console.warn('Error opening shared holiday:', error);
    });

    return () => {
      isActive = false;
    };
  }, [setCurrentDate]);

  const handleViewChange = (view) => {
    changeView(view);
    setIsMobileMenuOpen(false);
  };

  const handleOpenAboutModal = () => {
    setShowAboutModal(true);
    setIsMobileMenuOpen(false);
  };

  const allCountries = useMemo(() => getCountries(), []);
  const isAllSelected = selectedCountries.length > 0 && selectedCountries.length === allCountries.length;

  const selectionSummary = selectedCountries.length === 0
    ? t('listView.noCountriesSelected')
    : isAllSelected
    ? t('countryFilter.allCountries')
    : selectedCountries.length <= 2
    ? selectedCountries.join(', ')
    : `${selectedCountries.slice(0, 2).join(', ')} +${selectedCountries.length - 2}`;

  const currentMonthKey = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
  const { buildLocalizedUrl } = useUrlStateSync({
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
  const seoDescription = `${t('app.subtitle')}. ${monthLabel ? `${monthLabel} ${currentDate.getFullYear()}. ` : ''}${selectionSummary}. ${t('legend.note')}`;
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
  ]), [buildLocalizedUrl]);
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
  }), [buildLocalizedUrl, currentMonthKey, faqItems, language, monthLabel, seoDescription, seoImage, seoTitle, t]);

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
    <div className={isMobile ? 'flex flex-col gap-3' : 'flex items-center gap-2.5 w-full sm:w-auto'}>
      {/* Search trigger button */}
      <button
        type="button"
        onClick={() => {
          setIsSearchOpen(true);
          if (isMobile) setIsMobileMenuOpen(false);
        }}
        className={`focus-ring flex items-center justify-between gap-2 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-800/80 px-3 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-800 transition-all ${
          isMobile ? 'w-full' : ''
        }`}
        aria-label={t('search.searchHolidays')}
      >
        <div className="flex items-center gap-2">
          <Search size={16} className="text-teal-600 dark:text-teal-400" />
          <span className={isMobile ? 'inline' : 'hidden xl:inline'}>{t('search.button')}</span>
        </div>
        <kbd className="hidden sm:inline-block rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-1.5 py-0.5 text-[10px] text-slate-500 font-mono">
          ⌘K
        </kbd>
      </button>

      {/* View switcher */}
      <div
        className="flex items-center rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-800/80 p-1"
        role="tablist"
        aria-label="View selection"
      >
        <button
          type="button"
          onClick={() => handleViewChange('calendar')}
          className={`flex items-center justify-center space-x-1.5 rounded-xl transition-colors duration-200 text-xs sm:text-sm ${
            isMobile ? 'flex-1 px-3 py-2' : 'px-2.5 py-1.5'
          } ${
            currentView === 'calendar'
              ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm ring-1 ring-slate-200 dark:ring-slate-700 font-semibold'
              : 'text-slate-600 dark:text-slate-300 hover:bg-white/60 dark:hover:bg-slate-700/60'
          }`}
          role="tab"
          aria-selected={currentView === 'calendar'}
          aria-controls="main-view"
        >
          <CalendarViewIcon size={15} aria-hidden="true" />
          <span className={isMobile ? 'inline' : 'hidden sm:inline'}>{t('listView.calendarView')}</span>
        </button>
        <button
          type="button"
          onClick={() => handleViewChange('list')}
          className={`flex items-center justify-center space-x-1.5 rounded-xl transition-colors duration-200 text-xs sm:text-sm ${
            isMobile ? 'flex-1 px-3 py-2' : 'px-2.5 py-1.5'
          } ${
            currentView === 'list'
              ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm ring-1 ring-slate-200 dark:ring-slate-700 font-semibold'
              : 'text-slate-600 dark:text-slate-300 hover:bg-white/60 dark:hover:bg-slate-700/60'
          }`}
          role="tab"
          aria-selected={currentView === 'list'}
          aria-controls="main-view"
        >
          <List size={15} aria-hidden="true" />
          <span className={isMobile ? 'inline' : 'hidden sm:inline'}>{t('listView.listView')}</span>
        </button>
      </div>

      <div className={isMobile ? 'w-full' : ''}>
        <ThemeSelector fullWidth={isMobile} />
      </div>

      <div className={isMobile ? 'w-full' : ''}>
        <LanguageSelector fullWidth={isMobile} />
      </div>

      <button
        type="button"
        onClick={handleOpenAboutModal}
        className={`flex items-center justify-center space-x-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 shadow-sm transition-colors duration-200 text-sm hover:bg-slate-50 dark:hover:bg-slate-700/80 ${
          isMobile
            ? 'w-full px-4 py-2.5'
            : 'px-3 py-2'
        }`}
        aria-label={t('about.button')}
      >
        <Info size={16} aria-hidden="true" />
        <span className={isMobile ? 'inline' : 'hidden md:inline'}>{t('about.button')}</span>
      </button>
    </div>
  );

  return (
    <div className="app-shell min-h-screen text-slate-900 dark:text-slate-100">
      {/* Header */}
      <header
        className="sticky top-0 z-40 border-b border-slate-200/80 dark:border-slate-800/80 bg-white/92 dark:bg-slate-950/90 px-3 py-2 text-slate-900 dark:text-slate-100 backdrop-blur-xl sm:px-6 md:px-8"
        role="banner"
        aria-label="Site header"
      >
        <div className="mx-auto max-w-7xl relative z-10 flex items-center justify-between gap-4">
          {/* Logo and Title Section */}
          <div className="flex min-w-0 items-center gap-3 py-1">
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

          <div className="hidden lg:flex lg:items-center lg:justify-end py-1">
            {renderHeaderControls(false)}
          </div>

          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(open => !open)}
            className="lg:hidden inline-flex items-center justify-center rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2.5 text-slate-700 dark:text-slate-200 shadow-sm transition-colors duration-200 hover:bg-slate-50 dark:hover:bg-slate-800"
            aria-label={isMobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={isMobileMenuOpen}
            aria-controls="mobile-header-menu"
          >
            {isMobileMenuOpen ? <X size={20} aria-hidden="true" /> : <Menu size={20} aria-hidden="true" />}
          </button>

          {isMobileMenuOpen && (
            <>
              <button
                type="button"
                className="lg:hidden fixed inset-0 top-[60px] bg-slate-950/20 backdrop-blur-sm"
                aria-label="Close navigation menu"
                onClick={() => setIsMobileMenuOpen(false)}
              />
              <div
                id="mobile-header-menu"
                className="lg:hidden absolute left-0 right-0 top-full mt-2 rounded-[24px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xl"
              >
                {renderHeaderControls(true)}
              </div>
            </>
          )}
        </div>
      </header>

      {/* About Modal */}
      {showAboutModal && (
        <Suspense fallback={null}>
          <AboutModal
            isOpen={showAboutModal}
            onClose={() => setShowAboutModal(false)}
          />
        </Suspense>
      )}

      {/* Main Content */}
      <main className="relative z-10 mx-auto max-w-7xl px-3 py-4 sm:px-6 sm:py-8 lg:px-8">

        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 sm:mb-8">
          {/* Active filter chips */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
            <div className="pill-chip max-w-full border-teal-200/70 dark:border-teal-800/70 bg-teal-50/65 dark:bg-teal-950/40 text-teal-800 dark:text-teal-200 text-xs sm:text-sm">
              {currentView === 'calendar' ? <CalendarViewIcon size={15} aria-hidden="true" /> : <List size={15} aria-hidden="true" />}
              <span>{currentView === 'calendar' ? t('listView.calendarView') : t('listView.listView')}</span>
            </div>

            {selectedCountries.length === 0 ? (
              <div className="pill-chip max-w-full border-amber-200/70 dark:border-amber-800/70 bg-amber-50/65 dark:bg-amber-950/40 text-amber-800 dark:text-amber-200 text-xs sm:text-sm">
                <Globe size={15} aria-hidden="true" />
                <span>{t('listView.noCountriesSelected')}</span>
              </div>
            ) : isAllSelected ? (
              <div className="pill-chip max-w-full border-fuchsia-200/70 dark:border-fuchsia-800/70 bg-fuchsia-50/65 dark:bg-fuchsia-950/40 text-fuchsia-800 dark:text-fuchsia-200 text-xs sm:text-sm">
                <Globe size={15} aria-hidden="true" />
                <span>{t('countryFilter.allCountries')}</span>
              </div>
            ) : (
              selectedCountries.map((country) => (
                <button
                  key={country}
                  type="button"
                  onClick={() => updateSelectedCountries(selectedCountries.filter(c => c !== country))}
                  className="group flex items-center gap-1.5 rounded-full border border-fuchsia-200/70 dark:border-fuchsia-800/70 bg-fuchsia-50/65 dark:bg-fuchsia-950/40 px-2.5 py-1 text-xs sm:text-sm text-fuchsia-800 dark:text-fuchsia-200 transition-colors hover:bg-fuchsia-100/80 focus:outline-none focus:ring-2 focus:ring-fuchsia-400"
                  aria-label={`Remove ${country}`}
                >
                  <MapPin size={13} className="text-fuchsia-600/80 dark:text-fuchsia-400" aria-hidden="true" />
                  <span className="truncate max-w-[10rem]">{country}</span>
                  <X size={13} className="ml-0.5 text-fuchsia-400 opacity-60 transition-all group-hover:text-fuchsia-600 group-hover:opacity-100" aria-hidden="true" />
                </button>
              ))
            )}
          </div>

          {/* Category Filter Pills */}
          <CategoryFilter
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
          {/* Country Filter Sidebar */}
          <aside className="lg:col-span-1 space-y-4 sm:space-y-6 lg:sticky lg:top-24 self-start" aria-label="Country filters and legend">
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
                selectedCategory={selectedCategory}
                onDateClick={handleDateClick}
              />
            ) : (
              <HolidayListView
                currentDate={currentDate}
                onCurrentDateChange={setCurrentDate}
                selectedCountries={selectedCountries}
                selectedCategory={selectedCategory}
              />
            )}

            {/* Insights & Discovery Widget Bar (Upcoming Holiday, Monthly Breakdown, Cultural Trivia) */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4 mb-2">
              <UpcomingHolidayWidget
                monthHolidays={currentMonthHolidays}
                onSelectDate={handleSelectUpcomingHoliday}
              />
              <HolidayBreakdownWidget
                monthHolidays={currentMonthHolidays}
                selectedCategory={selectedCategory}
                onSelectCategory={setSelectedCategory}
              />
              <CulturalTriviaWidget
                monthHolidays={currentMonthHolidays}
                onSelectHoliday={handleSelectHolidayFromSearch}
                currentDate={currentDate}
              />
            </div>

            {faqItems.length > 0 && (
              <section className="surface-card rounded-[28px] p-4 sm:p-6 animate-fade-in-up" aria-labelledby="faq-heading">
                <h2 id="faq-heading" className="text-lg sm:text-xl font-semibold text-slate-900 dark:text-white mb-4">
                  {t('faq.title')}
                </h2>
                <div className="space-y-3">
                  {faqItems.map((item, index) => (
                    <details key={index} className="group rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 px-4 py-3 shadow-sm">
                      <summary className="cursor-pointer list-none font-medium text-slate-900 dark:text-white flex items-center justify-between gap-3">
                        <span>{item.question}</span>
                        <span className="text-slate-400 transition-transform group-open:rotate-45" aria-hidden="true">+</span>
                      </summary>
                      <p className="mt-3 text-sm sm:text-base leading-relaxed text-slate-600 dark:text-slate-300">
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

      {/* Global Search Modal */}
      <HolidaySearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectHoliday={handleSelectHolidayFromSearch}
        currentYear={currentDate.getFullYear()}
      />

      {/* Direct Search / Upcoming Jump Holiday Modal */}
      {activeModalHoliday && (
        <Suspense fallback={null}>
          <HolidayModal
            date={activeModalHoliday.date}
            holidays={activeModalHoliday.holidays}
            onClose={() => setActiveModalHoliday(null)}
          />
        </Suspense>
      )}

      {/* Mobile Sticky Thumb-Zone Bottom Nav */}
      <MobileBottomNav
        viewMode={currentView}
        onViewModeChange={handleViewChange}
        onOpenSearch={() => setIsSearchOpen(true)}
        onJumpToday={() => setCurrentDate(new Date())}
      />

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
                <span>© {new Date().getFullYear()} Orangely</span>
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
