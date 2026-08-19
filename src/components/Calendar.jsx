import React, { useState, useEffect, useMemo, useRef, lazy, Suspense } from 'react';
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getHolidaysForMonth } from '../services/holidayApi';
import { useTranslation } from '../hooks/useI18n';
import { getLocaleFromLanguage } from '../services/i18nService';
import { toDateKey } from '../utils/dateUtils';
import { matchesCategory } from '../utils/categoryUtils';
import MonthYearPicker from './MonthYearPicker';
import DayHoverPopover from './DayHoverPopover';

const HolidayModal = lazy(() => import('./HolidayModal'));

const Calendar = ({ currentDate, onCurrentDateChange, selectedCountries, selectedCategory = 'all', onDateClick }) => {
  const [selectedDate, setSelectedDate] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [monthHolidays, setMonthHolidays] = useState({});
  const [loading, setLoading] = useState(false);
  const [showLoadingState, setShowLoadingState] = useState(false);
  const [hoveredDay, setHoveredDay] = useState(null);
  const [hoverRect, setHoverRect] = useState(null);
  const { t, language } = useTranslation();
  const touchStartRef = useRef({ x: 0, y: 0 });

  const todayKey = useMemo(() => new Date().toDateString(), []);
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

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
    const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);
    const firstDayOfWeek = firstDayOfMonth.getDay();
    const daysInMonth = lastDayOfMonth.getDate();

    const days = [];

    // Helper function to get holidays for a date from monthHolidays
    const getHolidaysForDateFromCache = (date) => {
      const allForDay = monthHolidays[toDateKey(date)] || [];
      return allForDay.filter(h => matchesCategory(h, selectedCategory));
    };

    // Add previous month's trailing days
    const prevMonth = new Date(currentYear, currentMonth - 1, 0);
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const day = prevMonth.getDate() - i;
      const date = new Date(currentYear, currentMonth - 1, day);
      days.push({
        date,
        day,
        isCurrentMonth: false,
        isToday: false,
        holidays: [] // Don't show holidays for previous month days
      });
    }

    // Add current month's days
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentYear, currentMonth, day);
      const isToday = date.toDateString() === todayKey;
      days.push({
        date,
        day,
        isCurrentMonth: true,
        isToday,
        holidays: getHolidaysForDateFromCache(date)
      });
    }

    // Add next month's leading days
    const remainingDays = 42 - days.length; // 6 rows × 7 days
    for (let day = 1; day <= remainingDays; day++) {
      const date = new Date(currentYear, currentMonth + 1, day);
      days.push({
        date,
        day,
        isCurrentMonth: false,
        isToday: false,
        holidays: [] // Don't show holidays for next month days
      });
    }

    return days;
  }, [currentYear, currentMonth, monthHolidays, selectedCategory, todayKey]);

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

  const handleDateClick = (dayInfo) => {
    if (dayInfo.holidays.length > 0) {
      setSelectedDate(dayInfo);
      setIsModalOpen(true);
    }
    if (onDateClick) {
      onDateClick(dayInfo);
    }
  };

  const dayNames = t('calendar.weekdays');
  const mobileDayNames = dayNames.map(day => day.slice(0, 2));
  const hasMonthData = Object.keys(monthHolidays).length > 0;
  const locale = getLocaleFromLanguage(language);

  const formatCalendarLabel = (date) => {
    const formattedDate = date.toLocaleDateString(locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const holidayCount = monthHolidays[toDateKey(date)]?.length;
    if (!holidayCount) {
      return formattedDate;
    }

    return `${formattedDate}, ${t(holidayCount === 1 ? 'listView.holidayCount' : 'listView.holidayCountPlural', { count: holidayCount })}`;
  };

  return (
    <div
      className="surface-card overflow-hidden rounded-[28px] animate-fade-in-up"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Calendar Header */}
      <div className="bg-teal-600 p-3 text-white sm:p-4">
        <div className="flex items-center justify-between gap-2 sm:gap-4 mb-3 sm:mb-4">
          <button
            type="button"
            onClick={() => navigateMonth(-1)}
            className="focus-ring rounded-full border border-teal-500 bg-teal-700/50 p-2.5 hover:bg-orange-500 hover:border-orange-500 transition-colors"
            aria-label={t('calendar.previousMonth')}
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div className="text-center min-w-0 flex-1 px-1">
            <MonthYearPicker
              currentDate={currentDate}
              onDateChange={onCurrentDateChange}
              align="center"
            />
            <div>
              <button
                type="button"
                onClick={navigateToToday}
                className="mt-0.5 inline-flex items-center justify-center rounded-full border border-teal-500 bg-teal-700/50 px-3 py-0.5 text-xs sm:text-sm hover:bg-orange-500 hover:border-orange-500 transition-colors"
              >
                {t('calendar.today')}
              </button>
            </div>
          </div>

          <button
              type="button"
              onClick={() => navigateMonth(1)}
              className="focus-ring rounded-full border border-teal-500 bg-teal-700/50 p-2.5 hover:bg-orange-500 hover:border-orange-500 transition-colors"
              aria-label={t('calendar.nextMonth')}
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center justify-center min-h-5">
          <p className="sm:hidden text-[11px] text-white/85 animate-fade-in-up">
            {t('calendar.swipeHint')}
          </p>
          {loading && showLoadingState && hasMonthData && (
            <div className="hidden sm:inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs text-white/90">
              <span className="h-2 w-2 rounded-full bg-white animate-pulse" aria-hidden="true" />
              <span>{t('calendar.loading')}</span>
            </div>
          )}
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
          {dayNames.map((day, index) => (
            <div key={day} className="text-center text-[11px] sm:text-sm font-medium py-1.5 sm:py-2 uppercase sm:normal-case tracking-wide sm:tracking-normal">
              <span className="sm:hidden">{mobileDayNames[index]}</span>
              <span className="hidden sm:inline">{day}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="relative bg-white/40 dark:bg-slate-900/40 p-1.5 sm:p-3">
        {loading && showLoadingState && !hasMonthData ? (
          <div className="grid grid-cols-7 gap-1 sm:gap-1.5 animate-fade-in-up" aria-hidden="true">
            {Array.from({ length: 42 }).map((_, index) => (
              <div key={index} className="min-h-[3.85rem] sm:min-h-[5.5rem] lg:min-h-[6.5rem] rounded-lg sm:rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 p-1.5 sm:p-2">
                <div className="skeleton-shimmer h-3 w-5 rounded-full mb-2" />
                <div className="hidden sm:block skeleton-shimmer h-2.5 w-full rounded-full mb-1.5" />
                <div className="hidden sm:block skeleton-shimmer h-2.5 w-2/3 rounded-full" />
              </div>
            ))}
          </div>
        ) : (
        <div className={`grid grid-cols-7 gap-1 sm:gap-1.5 ${loading && showLoadingState ? 'opacity-70' : ''}`}>
          {calendarDays.map((dayInfo, index) => {
            const hasHolidays = dayInfo.holidays.length > 0;
            const isInteractive = hasHolidays && dayInfo.isCurrentMonth;

            return (
              <button
                type="button"
                key={index}
                onClick={() => handleDateClick(dayInfo)}
                onMouseEnter={(e) => {
                  if (hasHolidays && dayInfo.isCurrentMonth && window.innerWidth >= 640) {
                    setHoveredDay(dayInfo);
                    setHoverRect(e.currentTarget.getBoundingClientRect());
                  }
                }}
                onMouseLeave={() => {
                  setHoveredDay(null);
                  setHoverRect(null);
                }}
                disabled={!isInteractive}
                className={`
                  relative flex min-h-[3.85rem] sm:min-h-[5.5rem] lg:min-h-[6.5rem] flex-col overflow-hidden rounded-lg sm:rounded-xl border px-1 py-1.5 sm:p-2 transition-all duration-200 text-left
                  ${
                    dayInfo.isToday
                      ? 'bg-teal-600 border-teal-600 text-white shadow-md ring-2 ring-teal-400/40'
                      : hasHolidays && dayInfo.isCurrentMonth
                      ? 'bg-cyan-50/80 dark:bg-cyan-950/40 border-cyan-200/90 dark:border-cyan-800/60 shadow-sm'
                      : dayInfo.isCurrentMonth
                      ? 'bg-white/90 dark:bg-slate-900/60 border-slate-200/80 dark:border-slate-800/80 hover:bg-slate-50/90 dark:hover:bg-slate-800/60'
                      : 'bg-slate-50/40 dark:bg-slate-950/30 border-slate-200/40 dark:border-slate-800/40 opacity-40'
                  }
                  ${
                    isInteractive
                      ? 'cursor-pointer active:scale-[0.98] sm:hover:-translate-y-0.5 sm:hover:shadow-md transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-300 focus-visible:ring-offset-2'
                      : 'cursor-default'
                  }
                `}
                aria-label={formatCalendarLabel(dayInfo.date)}
                aria-disabled={!isInteractive}
              >
                <div className="mb-1 flex w-full items-start justify-between gap-1 sm:mb-1.5">
                  <span className={`inline-flex min-w-5 items-center justify-center rounded-full px-1.5 py-0.5 text-xs sm:text-sm font-semibold ${
                    dayInfo.isToday
                      ? 'bg-white/20 text-white font-bold'
                      : dayInfo.isCurrentMonth
                      ? 'text-slate-900 dark:text-slate-100'
                      : 'text-slate-400 dark:text-slate-600'
                  }`}>
                    {dayInfo.day}
                  </span>

                  {/* Holiday indicators */}
                  {hasHolidays && (
                    <div className="flex items-center gap-1 self-start">
                      <div className="hidden sm:flex flex-wrap items-center gap-1">
                        {dayInfo.holidays.slice(0, 3).map((holiday, holidayIndex) => (
                          <div
                            key={holidayIndex}
                            className="h-2 w-2 rounded-full shadow-sm"
                            style={{ backgroundColor: holiday.color || '#3B82F6' }}
                            title={holiday.name}
                          />
                        ))}
                        {dayInfo.holidays.length > 3 && (
                          <div className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                            +{dayInfo.holidays.length - 3}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Holiday names */}
                {hasHolidays && dayInfo.isCurrentMonth && (
                  <div className="flex flex-1 flex-col justify-end overflow-hidden">
                    <div className="mt-auto flex items-center gap-1 sm:hidden" aria-hidden="true">
                      {dayInfo.holidays.slice(0, 3).map((holiday, holidayIndex) => (
                        <span
                          key={holidayIndex}
                          className={`h-1.5 w-1.5 rounded-full ${dayInfo.isToday ? 'ring-1 ring-white/30' : ''}`}
                          style={{ backgroundColor: holiday.color || '#3B82F6' }}
                        />
                      ))}
                    </div>
                    {dayInfo.holidays.slice(0, 2).map((holiday, holidayIndex) => (
                      <div
                        key={holidayIndex}
                        className={`hidden truncate text-[11px] leading-4 sm:block font-medium ${
                          dayInfo.isToday
                            ? 'text-teal-100'
                            : 'text-slate-700 dark:text-slate-200'
                        }`}
                        title={holiday.name}
                      >
                        {holiday.name}
                      </div>
                    ))}
                    {dayInfo.holidays.length > 2 && (
                      <div className={`hidden pt-0.5 text-[11px] font-semibold sm:block ${
                        dayInfo.isToday
                          ? 'text-teal-200'
                          : 'text-slate-500 dark:text-slate-400'
                      }`}>
                        {t('common.moreCount', { count: dayInfo.holidays.length - 2 })}
                      </div>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>
        )}

        {loading && showLoadingState && hasMonthData && (
          <div className="pointer-events-none absolute inset-x-0 top-2 flex justify-center sm:hidden">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/95 dark:bg-slate-800/95 px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-200 shadow-sm ring-1 ring-slate-200/80 dark:ring-slate-700">
              <span className="h-2 w-2 rounded-full bg-teal-400 animate-pulse" aria-hidden="true" />
              <span>{t('calendar.loading')}</span>
            </div>
          </div>
        )}
      </div>

      {/* Desktop Hover Tooltip */}
      {hoveredDay && hoverRect && (
        <DayHoverPopover
          dayInfo={hoveredDay}
          targetRect={hoverRect}
          locale={locale}
        />
      )}

      {/* Holiday Modal */}
      {isModalOpen && selectedDate && (
        <Suspense fallback={null}>
          <HolidayModal
            date={selectedDate.date}
            holidays={selectedDate.holidays}
            onClose={() => setIsModalOpen(false)}
          />
        </Suspense>
      )}
    </div>
  );
};

export default Calendar;