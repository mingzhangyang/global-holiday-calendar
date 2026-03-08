// 语言选择器组件
import React, { useRef, useEffect } from 'react';
import { Globe, ChevronDown, Check } from 'lucide-react';
import { useLanguageSelector, useTranslation } from '../hooks/useI18n';

const LanguageSelector = ({ fullWidth = false }) => {
  const {
    currentLanguage,
    isOpen,
    isLoading,
    supportedLanguages,
    getLanguageDisplayName,
    handleLanguageSelect,
    toggleSelector,
    closeSelector
  } = useLanguageSelector();
  
  const { t } = useTranslation();
  const dropdownRef = useRef(null);

  // 点击外部关闭下拉菜单
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        closeSelector();
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isOpen, closeSelector]);

  // ESC键关闭下拉菜单
  useEffect(() => {
    function handleEscapeKey(event) {
      if (event.key === 'Escape' && isOpen) {
        closeSelector();
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscapeKey);
      return () => {
        document.removeEventListener('keydown', handleEscapeKey);
      };
    }
  }, [isOpen, closeSelector]);

  return (
    <div className={`relative ${fullWidth ? 'w-full' : ''}`} ref={dropdownRef}>
      {/* 语言选择按钮 */}
      <button
        type="button"
        onClick={toggleSelector}
        disabled={isLoading}
        className={`focus-ring accent-button-soft flex items-center space-x-2 rounded-2xl px-3 py-2.5 text-sm font-medium ${fullWidth ? 'w-full justify-between' : ''}`}
        aria-label={t('language.selector')}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <Globe size={18} />
        <span className={`${fullWidth ? 'inline text-sm flex-1 text-left' : 'hidden sm:inline text-sm'}`}>
          {getLanguageDisplayName(currentLanguage)}
        </span>
        <ChevronDown 
          size={16} 
          className={`transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`} 
        />
        {isLoading && (
          <div className="animate-spin rounded-full h-4 w-4 border border-white border-t-transparent" />
        )}
      </button>

      {/* 下拉菜单 */}
      {isOpen && (
        <div className={`surface-card-strong absolute top-full mt-2 overflow-hidden rounded-2xl py-2 z-[9999] ${fullWidth ? 'left-0 right-0 w-full' : 'right-0 w-56'}`}>
          <div className="border-b border-slate-200/80 px-3 py-2 text-xs font-medium uppercase tracking-[0.16em] text-slate-500">
            {t('language.change')}
          </div>
          
          <div className="max-h-64 overflow-y-auto" role="listbox">
            {supportedLanguages.map(({ code, name }) => (
              <button
                type="button"
                key={code}
                onClick={() => handleLanguageSelect(code)}
                className={`w-full flex items-center justify-between px-3 py-2.5 text-sm transition-colors duration-150 ${
                  currentLanguage === code 
                    ? 'bg-teal-50/80 text-teal-700' : 'text-slate-700 hover:bg-slate-50'
                }`}
                role="option"
                aria-selected={currentLanguage === code}
              >
                <span className="flex items-center space-x-2">
                  <span>{name}</span>
                  {code.includes('-') && (
                    <span className="text-xs text-gray-400 uppercase">
                      {code.split('-')[1]}
                    </span>
                  )}
                </span>
                
                {currentLanguage === code && (
                  <Check size={16} className="text-teal-600" />
                )}
              </button>
            ))}
          </div>
          
          <div className="mt-2 border-t border-slate-200/80 px-3 py-2 text-xs text-slate-400">
            {t('language.current', { language: getLanguageDisplayName(currentLanguage) })}
          </div>
        </div>
      )}
    </div>
  );
};

export default LanguageSelector;