import { useEffect, useRef, useState, lazy, Suspense } from 'react';
import { createPortal } from 'react-dom';
import { X, Calendar, MapPin, Clock, Book, Info, ChevronDown, Loader2, AlertCircle, Share2, Download, ExternalLink, Check } from 'lucide-react';
import { fetchHolidayInfo, readCachedHolidayInfo, writeCachedHolidayInfo } from '../services/holidayApi';
import { useI18n, useTranslation } from '../hooks/useI18n';
import { getLocaleFromLanguage } from '../services/i18nService';
import { generateGoogleCalendarUrl, downloadIcsFile, shareHoliday } from '../utils/calendarExport';
import { getHolidayColor } from '../utils/holidayColors';
import {
  getHolidayCountryLabel,
  getHolidayDisplayName,
  getHolidaySecondaryName,
  getHolidayTypeLabel
} from '../utils/holidayDisplay';
import { useFocusTrap } from '../hooks/useFocusTrap';

const MarkdownContent = lazy(() => import('./MarkdownContent'));

const HolidayModal = ({ date, holidays, onClose }) => {
  const [detailedInfo, setDetailedInfo] = useState({});
  const [loadingInfo, setLoadingInfo] = useState({});
  const [errorInfo, setErrorInfo] = useState({});
  const [showScrollHint, setShowScrollHint] = useState(null);
  const [shareStatus, setShareStatus] = useState({});
  const hintTimeoutRef = useRef(null);
  const { language } = useI18n();
  const { t } = useTranslation();
  const containerRef = useFocusTrap(true, onClose);

  const handleShare = async (holiday, index) => {
    const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
    const result = await shareHoliday(holiday, shareUrl);

    if (result === 'copied' || result === 'shared') {
      setShareStatus(previous => ({ ...previous, [index]: true }));
      setTimeout(() => {
        setShareStatus(previous => ({ ...previous, [index]: false }));
      }, 2500);
    }
  };

  // Auto-load detailed information from localStorage when the modal opens
  useEffect(() => {
    holidays.forEach((holiday, index) => {
      const cached = readCachedHolidayInfo(holiday.name, holiday.countryCode || holiday.country, language);
      if (cached) {
        setDetailedInfo(previous => ({ ...previous, [index]: cached }));
      }
    });
  }, [holidays, language]);

  // Prevent body scroll while the modal is open
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  useEffect(() => () => clearTimeout(hintTimeoutRef.current), []);

  const fetchDetailedInfo = async (holiday, index) => {
    if (loadingInfo[index]) return;

    const isRefresh = Boolean(detailedInfo[index]);
    const countryKey = holiday.countryCode || holiday.country;

    if (!isRefresh) {
      const cached = readCachedHolidayInfo(holiday.name, countryKey, language);
      if (cached) {
        setDetailedInfo(previous => ({ ...previous, [index]: cached }));
        return;
      }
    }

    setLoadingInfo(previous => ({ ...previous, [index]: true }));
    setErrorInfo(previous => ({ ...previous, [index]: false }));
    setShowScrollHint(null);

    try {
      const info = await fetchHolidayInfo(holiday.name, getHolidayCountryLabel(holiday, 'en'), language);

      if (info) {
        setDetailedInfo(previous => ({ ...previous, [index]: info }));
        writeCachedHolidayInfo(holiday.name, countryKey, language, info);

        if (!isRefresh) {
          setShowScrollHint(index);
          clearTimeout(hintTimeoutRef.current);
          hintTimeoutRef.current = setTimeout(() => setShowScrollHint(null), 5000);
        }
      } else {
        setErrorInfo(previous => ({ ...previous, [index]: true }));
      }
    } catch (error) {
      console.error('Error fetching holiday info:', error);
      setErrorInfo(previous => ({ ...previous, [index]: true }));
    } finally {
      setLoadingInfo(previous => ({ ...previous, [index]: false }));
    }
  };

  const formatDate = (value) => value.toLocaleDateString(getLocaleFromLanguage(language), {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/55 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-label={formatDate(date)}
        className="surface-card-strong w-full max-w-2xl max-h-[92dvh] overflow-y-auto rounded-t-3xl sm:max-h-[90vh] sm:rounded-[28px]"
        onClick={(event) => event.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-slate-200/80 dark:border-slate-800 bg-white/85 dark:bg-slate-900/90 px-4 py-3 backdrop-blur-xl sm:items-center sm:p-4">
          <div className="flex items-start sm:items-center space-x-2 min-w-0">
            <Calendar className="text-teal-500 shrink-0" size={20} aria-hidden="true" />
            <h2 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-white leading-tight">
              {formatDate(date)}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="focus-ring rounded-full p-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400"
            aria-label={t('common.close')}
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-4 sm:p-5 space-y-5 sm:space-y-6">
          {holidays.map((holiday, index) => {
            const color = getHolidayColor(holiday);
            const displayName = getHolidayDisplayName(holiday, language);
            const secondaryName = getHolidaySecondaryName(holiday, language);

            return (
              <div key={index} className="rounded-[24px] border border-slate-200/80 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 p-4 shadow-sm sm:p-5">
                {/* Holiday Header */}
                <div className="mb-4 border-l-4 pl-4" style={{ borderColor: color }}>
                  <h3 className="mb-1 text-lg font-bold leading-snug text-slate-900 dark:text-white sm:text-xl">
                    {displayName}
                  </h3>
                  {secondaryName && (
                    <p className="mb-1 text-sm text-slate-500 dark:text-slate-400">{secondaryName}</p>
                  )}
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-600 dark:text-slate-400">
                    <span className="flex items-center gap-1.5">
                      <MapPin size={16} aria-hidden="true" />
                      <span className="font-medium">{getHolidayCountryLabel(holiday, language)}</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} aria-hidden="true" />
                      <span>{getHolidayTypeLabel(holiday.type, t)}</span>
                    </span>
                  </div>
                </div>

                {holiday.description && (
                  <p className="mb-4 leading-relaxed text-slate-700 dark:text-slate-300">
                    {holiday.description}
                  </p>
                )}

                <div className="space-y-4">
                  {holiday.culturalInfo?.significance && (
                    <div>
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="h-3 w-3 rounded-full" style={{ backgroundColor: color }} aria-hidden="true" />
                        <h4 className="font-semibold text-slate-900 dark:text-white">{t('holidayModal.significance')}</h4>
                      </div>
                      <p className="ml-5 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                        {holiday.culturalInfo.significance}
                      </p>
                    </div>
                  )}

                  {holiday.culturalInfo?.traditions && (
                    <div>
                      <div className="flex items-center space-x-2 mb-2">
                        <Clock size={16} className="text-slate-500 dark:text-slate-400" aria-hidden="true" />
                        <h4 className="font-semibold text-slate-900 dark:text-white">{t('holidayModal.customs')}</h4>
                      </div>
                      <p className="ml-5 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                        {holiday.culturalInfo.traditions}
                      </p>
                    </div>
                  )}

                  {holiday.culturalInfo?.origin && (
                    <div>
                      <div className="flex items-center space-x-2 mb-2">
                        <Book size={16} className="text-slate-500 dark:text-slate-400" aria-hidden="true" />
                        <h4 className="font-semibold text-slate-900 dark:text-white">{t('holidayModal.historical')}</h4>
                      </div>
                      <p className="ml-5 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                        {holiday.culturalInfo.origin}
                      </p>
                    </div>
                  )}

                  {/* Action Buttons Toolbar */}
                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => fetchDetailedInfo(holiday, index)}
                      disabled={loadingInfo[index]}
                      className="accent-button-soft focus-ring flex flex-1 sm:flex-initial cursor-pointer items-center justify-center space-x-2 rounded-2xl px-3 py-2.5 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {loadingInfo[index] ? (
                        <Loader2 size={16} className="animate-spin" aria-hidden="true" />
                      ) : (
                        <Info size={16} aria-hidden="true" />
                      )}
                      <span className="text-sm font-medium">
                        {loadingInfo[index]
                          ? t('holidayModal.loading')
                          : detailedInfo[index]
                          ? t('holidayModal.refresh')
                          : t('holidayModal.getDetailed')}
                      </span>
                    </button>

                    <a
                      href={generateGoogleCalendarUrl({ ...holiday, name: displayName, country: getHolidayCountryLabel(holiday, language) })}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="focus-ring flex items-center justify-center space-x-1.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/90 px-3 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60"
                      title={t('calendar.addToGoogle')}
                    >
                      <ExternalLink size={14} aria-hidden="true" />
                      <span>{t('calendar.addToGoogle')}</span>
                    </a>

                    <button
                      type="button"
                      onClick={() => downloadIcsFile({ ...holiday, name: displayName, country: getHolidayCountryLabel(holiday, language) })}
                      className="focus-ring flex items-center justify-center space-x-1.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/90 px-3 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60"
                      title={t('calendar.downloadIcs')}
                    >
                      <Download size={14} aria-hidden="true" />
                      <span>{t('calendar.downloadIcs')}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleShare(holiday, index)}
                      className="focus-ring flex items-center justify-center space-x-1.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/90 px-3 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60"
                      title={t('calendar.share')}
                    >
                      {shareStatus[index] ? (
                        <>
                          <Check size={14} className="text-teal-600 dark:text-teal-400" aria-hidden="true" />
                          <span className="text-teal-600 dark:text-teal-400 font-semibold">{t('calendar.copied')}</span>
                        </>
                      ) : (
                        <>
                          <Share2 size={14} aria-hidden="true" />
                          <span>{t('calendar.share')}</span>
                        </>
                      )}
                    </button>
                  </div>

                  {errorInfo[index] && !loadingInfo[index] && (
                    <div className="mt-2 flex items-center gap-1.5 text-sm text-red-600 dark:text-red-400" role="alert">
                      <AlertCircle size={14} aria-hidden="true" />
                      <span>{t('holidayModal.loadError')}</span>
                    </div>
                  )}

                  {detailedInfo[index] && (
                    <div className="surface-card-muted mt-4 rounded-2xl p-4 relative">
                      {showScrollHint === index && (
                        <div className="absolute -top-4 right-4 flex animate-bounce items-center gap-1 rounded-full bg-teal-100 dark:bg-teal-950 px-3 py-1 font-medium text-teal-700 dark:text-teal-300 shadow-md sm:right-auto sm:left-1/2 sm:-translate-x-1/2">
                          <span className="text-xs">{t('holidayModal.scrollHint')}</span>
                          <ChevronDown size={14} aria-hidden="true" />
                        </div>
                      )}
                      <h4 className="mb-2 font-semibold text-slate-900 dark:text-white">
                        {t('holidayModal.detailedBackground')}
                      </h4>
                      <div className="prose prose-sm max-w-none text-sm text-slate-700 dark:text-slate-300">
                        <Suspense fallback={<p className="text-slate-400">{t('common.loading')}</p>}>
                          <MarkdownContent>{detailedInfo[index]}</MarkdownContent>
                        </Suspense>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Modal Footer */}
        <div className="sticky bottom-0 border-t border-slate-200/80 dark:border-slate-800 bg-slate-50/85 dark:bg-slate-900/90 p-4 backdrop-blur-xl">
          <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
            <div className="text-center text-sm text-slate-500 dark:text-slate-400 sm:text-left">
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
