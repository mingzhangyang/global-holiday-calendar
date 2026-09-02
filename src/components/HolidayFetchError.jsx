import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { useTranslation } from '../hooks/useI18n';

/**
 * What both month views show when the holiday request failed outright.
 */
const HolidayFetchError = ({ onRetry }) => {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-center gap-3 px-4 py-10 text-center" role="alert">
      <AlertCircle className="h-10 w-10 text-amber-500" aria-hidden="true" />
      <h3 className="text-base font-semibold text-slate-900 dark:text-white">
        {t('errors.holidaysUnavailable')}
      </h3>
      <p className="max-w-sm text-sm text-slate-600 dark:text-slate-400">
        {t('errors.holidaysUnavailableDescription')}
      </p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="accent-button focus-ring inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-medium"
        >
          <RefreshCw size={14} aria-hidden="true" />
          <span>{t('errors.retry')}</span>
        </button>
      )}
    </div>
  );
};

export default HolidayFetchError;
