import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslation } from '../hooks/useI18n';
import MonthYearPicker from './MonthYearPicker';

/**
 * The teal bar both month views wear: month picker, Today, previous/next, and
 * the swipe hint that doubles as the slow-load badge.
 *
 * `children` is the weekday row — only the calendar has one, which is also
 * what decides where the vertical breathing room goes.
 */
const MonthNavigationHeader = ({
  currentDate,
  onCurrentDateChange,
  onNavigate,
  showLoadingBadge = false,
  children
}) => {
  const { t } = useTranslation();
  const hasWeekdayRow = Boolean(children);

  return (
    <div className="bg-teal-600 p-3 text-white sm:p-4">
      <div className={`flex items-center justify-between gap-2 sm:gap-4 ${hasWeekdayRow ? 'mb-3 sm:mb-4' : ''}`}>
        <button
          type="button"
          onClick={() => onNavigate(-1)}
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
              onClick={() => onCurrentDateChange(new Date())}
              className="mt-0.5 inline-flex items-center justify-center rounded-full border border-teal-500 bg-teal-700/50 px-3 py-0.5 text-xs sm:text-sm hover:bg-orange-500 hover:border-orange-500 transition-colors"
            >
              {t('calendar.today')}
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onNavigate(1)}
          className="focus-ring rounded-full border border-teal-500 bg-teal-700/50 p-2.5 hover:bg-orange-500 hover:border-orange-500 transition-colors"
          aria-label={t('calendar.nextMonth')}
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      <div className={`flex items-center justify-center min-h-5 ${hasWeekdayRow ? '' : 'mt-2'}`}>
        <p className="sm:hidden text-[11px] text-white/85 animate-fade-in-up">
          {t('calendar.swipeHint')}
        </p>
        {showLoadingBadge && (
          <div className="hidden sm:inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs text-white/90">
            <span className="h-2 w-2 rounded-full bg-white animate-pulse" aria-hidden="true" />
            <span>{t('calendar.loading')}</span>
          </div>
        )}
      </div>

      {children}
    </div>
  );
};

export default MonthNavigationHeader;
