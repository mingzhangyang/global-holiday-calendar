import React, { useMemo } from 'react';
import { Sparkles, Calendar, ArrowRight } from 'lucide-react';
import { useTranslation } from '../hooks/useI18n';
import { getDateOnlyDayNumber, parseDateKey, toDateKey } from '../utils/dateUtils';
import { getLocaleFromLanguage } from '../services/i18nService';
import { getHolidayCountryLabel, getHolidayDisplayName } from '../utils/holidayDisplay';

/**
 * The countdown reads a forward-looking list rather than the month on screen,
 * so it keeps counting when the visitor browses back — and finds January's
 * holidays from December.
 */
const UpcomingHolidayWidget = ({ upcomingHolidays = [], onSelectHoliday }) => {
  const { t, language } = useTranslation();
  const locale = getLocaleFromLanguage(language);

  const upcomingHoliday = useMemo(() => {
    const nearest = upcomingHolidays[0];
    if (!nearest) return null;

    const todayDayNumber = getDateOnlyDayNumber(toDateKey(new Date()));

    return {
      ...nearest,
      dateObj: parseDateKey(nearest.date),
      diffDays: getDateOnlyDayNumber(nearest.date) - todayDayNumber
    };
  }, [upcomingHolidays]);

  if (!upcomingHoliday) {
    return (
      <div className="surface-card rounded-2xl p-4">
        <div className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-600 dark:text-teal-400 mb-1">
          {t('stats.nextHoliday')}
        </div>
        <div className="text-sm font-semibold text-slate-800 dark:text-slate-100">
          {t('stats.noUpcoming')}
        </div>
      </div>
    );
  }

  const formattedDate = upcomingHoliday.dateObj.toLocaleDateString(locale, {
    month: 'short',
    day: 'numeric'
  });

  const countdownText =
    upcomingHoliday.diffDays === 0
      ? t('stats.today')
      : upcomingHoliday.diffDays === 1
      ? t('stats.tomorrow')
      : t('stats.daysAway', { days: upcomingHoliday.diffDays });

  return (
    <button
      type="button"
      onClick={() => onSelectHoliday?.(upcomingHoliday)}
      className="group surface-card w-full text-left rounded-2xl p-4 transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 border border-teal-200/60 dark:border-teal-900/60 focus:outline-none focus:ring-2 focus:ring-teal-400"
    >
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <span className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-[0.16em] text-teal-600 dark:text-teal-400">
          <Sparkles size={13} className="animate-pulse" />
          <span>{t('stats.nextHoliday')}</span>
        </span>
        <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
          upcomingHoliday.diffDays === 0
            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 animate-pulse'
            : 'bg-teal-100/90 text-teal-800 dark:bg-teal-950 dark:text-teal-300'
        }`}>
          {countdownText}
        </span>
      </div>

      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <h4 className="text-base font-bold text-slate-900 dark:text-white truncate group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
            {getHolidayDisplayName(upcomingHoliday, language)}
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
            <span className="truncate">{getHolidayCountryLabel(upcomingHoliday, language)}</span>
            <span>•</span>
            <span className="inline-flex items-center gap-1">
              <Calendar size={11} />
              <span>{formattedDate}</span>
            </span>
          </p>
        </div>
        <ArrowRight size={16} className="text-teal-600 dark:text-teal-400 opacity-0 group-hover:opacity-100 transition-all group-hover:translate-x-1 shrink-0" />
      </div>
    </button>
  );
};

export default React.memo(UpcomingHolidayWidget);
