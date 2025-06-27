import React, { useState, useEffect, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getHolidaysForMonth, getHolidaysForDate } from '../services/holidayApi';
import HolidayModal from './HolidayModal';
import { useTranslation } from '../hooks/useI18n';

const Calendar = ({ selectedCountries, onDateClick }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [monthHolidays, setMonthHolidays] = useState({});
  const [loading, setLoading] = useState(false);
  const { t } = useTranslation();

  const today = new Date();
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

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
    const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);
    const firstDayOfWeek = firstDayOfMonth.getDay();
    const daysInMonth = lastDayOfMonth.getDate();

    const days = [];

    // Helper function to get holidays for a date from monthHolidays
    const getHolidaysForDateFromCache = (date) => {
      const dateStr = date.toISOString().split('T')[0];
      return monthHolidays[dateStr] || [];
    };

    // Add previous month's trailing days
    const prevMonth = new Date(currentYear, currentMonth - 1, 0);
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const day = prevMonth.getDate() - i;
      const date = new Date(currentYear, currentMonth - 1, day);
      days.push({
        date,
        day,
        isCurrentMonth: false,
        isToday: false,
        holidays: [] // Don't show holidays for previous month days
      });
    }

    // Add current month's days
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentYear, currentMonth, day);
      const isToday = date.toDateString() === today.toDateString();
      days.push({
        date,
        day,
        isCurrentMonth: true,
        isToday,
        holidays: getHolidaysForDateFromCache(date)
      });
    }

    // Add next month's leading days
    const remainingDays = 42 - days.length; // 6 rows × 7 days
    for (let day = 1; day <= remainingDays; day++) {
      const date = new Date(currentYear, currentMonth + 1, day);
      days.push({
        date,
        day,
        isCurrentMonth: false,
        isToday: false,
        holidays: [] // Don't show holidays for next month days
      });
    }

    return days;
  }, [currentYear, currentMonth, monthHolidays, today]);

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

  const handleDateClick = async (dayInfo) => {
    if (dayInfo.holidays.length > 0) {
      setSelectedDate(dayInfo);
      setIsModalOpen(true);
      
      // Pre-fetch detailed information for all holidays on this date
      dayInfo.holidays.forEach(async (holiday, index) => {
        const cacheKey = `holiday-info-${holiday.name}-${holiday.country}`;
        
        // Check if data is already in localStorage
        const cachedData = localStorage.getItem(cacheKey);
        const cachedTimestamp = localStorage.getItem(`${cacheKey}-timestamp`);
        const isExpired = cachedTimestamp && (Date.now() - parseInt(cachedTimestamp)) > (7 * 24 * 60 * 60 * 1000); // 7 days
        
        if (!cachedData || isExpired) {
          try {
            const { fetchHolidayInfo } = await import('../services/holidayApi');
            const info = await fetchHolidayInfo(holiday.name, holiday.country);
            if (info) {
              localStorage.setItem(cacheKey, info);
              localStorage.setItem(`${cacheKey}-timestamp`, Date.now().toString());
            }
          } catch (error) {
            console.error('Error pre-fetching holiday info:', error);
          }
        }
      });
    }
    if (onDateClick) {
      onDateClick(dayInfo);
    }
  };

  const monthNames = t('calendar.months');
  const dayNames = t('calendar.weekdays');

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Calendar Header */}
      <div className="text-white p-4" style={{backgroundColor: '#ff8c00'}}>
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => navigateMonth(-1)}
            className="p-2 hover:bg-white/20 rounded-full transition-colors duration-200"
            aria-label={t('calendar.previousMonth')}
          >
            <ChevronLeft className="w-5 h-5" />
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
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
        
        {/* Day headers */}
        <div className="grid grid-cols-7 gap-1">
          {dayNames.map(day => (
            <div key={day} className="text-center text-sm font-medium py-2">
              {day}
            </div>
          ))}
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="p-4">
        {loading && (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{borderBottomColor: '#ff8c00'}}></div>
            <span className="ml-2 text-gray-600">{t('calendar.loading')}</span>
          </div>
        )}
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((dayInfo, index) => {
            const hasHolidays = dayInfo.holidays.length > 0;
            
            return (
              <div
                key={index}
                onClick={() => handleDateClick(dayInfo)}
                className={`
                  relative flex flex-col p-1 border rounded-lg transition-all duration-200
                  ${
                    dayInfo.isToday
                      ? 'text-white shadow-md'
                      : hasHolidays && dayInfo.isCurrentMonth
                      ? 'bg-gradient-to-br from-green-50 border-green-200 shadow-sm'
                      : dayInfo.isCurrentMonth
                      ? 'bg-white border-gray-200 hover:bg-gray-50'
                      : 'bg-gray-50 border-gray-100'
                  }
                  ${
                    hasHolidays
                      ? 'cursor-pointer hover:shadow-md hover:scale-105 transform'
                      : dayInfo.isCurrentMonth
                      ? 'cursor-default'
                      : 'cursor-default'
                  }
                  min-h-16 sm:min-h-20
                `}
                style={dayInfo.isToday ? {backgroundColor: '#ff8c00', borderColor: '#ff8c00'} : hasHolidays && dayInfo.isCurrentMonth ? {background: 'linear-gradient(to bottom right, #f0fdf4, #fff5e6)'} : {}}
              >
                <div className="flex justify-between items-start w-full mb-1">
                  <span className={`text-sm font-semibold ${
                    dayInfo.isToday
                      ? 'text-white'
                      : dayInfo.isCurrentMonth 
                      ? 'text-gray-900' 
                      : 'text-gray-400'
                  }`}>
                    {dayInfo.day}
                  </span>
                  
                  {/* Holiday indicators */}
                  {hasHolidays && (
                    <div className="flex flex-wrap gap-1">
                      {dayInfo.holidays.slice(0, 3).map((holiday, holidayIndex) => (
                        <div
                          key={holidayIndex}
                          className="w-2 h-2 rounded-full shadow-sm"
                          style={{ backgroundColor: holiday.color || '#3B82F6' }}
                          title={holiday.name}
                        />
                      ))}
                      {dayInfo.holidays.length > 3 && (
                        <div className="text-xs text-gray-600 font-medium">
                          +{dayInfo.holidays.length - 3}
                        </div>
                      )}
                    </div>
                  )}
                </div>
                
                {/* Holiday names */}
                {hasHolidays && dayInfo.isCurrentMonth && (
                  <div className="flex-1 w-full">
                    {dayInfo.holidays.slice(0, 2).map((holiday, holidayIndex) => (
                      <div
                        key={holidayIndex}
                        className={`text-xs leading-tight mb-1 truncate ${
                          dayInfo.isToday
                            ? ''
                            : 'text-gray-700'
                        }`}
                        style={dayInfo.isToday ? {color: '#ffcc99'} : {}}
                        title={holiday.name}
                      >
                        {holiday.name}
                      </div>
                    ))}
                    {dayInfo.holidays.length > 2 && (
                      <div className={`text-xs font-medium ${
                        dayInfo.isToday
                          ? ''
                          : 'text-gray-500'
                      }`}
                      style={dayInfo.isToday ? {color: '#ffe6cc'} : {}}>
                        +{dayInfo.holidays.length - 2} more
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Holiday Modal */}
      {isModalOpen && selectedDate && (
        <HolidayModal
          date={selectedDate.date}
          holidays={selectedDate.holidays}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </div>
  );
};

export default Calendar;