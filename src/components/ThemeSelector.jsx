import React, { useState, useRef, useEffect } from 'react';
import { Sun, Moon, Monitor, Check } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';
import { useTranslation } from '../hooks/useI18n';

const ThemeSelector = ({ fullWidth = false }) => {
  const { theme, setTheme, isDarkMode } = useTheme();
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  useEffect(() => {
    function handleEscapeKey(event) {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscapeKey);
      return () => document.removeEventListener('keydown', handleEscapeKey);
    }
  }, [isOpen]);

  const options = [
    { value: 'light', label: t('theme.light'), icon: Sun },
    { value: 'dark', label: t('theme.dark'), icon: Moon },
    { value: 'system', label: t('theme.system'), icon: Monitor }
  ];

  const CurrentIcon = theme === 'system' ? Monitor : isDarkMode ? Moon : Sun;

  return (
    <div className={`relative ${fullWidth ? 'w-full' : ''}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`focus-ring accent-button-soft flex items-center space-x-2 rounded-2xl px-3 py-2.5 text-sm font-medium ${fullWidth ? 'w-full justify-between' : ''}`}
        aria-label={t('theme.title')}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <CurrentIcon size={18} />
        <span className={`${fullWidth ? 'inline text-sm flex-1 text-left' : 'hidden md:inline text-sm'}`}>
          {t(`theme.${theme}`)}
        </span>
      </button>

      {isOpen && (
        <div className={`surface-card-strong absolute top-full mt-2 overflow-hidden rounded-2xl py-2 z-[9999] shadow-xl ${fullWidth ? 'left-0 right-0 w-full' : 'right-0 w-44'}`}>
          <div className="border-b border-slate-200/80 dark:border-slate-800 px-3 py-2 text-xs font-medium uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
            {t('theme.title')}
          </div>

          <div role="listbox">
            {options.map((opt) => {
              const Icon = opt.icon;
              return (
                <button
                  type="button"
                  key={opt.value}
                  onClick={() => {
                    setTheme(opt.value);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 text-sm transition-colors duration-150 ${
                    theme === opt.value
                      ? 'bg-teal-50/80 text-teal-700 dark:bg-teal-950/60 dark:text-teal-300 font-semibold'
                      : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                  }`}
                  role="option"
                  aria-selected={theme === opt.value}
                >
                  <span className="flex items-center space-x-2">
                    <Icon size={16} />
                    <span>{opt.label}</span>
                  </span>

                  {theme === opt.value && (
                    <Check size={16} className="text-teal-600 dark:text-teal-400" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default React.memo(ThemeSelector);
