import React from 'react';
import { MapPin } from 'lucide-react';
import { useTranslation } from '../hooks/useI18n';
import { getHolidayColor } from '../utils/holidayColors';
import { getHolidayCountryLabel, getHolidayDisplayName } from '../utils/holidayDisplay';

const DayHoverPopover = ({ dayInfo, targetRect, locale, language = 'en' }) => {
  const { t } = useTranslation();

  if (!dayInfo || !dayInfo.holidays || dayInfo.holidays.length === 0 || !targetRect) {
    return null;
  }

  const formattedDate = dayInfo.date.toLocaleDateString(locale, {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  });

  // Calculate smart position centered above or below the target rect
  const top = targetRect.top > 220 ? targetRect.top - 8 : targetRect.bottom + 8;
  const isAbove = targetRect.top > 220;
  const left = Math.max(16, Math.min(window.innerWidth - 276, targetRect.left + targetRect.width / 2 - 130));

  return (
    <div
      className={`fixed z-[99999] pointer-events-none w-64 surface-card-strong rounded-2xl p-3 shadow-2xl animate-fade-in-up border border-slate-200/90 dark:border-slate-700/90 ${
        isAbove ? '-translate-y-full' : ''
      }`}
      style={{ top: `${top}px`, left: `${left}px` }}
      role="tooltip"
    >
      <div className="border-b border-slate-100 dark:border-slate-800 pb-1.5 mb-2 flex items-center justify-between">
        <span className="text-xs font-bold text-slate-900 dark:text-white">
          {formattedDate}
        </span>
        <span className="text-[10px] font-semibold text-teal-600 dark:text-teal-400">
          {t(dayInfo.holidays.length === 1 ? 'listView.holidayCount' : 'listView.holidayCountPlural', { count: dayInfo.holidays.length })}
        </span>
      </div>

      <div className="space-y-2 max-h-48 overflow-hidden">
        {dayInfo.holidays.slice(0, 4).map((holiday, idx) => (
          <div key={idx} className="flex items-start gap-2">
            <span
              className="h-2 w-2 rounded-full mt-1 shrink-0"
              style={{ backgroundColor: getHolidayColor(holiday) }}
            />
            <div className="min-w-0 flex-1">
              <div className="text-xs font-semibold text-slate-800 dark:text-slate-100 truncate">
                {getHolidayDisplayName(holiday, language)}
              </div>
              <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
                <MapPin size={10} className="shrink-0" />
                <span className="truncate">{getHolidayCountryLabel(holiday, language)}</span>
              </div>
            </div>
          </div>
        ))}
        {dayInfo.holidays.length > 4 && (
          <div className="text-[11px] text-slate-400 text-center font-medium">
            {t('common.moreCount', { count: dayInfo.holidays.length - 4 })}
          </div>
        )}
      </div>
    </div>
  );
};

export default React.memo(DayHoverPopover);
