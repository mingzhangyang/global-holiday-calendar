import React, { useEffect } from 'react';
import { X, Calendar, MapPin, Clock, Book } from 'lucide-react';

const HolidayModal = ({ date, holidays, onClose }) => {
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

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div 
      className="modal-overlay animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="modal-content animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Calendar className="text-blue-600" size={20} />
            <h2 className="text-lg font-semibold text-gray-900">
              {formatDate(date)}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors duration-200"
            aria-label="Close modal"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-4 space-y-6">
          {holidays.map((holiday, index) => (
            <div key={index} className="border-l-4 pl-4" style={{ borderColor: holiday.color }}>
              {/* Holiday Header */}
              <div className="mb-3">
                <h3 className="text-xl font-bold text-gray-900 mb-1">
                  {holiday.name}
                </h3>
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <MapPin size={16} />
                  <span className="font-medium">{holiday.country}</span>
                </div>
              </div>

              {/* Holiday Description */}
              <div className="mb-4">
                <p className="text-gray-700 leading-relaxed">
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
                    <h4 className="font-semibold text-gray-900">Significance</h4>
                  </div>
                  <p className="text-gray-700 text-sm leading-relaxed ml-5">
                    {holiday.significance}
                  </p>
                </div>

                {/* Customs */}
                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    <Clock size={16} className="text-gray-500" />
                    <h4 className="font-semibold text-gray-900">Customs & Traditions</h4>
                  </div>
                  <p className="text-gray-700 text-sm leading-relaxed ml-5">
                    {holiday.customs}
                  </p>
                </div>

                {/* History */}
                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    <Book size={16} className="text-gray-500" />
                    <h4 className="font-semibold text-gray-900">Historical Context</h4>
                  </div>
                  <p className="text-gray-700 text-sm leading-relaxed ml-5">
                    {holiday.history}
                  </p>
                </div>
              </div>

              {/* Separator for multiple holidays */}
              {index < holidays.length - 1 && (
                <div className="mt-6 pt-6 border-t border-gray-200" />
              )}
            </div>
          ))}
        </div>

        {/* Modal Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 p-4">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-500">
              {holidays.length} {holidays.length === 1 ? 'holiday' : 'holidays'} on this date
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HolidayModal;