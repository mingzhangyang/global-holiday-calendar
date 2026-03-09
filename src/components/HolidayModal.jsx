import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Calendar, MapPin, Clock, Book, Info, ChevronDown } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { fetchHolidayInfo } from '../services/holidayApi';
import { useI18n, useTranslation } from '../hooks/useI18n';
import { getLocaleFromLanguage } from '../services/i18nService';

const HolidayModal = ({ date, holidays, onClose }) => {
  const [detailedInfo, setDetailedInfo] = useState({});
  const [loadingInfo, setLoadingInfo] = useState({});
  const [showScrollHint, setShowScrollHint] = useState(null);
  const { language } = useI18n();
  const { t } = useTranslation();



  // Auto-load detailed information from localStorage when modal opens
  useEffect(() => {
    holidays.forEach((holiday, index) => {
      const cacheKey = `holiday-info-${holiday.name}-${holiday.country}`;
      const languageCacheKey = `${cacheKey}-${language}`;
      const cachedData = localStorage.getItem(languageCacheKey);
      const cachedTimestamp = localStorage.getItem(`${languageCacheKey}-timestamp`);
      const isExpired = cachedTimestamp && (Date.now() - parseInt(cachedTimestamp)) > (7 * 24 * 60 * 60 * 1000); // 7 days
      
      if (cachedData && !isExpired) {
        setDetailedInfo(prev => ({ ...prev, [index]: cachedData }));
      }
    });
  }, [holidays, language]);

  // Close modal on escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  // Function to fetch detailed holiday information
  const fetchDetailedInfo = async (holiday, index) => {
    if (detailedInfo[index] || loadingInfo[index]) return;

    const cacheKey = `holiday-info-${holiday.name}-${holiday.country}`;
    const languageCacheKey = `${cacheKey}-${language}`;
    
    // Check localStorage first
    const cachedData = localStorage.getItem(languageCacheKey);
    const cachedTimestamp = localStorage.getItem(`${languageCacheKey}-timestamp`);
    const isExpired = cachedTimestamp && (Date.now() - parseInt(cachedTimestamp)) > (7 * 24 * 60 * 60 * 1000); // 7 days
    
    if (cachedData && !isExpired) {
      setDetailedInfo(prev => ({ ...prev, [index]: cachedData }));
      return;
    }

    setLoadingInfo(prev => ({ ...prev, [index]: true }));
    setShowScrollHint(null);
    
    try {
      const info = await fetchHolidayInfo(holiday.name, holiday.country, language);
      if (info) {
        setDetailedInfo(prev => ({ ...prev, [index]: info }));
        // Cache the data in localStorage with language key
        const languageCacheKey = `${cacheKey}-${language}`;
        localStorage.setItem(languageCacheKey, info);
        localStorage.setItem(`${languageCacheKey}-timestamp`, Date.now().toString());
        
        setShowScrollHint(index);
        setTimeout(() => {
          setShowScrollHint(null);
        }, 5000); // Hide the hint after 5 seconds
      }
    } catch (error) {
      console.error('Error fetching holiday info:', error);
    } finally {
      setLoadingInfo(prev => ({ ...prev, [index]: false }));
    }
  };

  const formatDate = (date) => {
    const locale = getLocaleFromLanguage(language);
    return date.toLocaleDateString(locale, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return createPortal(
    <div 
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/55 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div 
        className="surface-card-strong w-full max-w-2xl max-h-[92dvh] overflow-y-auto rounded-t-3xl sm:max-h-[90vh] sm:rounded-[28px]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="sticky top-0 flex items-start justify-between gap-3 border-b border-slate-200/80 bg-white/85 px-4 py-3 backdrop-blur-xl sm:items-center sm:p-4">
          <div className="flex items-start sm:items-center space-x-2 min-w-0">
            <Calendar className="text-teal-500" size={20} />
            <h2 className="text-base sm:text-lg font-semibold text-slate-900 leading-tight">
              {formatDate(date)}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="focus-ring rounded-full p-2 hover:bg-slate-100"
            aria-label={t('common.close')}
          >
            <X size={20} className="text-slate-500" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-4 sm:p-5 space-y-5 sm:space-y-6">
          {holidays.map((holiday, index) => (
            <div key={index} className="rounded-[24px] border border-slate-200/80 bg-white/70 p-4 shadow-sm sm:p-5">
              {/* Holiday Header */}
              <div className="mb-4 border-l-4 pl-4" style={{ borderColor: holiday.color }}>
                <h3 className="mb-1 text-lg font-bold leading-snug text-slate-900 sm:text-xl">
                  {holiday.name}
                </h3>
                <div className="flex flex-wrap items-center space-x-2 text-sm text-slate-600">
                  <MapPin size={16} />
                  <span className="font-medium">{holiday.country}</span>
                </div>
              </div>

              {/* Holiday Description */}
              <div className="mb-4">
                <p className="leading-relaxed text-slate-700">
                  {holiday.description}
                </p>
              </div>

              {/* Holiday Details */}
              <div className="space-y-4">
                {/* Significance */}
                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: holiday.color }}
                    />
                    <h4 className="font-semibold text-slate-900">{t('holidayModal.significance')}</h4>
                  </div>
                  <p className="ml-5 text-sm leading-relaxed text-slate-700">
                    {holiday.significance}
                  </p>
                </div>

                {/* Customs */}
                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    <Clock size={16} className="text-slate-500" />
                    <h4 className="font-semibold text-slate-900">{t('holidayModal.customs')}</h4>
                  </div>
                  <p className="ml-5 text-sm leading-relaxed text-slate-700">
                    {holiday.customs}
                  </p>
                </div>

                {/* History */}
                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    <Book size={16} className="text-slate-500" />
                    <h4 className="font-semibold text-slate-900">{t('holidayModal.historical')}</h4>
                  </div>
                  <p className="ml-5 text-sm leading-relaxed text-slate-700">
                    {holiday.history}
                  </p>
                </div>

                {/* Detailed Information Button */}
                <div className="mt-4">
                  <button
                    type="button"
                    onClick={() => fetchDetailedInfo(holiday, index)}
                    disabled={loadingInfo[index]}
                    className="accent-button-soft focus-ring flex w-full cursor-pointer items-center justify-center space-x-2 rounded-2xl px-3 py-2.5 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                  >
                    <Info size={16} />
                    <span className="text-sm font-medium">
                      {loadingInfo[index] ? t('holidayModal.loading') : detailedInfo[index] ? t('holidayModal.refresh') : t('holidayModal.getDetailed')}
                    </span>
                  </button>
                </div>

                {/* Detailed Information Display */}
                {detailedInfo[index] && (
                  <div className="surface-card-muted mt-4 rounded-2xl p-4 relative">
                    {showScrollHint === index && (
                      <div className="absolute -top-4 right-4 flex animate-bounce items-center gap-1 rounded-full bg-teal-100 px-3 py-1 font-medium text-teal-700 shadow-md sm:right-auto sm:left-1/2 sm:-translate-x-1/2">
                        <span className="text-xs">
                          {language === 'zh' ? '往下滑动查看详细内容' : 'Scroll down to read'}
                        </span>
                        <ChevronDown size={14} />
                      </div>
                    )}
                    <h4 className="mb-2 font-semibold text-slate-900">{t('holidayModal.detailedBackground')}</h4>
                    <div className="prose prose-sm max-w-none text-sm text-slate-700">
                      <ReactMarkdown 
                        components={{
                          h1: ({children}) => <h1 className="mb-2 mt-4 text-lg font-bold text-slate-900">{children}</h1>,
                          h2: ({children}) => <h2 className="mb-2 mt-4 text-base font-semibold text-slate-900">{children}</h2>,
                          h3: ({children}) => <h3 className="mb-1 mt-3 text-sm font-medium text-slate-900">{children}</h3>,
                          p: ({children}) => <p className="mb-2">{children}</p>,
                          ul: ({children}) => <ul className="list-disc list-inside mb-2">{children}</ul>,
                          ol: ({children}) => <ol className="list-decimal list-inside mb-2">{children}</ol>,
                          li: ({children}) => <li className="text-slate-700">{children}</li>,
                          strong: ({children}) => <strong className="font-semibold text-slate-900">{children}</strong>,
                          em: ({children}) => <em className="italic">{children}</em>,
                          blockquote: ({children}) => <blockquote className="mb-2 border-l-4 border-slate-300 pl-4 italic text-slate-600">{children}</blockquote>
                        }}
                      >
                        {detailedInfo[index]}
                      </ReactMarkdown>
                    </div>
                  </div>
                )}
              </div>

              {/* Separator for multiple holidays */}
              {index < holidays.length - 1 && (
                <div className="soft-divider mt-6 border-t pt-6" />
              )}
            </div>
          ))}
        </div>

        {/* Modal Footer */}
        <div className="sticky bottom-0 border-t border-slate-200/80 bg-slate-50/85 p-4 backdrop-blur-xl">
          <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
            <div className="text-center text-sm text-slate-500 sm:text-left">
              {t(holidays.length === 1 ? 'holidayModal.holidayCount' : 'holidayModal.holidayCountPlural', { count: holidays.length })}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="accent-button focus-ring w-full rounded-2xl px-4 py-2.5 font-medium sm:w-auto"
            >
              {t('common.close')}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default HolidayModal;