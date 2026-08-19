import React, { useState, useMemo } from 'react';
import { Lightbulb, Shuffle, ArrowRight, Sparkles, MapPin } from 'lucide-react';
import { useTranslation } from '../hooks/useI18n';
import { parseDateKey } from '../utils/dateUtils';

// Curated authoritative global cultural trivia library
const GLOBAL_TRIVIA = [
  // ── East Asia ─────────────────────────────────────────────────────────────
  {
    title: 'The 24 Solar Terms (二十四节气)',
    country: 'China',
    customs: 'Inscribed on UNESCO’s Intangible Cultural Heritage list; guides agricultural timing, health preservation, and seasonal cuisine like spring pancakes during Lichun.',
    isCurated: true
  },
  {
    title: 'Dragon Boat Festival (端午节)',
    country: 'China',
    customs: 'With over 2,000 years of history, celebrated on the 5th day of the 5th lunar month with dragon boat racing, hanging mugwort, and eating sticky rice zongzi.',
    isCurated: true
  },
  {
    title: 'Mid-Autumn Festival (中秋节)',
    country: 'China',
    customs: 'An ancient lunar harvest festival symbolising family reunion through moon gazing, sharing artisan mooncakes, and lighting colorful lanterns.',
    isCurated: true
  },
  {
    title: 'Setsubun (節分・豆まき)',
    country: 'Japan',
    customs: 'Dating back to the Heian era, families toss roasted soybeans chanting "Demons out, Fortune in!" (鬼は外、福は内) and eat Ehomaki rolls facing the year’s lucky compass direction.',
    isCurated: true
  },
  {
    title: 'Tanabata (七夕・星祭り)',
    country: 'Japan',
    customs: 'Celebrating the once-a-year celestial meeting of deities Orihime and Hikoboshi, people write wishes on colorful Tanzaku paper strips and tie them to bamboo branches.',
    isCurated: true
  },
  {
    title: 'Hinamatsuri (雛祭り・Doll Festival)',
    country: 'Japan',
    customs: 'Celebrated on March 3rd, families display ornate Heian-period imperial court dolls on tiered crimson platforms to pray for young girls’ health, growth, and prosperity.',
    isCurated: true
  },
  {
    title: 'Chuseok (추석 / Hangawi)',
    country: 'South Korea',
    customs: 'Major autumn harvest festival where families perform Charye (ancestor memorial rites) and prepare Songpyeon (half-moon rice cakes steamed over aromatic pine needles).',
    isCurated: true
  },
  {
    title: 'Seollal (설날 / Korean New Year)',
    country: 'South Korea',
    customs: 'Marked by Sebae (deep ceremonial bows to elders), wearing traditional Hanbok, and eating Tteokguk (sliced rice cake soup) to symbolize gaining a year in age and spiritual purity.',
    isCurated: true
  },

  // ── South Asia ─────────────────────────────────────────────────────────────
  {
    title: 'Holi (Festival of Colors)',
    country: 'India',
    customs: 'An ancient festival welcoming spring and the triumph of good over evil, celebrated with Holika bonfires and joyful tossing of vibrant herbal powders (gulal).',
    isCurated: true
  },
  {
    title: 'Diwali (Deepavali / Festival of Lights)',
    country: 'India',
    customs: 'Symbolising the victory of spiritual light over darkness, families illuminate homes with clay oil lamps (diyas), craft intricate floral Rangoli, and share festive sweets.',
    isCurated: true
  },

  // ── Americas ───────────────────────────────────────────────────────────────
  {
    title: 'Día de los Muertos (Day of the Dead)',
    country: 'Mexico',
    customs: 'A UNESCO Intangible Cultural Heritage celebration blending pre-Hispanic Aztec traditions and All Saints’ Day, honoring deceased ancestors with marigold-decked ofrendas and sugar skulls.',
    isCurated: true
  },
  {
    title: 'Las Posadas & Piñatas',
    country: 'Mexico',
    customs: 'Nine-night festive processions commemorating Mary and Joseph’s journey to Bethlehem, featuring community caroling, star-shaped piñatas, and spiced Ponche Navideño.',
    isCurated: true
  },
  {
    title: 'Carnaval do Brasil (Rio Carnival)',
    country: 'Brazil',
    customs: 'The world’s largest pre-Lenten festival blending Afro-Brazilian Samba rhythms, vibrant street blocos, and monumental competitive float parades at the Sambadrome.',
    isCurated: true
  },
  {
    title: 'Festa Junina (Saint John\'s Festival)',
    country: 'Brazil',
    customs: 'Second only to Carnival in scale, celebrating rural Caipira heritage with lively Quadrilha folk dances, blazing bonfires, straw hats, and corn-based delicacies.',
    isCurated: true
  },
  {
    title: 'Juneteenth (National Independence Day)',
    country: 'United States',
    customs: 'Commemorates June 19, 1865, when Union General Gordon Granger announced the freedom of enslaved people in Galveston, Texas; officially recognized as a US federal holiday in 2021.',
    isCurated: true
  },
  {
    title: 'Thanksgiving & Harvest Traditions',
    country: 'United States',
    customs: 'Rooted in the 1621 harvest feast shared between the Wampanoag people and English pilgrims, celebrated with family feasts, community parades, and the formal presidential turkey pardon.',
    isCurated: true
  },
  {
    title: 'Carnaval de Québec (Winter Carnival)',
    country: 'Canada',
    customs: 'One of the world’s largest winter festivals, presided over by the iconic Bonhomme Carnaval, featuring crystalline ice palaces, canoe ice races, and master snow carving.',
    isCurated: true
  },

  // ── Europe ─────────────────────────────────────────────────────────────────
  {
    title: 'Carnevale di Venezia (Venice Carnival)',
    country: 'Italy',
    customs: 'Dating back to the 11th century, famous for world-renowned porcelain Bauta masks, lavish baroque historical costumes, and candlelit gondola parades on the Grand Canal.',
    isCurated: true
  },
  {
    title: 'Ferragosto (Feriae Augusti)',
    country: 'Italy',
    customs: 'Originating in the ancient Roman *Feriae Augusti* established by Emperor Augustus in 18 BC, celebrated throughout Italy on August 15th with coastal holidays and outdoor banquets.',
    isCurated: true
  },
  {
    title: 'Bastille Day (Fête Nationale)',
    country: 'France',
    customs: 'Commemorates the 1789 storming of the Bastille and the 1790 Fête de la Fédération, famous for Champs-Élysées military flypasts and historic fire station dance balls (bals des pompiers).',
    isCurated: true
  },
  {
    title: 'Fête de la Musique (World Music Day)',
    country: 'France',
    customs: 'Inaugurated on the summer solstice in 1982 by Jack Lang, turning streets, squares, and riverbanks into free public concert venues for amateur and master musicians.',
    isCurated: true
  },
  {
    title: 'Oktoberfest (Bavarian Folk Festival)',
    country: 'Germany',
    customs: 'First held on October 12, 1810 to celebrate a royal Bavarian wedding, it has grown into a world-famous celebration of Bavarian folklore, traditional Trachten, and brass bands.',
    isCurated: true
  },
  {
    title: 'Walpurgisnacht (Walpurgis Night)',
    country: 'Germany',
    customs: 'Celebrated on the eve of May 1st across the Harz mountains (Mount Brocken), marked by traditional hilltop bonfires, folk dancing, and legends welcoming the departure of winter.',
    isCurated: true
  },
  {
    title: 'La Tomatina (Buñol Tomato Festival)',
    country: 'Spain',
    customs: 'Held annually on the last Wednesday of August in Buñol since 1945, where tens of thousands of participants take part in a joyful communal food fight with overripe tomatoes.',
    isCurated: true
  },
  {
    title: 'Las Fallas de Valencia',
    country: 'Spain',
    customs: 'A UNESCO World Heritage festival celebrating Saint Joseph, where neighborhood guilds erect monumental satirical wooden sculptures (ninots) that are illuminated and cremated in the Cremà.',
    isCurated: true
  },
  {
    title: 'Midsummer (Midsommar / Solstice)',
    country: 'Sweden',
    customs: 'An ancient summer solstice festival celebrating the rebirth of nature with floral crowns, dancing around the leaf-decorated Majstång (maypole), pickled herring, and fresh strawberries.',
    isCurated: true
  },
  {
    title: 'Saint Lucia Day (Sankta Lucia)',
    country: 'Sweden',
    customs: 'Celebrated on December 13th with candlelit dawn choral processions led by Lucia crowned in lingonberry greens and glowing candles, accompanied by golden saffron Lussekatter buns.',
    isCurated: true
  },
  {
    title: 'St. Patrick\'s Day',
    country: 'Ireland',
    customs: 'Originating as a feast day for Ireland’s patron saint, celebrated across the globe with wearing green, shamrock badges, Celtic pipe bands, and dyeing iconic landmarks green.',
    isCurated: true
  },
  {
    title: 'Burns Night & The Haggis Address',
    country: 'United Kingdom',
    customs: 'Held annually on January 25th in Scotland to celebrate national poet Robert Burns, featuring traditional haggis piped into the hall, recitation of the Address to a Haggis, and whisky toasts.',
    isCurated: true
  },
  {
    title: 'Guy Fawkes Night (Bonfire Night)',
    country: 'United Kingdom',
    customs: 'Commemorates the thwarted 1605 Gunpowder Plot to blow up the Houses of Parliament, celebrated throughout Britain with community bonfires, effigy burnings, and fireworks.',
    isCurated: true
  },

  // ── Middle East & Oceania ──────────────────────────────────────────────────
  {
    title: 'Şeker Bayramı (Sugar Feast / Eid)',
    country: 'Turkey',
    customs: 'Celebrated at the conclusion of Ramadan, where younger generations visit elders to kiss their right hands in respect and receive Turkish delight (Lokum), baklava, and sweets.',
    isCurated: true
  },
  {
    title: 'ANZAC Day (Dawn Service Remembrance)',
    country: 'Australia',
    customs: 'Observed on April 25th to honor military service members of Australia and New Zealand, marked by solemn Dawn Services, playing of The Last Post, and baking ANZAC oat biscuits.',
    isCurated: true
  }
];

const CulturalTriviaWidget = ({
  monthHolidays = {},
  onSelectHoliday,
  currentDate = new Date()
}) => {
  const { t } = useTranslation();
  const [indexOffset, setIndexOffset] = useState(0);
  const [isRotating, setIsRotating] = useState(false);

  // Extract spotlight candidates from current month's holidays
  const triviaItems = useMemo(() => {
    const candidates = [];
    const seen = new Set();

    Object.entries(monthHolidays).forEach(([dateStr, list]) => {
      (list || []).forEach(h => {
        const key = `${h.date}-${h.name.toLowerCase().trim()}`;
        if (!seen.has(key)) {
          seen.add(key);
          const dateObj = parseDateKey(dateStr);
          const snippet = h.customs || h.significance || h.description || h.history;
          if (snippet) {
            candidates.push({
              holiday: h,
              title: h.name,
              country: h.country,
              color: h.color,
              date: dateStr,
              dateObj,
              customs: snippet,
              isCurated: false
            });
          }
        }
      });
    });

    if (candidates.length > 0) {
      return candidates;
    }

    return GLOBAL_TRIVIA;
  }, [monthHolidays]);

  const activeIndex = triviaItems.length > 0 ? Math.abs(indexOffset) % triviaItems.length : 0;
  const currentItem = triviaItems[activeIndex] || GLOBAL_TRIVIA[0];

  const handleShuffle = (e) => {
    e.stopPropagation();
    setIsRotating(true);
    setIndexOffset(prev => prev + 1);
    setTimeout(() => setIsRotating(false), 400);
  };

  const handleCardClick = () => {
    if (currentItem.holiday && onSelectHoliday) {
      onSelectHoliday({
        holiday: currentItem.holiday,
        date: currentItem.dateObj || currentDate
      });
    }
  };

  return (
    <div
      onClick={handleCardClick}
      className={`surface-card rounded-2xl p-4 flex flex-col justify-between transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 border border-cyan-200/60 dark:border-cyan-900/60 ${
        currentItem.holiday ? 'cursor-pointer group' : ''
      }`}
    >
      {/* Header with Title & Shuffle Button */}
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

      {/* Main Trivia Spotlight Content */}
      <div className="my-1 flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-1">
          {currentItem.color && (
            <span
              className="h-2 w-2 rounded-full shrink-0"
              style={{ backgroundColor: currentItem.color }}
            />
          )}
          <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
            {currentItem.title}
          </h4>
          {currentItem.country && (
            <span className="inline-flex items-center gap-0.5 rounded-md bg-slate-100 dark:bg-slate-800 px-1.5 py-0.2 text-[10px] font-medium text-slate-600 dark:text-slate-300 shrink-0">
              <MapPin size={9} />
              <span>{currentItem.country}</span>
            </span>
          )}
        </div>

        <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300 line-clamp-2">
          {currentItem.customs}
        </p>
      </div>

      {/* Footer Link / Explore Hint */}
      <div className="flex items-center justify-between text-[11px] font-semibold pt-1 border-t border-slate-100/80 dark:border-slate-800/80">
        <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
          <Sparkles size={11} className="text-amber-500" />
          <span>{t('stats.didYouKnow')}</span>
        </span>
        {currentItem.holiday && (
          <span className="inline-flex items-center gap-1 text-cyan-600 dark:text-cyan-400 group-hover:translate-x-0.5 transition-transform">
            <span>{t('stats.exploreHoliday')}</span>
            <ArrowRight size={12} />
          </span>
        )}
      </div>
    </div>
  );
};

export default React.memo(CulturalTriviaWidget);
