import React, { useEffect } from 'react';
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

  return (
    <div className="fixed inset-0 bg-black/55 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4" onClick={onClose}>
      <div className="bg-white rounded-t-3xl sm:rounded-2xl max-w-2xl w-full max-h-[92dvh] sm:max-h-[90vh] overflow-y-auto shadow-xl" onClick={(event) => event.stopPropagation()}>
        <div className="sm:hidden flex justify-center pt-2">
          <div className="h-1.5 w-12 rounded-full bg-gray-300" aria-hidden="true" />
        </div>
        {/* Header */}
        <div className="sticky top-0 bg-white flex items-center justify-between px-4 py-3 sm:p-6 border-b border-gray-200">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 flex items-center space-x-2 pr-3">
            <Globe className="" style={{color: '#ff8c00'}} size={24} />
            <span>{t('about.title')}</span>
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-full hover:bg-gray-100"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6">
          <div className="text-gray-700 space-y-4">
            <p className="text-sm sm:text-base leading-relaxed">
              {t('about.description')}
            </p>
            
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">
                {t('about.howToUse')}
              </h3>
              <ul className="list-disc list-inside space-y-2 ml-2 sm:ml-4 text-sm leading-relaxed">
                {t('about.usage').map((instruction, index) => (
                  <li key={index} className="leading-relaxed">{instruction}</li>
                ))}
              </ul>
            </div>
            
            <div className="pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-500">
                {t('legend.note')}
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end p-4 sm:p-6 border-t border-gray-200 bg-gray-50">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2.5 text-white rounded-xl transition-colors duration-200 font-medium" style={{backgroundColor: '#ff8c00'}} onMouseEnter={(e) => e.target.style.backgroundColor = '#e67e00'} onMouseLeave={(e) => e.target.style.backgroundColor = '#ff8c00'}
          >
            {t('common.close')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AboutModal;