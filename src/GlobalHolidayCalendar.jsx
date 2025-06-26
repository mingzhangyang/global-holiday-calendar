import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, X, Globe, Calendar } from 'lucide-react';

const GlobalHolidayCalendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedCountries, setSelectedCountries] = useState(['all']);
  const [selectedHoliday, setSelectedHoliday] = useState(null);
  const [apiHolidays, setApiHolidays] = useState({});
  const [loading, setLoading] = useState(false);

  const holidays = {
    // January
    '2025-01-01': [
      {
        name: "New Year's Day",
        country: "Global",
        description: "Celebrated worldwide as the beginning of the Gregorian calendar year. Traditions include fireworks, resolutions, and gatherings with family and friends.",
        background: "The celebration of January 1st as New Year's Day was established by Julius Caesar in 46 BC, though different cultures have celebrated new years at various times throughout history."
      }
    ],
    '2025-01-07': [
      {
        name: "Orthodox Christmas",
        country: "Russia",
        description: "Christmas celebrated by Orthodox Christians who follow the Julian calendar. Families gather for festive meals and gift exchanges.",
        background: "Due to calendar differences, Orthodox churches celebrate Christmas 13 days after Western Christmas. The celebration includes special church services and traditional foods like kutia."
      }
    ],
    '2025-01-26': [
      {
        name: "Australia Day",
        country: "Australia",
        description: "National day of Australia commemorating the arrival of the First British Fleet in 1788. Celebrated with barbecues, fireworks, and citizenship ceremonies.",
        background: "Marks the anniversary of the 1788 arrival of the First Fleet at Port Jackson in New South Wales. The day has become increasingly controversial due to its association with colonization."
      }
    ],
    // February
    '2025-02-14': [
      {
        name: "Valentine's Day",
        country: "Global",
        description: "Day of love and romance celebrated with gifts, flowers, and expressions of affection between romantic partners.",
        background: "Named after Saint Valentine, a Christian martyr. The tradition of romantic love associated with this day emerged in the Middle Ages and has become commercialized worldwide."
      }
    ],
    '2025-02-18': [
      {
        name: "Chinese New Year",
        country: "China",
        description: "The most important traditional Chinese holiday, marking the beginning of the lunar new year. Celebrated with family reunions, fireworks, and red decorations.",
        background: "Also known as Spring Festival, it's based on the lunar calendar and dates back over 4,000 years. Each year is associated with one of 12 zodiac animals - 2025 is the Year of the Snake."
      }
    ],
    // March
    '2025-03-08': [
      {
        name: "International Women's Day",
        country: "Global",
        description: "A global day celebrating women's social, economic, cultural, and political achievements while calling for gender equality.",
        background: "Established in 1911, it originated from labor movements in North America and Europe. In many countries, it's a national holiday with protests, celebrations, and recognition of women's contributions."
      }
    ],
    '2025-03-17': [
      {
        name: "St. Patrick's Day",
        country: "Ireland",
        description: "Irish cultural and religious celebration honoring Saint Patrick, the patron saint of Ireland. Celebrated with parades, wearing green, and traditional Irish music.",
        background: "Originally a religious feast day, it has become a celebration of Irish heritage and culture worldwide. The tradition of wearing green comes from Ireland being called the 'Emerald Isle.'"
      }
    ],
    // April
    '2025-04-20': [
      {
        name: "Easter Sunday",
        country: "Global",
        description: "Christian holiday celebrating the resurrection of Jesus Christ. Traditions include Easter eggs, church services, and family gatherings.",
        background: "The most important holiday in Christianity, Easter's date varies each year as it's calculated based on lunar cycles. Many traditions like Easter eggs symbolize new life and rebirth."
      }
    ],
    // May
    '2025-05-01': [
      {
        name: "Labor Day",
        country: "Global",
        description: "International Workers' Day celebrating laborers and the working class. Observed with parades, demonstrations, and workers' rights advocacy.",
        background: "Originated from the labor union movement, specifically the eight-hour-day movement. It commemorates the Haymarket affair in Chicago in 1886 and is observed in many countries except the US and Canada."
      }
    ],
    '2025-05-05': [
      {
        name: "Cinco de Mayo",
        country: "Mexico",
        description: "Celebrates the Mexican Army's victory over the French Empire at the Battle of Puebla in 1862. Observed with parades, music, and traditional Mexican food.",
        background: "While often mistaken for Mexican Independence Day, Cinco de Mayo commemorates a significant military victory. It's more widely celebrated in the United States than in Mexico."
      }
    ],
    // June
    '2025-06-21': [
      {
        name: "Summer Solstice",
        country: "Global",
        description: "The longest day of the year in the Northern Hemisphere. Celebrated in many cultures as a time of renewal, fertility, and the power of the sun.",
        background: "Ancient civilizations built monuments like Stonehenge to mark this astronomical event. Modern celebrations include festivals, bonfires, and outdoor gatherings welcoming summer."
      }
    ],
    // July
    '2025-07-04': [
      {
        name: "Independence Day",
        country: "USA",
        description: "American national holiday commemorating the Declaration of Independence in 1776. Celebrated with fireworks, barbecues, and patriotic displays.",
        background: "Marks the day the Continental Congress approved the Declaration of Independence, declaring freedom from British rule. It's considered the birthday of American independence."
      }
    ],
    '2025-07-14': [
      {
        name: "Bastille Day",
        country: "France",
        description: "French national day commemorating the storming of the Bastille fortress in 1789, marking the beginning of the French Revolution.",
        background: "The storming of the Bastille symbolized the uprising of the modern nation and the unity of the French people. Celebrated with military parades, fireworks, and public festivities."
      }
    ],
    // August
    '2025-08-15': [
      {
        name: "Independence Day",
        country: "India",
        description: "Celebrates India's independence from British rule in 1947. Observed with flag hoisting, parades, and cultural programs.",
        background: "Marks the end of British colonial rule and the partition of British India into India and Pakistan. The Prime Minister traditionally addresses the nation from the Red Fort in Delhi."
      }
    ],
    // September
    '2025-09-16': [
      {
        name: "Independence Day",
        country: "Mexico",
        description: "Celebrates the beginning of the Mexican War of Independence from Spain in 1810. Features the 'Grito de Dolores' ceremony and festive celebrations.",
        background: "Commemorates Father Miguel Hidalgo's call for independence. The president recreates the historic 'grito' (cry) from the National Palace balcony, followed by fireworks and celebrations."
      }
    ],
    // October
    '2025-10-31': [
      {
        name: "Halloween",
        country: "Global",
        description: "Holiday with Celtic origins, now celebrated with costumes, trick-or-treating, and spooky decorations. Popular in many Western countries.",
        background: "Originated from the ancient Celtic festival of Samhain, marking the end of harvest season. The tradition evolved through Christian influence and immigration to become today's Halloween."
      }
    ],
    // November
    '2025-11-27': [
      {
        name: "Thanksgiving",
        country: "USA",
        description: "National holiday of gratitude and harvest celebration. Families gather for traditional meals featuring turkey, stuffing, and pumpkin pie.",
        background: "Traces back to 1621 when Plymouth colonists and Wampanoag Native Americans shared a harvest feast. Officially proclaimed a national holiday by President Lincoln in 1863."
      }
    ],
    // December
    '2025-12-25': [
      {
        name: "Christmas Day",
        country: "Global",
        description: "Christian holiday celebrating the birth of Jesus Christ. Traditions include gift-giving, family gatherings, Christmas trees, and festive meals.",
        background: "While the exact birth date of Jesus is unknown, December 25th was chosen by the Roman Church in the 4th century. The holiday has incorporated many cultural traditions from around the world."
      }
    ],
    '2025-12-26': [
      {
        name: "Boxing Day",
        country: "UK",
        description: "British holiday traditionally for giving gifts to service workers and the less fortunate. Now a day for shopping, sports, and family time.",
        background: "The name may derive from the practice of giving 'Christmas boxes' to servants and tradespeople. It's observed in many Commonwealth countries as a public holiday."
      }
    ]
  };

  // API holiday fetching
  const fetchHolidaysFromAPI = async (year, countryCode) => {
    try {
      const response = await fetch(`https://date.nager.at/api/v3/PublicHolidays/${year}/${countryCode}`);
      if (!response.ok) throw new Error('API request failed');
      const holidays = await response.json();
      
      return holidays.map(holiday => ({
        name: holiday.name,
        country: holiday.countryCode,
        description: `${holiday.name} is a public holiday in ${holiday.countryCode}. ${holiday.localName ? `Also known as "${holiday.localName}".` : ''}`,
        background: `This is an official public holiday observed nationwide. ${holiday.global ? 'It is observed globally within the country.' : 'It may be observed differently in various regions.'}`
      }));
    } catch (error) {
      console.error(`Failed to fetch holidays for ${countryCode}:`, error);
      return [];
    }
  };

  const loadHolidaysForYear = async (year) => {
    setLoading(true);
    const countryCodes = ['US', 'GB', 'FR', 'DE', 'CA', 'AU', 'JP', 'IN', 'MX', 'BR'];
    const holidayPromises = countryCodes.map(code => 
      fetchHolidaysFromAPI(year, code).then(holidays => ({ code, holidays }))
    );

    try {
      const results = await Promise.all(holidayPromises);
      const newApiHolidays = {};
      
      results.forEach(({ code, holidays }) => {
        holidays.forEach(holiday => {
          // Convert to our date format
          const date = holiday.date || `${year}-01-01`; // fallback
          if (!newApiHolidays[date]) {
            newApiHolidays[date] = [];
          }
          newApiHolidays[date].push({
            ...holiday,
            country: getCountryName(code)
          });
        });
      });

      setApiHolidays(prev => ({ ...prev, ...newApiHolidays }));
    } catch (error) {
      console.error('Failed to load holidays:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCountryName = (code) => {
    const countryMap = {
      'US': 'USA',
      'GB': 'UK', 
      'FR': 'France',
      'DE': 'Germany',
      'CA': 'Canada',
      'AU': 'Australia',
      'JP': 'Japan',
      'IN': 'India',
      'MX': 'Mexico',
      'BR': 'Brazil'
    };
    return countryMap[code] || code;
  };

  // Load holidays when component mounts or year changes
  React.useEffect(() => {
    const year = currentDate.getFullYear();
    if (!apiHolidays[`${year}-01-01`]) { // Simple check if we have data for this year
      loadHolidaysForYear(year);
    }
  }, [currentDate.getFullYear()]);

  const countries = ['all', 'Global', 'USA', 'UK', 'France', 'Germany', 'Canada', 'Australia', 'Japan', 'India', 'Mexico', 'Brazil'];

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const formatDateKey = (year, month, day) => {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  };

  const getHolidaysForDate = (year, month, day) => {
    const dateKey = formatDateKey(year, month, day);
    
    // Combine static holidays with API holidays
    const staticHolidays = holidays[dateKey] || [];
    const dynamicHolidays = apiHolidays[dateKey] || [];
    const allHolidays = [...staticHolidays, ...dynamicHolidays];
    
    if (selectedCountries.includes('all')) {
      return allHolidays;
    }
    
    return allHolidays.filter(holiday => 
      selectedCountries.includes(holiday.country)
    );
  };

  const navigateMonth = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(currentDate.getMonth() + direction);
    setCurrentDate(newDate);
  };

  const handleCountryFilter = (country) => {
    if (country === 'all') {
      setSelectedCountries(['all']);
    } else {
      const newSelection = selectedCountries.includes('all') ? [] : [...selectedCountries];
      
      if (newSelection.includes(country)) {
        const filtered = newSelection.filter(c => c !== country);
        setSelectedCountries(filtered.length === 0 ? ['all'] : filtered);
      } else {
        setSelectedCountries([...newSelection, country]);
      }
    }
  };

  const renderCalendar = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    
    const days = [];
    
    // Empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-20 border border-gray-100"></div>);
    }
    
    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dayHolidays = getHolidaysForDate(year, month, day);
      const hasHolidays = dayHolidays.length > 0;
      
      days.push(
        <div
          key={day}
          className={`h-20 border border-gray-100 p-1 cursor-pointer transition-all hover:bg-blue-50 ${
            hasHolidays ? 'bg-gradient-to-br from-red-50 to-orange-50 hover:from-red-100 hover:to-orange-100' : ''
          }`}
          onClick={() => hasHolidays && setSelectedHoliday({ day, holidays: dayHolidays })}
        >
          <div className="flex flex-col h-full">
            <span className={`text-sm font-medium ${hasHolidays ? 'text-red-700' : 'text-gray-700'}`}>
              {day}
            </span>
            {hasHolidays && (
              <div className="flex-1 flex flex-wrap gap-1 mt-1">
                {dayHolidays.slice(0, 2).map((holiday, idx) => (
                  <div
                    key={idx}
                    className="w-2 h-2 rounded-full bg-red-500"
                    title={holiday.name}
                  ></div>
                ))}
                {dayHolidays.length > 2 && (
                  <div className="text-xs text-red-600 font-medium">+{dayHolidays.length - 2}</div>
                )}
              </div>
            )}
          </div>
        </div>
      );
    }
    
    return days;
  };

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-3 mb-4">
          <Globe className="w-8 h-8 text-blue-600" />
          <h1 className="text-4xl font-bold text-gray-800">Global Holiday Calendar</h1>
        </div>
        <p className="text-lg text-gray-600">Discover holidays and cultural celebrations from around the world</p>
      </div>

      {/* Country Filter */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-700 mb-3">Filter by Country:</h3>
        <div className="flex flex-wrap gap-2">
          {countries.map(country => (
            <button
              key={country}
              onClick={() => handleCountryFilter(country)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                selectedCountries.includes(country) || (selectedCountries.includes('all') && country === 'all')
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {country === 'all' ? 'All Countries' : country}
            </button>
          ))}
        </div>
      </div>

      {/* Calendar Navigation */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => navigateMonth(-1)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
          Previous
        </button>
        
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold text-gray-800">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h2>
          {loading && (
            <div className="flex items-center gap-2 text-blue-600">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
              <span className="text-sm">Loading holidays...</span>
            </div>
          )}
        </div>
        
        <button
          onClick={() => navigateMonth(1)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Next
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Calendar Grid */}
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        {/* Day Headers */}
        <div className="grid grid-cols-7 bg-gray-50">
          {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(day => (
            <div key={day} className="p-3 text-center font-semibold text-gray-700 border-b border-gray-200">
              {day}
            </div>
          ))}
        </div>
        
        {/* Calendar Days */}
        <div className="grid grid-cols-7">
          {renderCalendar()}
        </div>
      </div>

      {/* Legend */}
      <div className="mt-6 flex items-center justify-center gap-4 text-sm text-gray-600">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500"></div>
          <span>Holiday</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-gradient-to-br from-red-50 to-orange-50 border border-red-200 rounded"></div>
          <span>Day with holidays</span>
        </div>
      </div>

      {/* Holiday Details Modal */}
      {selectedHoliday && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                  <Calendar className="w-6 h-6 text-blue-600" />
                  {monthNames[currentDate.getMonth()]} {selectedHoliday.day}, {currentDate.getFullYear()}
                </h3>
                <button
                  onClick={() => setSelectedHoliday(null)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-6 h-6 text-gray-500" />
                </button>
              </div>
              
              <div className="space-y-6">
                {selectedHoliday.holidays.map((holiday, idx) => (
                  <div key={idx} className="border-l-4 border-blue-500 pl-4">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="text-xl font-semibold text-gray-800">{holiday.name}</h4>
                      <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
                        {holiday.country}
                      </span>
                    </div>
                    <p className="text-gray-700 mb-3 leading-relaxed">{holiday.description}</p>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h5 className="font-semibold text-gray-800 mb-2">Cultural Background:</h5>
                      <p className="text-gray-700 leading-relaxed">{holiday.background}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GlobalHolidayCalendar;