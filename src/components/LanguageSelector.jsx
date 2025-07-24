// 语言选择器组件
import React, { useRef, useEffect } from 'react';
import { Globe, ChevronDown, Check } from 'lucide-react';
import { useLanguageSelector, useTranslation } from '../hooks/useI18n';

const LanguageSelector = () => {
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
    <div className="relative" ref={dropdownRef}>
      {/* 语言选择按钮 */}
      <button
        onClick={toggleSelector}
        disabled={isLoading}
        className="flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors duration-200" style={{backgroundColor: '#fff5e6', color: '#cc7000'}} onMouseEnter={(e) => e.target.style.backgroundColor = '#ffe6cc'} onMouseLeave={(e) => e.target.style.backgroundColor = '#fff5e6'}
        aria-label={t('language.selector')}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <Globe size={18} />
        <span className="hidden sm:inline text-sm">
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
        <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-[9999]">
          <div className="px-3 py-2 text-xs font-medium text-gray-500 border-b border-gray-100">
            {t('language.change')}
          </div>
          
          <div className="max-h-64 overflow-y-auto" role="listbox">
            {supportedLanguages.map(({ code, name }) => (
              <button
                key={code}
                onClick={() => handleLanguageSelect(code)}
                className={`w-full flex items-center justify-between px-3 py-2 text-sm transition-colors duration-150 ${
                  currentLanguage === code 
                    ? '' : 'hover:bg-gray-50'
                }`} style={code === currentLanguage ? {backgroundColor: '#fff5e6', color: '#cc7000'} : {color: '#374151'}} onMouseEnter={(e) => {if (code !== currentLanguage) {e.target.style.backgroundColor = '#f9fafb'}}} onMouseLeave={(e) => {if (code !== currentLanguage) {e.target.style.backgroundColor = 'transparent'}}}
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
                  <Check size={16} className="text-blue-600" />
                )}
              </button>
            ))}
          </div>
          
          <div className="px-3 py-2 text-xs text-gray-400 border-t border-gray-100 mt-2">
            {t('language.current', { language: getLanguageDisplayName(currentLanguage) })}
          </div>
        </div>
      )}
    </div>
  );
};

export default LanguageSelector;