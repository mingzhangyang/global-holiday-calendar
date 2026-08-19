import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, Info } from 'lucide-react';
import { useTranslation } from '../hooks/useI18n';

const Legend = () => {
  const [isExpanded, setIsExpanded] = useState(() => {
    if (typeof window === 'undefined') {
      return false;
    }
    return window.innerWidth >= 1024;
  });
  const { t } = useTranslation();

  useEffect(() => {
    const handleResize = () => {
      // Auto-expand on desktop, but be careful not to override user preference 
      // if we only want this on initial load.
      // Usually, it's fine to sync it if window crosses the breakpoint.
      if (window.innerWidth >= 1024) {
        setIsExpanded(true);
      } else {
        // Option 1: auto-collapse on resize to mobile
        // Option 2: Do not auto-collapse if they explicitly opened it
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
          <div className="space-y-2 text-sm">
            <div className="flex items-center space-x-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 px-3 py-2">
              <div className="h-3 w-3 rounded-full shrink-0" style={{backgroundColor: '#14b8a6'}} />
              <span className="text-slate-700 dark:text-slate-200">{t('legend.nationalHoliday')}</span>
            </div>
            <div className="flex items-center space-x-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 px-3 py-2">
              <div className="h-3 w-3 rounded-full bg-cyan-500 shrink-0" />
              <span className="text-slate-700 dark:text-slate-200">{t('legend.culturalFestival')}</span>
            </div>
            <div className="flex items-center space-x-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 px-3 py-2">
              <div className="h-3 w-3 rounded-full shrink-0" style={{backgroundColor: 'rgb(243, 74, 217)'}} />
              <span className="text-slate-700 dark:text-slate-200">{t('legend.religiousObservance')}</span>
            </div>
            <div className="flex items-center space-x-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 px-3 py-2">
              <div className="h-3 w-3 rounded-full bg-orange-500 shrink-0" />
              <span className="text-slate-700 dark:text-slate-200">{t('legend.traditionalCelebration')}</span>
            </div>
            <div className="flex items-center space-x-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 px-3 py-2">
              <div className="h-3 w-3 rounded-full bg-fuchsia-500 shrink-0" />
              <span className="text-slate-700 dark:text-slate-200">{t('legend.internationalDay')}</span>
            </div>
          </div>

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

export default Legend;