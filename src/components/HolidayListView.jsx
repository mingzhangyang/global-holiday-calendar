import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Calendar, MapPin, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import { getHolidaysForMonth } from '../services/holidayApi';
import HolidayModal from './HolidayModal';
import { useTranslation } from '../hooks/useI18n';
import { getLocaleFromLanguage } from '../services/i18nService';

const HolidayListView = ({ currentDate, onCurrentDateChange, selectedCountries }) => {
  const [monthHolidays, setMonthHolidays] = useState({});
  const [loading, setLoading] = useState(false);
  const [showLoadingState, setShowLoadingState] = useState(false);
  const [selectedHoliday, setSelectedHoliday] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [expandedDates, setExpandedDates] = useState(new Set());
  const { t, language } = useTranslation();
  const touchStartRef = useRef({ x: 0, y: 0 });

  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  // Fetch holidays for the current month
  useEffect(() => {
    let isActive = true;

    const fetchMonthHolidays = async () => {
      setLoading(true);
      try {
        const holidays = await getHolidaysForMonth(currentYear, currentMonth, selectedCountries);
        if (isActive) {
          setMonthHolidays(holidays);
        }
      } catch (error) {
        console.error('Error fetching holidays:', error);
        if (isActive) {
          setMonthHolidays({});
        }
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    };

    fetchMonthHolidays();

    return () => {
      isActive = false;
    };
  }, [currentYear, currentMonth, selectedCountries]);

  useEffect(() => {
    if (!loading) {
      setShowLoadingState(false);
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      setShowLoadingState(true);
    }, 180);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [loading]);

  // Process holidays into sorted list
  const holidaysList = useMemo(() => {
    const holidays = [];
    
    Object.entries(monthHolidays).forEach(([dateStr, dayHolidays]) => {
      const date = new Date(dateStr);
      holidays.push({
        date,
        dateStr,
        holidays: dayHolidays
      });
    });

    return holidays.sort((a, b) => a.date - b.date);
  }, [monthHolidays]);

  const navigateMonth = (direction) => {
    onCurrentDateChange(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + direction);
      return newDate;
    });
  };

  const navigateToToday = () => {
    onCurrentDateChange(new Date());
  };

  const handleTouchStart = (event) => {
    const touch = event.changedTouches[0];
    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY
    };
  };

  const handleTouchEnd = (event) => {
    const touch = event.changedTouches[0];
    const deltaX = touch.clientX - touchStartRef.current.x;
    const deltaY = touch.clientY - touchStartRef.current.y;

    if (Math.abs(deltaX) < 50 || Math.abs(deltaX) < Math.abs(deltaY)) {
      return;
    }

    navigateMonth(deltaX < 0 ? 1 : -1);
  };

  const handleHolidayClick = (dateInfo) => {
    setSelectedHoliday(dateInfo);
    setIsModalOpen(true);
  };

  const toggleDateExpansion = (dateStr) => {
    const newExpanded = new Set(expandedDates);
    if (newExpanded.has(dateStr)) {
      newExpanded.delete(dateStr);
    } else {
      newExpanded.add(dateStr);
    }
    setExpandedDates(newExpanded);
  };

  const formatDate = (date) => {
    const today = new Date();
    const isToday = date.toDateString() === today.toDateString();
    const locale = getLocaleFromLanguage(language);
    
    const options = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    
    const formatted = date.toLocaleDateString(locale, options);
    return isToday ? t('listView.todayDate', { date: formatted }) : formatted;
  };

  const monthNames = t('calendar.months');
  const hasListData = holidaysList.length > 0;

  const getHolidayTypeLabel = (type) => {
    const translation = t(`holidayType.${type || 'default'}`);
    return translation.startsWith('holidayType.') ? t('holidayType.default') : translation;
  };

  if (selectedCountries.length === 0) {
    return (
      <div className="surface-card rounded-[28px] p-6 text-center sm:p-8">
        <Calendar className="mx-auto mb-4 h-16 w-16 text-slate-400" />
        <h3 className="mb-2 text-lg font-semibold text-slate-900">
          {t('listView.noCountriesSelected')}
        </h3>
        <p className="text-slate-600">
          {t('listView.selectCountriesPrompt')}
        </p>
      </div>
    );
  }

  return (
    <div
      className="surface-card overflow-hidden rounded-[28px] animate-fade-in-up"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Header */}
      <div className="bg-gradient-to-br from-slate-950 via-teal-950 to-cyan-600 p-3 text-white sm:p-4">
        <div className="flex items-center justify-between gap-2 sm:gap-4">
          <button
            type="button"
            onClick={() => navigateMonth(-1)}
            className="focus-ring rounded-full border border-white/10 bg-white/10 p-2.5 hover:bg-white/15"
            aria-label={t('calendar.previousMonth')}
          >
            <ChevronDown className="w-5 h-5 transform rotate-90" />
          </button>
          
          <div className="text-center min-w-0 flex-1 px-1">
            <h2 className="text-lg sm:text-2xl font-bold truncate">
              {monthNames[currentMonth]} {currentYear}
            </h2>
            <button
              type="button"
              onClick={navigateToToday}
              className="mt-1 inline-flex items-center justify-center rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs sm:text-sm opacity-90 hover:bg-white/15"
            >
              {t('calendar.today')}
            </button>
          </div>
          
          <button
            type="button"
            onClick={() => navigateMonth(1)}
            className="focus-ring rounded-full border border-white/10 bg-white/10 p-2.5 hover:bg-white/15"
            aria-label={t('calendar.nextMonth')}
          >
            <ChevronUp className="w-5 h-5 transform rotate-90" />
          </button>
        </div>

        <div className="flex items-center justify-center min-h-5 mt-2">
          <p className="sm:hidden text-[11px] text-white/85 animate-fade-in-up">
            {t('calendar.swipeHint')}
          </p>
          {loading && showLoadingState && hasListData && (
            <div className="hidden sm:inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs text-white/90">
              <span className="h-2 w-2 rounded-full bg-white animate-pulse" aria-hidden="true" />
              <span>{t('calendar.loading')}</span>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
  <div className="relative p-3 sm:p-4">
        {loading && showLoadingState && !hasListData && (
          <div className="space-y-3 sm:space-y-4 animate-fade-in-up" aria-hidden="true">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="overflow-hidden rounded-[24px] border border-slate-200/80 bg-white/85 shadow-sm">
                <div className="border-b border-slate-200/70 bg-slate-100/80 p-4">
                  <div className="skeleton-shimmer h-4 w-2/3 rounded-full mb-2" />
                  <div className="skeleton-shimmer h-3 w-1/3 rounded-full" />
                </div>
                <div className="p-4 space-y-3">
                  <div className="skeleton-shimmer h-4 w-1/2 rounded-full" />
                  <div className="skeleton-shimmer h-3 w-full rounded-full" />
                  <div className="skeleton-shimmer h-3 w-4/5 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && holidaysList.length === 0 && (
          <div className="py-8 text-center">
            <Calendar className="mx-auto mb-4 h-16 w-16 text-slate-400" />
            <h3 className="mb-2 text-lg font-semibold text-slate-900">
              {t('listView.noHolidays')}
            </h3>
            <p className="text-slate-600">
              {t('listView.noHolidaysDescription')}
            </p>
          </div>
        )}

        {(hasListData || (!loading && holidaysList.length > 0)) && (
          <div className={`space-y-3 sm:space-y-4 ${loading && showLoadingState ? 'opacity-70' : ''}`}>
            {holidaysList.map((dateInfo) => {
              const isExpanded = expandedDates.has(dateInfo.dateStr);
              const visibleHolidays = isExpanded ? dateInfo.holidays : dateInfo.holidays.slice(0, 2);
              const hasMore = dateInfo.holidays.length > 2;

              return (
                <div key={dateInfo.dateStr} className="overflow-hidden rounded-[24px] border border-slate-200/80 bg-white/85 shadow-sm backdrop-blur-sm">
                  {/* Date Header */}
                  <div className="border-b border-slate-200/80 bg-slate-50/80 px-3 py-3 sm:px-4">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-start sm:items-center space-x-2 min-w-0">
                        <Calendar className="h-5 w-5 text-teal-500" />
                        <h3 className="text-base sm:text-lg font-semibold text-slate-900 leading-tight">
                          {formatDate(dateInfo.date)}
                        </h3>
                      </div>
                      <div className="flex items-center justify-between sm:justify-end space-x-2">
                        <span className="text-xs sm:text-sm text-slate-600">
                          {t(dateInfo.holidays.length === 1 ? 'listView.holidayCount' : 'listView.holidayCountPlural', { count: dateInfo.holidays.length })}
                        </span>
                        {hasMore && (
                          <button
                            type="button"
                            onClick={() => toggleDateExpansion(dateInfo.dateStr)}
                            className="focus-ring rounded-full p-2 hover:bg-slate-200/70"
                          >
                            {isExpanded ? (
                              <ChevronUp className="w-4 h-4 text-slate-600" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-slate-600" />
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Holidays List */}
                  <div className="divide-y divide-slate-100">
                    {visibleHolidays.map((holiday, index) => (
                      <div
                        key={index}
                        onClick={() => handleHolidayClick(dateInfo)}
                        className="cursor-pointer p-3 transition-colors duration-200 hover:bg-slate-50/80 active:bg-slate-50 sm:p-4"
                      >
                        <div className="flex items-start space-x-3">
                          <div
                            className="w-3 h-3 rounded-full mt-2 flex-shrink-0"
                            style={{ backgroundColor: holiday.color || '#3B82F6' }}
                          />
                          <div className="flex-1 min-w-0">
                            <h4 className="mb-1 text-base font-medium leading-snug text-slate-900 sm:text-lg">
                              {holiday.name}
                            </h4>
                            <div className="flex flex-col gap-1 text-sm text-slate-600 sm:flex-row sm:items-center sm:space-x-4">
                              <div className="flex items-center space-x-1">
                                <MapPin className="w-4 h-4" />
                                <span>{holiday.country}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Clock className="w-4 h-4" />
                                <span className="capitalize">{getHolidayTypeLabel(holiday.type)}</span>
                              </div>
                            </div>
                            {holiday.description && (
                              <p className="mt-2 line-clamp-2 text-sm text-slate-700">
                                {holiday.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {hasMore && !isExpanded && (
                      <div className="bg-slate-50/80 p-3 sm:p-4">
                        <button
                          type="button"
                          onClick={() => toggleDateExpansion(dateInfo.dateStr)}
                          className="accent-button-soft focus-ring w-full rounded-2xl px-4 py-2 text-sm font-medium"
                        >
                          {t('listView.showMoreHolidays', { count: dateInfo.holidays.length - 2 })}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {loading && showLoadingState && hasListData && (
          <div className="pointer-events-none absolute inset-x-0 top-3 flex justify-center sm:hidden">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/95 px-3 py-1.5 text-xs font-medium text-slate-600 shadow-sm ring-1 ring-slate-200/80">
              <span className="h-2 w-2 rounded-full bg-teal-400 animate-pulse" aria-hidden="true" />
              <span>{t('calendar.loading')}</span>
            </div>
          </div>
        )}
      </div>

      {/* Holiday Modal */}
      {isModalOpen && selectedHoliday && (
        <HolidayModal
          date={selectedHoliday.date}
          holidays={selectedHoliday.holidays}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </div>
  );
};

export default HolidayListView;