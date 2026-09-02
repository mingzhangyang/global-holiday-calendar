import React, { useMemo } from 'react';
import { PieChart, Landmark, Palette, Compass } from 'lucide-react';
import { useTranslation } from '../hooks/useI18n';
import { matchesCategory } from '../utils/categoryUtils';
import { HOLIDAY_TYPE_COLORS } from '../utils/holidayColors';

const SEGMENTS = [
  { id: 'public', color: HOLIDAY_TYPE_COLORS.public, icon: Landmark, countKey: 'stats.publicCount', labelKey: 'categoryFilter.public' },
  { id: 'cultural', color: HOLIDAY_TYPE_COLORS.cultural, icon: Palette, countKey: 'stats.culturalCount', labelKey: 'categoryFilter.cultural' },
  { id: 'astronomical', color: HOLIDAY_TYPE_COLORS.seasonal, icon: Compass, countKey: 'stats.solarCount', labelKey: 'categoryFilter.astronomical' }
];

/**
 * A proportion meter for the month. Segments carry the same colours as the
 * category chips below them, and every value is also written out — colour is
 * never the only carrier of meaning.
 */
const HolidayBreakdownWidget = ({ monthHolidays = {}, selectedCategory = 'all', onSelectCategory }) => {
  const { t } = useTranslation();

  const { total, counts } = useMemo(() => {
    const holidays = Object.values(monthHolidays).flat();
    const tally = { public: 0, cultural: 0, astronomical: 0 };

    holidays.forEach(holiday => {
      const segment = SEGMENTS.find(candidate => matchesCategory(holiday, candidate.id));
      tally[segment ? segment.id : 'public'] += 1;
    });

    return { total: holidays.length, counts: tally };
  }, [monthHolidays]);

  if (total === 0) {
    return (
      <div className="surface-card rounded-2xl p-4 flex flex-col justify-between border border-slate-200/70 dark:border-slate-800">
        <div className="flex items-center gap-1 text-xs font-bold uppercase tracking-[0.16em] text-fuchsia-600 dark:text-fuchsia-400 mb-1.5">
          <PieChart size={13} aria-hidden="true" />
          <span>{t('stats.holidayDistribution')}</span>
        </div>
        <div className="text-sm font-semibold text-slate-800 dark:text-slate-100">
          {t('stats.noDataThisMonth')}
        </div>
      </div>
    );
  }

  return (
    <div className="surface-card rounded-2xl p-4 flex flex-col justify-between transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 border border-fuchsia-200/60 dark:border-fuchsia-900/60">
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <span className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-[0.16em] text-fuchsia-600 dark:text-fuchsia-400">
          <PieChart size={13} aria-hidden="true" />
          <span>{t('stats.holidayDistribution')}</span>
        </span>
        <span className="rounded-full bg-fuchsia-100/90 dark:bg-fuchsia-950 dark:text-fuchsia-300 px-2 py-0.5 text-[11px] font-bold text-fuchsia-800">
          {t('stats.totalInMonth', { count: total })}
        </span>
      </div>

      {/* Proportion meter: 2px surface gaps keep adjacent segments readable. */}
      <div className="my-2 flex h-2 w-full gap-0.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
        {SEGMENTS.map(segment => {
          const count = counts[segment.id];
          if (count === 0) return null;

          return (
            <div
              key={segment.id}
              style={{ width: `${(count / total) * 100}%`, backgroundColor: segment.color }}
              className="rounded-full transition-all duration-500"
              title={`${t(segment.countKey, { count })} (${Math.round((count / total) * 100)}%)`}
            />
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
        {SEGMENTS.map(segment => {
          const count = counts[segment.id];
          if (count === 0 && segment.id === 'astronomical') return null;

          const Icon = segment.icon;
          const isSelected = selectedCategory === segment.id;

          return (
            <button
              key={segment.id}
              type="button"
              onClick={() => onSelectCategory?.(isSelected ? 'all' : segment.id)}
              aria-pressed={isSelected}
              className={`inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-[11px] font-medium transition-all ${
                isSelected
                  ? 'text-white font-semibold shadow-sm'
                  : 'bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
              style={isSelected ? { backgroundColor: segment.color } : undefined}
              title={t(segment.labelKey)}
            >
              <Icon
                size={11}
                aria-hidden="true"
                style={isSelected ? undefined : { color: segment.color }}
              />
              <span>{t(segment.countKey, { count })}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default React.memo(HolidayBreakdownWidget);
