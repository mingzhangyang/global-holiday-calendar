import React, { useMemo, useState } from 'react';
import { Calendar, MapPin, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import { useTranslation } from '../hooks/useI18n';
import { getLocaleFromLanguage } from '../services/i18nService';
import { parseDateKey } from '../utils/dateUtils';
import { matchesCategory } from '../utils/categoryUtils';
import { getHolidayColor } from '../utils/holidayColors';
import { getHolidayCountryLabel, getHolidayDisplayName, getHolidayTypeLabel } from '../utils/holidayDisplay';
import { useDelayedLoading } from '../hooks/useDelayedLoading';
import { useMonthNavigation } from '../hooks/useMonthNavigation';
import HolidayFetchError from './HolidayFetchError';
import MonthNavigationHeader from './MonthNavigationHeader';

const HolidayListView = ({
  currentDate,
  onCurrentDateChange,
  monthHolidays = {},
  loading = false,
  error = null,
  onRetry,
  hasSelection = true,
  selectedCategory = 'all',
  onSelectDay
}) => {
  const [expandedDates, setExpandedDates] = useState(() => new Set());
  const { t, language } = useTranslation();
  const locale = getLocaleFromLanguage(language);
  const showLoadingState = useDelayedLoading(loading);
  const { navigateMonth, swipeHandlers } = useMonthNavigation(onCurrentDateChange);

  const holidaysList = useMemo(() => {
    return Object.entries(monthHolidays)
      .map(([dateStr, dayHolidays]) => ({
        dateStr,
        date: parseDateKey(dateStr),
        holidays: (dayHolidays || []).filter(holiday => matchesCategory(holiday, selectedCategory))
      }))
      .filter(entry => entry.holidays.length > 0)
      .sort((a, b) => (a.dateStr < b.dateStr ? -1 : 1));
  }, [monthHolidays, selectedCategory]);

  const toggleDateExpansion = (dateStr) => {
    setExpandedDates(previous => {
      const next = new Set(previous);
      if (next.has(dateStr)) {
        next.delete(dateStr);
      } else {
        next.add(dateStr);
      }
      return next;
    });
  };

  const formatDate = (date) => {
    const isToday = date.toDateString() === new Date().toDateString();
    const formatted = date.toLocaleDateString(locale, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    return isToday ? t('listView.todayDate', { date: formatted }) : formatted;
  };

  const hasListData = holidaysList.length > 0;

  if (!hasSelection) {
    return (
      <div className="surface-card rounded-[28px] p-6 text-center sm:p-8">
        <Calendar className="mx-auto mb-4 h-16 w-16 text-slate-400 dark:text-slate-500" />
        <h3 className="mb-2 text-lg font-semibold text-slate-900 dark:text-white">
          {t('listView.noCountriesSelected')}
        </h3>
        <p className="text-slate-600 dark:text-slate-400">
          {t('listView.selectCountriesPrompt')}
        </p>
      </div>
    );
  }

  return (
    <div className="surface-card overflow-hidden rounded-[28px] animate-fade-in-up" {...swipeHandlers}>
      <MonthNavigationHeader
        currentDate={currentDate}
        onCurrentDateChange={onCurrentDateChange}
        onNavigate={navigateMonth}
        showLoadingBadge={loading && showLoadingState && hasListData}
      />

      {/* Content */}
      <div className="relative p-3 sm:p-4">
        {error && !loading && <HolidayFetchError onRetry={onRetry} />}

        {!error && loading && showLoadingState && !hasListData && (
          <div className="space-y-3 sm:space-y-4 animate-fade-in-up" aria-hidden="true">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="overflow-hidden rounded-[24px] border border-slate-200/80 dark:border-slate-800 bg-white/85 dark:bg-slate-900/80 shadow-sm">
                <div className="border-b border-slate-200/70 dark:border-slate-800 bg-slate-100/80 dark:bg-slate-800/60 p-4">
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

        {!error && !loading && !hasListData && (
          <div className="py-8 text-center">
            <Calendar className="mx-auto mb-4 h-16 w-16 text-slate-400 dark:text-slate-500" />
            <h3 className="mb-2 text-lg font-semibold text-slate-900 dark:text-white">
              {t('listView.noHolidays')}
            </h3>
            <p className="text-slate-600 dark:text-slate-400">
              {t('listView.noHolidaysDescription')}
            </p>
          </div>
        )}

        {!error && hasListData && (
          <div className={`space-y-3 sm:space-y-4 ${loading && showLoadingState ? 'opacity-70' : ''}`}>
            {holidaysList.map((dateInfo) => {
              const isExpanded = expandedDates.has(dateInfo.dateStr);
              const visibleHolidays = isExpanded ? dateInfo.holidays : dateInfo.holidays.slice(0, 2);
              const hasMore = dateInfo.holidays.length > 2;

              return (
                <div key={dateInfo.dateStr} className="overflow-hidden rounded-[24px] border border-slate-200/80 dark:border-slate-800 bg-white/85 dark:bg-slate-900/80 shadow-sm backdrop-blur-sm">
                  {/* Date Header */}
                  <div className="border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/60 px-3 py-3 sm:px-4">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-start sm:items-center space-x-2 min-w-0">
                        <Calendar className="h-5 w-5 text-teal-500 shrink-0" />
                        <h3 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-white leading-tight">
                          {formatDate(dateInfo.date)}
                        </h3>
                      </div>
                      <div className="flex items-center justify-between sm:justify-end space-x-2">
                        <span className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                          {t(dateInfo.holidays.length === 1 ? 'listView.holidayCount' : 'listView.holidayCountPlural', { count: dateInfo.holidays.length })}
                        </span>
                        {hasMore && (
                          <button
                            type="button"
                            onClick={() => toggleDateExpansion(dateInfo.dateStr)}
                            className="focus-ring rounded-full p-2 hover:bg-slate-200/70 dark:hover:bg-slate-700/70 text-slate-600 dark:text-slate-400"
                            aria-expanded={isExpanded}
                            aria-label={t('listView.showMoreHolidays', { count: dateInfo.holidays.length - 2 })}
                          >
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Holidays List */}
                  <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {visibleHolidays.map((holiday, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => onSelectDay?.({ date: dateInfo.date, holidays: dateInfo.holidays })}
                        className="focus-ring w-full cursor-pointer p-3 text-left transition-colors duration-200 hover:bg-slate-50/80 dark:hover:bg-slate-800/50 active:bg-slate-50 dark:active:bg-slate-800 sm:p-4"
                      >
                        <div className="flex items-start space-x-3">
                          <span
                            className="mt-2 h-3 w-3 flex-shrink-0 rounded-full"
                            style={{ backgroundColor: getHolidayColor(holiday) }}
                            aria-hidden="true"
                          />
                          <div className="flex-1 min-w-0">
                            <h4 className="mb-1 text-base font-medium leading-snug text-slate-900 dark:text-white sm:text-lg">
                              {getHolidayDisplayName(holiday, language)}
                            </h4>
                            <div className="flex flex-col gap-1 text-sm text-slate-600 dark:text-slate-400 sm:flex-row sm:items-center sm:space-x-4">
                              <span className="flex items-center space-x-1">
                                <MapPin className="w-4 h-4" />
                                <span>{getHolidayCountryLabel(holiday, language)}</span>
                              </span>
                              <span className="flex items-center space-x-1">
                                <Clock className="w-4 h-4" />
                                <span>{getHolidayTypeLabel(holiday.type, t)}</span>
                              </span>
                            </div>
                            {holiday.description && (
                              <p className="mt-2 line-clamp-2 text-sm text-slate-700 dark:text-slate-300">
                                {holiday.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </button>
                    ))}

                    {hasMore && !isExpanded && (
                      <div className="bg-slate-50/80 dark:bg-slate-800/60 p-3 sm:p-4">
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
            <div className="inline-flex items-center gap-2 rounded-full bg-white/95 dark:bg-slate-800/95 px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-200 shadow-sm ring-1 ring-slate-200/80 dark:ring-slate-700">
              <span className="h-2 w-2 rounded-full bg-teal-400 animate-pulse" aria-hidden="true" />
              <span>{t('calendar.loading')}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default React.memo(HolidayListView);
