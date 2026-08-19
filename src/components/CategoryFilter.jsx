import React from 'react';
import { useTranslation } from '../hooks/useI18n';
import { CATEGORIES } from '../utils/categoryUtils';

const CategoryFilter = ({ selectedCategory = 'all', onCategoryChange }) => {
  const { t } = useTranslation();

  return (
    <div
      className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none"
      role="radiogroup"
      aria-label={t('categoryFilter.all')}
    >
      {CATEGORIES.map((cat) => {
        const isSelected = selectedCategory === cat.id;
        const Icon = cat.icon;
        return (
          <button
            key={cat.id}
            type="button"
            role="radio"
            aria-checked={isSelected}
            onClick={() => onCategoryChange(cat.id)}
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs sm:text-sm font-medium transition-all whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-teal-400 ${
              isSelected
                ? 'bg-teal-600 text-white shadow-sm ring-1 ring-teal-700 dark:bg-teal-500'
                : 'bg-white/80 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700/80 hover:bg-white dark:hover:bg-slate-800'
            }`}
          >
            <Icon size={14} className={isSelected ? 'text-teal-100' : 'text-slate-400 dark:text-slate-400'} />
            <span>{t(cat.labelKey)}</span>
          </button>
        );
      })}
    </div>
  );
};

export default React.memo(CategoryFilter);
