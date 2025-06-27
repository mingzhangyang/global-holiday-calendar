// 国际化 React Hook
import { useState, useEffect, useCallback } from 'react';
import { 
  getCurrentLanguage, 
  updateCurrentLanguage, 
  detectUserLanguage,
  getSupportedLanguages,
  getLanguageDisplayName
} from '../services/i18nService';
import { t, getTranslations } from '../locales/translations';

// 创建一个全局状态来管理语言变化
let globalLanguage = getCurrentLanguage();
const listeners = new Set();

// 通知所有监听器语言变化
function notifyLanguageChange(newLanguage) {
  globalLanguage = newLanguage;
  listeners.forEach(listener => listener(newLanguage));
}

// 主要的国际化 Hook
export function useI18n() {
  const [language, setLanguage] = useState(globalLanguage);
  const [isLoading, setIsLoading] = useState(false);

  // 监听语言变化
  useEffect(() => {
    const handleLanguageChange = (newLanguage) => {
      setLanguage(newLanguage);
    };

    listeners.add(handleLanguageChange);
    return () => {
      listeners.delete(handleLanguageChange);
    };
  }, []);

  // 翻译函数
  const translate = useCallback((key, params = {}) => {
    return t(key, params, language);
  }, [language]);

  // 更改语言
  const changeLanguage = useCallback(async (newLanguage) => {
    if (newLanguage === language) return;
    
    setIsLoading(true);
    try {
      const success = updateCurrentLanguage(newLanguage);
      if (success) {
        notifyLanguageChange(newLanguage);
      }
    } catch (error) {
      console.error('Error changing language:', error);
    } finally {
      setIsLoading(false);
    }
  }, [language]);

  // 自动检测语言
  const detectLanguage = useCallback(async (countryCode = null) => {
    setIsLoading(true);
    try {
      const detectedLanguage = await detectUserLanguage(countryCode);
      if (detectedLanguage && detectedLanguage !== language) {
        const success = updateCurrentLanguage(detectedLanguage);
        if (success) {
          notifyLanguageChange(detectedLanguage);
        }
      }
      return detectedLanguage;
    } catch (error) {
      console.error('Error detecting language:', error);
      return language;
    } finally {
      setIsLoading(false);
    }
  }, [language]);

  // 获取当前语言的所有翻译
  const translations = getTranslations(language);

  return {
    language,
    isLoading,
    translate,
    changeLanguage,
    detectLanguage,
    translations,
    supportedLanguages: getSupportedLanguages(),
    getLanguageDisplayName
  };
}

// 简化的翻译 Hook（只用于翻译，不管理状态）
export function useTranslation() {
  const [language, setLanguage] = useState(globalLanguage);

  useEffect(() => {
    const handleLanguageChange = (newLanguage) => {
      setLanguage(newLanguage);
    };

    listeners.add(handleLanguageChange);
    return () => {
      listeners.delete(handleLanguageChange);
    };
  }, []);

  const translate = useCallback((key, params = {}) => {
    return t(key, params, language);
  }, [language]);

  return {
    t: translate,
    language,
    translations: getTranslations(language)
  };
}

// 语言选择器 Hook
export function useLanguageSelector() {
  const { language, changeLanguage, isLoading, supportedLanguages, getLanguageDisplayName } = useI18n();
  const [isOpen, setIsOpen] = useState(false);

  const handleLanguageSelect = useCallback(async (selectedLanguage) => {
    await changeLanguage(selectedLanguage);
    setIsOpen(false);
  }, [changeLanguage]);

  const toggleSelector = useCallback(() => {
    setIsOpen(prev => !prev);
  }, []);

  const closeSelector = useCallback(() => {
    setIsOpen(false);
  }, []);

  return {
    currentLanguage: language,
    isOpen,
    isLoading,
    supportedLanguages,
    getLanguageDisplayName,
    handleLanguageSelect,
    toggleSelector,
    closeSelector
  };
}