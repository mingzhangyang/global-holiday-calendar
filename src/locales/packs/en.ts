// 英语
export default {
  // 页面标题和头部
  'app.title': 'Global Holiday Calendar',
  'app.subtitle': 'Discover cultural celebrations worldwide',
  'header.about': 'About',

  // 国家筛选器
  'countryFilter.title': 'Country Filter',
  'countryFilter.expand': 'Expand country filter',
  'countryFilter.collapse': 'Collapse country filter',
  'countryFilter.showingAll': 'Showing all countries',
  'countryFilter.allCountries': 'All countries',
  'countryFilter.selectedCount': '{count} of {total} countries selected',
  'countryFilter.detectingLocation': 'Detecting your location...',
  'countryFilter.basedOnLocation': 'Showing {count} countries based on your location',
  'countryFilter.showAll': 'Show All',
  'countryFilter.clearSelection': 'Clear Selection',
  'countryFilter.smartRecommend': 'Smart Recommend',
  'countryFilter.smartRecommendTooltip': 'Re-detect your location',
  'countryFilter.locationBased': 'Selected {count} countries or regions',
  'countryFilter.moreCountries': '+{count} more countries',
  'countryFilter.searchPlaceholder': 'Search countries...',
  'countryFilter.showAllCountries': 'Show all countries',
  'countryFilter.showPopular': 'Show popular only',
  'countryFilter.limitReached': 'You can compare up to {max} countries at once.',
  'countryFilter.noMatches': 'No countries match your search.',

  // 日历
  'calendar.today': 'Today',
  'calendar.previousMonth': 'Previous month',
  'calendar.nextMonth': 'Next month',
  'calendar.weekdays': ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
  'calendar.months': [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ],
  'calendar.loading': 'Loading holidays...',
  'calendar.swipeHint': 'Swipe across the calendar to change months',

  // 图例
  'legend.title': 'Legend',
  'legend.nationalHoliday': 'National Holiday',
  'legend.culturalFestival': 'Cultural Festival',
  'legend.religiousObservance': 'Religious Observance',
  'legend.traditionalCelebration': 'Traditional Celebration',
  'legend.internationalDay': 'International Day',
  'legend.seasonal': 'Seasonal & Astronomical',
  'legend.description': 'Multiple holidays on the same date are shown with multiple dots. Click any date to learn more.',
  'legend.note': 'Multiple holidays on the same date are shown with multiple dots. Click any date to learn more.',

  // 统计信息
  'stats.globalHolidays': 'Global Holidays',
  'stats.countries': 'Countries',
  'stats.months': 'Months',
  'stats.monthsCoverage': 'Months',

  // 关于页面
  'about.button': 'About',
  'about.title': 'About Global Holiday Calendar',
  'about.description': 'Explore and celebrate cultural diversity through holidays and traditions from around the world. Our interactive calendar helps you discover the rich tapestry of global celebrations, fostering cross-cultural understanding and appreciation.',
  'about.howToUse': 'How to use:',
  'about.usage': [
    'Click on dates with colored dots to learn about holidays',
    'Use the country filter to focus on specific regions',
    'Navigate between months using the arrow buttons',
    'Click "Today" to return to the current date',
    'The app automatically detects your location and shows relevant countries\' holidays',
    'You can select multiple countries simultaneously to view holidays'
  ],
  'faq.title': 'Frequently asked questions',
  'faq.items': [
    {
      question: 'How do I use the Global Holiday Calendar?',
      answer: 'Choose one or more countries, browse the calendar or list view, and click a holiday to learn about its history, customs, and significance.'
    },
    {
      question: 'Which holidays can I discover here?',
      answer: 'The app highlights public holidays, cultural festivals, religious observances, and traditional celebrations from multiple countries.'
    },
    {
      question: 'Can I explore holidays on mobile devices?',
      answer: 'Yes. The interface is optimized for mobile browsers with swipe month navigation, quick filters, and responsive holiday details.'
    },
    {
      question: 'Does the calendar support multiple countries at once?',
      answer: 'Yes. You can compare holidays across selected countries and switch between calendar and list layouts at any time.'
    }
  ],

  // 页脚
  'footer.title': 'Global Holiday Calendar',
   'footer.description': 'Celebrating cultural diversity through shared traditions and holidays',
   'footer.builtWith': 'Built with React & Tailwind CSS',
   'footer.mission': 'Foster cultural understanding',
   'footer.culturalEducation': 'Cultural education through technology',

  // 语言选择器
  'language.selector': 'Language',
  'language.current': 'Current: {language}',
  'language.change': 'Change Language',

  // 列表视图
  'listView.noCountriesSelected': 'No Countries Selected',
  'listView.selectCountriesPrompt': 'Please select one or more countries from the filter to view holidays.',
  'listView.noHolidays': 'No Holidays Found',
  'listView.noHolidaysDescription': 'No holidays found for the selected countries in this month.',
  'listView.viewToggle': 'View',
  'listView.calendarView': 'Calendar View',
  'listView.listView': 'List View',
  'listView.todayDate': '{date} (Today)',
  'listView.holidayCount': '{count} holiday',
  'listView.holidayCountPlural': '{count} holidays',
  'listView.showMoreHolidays': 'Show {count} more holidays',

  // 节日模态框
  'holidayModal.significance': 'Significance',
  'holidayModal.customs': 'Customs & Traditions',
  'holidayModal.historical': 'Historical Context',
  'holidayModal.getDetailed': 'Get Detailed Information',
  'holidayModal.loading': 'Loading...',
  'holidayModal.refresh': 'Refresh Information',
  'holidayModal.detailedBackground': 'Detailed Background',
  'holidayModal.holidayCount': '{count} holiday on this date',
  'holidayModal.holidayCountPlural': '{count} holidays on this date',
  'holidayModal.scrollHint': 'Scroll down to read',
  'holidayModal.loadError': 'Couldn\'t load detailed information. Please try again.',
  'holidayType.public': 'Public holiday',
  'holidayType.religious': 'Religious observance',
  'holidayType.observance': 'Observance',
  'holidayType.national': 'National holiday',
  'holidayType.default': 'Holiday',
  'holidayType.cultural': 'Cultural celebration',
  'holidayType.seasonal': 'Seasonal observance',

  // 错误状态
  'errors.holidaysUnavailable': 'Holidays could not be loaded',
  'errors.holidaysUnavailableDescription': 'The holiday service did not respond. Check your connection and try again.',
  'errors.retry': 'Try again',

  // 通用
  'common.loading': 'Loading...',
  'common.error': 'Error',
  'common.close': 'Close',
  'common.save': 'Save',
  'common.cancel': 'Cancel',
  'common.moreCount': '+{count} more',

  // 搜索
  'search.placeholder': 'Search holidays, countries, or traditions...',
  'search.noResults': 'No holidays found',
  'search.shortcutHint': 'Press ESC to close, ↑↓ to navigate',
  'search.button': 'Search',
  'search.searchHolidays': 'Search Holidays',
  'search.searchAllCountries': 'Search all countries',
  'search.resultCount': '{count} results',

  // 类别筛选
  'categoryFilter.all': 'All Observances',
  'categoryFilter.public': 'Public Holidays',
  'categoryFilter.cultural': 'Cultural Festivals',
  'categoryFilter.astronomical': 'Solar & Astronomical',

  // 主题
  'theme.title': 'Theme',
  'theme.light': 'Light',
  'theme.dark': 'Dark',
  'theme.system': 'System',

  // 导出与分享
  'calendar.addToGoogle': 'Google Calendar',
  'calendar.downloadIcs': 'Download .ics',
  'calendar.share': 'Share',
  'calendar.copied': 'Link Copied!',

  // 下一个节日倒计时 & 洞察卡片
  'stats.nextHoliday': 'Next Upcoming Holiday',
  'stats.daysAway': 'in {days} days',
  'stats.today': 'Today!',
  'stats.tomorrow': 'Tomorrow',
  'stats.inDays': '{days}d',
  'stats.noUpcoming': 'No upcoming holidays',
  'stats.holidayDistribution': 'Holiday Breakdown',
  'stats.totalInMonth': '{count} Holidays',
  'stats.publicCount': '{count} Public',
  'stats.culturalCount': '{count} Cultural',
  'stats.solarCount': '{count} Seasonal',
  'stats.culturalTrivia': 'Cultural Spotlight',
  'stats.shuffleTrivia': 'Shuffle',
  'stats.exploreHoliday': 'Learn more',
  'stats.noDataThisMonth': 'No holidays for current filters',
  'stats.didYouKnow': 'Did you know?',

  // 移动端导航
  'mobileNav.calendar': 'Calendar',
  'mobileNav.list': 'List',
  'mobileNav.search': 'Search',
  'mobileNav.today': 'Today'
};
