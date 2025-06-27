import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { getHolidaysForMonth, getHolidaysForDate } from '../data/holidays';
import HolidayModal from './HolidayModal';

const Calendar = ({ selectedCountries, onDateClick }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const today = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  // Get holidays for the current month
  const monthHolidays = useMemo(() => {
    return getHolidaysForMonth(currentYear, currentMonth, selectedCountries);
  }, [currentYear, currentMonth, selectedCountries]);

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
    const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);
    const firstDayOfWeek = firstDayOfMonth.getDay();
    const daysInMonth = lastDayOfMonth.getDate();

    const days = [];

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
        holidays: getHolidaysForDate(date, selectedCountries)
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
        holidays: getHolidaysForDate(date, selectedCountries)
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
        holidays: getHolidaysForDate(date, selectedCountries)
      });
    }

    return days;
  }, [currentYear, currentMonth, selectedCountries, today]);

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

  const handleDateClick = (dayInfo) => {
    if (dayInfo.holidays.length > 0) {
      setSelectedDate(dayInfo);
      setIsModalOpen(true);
    }
    if (onDateClick) {
      onDateClick(dayInfo);
    }
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Calendar Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => navigateMonth(-1)}
            className="p-2 hover:bg-white/20 rounded-full transition-colors duration-200"
            aria-label="Previous month"
          >
            <ChevronLeft size={20} />
          </button>
          
          <div className="text-center">
            <h2 className="text-2xl font-bold">
              {monthNames[currentMonth]} {currentYear}
            </h2>
            <button
              onClick={navigateToToday}
              className="text-sm opacity-80 hover:opacity-100 transition-opacity duration-200 mt-1"
            >
              Today
            </button>
          </div>
          
          <button
              onClick={() => navigateMonth(1)}
              className="p-2 hover:bg-white/20 rounded-full transition-colors duration-200"
              aria-label="Next month"
          >
            <ChevronRight size={20} />
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
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((dayInfo, index) => {
            const hasHolidays = dayInfo.holidays.length > 0;
            
            return (
              <div
                key={index}
                onClick={() => handleDateClick(dayInfo)}
                className={`
                  calendar-cell h-12 sm:h-16
                  ${
                    dayInfo.isToday
                      ? 'today'
                      : dayInfo.isCurrentMonth
                      ? 'bg-white hover:bg-gray-50'
                      : 'other-month'
                  }
                  ${
                    hasHolidays
                      ? 'cursor-pointer hover:bg-blue-50 border-blue-200'
                      : dayInfo.isCurrentMonth
                      ? 'cursor-default'
                      : 'cursor-default'
                  }
                `}
              >
                <span className={`text-sm font-medium ${
                  dayInfo.isCurrentMonth ? 'text-gray-900' : 'text-gray-400'
                }`}>
                  {dayInfo.day}
                </span>
                
                {/* Holiday indicators */}
                {hasHolidays && (
                  <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex space-x-1">
                    {dayInfo.holidays.slice(0, 3).map((holiday, holidayIndex) => (
                      <div
                        key={holidayIndex}
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: holiday.color }}
                        title={holiday.name}
                      />
                    ))}
                    {dayInfo.holidays.length > 3 && (
                      <div className="text-xs text-gray-600 ml-1">
                        +{dayInfo.holidays.length - 3}
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