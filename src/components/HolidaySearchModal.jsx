import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Search, X, Calendar, MapPin, ArrowRight, Sparkles } from 'lucide-react';
import { useTranslation } from '../hooks/useI18n';
import { fetchHolidaysFromWorker, getCountries, getCountryCodeByName } from '../services/holidayApi';
import { parseDateKey } from '../utils/dateUtils';
import { getLocaleFromLanguage } from '../services/i18nService';

const HolidaySearchModal = ({ isOpen, onClose, onSelectHoliday, currentYear }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [yearHolidays, setYearHolidays] = useState([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);
  const resultsRef = useRef(null);
  const { t, language } = useTranslation();
  const locale = getLocaleFromLanguage(language);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setSearchTerm('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Load search index for the year from all supported countries
  useEffect(() => {
    let isActive = true;
    if (!isOpen) return;

    const loadSearchIndex = async () => {
      setLoading(true);
      try {
        const countries = getCountries();
        const promises = countries.map(countryName => {
          const code = getCountryCodeByName(countryName);
          return fetchHolidaysFromWorker(currentYear, code, false).catch(() => []);
        });
        const results = await Promise.all(promises);
        if (isActive) {
          const all = results.flat();
          // Deduplicate by date + name
          const seen = new Set();
          const deduped = all.filter(h => {
            const key = `${h.date}-${h.country}-${h.name.toLowerCase()}`;
            return seen.has(key) ? false : seen.add(key);
          });
          setYearHolidays(deduped);
        }
      } catch (e) {
        console.warn('Error loading search index:', e);
      } finally {
        if (isActive) setLoading(false);
      }
    };

    loadSearchIndex();
    return () => {
      isActive = false;
    };
  }, [isOpen, currentYear]);

  // Filter holidays matching search term
  const filteredHolidays = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) {
      // Show upcoming holidays or top 8 holidays
      return yearHolidays.slice(0, 8);
    }

    return yearHolidays
      .filter(h => {
        return (
          h.name.toLowerCase().includes(term) ||
          (h.country && h.country.toLowerCase().includes(term)) ||
          (h.localName && h.localName.toLowerCase().includes(term)) ||
          (h.description && h.description.toLowerCase().includes(term))
        );
      })
      .slice(0, 15);
  }, [searchTerm, yearHolidays]);

  const handleItemClick = React.useCallback((holiday) => {
    const dateObj = parseDateKey(holiday.date);
    onSelectHoliday({
      holiday,
      date: dateObj
    });
    onClose();
  }, [onSelectHoliday, onClose]);

  // Keyboard navigation inside search results
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;

      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % (filteredHolidays.length || 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + filteredHolidays.length) % (filteredHolidays.length || 1));
      } else if (e.key === 'Enter' && filteredHolidays[selectedIndex]) {
        e.preventDefault();
        handleItemClick(filteredHolidays[selectedIndex]);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredHolidays, selectedIndex, onClose, handleItemClick]);

  // Auto-scroll selected item into view
  useEffect(() => {
    if (resultsRef.current) {
      const activeElement = resultsRef.current.children[selectedIndex];
      if (activeElement) {
        activeElement.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex]);

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[99999] flex items-start justify-center bg-slate-950/60 p-3 sm:p-6 backdrop-blur-sm animate-fade-in-up"
      onClick={onClose}
    >
      <div
        className="surface-card-strong mt-10 sm:mt-16 w-full max-w-xl overflow-hidden rounded-3xl shadow-2xl border border-slate-200/90 dark:border-slate-700/90"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Header Input */}
        <div className="flex items-center gap-3 border-b border-slate-200/80 dark:border-slate-800 p-4">
          <Search size={20} className="text-teal-600 dark:text-teal-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder={t('search.placeholder')}
            className="w-full bg-transparent text-base sm:text-lg text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none"
            aria-label={t('search.placeholder')}
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="rounded-full p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
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
          {loading && yearHolidays.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-sm">
              <div className="animate-spin rounded-full h-6 w-6 border border-teal-500 border-t-transparent mx-auto mb-2" />
              <span>{t('calendar.loading')}</span>
            </div>
          ) : filteredHolidays.length === 0 ? (
            <div className="p-8 text-center text-slate-500 dark:text-slate-400 text-sm">
              <Sparkles size={24} className="mx-auto mb-2 opacity-50 text-teal-500" />
              <p>{t('search.noResults')}</p>
            </div>
          ) : (
            filteredHolidays.map((holiday, idx) => {
              const isSelected = idx === selectedIndex;
              const holidayDate = parseDateKey(holiday.date);
              const formatted = holidayDate.toLocaleDateString(locale, {
                month: 'short',
                day: 'numeric'
              });

              return (
                <button
                  key={`${holiday.date}-${holiday.name}-${idx}`}
                  type="button"
                  onClick={() => handleItemClick(holiday)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`w-full flex items-center justify-between gap-3 p-3 rounded-2xl text-left transition-all ${
                    isSelected
                      ? 'bg-teal-50/90 dark:bg-teal-950/60 text-teal-950 dark:text-teal-100 ring-1 ring-teal-200 dark:ring-teal-800'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-800 dark:text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className="h-2.5 w-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: holiday.color || '#0d9488' }}
                    />
                    <div className="min-w-0">
                      <div className="text-sm font-semibold truncate">
                        {holiday.name}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                        <span className="flex items-center gap-1">
                          <MapPin size={12} />
                          <span>{holiday.country}</span>
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Calendar size={12} />
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
                  />
                </button>
              );
            })
          )}
        </div>

        {/* Footer Hint */}
        <div className="border-t border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 px-4 py-2.5 text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between">
          <span>{t('search.shortcutHint')}</span>
          <span className="font-semibold text-teal-600 dark:text-teal-400">{filteredHolidays.length} results</span>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default React.memo(HolidaySearchModal);
