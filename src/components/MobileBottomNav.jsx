import React from 'react';
import { Calendar, List, Search, Compass } from 'lucide-react';
import { useTranslation } from '../hooks/useI18n';

const MobileBottomNav = ({ viewMode, onViewModeChange, onOpenSearch, onJumpToday }) => {
  const { t } = useTranslation();

  return (
    <div className="fixed bottom-0 inset-x-0 z-[9990] p-2.5 sm:hidden pointer-events-none">
      <div className="surface-card-strong pointer-events-auto mx-auto max-w-sm rounded-full px-3 py-1.5 shadow-2xl border border-slate-200/90 dark:border-slate-800 flex items-center justify-around">
        {/* Calendar View Button */}
        <button
          type="button"
          onClick={() => onViewModeChange('calendar')}
          className={`flex flex-col items-center gap-0.5 rounded-2xl px-3 py-1 text-[10px] font-bold transition-all ${
            viewMode === 'calendar'
              ? 'text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/60'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
          aria-label={t('mobileNav.calendar')}
        >
          <Calendar size={18} />
          <span>{t('mobileNav.calendar')}</span>
        </button>

        {/* List View Button */}
        <button
          type="button"
          onClick={() => onViewModeChange('list')}
          className={`flex flex-col items-center gap-0.5 rounded-2xl px-3 py-1 text-[10px] font-bold transition-all ${
            viewMode === 'list'
              ? 'text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/60'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
          aria-label={t('mobileNav.list')}
        >
          <List size={18} />
          <span>{t('mobileNav.list')}</span>
        </button>

        {/* Search Button */}
        <button
          type="button"
          onClick={onOpenSearch}
          className="flex flex-col items-center gap-0.5 rounded-2xl px-3 py-1 text-[10px] font-bold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all"
          aria-label={t('mobileNav.search')}
        >
          <Search size={18} />
          <span>{t('mobileNav.search')}</span>
        </button>

        {/* Today Button */}
        <button
          type="button"
          onClick={onJumpToday}
          className="flex flex-col items-center gap-0.5 rounded-2xl px-3 py-1 text-[10px] font-bold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all"
          aria-label={t('mobileNav.today')}
        >
          <Compass size={18} />
          <span>{t('mobileNav.today')}</span>
        </button>
      </div>
    </div>
  );
};

export default React.memo(MobileBottomNav);
