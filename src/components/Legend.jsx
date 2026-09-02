import React, { useEffect, useState } from 'react';
import { ChevronDown, ChevronUp, Info } from 'lucide-react';
import { useTranslation } from '../hooks/useI18n';
import { HOLIDAY_TYPES, HOLIDAY_TYPE_COLORS, HOLIDAY_TYPE_LABEL_KEYS } from '../utils/holidayColors';

/**
 * The legend is generated from the same type→colour map the calendar dots
 * use, so a swatch here always means the same thing as a dot over there.
 */
const Legend = ({ typeCounts = null }) => {
  const [isExpanded, setIsExpanded] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth >= 1024;
  });
  const { t } = useTranslation();

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsExpanded(true);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="surface-card rounded-[24px]">
      <button
        type="button"
        className="w-full flex items-center justify-between p-4 sm:p-5 text-left focus-ring"
        onClick={() => setIsExpanded(!isExpanded)}
        aria-expanded={isExpanded}
      >
        <div className="flex items-center space-x-2">
          <Info size={20} className="text-slate-600 dark:text-slate-400" />
          <h3 className="text-base font-semibold text-slate-900 dark:text-white sm:text-lg">
            {t('legend.title')}
          </h3>
        </div>
        <div className="flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 p-1.5 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-700 dark:hover:text-slate-200 transition-colors">
          {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </div>
      </button>

      {isExpanded && (
        <div className="px-4 pb-4 sm:px-5 sm:pb-5">
          <ul className="space-y-2 text-sm">
            {HOLIDAY_TYPES.map(type => {
              const count = typeCounts?.[type] ?? null;

              return (
                <li
                  key={type}
                  className="flex items-center gap-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 px-3 py-2"
                >
                  <span
                    className="h-3 w-3 shrink-0 rounded-full"
                    style={{ backgroundColor: HOLIDAY_TYPE_COLORS[type] }}
                    aria-hidden="true"
                  />
                  <span className="flex-1 text-slate-700 dark:text-slate-200">
                    {t(HOLIDAY_TYPE_LABEL_KEYS[type])}
                  </span>
                  {count !== null && (
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums ${
                      count > 0
                        ? 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 ring-1 ring-slate-200 dark:ring-slate-700'
                        : 'text-slate-400 dark:text-slate-600'
                    }`}>
                      {count}
                    </span>
                  )}
                </li>
              );
            })}
          </ul>

          <div className="soft-divider mt-4 border-t pt-3">
            <p className="text-xs leading-6 text-slate-500 dark:text-slate-400">
              {t('legend.note')}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default React.memo(Legend);
