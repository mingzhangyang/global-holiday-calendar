import React, { useState, useEffect } from 'react';
import { X, Calendar, MapPin, Clock, Book, Info } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { fetchHolidayInfo } from '../services/holidayApi';

const HolidayModal = ({ date, holidays, onClose }) => {
  const [detailedInfo, setDetailedInfo] = useState({});
  const [loadingInfo, setLoadingInfo] = useState({});



  // Auto-load detailed information from localStorage when modal opens
  useEffect(() => {
    holidays.forEach((holiday, index) => {
      const cacheKey = `holiday-info-${holiday.name}-${holiday.country}`;
      const cachedData = localStorage.getItem(cacheKey);
      const cachedTimestamp = localStorage.getItem(`${cacheKey}-timestamp`);
      const isExpired = cachedTimestamp && (Date.now() - parseInt(cachedTimestamp)) > (7 * 24 * 60 * 60 * 1000); // 7 days
      
      if (cachedData && !isExpired) {
        setDetailedInfo(prev => ({ ...prev, [index]: cachedData }));
      }
    });
  }, [holidays]);

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
    
    // Check localStorage first
    const cachedData = localStorage.getItem(cacheKey);
    const cachedTimestamp = localStorage.getItem(`${cacheKey}-timestamp`);
    const isExpired = cachedTimestamp && (Date.now() - parseInt(cachedTimestamp)) > (7 * 24 * 60 * 60 * 1000); // 7 days
    
    if (cachedData && !isExpired) {
      setDetailedInfo(prev => ({ ...prev, [index]: cachedData }));
      return;
    }

    setLoadingInfo(prev => ({ ...prev, [index]: true }));
    
    try {
      const info = await fetchHolidayInfo(holiday.name, holiday.country);
      if (info) {
        setDetailedInfo(prev => ({ ...prev, [index]: info }));
        // Cache the data in localStorage
        localStorage.setItem(cacheKey, info);
        localStorage.setItem(`${cacheKey}-timestamp`, Date.now().toString());
      }
    } catch (error) {
      console.error('Error fetching holiday info:', error);
    } finally {
      setLoadingInfo(prev => ({ ...prev, [index]: false }));
    }
  };

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
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl"
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

                {/* Detailed Information Button */}
                <div className="mt-4">
                  <button
                    onClick={() => fetchDetailedInfo(holiday, index)}
                    disabled={loadingInfo[index]}
                    className="flex items-center space-x-2 px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <Info size={16} />
                    <span className="text-sm font-medium">
                      {loadingInfo[index] ? 'Loading...' : detailedInfo[index] ? 'Refresh Information' : 'Get Detailed Information'}
                    </span>
                  </button>
                </div>

                {/* Detailed Information Display */}
                {detailedInfo[index] && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-2">Detailed Background</h4>
                    <div className="text-sm text-gray-700 prose prose-sm max-w-none">
                      <ReactMarkdown 
                        components={{
                          h1: ({children}) => <h1 className="text-lg font-bold text-gray-900 mb-2 mt-4">{children}</h1>,
                          h2: ({children}) => <h2 className="text-base font-semibold text-gray-900 mb-2 mt-4">{children}</h2>,
                          h3: ({children}) => <h3 className="text-sm font-medium text-gray-900 mb-1 mt-3">{children}</h3>,
                          p: ({children}) => <p className="mb-2">{children}</p>,
                          ul: ({children}) => <ul className="list-disc list-inside mb-2">{children}</ul>,
                          ol: ({children}) => <ol className="list-decimal list-inside mb-2">{children}</ol>,
                          li: ({children}) => <li className="text-gray-700">{children}</li>,
                          strong: ({children}) => <strong className="font-semibold text-gray-900">{children}</strong>,
                          em: ({children}) => <em className="italic">{children}</em>,
                          blockquote: ({children}) => <blockquote className="border-l-4 border-gray-300 pl-4 italic text-gray-600 mb-2">{children}</blockquote>
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