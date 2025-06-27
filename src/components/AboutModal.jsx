import React from 'react';
import { X, Globe } from 'lucide-react';
import { useTranslation } from '../hooks/useI18n';

const AboutModal = ({ isOpen, onClose }) => {
  const { t } = useTranslation();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center space-x-2">
            <Globe className="" style={{color: '#ff8c00'}} size={24} />
            <span>{t('about.title')}</span>
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="text-gray-700 space-y-4">
            <p className="text-base leading-relaxed">
              {t('about.description')}
            </p>
            
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">
                {t('about.howToUse')}
              </h3>
              <ul className="list-disc list-inside space-y-2 ml-4 text-sm">
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
        <div className="flex justify-end p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-white rounded-lg transition-colors duration-200 font-medium" style={{backgroundColor: '#ff8c00'}} onMouseEnter={(e) => e.target.style.backgroundColor = '#e67e00'} onMouseLeave={(e) => e.target.style.backgroundColor = '#ff8c00'}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default AboutModal;