// 国际化 React Hook
import { useState, useEffect, useCallback } from 'react';
import {
  getCurrentLanguage,
  updateCurrentLanguage,
  detectUserLanguage,
  getSupportedLanguages,
  getLanguageDisplayName
} from '../services/i18nService';
import { t, getTranslations, loadLanguage } from '../locales/translations';
import type { TranslationValue } from '../locales/translations';

// `t` answers with whatever the key holds: a string for most keys, an array
// for lists such as weekday names and the FAQ entries.

type LanguageListener = (language: string) => void;

// 全局语言状态：翻译包按需加载，加载完成后再通知订阅者重新渲染
let globalLanguage = getCurrentLanguage();
const listeners = new Set<LanguageListener>();

function notifyLanguageChange(newLanguage: string): void {
  globalLanguage = newLanguage;
  listeners.forEach(listener => listener(newLanguage));
}

/**
 * 切换语言：先把语言包取回来，再切换，避免界面闪一帧英文。
 */
async function applyLanguage(newLanguage: string): Promise<boolean> {
  if (!updateCurrentLanguage(newLanguage)) {
    return false;
  }

  await loadLanguage(newLanguage);
  notifyLanguageChange(newLanguage);
  return true;
}

// 首屏：如果记住的语言不是英语，异步补上对应语言包
if (globalLanguage !== 'en') {
  loadLanguage(globalLanguage).then(() => notifyLanguageChange(globalLanguage));
}

function useLanguageState(): string {
  const [language, setLanguage] = useState(globalLanguage);

  useEffect(() => {
    const handleLanguageChange: LanguageListener = (newLanguage) => setLanguage(newLanguage);

    listeners.add(handleLanguageChange);
    // 订阅期间语言可能已经变过（例如语言包刚加载完）
    if (globalLanguage !== language) {
      setLanguage(globalLanguage);
    }

    return () => {
      listeners.delete(handleLanguageChange);
    };
  }, [language]);

  return language;
}

// 主要的国际化 Hook
export function useI18n() {
  const language = useLanguageState();
  const [isLoading, setIsLoading] = useState(false);

  const translate = useCallback(
    (key: string, params: Record<string, string | number> = {}): TranslationValue => t(key, params, language),
    [language]
  );

  const changeLanguage = useCallback(async (newLanguage: string) => {
    if (newLanguage === globalLanguage) return;

    setIsLoading(true);
    try {
      await applyLanguage(newLanguage);
    } catch (error) {
      console.error('Error changing language:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const detectLanguage = useCallback(async (countryCode: string | null = null) => {
    setIsLoading(true);
    try {
      const detectedLanguage = await detectUserLanguage(countryCode);
      if (detectedLanguage && detectedLanguage !== globalLanguage) {
        await applyLanguage(detectedLanguage);
      }
      return detectedLanguage;
    } catch (error) {
      console.error('Error detecting language:', error);
      return globalLanguage;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    language,
    isLoading,
    translate,
    changeLanguage,
    detectLanguage,
    translations: getTranslations(language),
    supportedLanguages: getSupportedLanguages(),
    getLanguageDisplayName
  };
}

// 简化的翻译 Hook（只用于翻译，不管理状态）
export function useTranslation() {
  const language = useLanguageState();
  const translate = useCallback(
    (key: string, params: Record<string, string | number> = {}): TranslationValue =>
      t(key, params, language),
    [language]
  );

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

  const handleLanguageSelect = useCallback(async (selectedLanguage: string) => {
    await changeLanguage(selectedLanguage);
    setIsOpen(false);
  }, [changeLanguage]);

  const toggleSelector = useCallback(() => setIsOpen(previous => !previous), []);
  const closeSelector = useCallback(() => setIsOpen(false), []);

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
