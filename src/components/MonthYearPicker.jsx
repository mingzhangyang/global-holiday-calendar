import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { useTranslation } from '../hooks/useI18n';

const MIN_YEAR = 2020;
const MAX_YEAR = 2030;

const MonthYearPicker = ({ currentDate, onDateChange, align = 'center' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [pickerYear, setPickerYear] = useState(() => currentDate.getFullYear());
  const { t } = useTranslation();
  const dropdownRef = useRef(null);

  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();
  const monthNames = t('calendar.months');

  // Keep internal picker year in sync when currentDate changes from outside
  useEffect(() => {
    setPickerYear(currentDate.getFullYear());
  }, [currentDate]);

  // Click outside listener
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

  // ESC key listener
  useEffect(() => {
    function handleEscape(event) {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen]);

  const handleSelectMonth = (monthIndex) => {
    const newDate = new Date(pickerYear, monthIndex, 1);
    onDateChange(newDate);
    setIsOpen(false);
  };

  const handlePrevYear = (e) => {
    e.stopPropagation();
    if (pickerYear > MIN_YEAR) {
      setPickerYear(prev => prev - 1);
    }
  };

  const handleNextYear = (e) => {
    e.stopPropagation();
    if (pickerYear < MAX_YEAR) {
      setPickerYear(prev => prev + 1);
    }
  };

  const handleJumpToToday = (e) => {
    e.stopPropagation();
    const today = new Date();
    setPickerYear(today.getFullYear());
    onDateChange(today);
    setIsOpen(false);
  };

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="group inline-flex items-center gap-1.5 rounded-2xl px-2.5 py-1 text-lg font-bold text-white transition-all hover:bg-white/15 focus:outline-none focus:ring-2 focus:ring-white/40 sm:text-2xl"
        aria-label={`${monthNames[currentMonth]} ${currentYear} - Change month and year`}
        aria-expanded={isOpen}
      >
        <span className="truncate">{monthNames[currentMonth]} {currentYear}</span>
        <ChevronDown
          size={18}
          className={`opacity-80 transition-transform duration-200 group-hover:opacity-100 ${
            isOpen ? 'rotate-180' : ''
          }`}
          aria-hidden="true"
        />
      </button>

      {isOpen && (
        <div
          className={`surface-card-strong absolute top-full mt-2 w-72 sm:w-80 rounded-3xl p-4 z-[9999] shadow-2xl animate-fade-in-up ${
            align === 'center'
              ? 'left-1/2 -translate-x-1/2'
              : align === 'left'
              ? 'left-0'
              : 'right-0'
          }`}
          role="dialog"
          aria-modal="true"
        >
          {/* Year Navigator */}
          <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800 pb-3 mb-3">
            <button
              type="button"
              onClick={handlePrevYear}
              disabled={pickerYear <= MIN_YEAR}
              className="rounded-full p-1.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none"
              aria-label="Previous year"
            >
              <ChevronLeft size={18} />
            </button>

            <span className="text-base font-bold text-slate-900 dark:text-white">
              {pickerYear}
            </span>

            <button
              type="button"
              onClick={handleNextYear}
              disabled={pickerYear >= MAX_YEAR}
              className="rounded-full p-1.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none"
              aria-label="Next year"
            >
              <ChevronRight size={18} />
            </button>
          </div>

          {/* 12 Months Grid */}
          <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
            {monthNames.map((name, index) => {
              const isCurrentSelected = pickerYear === currentYear && index === currentMonth;
              const isCurrentActualMonth =
                pickerYear === new Date().getFullYear() && index === new Date().getMonth();

              return (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleSelectMonth(index)}
                  className={`relative rounded-xl px-2 py-2 text-xs sm:text-sm font-medium transition-all ${
                    isCurrentSelected
                      ? 'bg-teal-600 text-white shadow-md'
                      : isCurrentActualMonth
                      ? 'bg-teal-50 text-teal-800 dark:bg-teal-950/60 dark:text-teal-300 font-semibold ring-1 ring-teal-300 dark:ring-teal-700'
                      : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/80'
                  }`}
                >
                  {name.slice(0, 3)}
                </button>
              );
            })}
          </div>

          {/* Quick Jump Today Footer */}
          <div className="mt-3 pt-3 border-t border-slate-200/80 dark:border-slate-800 flex justify-between items-center">
            <button
              type="button"
              onClick={handleJumpToToday}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300"
            >
              <CalendarIcon size={14} />
              <span>{t('calendar.today')}</span>
            </button>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
            >
              {t('common.close')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default React.memo(MonthYearPicker);
