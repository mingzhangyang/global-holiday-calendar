import React, { useMemo, useState } from 'react';
import { useTranslation } from '../hooks/useI18n';
import { getLocaleFromLanguage } from '../services/i18nService';
import { getFirstDayOfWeek, getLeadingDayCount, rotateToWeekStart, toDateKey } from '../utils/dateUtils';
import { matchesCategory } from '../utils/categoryUtils';
import { getHolidayColor } from '../utils/holidayColors';
import { getHolidayDisplayName } from '../utils/holidayDisplay';
import { useDelayedLoading } from '../hooks/useDelayedLoading';
import { useMonthNavigation } from '../hooks/useMonthNavigation';
import DayHoverPopover from './DayHoverPopover';
import HolidayFetchError from './HolidayFetchError';
import MonthNavigationHeader from './MonthNavigationHeader';

const Calendar = ({
  currentDate,
  onCurrentDateChange,
  monthHolidays = {},
  loading = false,
  error = null,
  onRetry,
  selectedCategory = 'all',
  onSelectDay
}) => {
  const [hoveredDay, setHoveredDay] = useState(null);
  const [hoverRect, setHoverRect] = useState(null);
  const { t, language } = useTranslation();
  const showLoadingState = useDelayedLoading(loading);
  const { navigateMonth, swipeHandlers } = useMonthNavigation(onCurrentDateChange);

  const todayKey = useMemo(() => new Date().toDateString(), []);
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();
  const locale = getLocaleFromLanguage(language);
  const firstDayOfWeek = useMemo(() => getFirstDayOfWeek(locale), [locale]);

  const calendarDays = useMemo(() => {
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const leadingDays = getLeadingDayCount(firstDayOfMonth, firstDayOfWeek);

    const days = [];

    // Trailing days of the previous month, shown as context only.
    const previousMonthLength = new Date(currentYear, currentMonth, 0).getDate();
    for (let index = leadingDays; index > 0; index--) {
      const day = previousMonthLength - index + 1;
      days.push({
        date: new Date(currentYear, currentMonth - 1, day),
        day,
        isCurrentMonth: false,
        isToday: false,
        holidays: []
      });
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentYear, currentMonth, day);
      const holidays = (monthHolidays[toDateKey(date)] || []).filter(holiday =>
        matchesCategory(holiday, selectedCategory)
      );

      days.push({
        date,
        day,
        isCurrentMonth: true,
        isToday: date.toDateString() === todayKey,
        holidays
      });
    }

    const trailingDays = (7 - (days.length % 7)) % 7;
    for (let day = 1; day <= trailingDays; day++) {
      days.push({
        date: new Date(currentYear, currentMonth + 1, day),
        day,
        isCurrentMonth: false,
        isToday: false,
        holidays: []
      });
    }

    return days;
  }, [currentYear, currentMonth, firstDayOfWeek, monthHolidays, selectedCategory, todayKey]);

  const handleDateClick = (dayInfo) => {
    if (dayInfo.holidays.length > 0 && onSelectDay) {
      onSelectDay({ date: dayInfo.date, holidays: dayInfo.holidays });
    }
  };

  const weekdayNames = rotateToWeekStart(t('calendar.weekdays'), firstDayOfWeek);
  const mobileWeekdayNames = weekdayNames.map(day => day.slice(0, 2));
  const hasMonthData = Object.keys(monthHolidays).length > 0;

  const formatCalendarLabel = (date, holidayCount) => {
    const formattedDate = date.toLocaleDateString(locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    if (!holidayCount) return formattedDate;

    return `${formattedDate}, ${t(
      holidayCount === 1 ? 'listView.holidayCount' : 'listView.holidayCountPlural',
      { count: holidayCount }
    )}`;
  };

  return (
    <div className="surface-card overflow-hidden rounded-[28px] animate-fade-in-up" {...swipeHandlers}>
      <MonthNavigationHeader
        currentDate={currentDate}
        onCurrentDateChange={onCurrentDateChange}
        onNavigate={navigateMonth}
        showLoadingBadge={loading && showLoadingState && hasMonthData}
      >
        <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
          {weekdayNames.map((day, index) => (
            <div key={day} className="text-center text-[11px] sm:text-sm font-medium py-1.5 sm:py-2 uppercase sm:normal-case tracking-wide sm:tracking-normal">
              <span className="sm:hidden">{mobileWeekdayNames[index]}</span>
              <span className="hidden sm:inline">{day}</span>
            </div>
          ))}
        </div>
      </MonthNavigationHeader>

      {/* Calendar Grid */}
      <div className="relative bg-white/40 dark:bg-slate-900/40 p-1.5 sm:p-3">
        {error && !loading ? (
          <HolidayFetchError onRetry={onRetry} />
        ) : loading && showLoadingState && !hasMonthData ? (
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
                  onMouseEnter={(event) => {
                    if (isInteractive && window.innerWidth >= 640) {
                      setHoveredDay(dayInfo);
                      setHoverRect(event.currentTarget.getBoundingClientRect());
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
                  aria-label={formatCalendarLabel(dayInfo.date, dayInfo.holidays.length)}
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

                    {hasHolidays && (
                      <div className="hidden sm:flex flex-wrap items-center gap-1 self-start">
                        {dayInfo.holidays.slice(0, 3).map((holiday, holidayIndex) => (
                          <span
                            key={holidayIndex}
                            className="h-2 w-2 rounded-full shadow-sm ring-1 ring-white/70 dark:ring-slate-900/70"
                            style={{ backgroundColor: getHolidayColor(holiday) }}
                            title={getHolidayDisplayName(holiday, language)}
                          />
                        ))}
                        {dayInfo.holidays.length > 3 && (
                          <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                            +{dayInfo.holidays.length - 3}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {hasHolidays && dayInfo.isCurrentMonth && (
                    <div className="flex flex-1 flex-col justify-end overflow-hidden">
                      <div className="mt-auto flex items-center gap-1 sm:hidden" aria-hidden="true">
                        {dayInfo.holidays.slice(0, 3).map((holiday, holidayIndex) => (
                          <span
                            key={holidayIndex}
                            className={`h-1.5 w-1.5 rounded-full ${dayInfo.isToday ? 'ring-1 ring-white/30' : ''}`}
                            style={{ backgroundColor: getHolidayColor(holiday) }}
                          />
                        ))}
                      </div>
                      {dayInfo.holidays.slice(0, 2).map((holiday, holidayIndex) => (
                        <div
                          key={holidayIndex}
                          className={`hidden truncate text-[11px] leading-4 sm:block font-medium ${
                            dayInfo.isToday ? 'text-teal-100' : 'text-slate-700 dark:text-slate-200'
                          }`}
                          title={getHolidayDisplayName(holiday, language)}
                        >
                          {getHolidayDisplayName(holiday, language)}
                        </div>
                      ))}
                      {dayInfo.holidays.length > 2 && (
                        <div className={`hidden pt-0.5 text-[11px] font-semibold sm:block ${
                          dayInfo.isToday ? 'text-teal-200' : 'text-slate-500 dark:text-slate-400'
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
        <DayHoverPopover dayInfo={hoveredDay} targetRect={hoverRect} locale={locale} language={language} />
      )}
    </div>
  );
};

export default React.memo(Calendar);
