import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Globe } from 'lucide-react';
import { useTranslation } from '../hooks/useI18n';

const AboutModal = ({ isOpen, onClose }) => {
  const { t } = useTranslation();

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/55 p-0 backdrop-blur-sm sm:items-center sm:p-4" onClick={onClose}>
      <div className="surface-card-strong w-full max-w-2xl max-h-[92dvh] overflow-y-auto rounded-t-3xl sm:max-h-[90vh] sm:rounded-[28px]" onClick={(event) => event.stopPropagation()}>
        <div className="sm:hidden flex justify-center pt-2">
          <div className="h-1.5 w-12 rounded-full bg-slate-300 dark:bg-slate-700" aria-hidden="true" />
        </div>
        {/* Header */}
        <div className="sticky top-0 flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800 bg-white/85 dark:bg-slate-900/90 px-4 py-3 backdrop-blur-xl sm:p-6">
          <h2 className="flex items-center space-x-2 pr-3 text-lg font-semibold text-slate-900 dark:text-white sm:text-xl">
            <Globe className="text-teal-500 shrink-0" size={24} />
            <span>{t('about.title')}</span>
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="focus-ring rounded-full p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6">
          <div className="space-y-5 text-slate-700 dark:text-slate-300">
            <p className="text-sm sm:text-base leading-relaxed">
              {t('about.description')}
            </p>
            
            <div className="surface-card-muted rounded-2xl p-4">
              <h3 className="mb-2 font-semibold text-slate-900 dark:text-white">
                {t('about.howToUse')}
              </h3>
              <ul className="list-disc list-inside space-y-2 ml-2 sm:ml-4 text-sm leading-relaxed">
                {t('about.usage').map((instruction, index) => (
                  <li key={index} className="leading-relaxed">{instruction}</li>
                ))}
              </ul>
            </div>
            
            <div className="soft-divider border-t pt-4">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {t('legend.note')}
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end border-t border-slate-200/80 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/90 p-4 sm:p-6">
          <button
            type="button"
            onClick={onClose}
            className="accent-button focus-ring w-full rounded-2xl px-4 py-2.5 font-medium sm:w-auto"
          >
            {t('common.close')}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default AboutModal;