import React, { useState, useEffect, useMemo } from 'react';
import { Calendar, MapPin, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import { getHolidaysForMonth } from '../services/holidayApi';
import HolidayModal from './HolidayModal';
import { useTranslation } from '../hooks/useI18n';

const HolidayListView = ({ selectedCountries }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [monthHolidays, setMonthHolidays] = useState({});
  const [loading, setLoading] = useState(false);
  const [selectedHoliday, setSelectedHoliday] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [expandedDates, setExpandedDates] = useState(new Set());
  const { t } = useTranslation();

  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  // Fetch holidays for the current month
  useEffect(() => {
    const fetchMonthHolidays = async () => {
      setLoading(true);
      try {
        const holidays = await getHolidaysForMonth(currentYear, currentMonth, selectedCountries);
        setMonthHolidays(holidays);
      } catch (error) {
        console.error('Error fetching holidays:', error);
        setMonthHolidays({});
      } finally {
        setLoading(false);
      }
    };

    fetchMonthHolidays();
  }, [currentYear, currentMonth, selectedCountries]);

  // Process holidays into sorted list
  const holidaysList = useMemo(() => {
    const holidays = [];
    
    Object.entries(monthHolidays).forEach(([dateStr, dayHolidays]) => {
      const date = new Date(dateStr);
      holidays.push({
        date,
        dateStr,
        holidays: dayHolidays
      });
    });

    return holidays.sort((a, b) => a.date - b.date);
  }, [monthHolidays]);

  const navigateMonth = (direction) => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + direction);
      return newDate;
    });
  };

  const navigateToToday = () => {
    setCurrentDate(new Date());
  };

  const handleHolidayClick = (dateInfo) => {
    setSelectedHoliday(dateInfo);
    setIsModalOpen(true);
  };

  const toggleDateExpansion = (dateStr) => {
    const newExpanded = new Set(expandedDates);
    if (newExpanded.has(dateStr)) {
      newExpanded.delete(dateStr);
    } else {
      newExpanded.add(dateStr);
    }
    setExpandedDates(newExpanded);
  };

  const formatDate = (date) => {
    const today = new Date();
    const isToday = date.toDateString() === today.toDateString();
    
    const options = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    
    const formatted = date.toLocaleDateString('en-US', options);
    return isToday ? `${formatted} (Today)` : formatted;
  };

  const monthNames = t('calendar.months');

  if (selectedCountries.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-8 text-center">
        <Calendar className="w-16 h-16 mx-auto text-gray-400 mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {t('listView.noCountriesSelected')}
        </h3>
        <p className="text-gray-600">
          {t('listView.selectCountriesPrompt')}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => navigateMonth(-1)}
            className="p-2 hover:bg-white/20 rounded-full transition-colors duration-200"
            aria-label={t('calendar.previousMonth')}
          >
            <ChevronDown className="w-5 h-5 transform rotate-90" />
          </button>
          
          <div className="text-center">
            <h2 className="text-2xl font-bold">
              {monthNames[currentMonth]} {currentYear}
            </h2>
            <button
              onClick={navigateToToday}
              className="text-sm opacity-80 hover:opacity-100 transition-opacity duration-200 mt-1"
            >
              {t('calendar.today')}
            </button>
          </div>
          
          <button
            onClick={() => navigateMonth(1)}
            className="p-2 hover:bg-white/20 rounded-full transition-colors duration-200"
            aria-label={t('calendar.nextMonth')}
          >
            <ChevronUp className="w-5 h-5 transform rotate-90" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {loading && (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">{t('calendar.loading')}</span>
          </div>
        )}

        {!loading && holidaysList.length === 0 && (
          <div className="text-center py-8">
            <Calendar className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {t('listView.noHolidays')}
            </h3>
            <p className="text-gray-600">
              {t('listView.noHolidaysDescription')}
            </p>
          </div>
        )}

        {!loading && holidaysList.length > 0 && (
          <div className="space-y-4">
            {holidaysList.map((dateInfo) => {
              const isExpanded = expandedDates.has(dateInfo.dateStr);
              const visibleHolidays = isExpanded ? dateInfo.holidays : dateInfo.holidays.slice(0, 2);
              const hasMore = dateInfo.holidays.length > 2;

              return (
                <div key={dateInfo.dateStr} className="border border-gray-200 rounded-lg overflow-hidden">
                  {/* Date Header */}
                  <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-5 h-5 text-blue-600" />
                        <h3 className="text-lg font-semibold text-gray-900">
                          {formatDate(dateInfo.date)}
                        </h3>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-600">
                          {dateInfo.holidays.length} {dateInfo.holidays.length === 1 ? 'holiday' : 'holidays'}
                        </span>
                        {hasMore && (
                          <button
                            onClick={() => toggleDateExpansion(dateInfo.dateStr)}
                            className="p-1 hover:bg-gray-200 rounded transition-colors duration-200"
                          >
                            {isExpanded ? (
                              <ChevronUp className="w-4 h-4 text-gray-600" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-gray-600" />
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Holidays List */}
                  <div className="divide-y divide-gray-100">
                    {visibleHolidays.map((holiday, index) => (
                      <div
                        key={index}
                        onClick={() => handleHolidayClick(dateInfo)}
                        className="p-4 hover:bg-gray-50 cursor-pointer transition-colors duration-200"
                      >
                        <div className="flex items-start space-x-3">
                          <div
                            className="w-3 h-3 rounded-full mt-2 flex-shrink-0"
                            style={{ backgroundColor: holiday.color || '#3B82F6' }}
                          />
                          <div className="flex-1 min-w-0">
                            <h4 className="text-lg font-medium text-gray-900 mb-1">
                              {holiday.name}
                            </h4>
                            <div className="flex items-center space-x-4 text-sm text-gray-600">
                              <div className="flex items-center space-x-1">
                                <MapPin className="w-4 h-4" />
                                <span>{holiday.country}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Clock className="w-4 h-4" />
                                <span className="capitalize">{holiday.type || 'Holiday'}</span>
                              </div>
                            </div>
                            {holiday.description && (
                              <p className="text-sm text-gray-700 mt-2 line-clamp-2">
                                {holiday.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {hasMore && !isExpanded && (
                      <div className="p-4 bg-gray-50">
                        <button
                          onClick={() => toggleDateExpansion(dateInfo.dateStr)}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors duration-200"
                        >
                          Show {dateInfo.holidays.length - 2} more holidays
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Holiday Modal */}
      {isModalOpen && selectedHoliday && (
        <HolidayModal
          date={selectedHoliday.date}
          holidays={selectedHoliday.holidays}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </div>
  );
};

export default HolidayListView;