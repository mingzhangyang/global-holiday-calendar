import React, { useMemo } from 'react';
import { PieChart, Landmark, Palette, Compass } from 'lucide-react';
import { useTranslation } from '../hooks/useI18n';
import { matchesCategory } from '../utils/categoryUtils';

const HolidayBreakdownWidget = ({
  monthHolidays = {},
  selectedCategory = 'all',
  onSelectCategory
}) => {
  const { t } = useTranslation();

  const { total, publicCount, culturalCount, astronomicalCount } = useMemo(() => {
    const all = [];
    const seen = new Set();

    Object.values(monthHolidays).forEach(list => {
      (list || []).forEach(h => {
        const key = `${h.date}-${h.name.toLowerCase().trim()}`;
        if (!seen.has(key)) {
          seen.add(key);
          all.push(h);
        }
      });
    });

    let pub = 0;
    let cult = 0;
    let astro = 0;

    all.forEach(h => {
      if (matchesCategory(h, 'public')) pub++;
      else if (matchesCategory(h, 'astronomical')) astro++;
      else if (matchesCategory(h, 'cultural')) cult++;
      else pub++; // default to public if uncategorized
    });

    return {
      total: all.length,
      publicCount: pub,
      culturalCount: cult,
      astronomicalCount: astro
    };
  }, [monthHolidays]);

  const publicPercent = total > 0 ? Math.round((publicCount / total) * 100) : 0;
  const culturalPercent = total > 0 ? Math.round((culturalCount / total) * 100) : 0;
  const astroPercent = total > 0 ? 100 - publicPercent - culturalPercent : 0;

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
        <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          {t('countryFilter.showingAll')}
        </div>
      </div>
    );
  }

  return (
    <div className="surface-card rounded-2xl p-4 flex flex-col justify-between transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 border border-fuchsia-200/60 dark:border-fuchsia-900/60">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <span className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-[0.16em] text-fuchsia-600 dark:text-fuchsia-400">
          <PieChart size={13} aria-hidden="true" />
          <span>{t('stats.holidayDistribution')}</span>
        </span>
        <span className="rounded-full bg-fuchsia-100/90 dark:bg-fuchsia-950 dark:text-fuchsia-300 px-2 py-0.5 text-[11px] font-bold text-fuchsia-800">
          {t('stats.totalInMonth', { count: total })}
        </span>
      </div>

      {/* Visual Proportional Distribution Bar */}
      <div className="my-2">
        <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden flex" role="progressbar" aria-valuenow={100} aria-valuemin={0} aria-valuemax={100}>
          {publicCount > 0 && (
            <div
              style={{ width: `${publicPercent}%` }}
              className="bg-teal-500 transition-all duration-500"
              title={`${t('stats.publicCount', { count: publicCount })} (${publicPercent}%)`}
            />
          )}
          {culturalCount > 0 && (
            <div
              style={{ width: `${culturalPercent}%` }}
              className="bg-fuchsia-500 transition-all duration-500"
              title={`${t('stats.culturalCount', { count: culturalCount })} (${culturalPercent}%)`}
            />
          )}
          {astronomicalCount > 0 && (
            <div
              style={{ width: `${Math.max(0, astroPercent)}%` }}
              className="bg-cyan-500 transition-all duration-500"
              title={`${t('stats.solarCount', { count: astronomicalCount })} (${astroPercent}%)`}
            />
          )}
        </div>
      </div>

      {/* Category Pills Breakdown */}
      <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
        <button
          type="button"
          onClick={() => onSelectCategory && onSelectCategory(selectedCategory === 'public' ? 'all' : 'public')}
          className={`inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-[11px] font-medium transition-all ${
            selectedCategory === 'public'
              ? 'bg-teal-600 text-white font-semibold shadow-sm'
              : 'bg-teal-50/80 dark:bg-teal-950/40 text-teal-800 dark:text-teal-300 hover:bg-teal-100/80 dark:hover:bg-teal-900/50'
          }`}
          title={t('categoryFilter.public')}
        >
          <Landmark size={11} aria-hidden="true" />
          <span>{t('stats.publicCount', { count: publicCount })}</span>
        </button>

        <button
          type="button"
          onClick={() => onSelectCategory && onSelectCategory(selectedCategory === 'cultural' ? 'all' : 'cultural')}
          className={`inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-[11px] font-medium transition-all ${
            selectedCategory === 'cultural'
              ? 'bg-fuchsia-600 text-white font-semibold shadow-sm'
              : 'bg-fuchsia-50/80 dark:bg-fuchsia-950/40 text-fuchsia-800 dark:text-fuchsia-300 hover:bg-fuchsia-100/80 dark:hover:bg-fuchsia-900/50'
          }`}
          title={t('categoryFilter.cultural')}
        >
          <Palette size={11} aria-hidden="true" />
          <span>{t('stats.culturalCount', { count: culturalCount })}</span>
        </button>

        {astronomicalCount > 0 && (
          <button
            type="button"
            onClick={() => onSelectCategory && onSelectCategory(selectedCategory === 'astronomical' ? 'all' : 'astronomical')}
            className={`inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-[11px] font-medium transition-all ${
              selectedCategory === 'astronomical'
                ? 'bg-cyan-600 text-white font-semibold shadow-sm'
                : 'bg-cyan-50/80 dark:bg-cyan-950/40 text-cyan-800 dark:text-cyan-300 hover:bg-cyan-100/80 dark:hover:bg-cyan-900/50'
            }`}
            title={t('categoryFilter.astronomical')}
          >
            <Compass size={11} aria-hidden="true" />
            <span>{t('stats.solarCount', { count: astronomicalCount })}</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default React.memo(HolidayBreakdownWidget);
