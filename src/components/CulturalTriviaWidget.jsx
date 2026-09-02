import React, { useEffect, useMemo, useState } from 'react';
import { Lightbulb, Shuffle, ArrowRight, Sparkles, MapPin } from 'lucide-react';
import { useTranslation } from '../hooks/useI18n';
import { parseDateKey } from '../utils/dateUtils';
import { getHolidayColor } from '../utils/holidayColors';
import { getHolidayCountryLabel, getHolidayDisplayName } from '../utils/holidayDisplay';
import { getCountryDisplayName } from '../services/countryService';
import { loadTrivia } from '../data/trivia';

/**
 * Spotlights something worth knowing about the month on screen, falling back
 * to a curated library loaded for the current language.
 */
const CulturalTriviaWidget = ({ monthHolidays = {}, onSelectHoliday, currentDate = new Date() }) => {
  const { t, language } = useTranslation();
  const [indexOffset, setIndexOffset] = useState(0);
  const [isRotating, setIsRotating] = useState(false);
  const [curatedTrivia, setCuratedTrivia] = useState([]);

  useEffect(() => {
    let isActive = true;

    loadTrivia(language).then(entries => {
      if (isActive) setCuratedTrivia(entries);
    });

    return () => {
      isActive = false;
    };
  }, [language]);

  const triviaItems = useMemo(() => {
    const candidates = [];

    Object.entries(monthHolidays).forEach(([dateStr, list]) => {
      (list || []).forEach(holiday => {
        const snippet =
          holiday.culturalInfo?.traditions ||
          holiday.culturalInfo?.significance ||
          holiday.description;

        if (snippet) {
          candidates.push({
            holiday,
            title: getHolidayDisplayName(holiday, language),
            country: getHolidayCountryLabel(holiday, language),
            color: getHolidayColor(holiday),
            dateObj: parseDateKey(dateStr),
            customs: snippet
          });
        }
      });
    });

    if (candidates.length > 0) return candidates;

    return curatedTrivia.map(entry => ({
      ...entry,
      country: getCountryDisplayName(entry.countryCode, language)
    }));
  }, [monthHolidays, curatedTrivia, language]);

  const activeIndex = triviaItems.length > 0 ? Math.abs(indexOffset) % triviaItems.length : 0;
  const currentItem = triviaItems[activeIndex];

  const handleShuffle = (event) => {
    event.stopPropagation();
    setIsRotating(true);
    setIndexOffset(previous => previous + 1);
    setTimeout(() => setIsRotating(false), 400);
  };

  const handleCardClick = () => {
    if (currentItem?.holiday && onSelectHoliday) {
      onSelectHoliday({
        holiday: currentItem.holiday,
        date: currentItem.dateObj || currentDate
      });
    }
  };

  // The card stays clickable for pointer users, but the keyboard-reachable
  // control is the "explore" button in the footer: a bare <div onClick> is
  // unreachable by Tab and invisible to assistive tech.
  const handleExploreClick = (event) => {
    event.stopPropagation();
    handleCardClick();
  };

  if (!currentItem) {
    return (
      <div className="surface-card rounded-2xl p-4 border border-cyan-200/60 dark:border-cyan-900/60">
        <div className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-[0.16em] text-cyan-600 dark:text-cyan-400">
          <Lightbulb size={13} className="shrink-0 text-amber-500" aria-hidden="true" />
          <span>{t('stats.culturalTrivia')}</span>
        </div>
      </div>
    );
  }

  const isInteractive = Boolean(currentItem.holiday);

  return (
    <div
      onClick={handleCardClick}
      className={`surface-card rounded-2xl p-4 flex flex-col justify-between transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 border border-cyan-200/60 dark:border-cyan-900/60 ${
        isInteractive ? 'cursor-pointer group' : ''
      }`}
    >
      <div className="flex items-center justify-between gap-2 mb-1">
        <span className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-[0.16em] text-cyan-600 dark:text-cyan-400">
          <Lightbulb size={13} className="shrink-0 text-amber-500" aria-hidden="true" />
          <span>{t('stats.culturalTrivia')}</span>
        </span>

        <button
          type="button"
          onClick={handleShuffle}
          className="inline-flex items-center gap-1 rounded-full bg-cyan-50 dark:bg-cyan-950/60 px-2 py-0.5 text-[11px] font-semibold text-cyan-700 dark:text-cyan-300 hover:bg-cyan-100 dark:hover:bg-cyan-900/60 transition-colors"
          title={t('stats.shuffleTrivia')}
          aria-label={t('stats.shuffleTrivia')}
        >
          <Shuffle size={11} className={`transition-transform duration-300 ${isRotating ? 'rotate-180' : ''}`} />
          <span>{t('stats.shuffleTrivia')}</span>
        </button>
      </div>

      <div className="my-1 flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-1">
          {currentItem.color && (
            <span
              className="h-2 w-2 rounded-full shrink-0"
              style={{ backgroundColor: currentItem.color }}
              aria-hidden="true"
            />
          )}
          <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
            {currentItem.title}
          </h4>
          {currentItem.country && (
            <span className="inline-flex items-center gap-0.5 rounded-md bg-slate-100 dark:bg-slate-800 px-1.5 text-[10px] font-medium text-slate-600 dark:text-slate-300 shrink-0">
              <MapPin size={9} aria-hidden="true" />
              <span>{currentItem.country}</span>
            </span>
          )}
        </div>

        <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300 line-clamp-2">
          {currentItem.customs}
        </p>
      </div>

      <div className="flex items-center justify-between text-[11px] font-semibold pt-1 border-t border-slate-100/80 dark:border-slate-800/80">
        <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
          <Sparkles size={11} className="text-amber-500" aria-hidden="true" />
          <span>{t('stats.didYouKnow')}</span>
        </span>
        {isInteractive && (
          <button
            type="button"
            onClick={handleExploreClick}
            aria-label={`${t('stats.exploreHoliday')}: ${currentItem.title}`}
            className="inline-flex items-center gap-1 rounded-md text-cyan-600 dark:text-cyan-400 group-hover:translate-x-0.5 transition-transform hover:underline"
          >
            <span>{t('stats.exploreHoliday')}</span>
            <ArrowRight size={12} aria-hidden="true" />
          </button>
        )}
      </div>
    </div>
  );
};

export default React.memo(CulturalTriviaWidget);
