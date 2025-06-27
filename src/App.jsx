import React, { useState } from 'react';
import { Calendar as CalendarIcon, Globe, Info } from 'lucide-react';
import Calendar from './components/Calendar';
import CountryFilter from './components/CountryFilter';

function App() {
  const [selectedCountries, setSelectedCountries] = useState([]);
  const [showInfo, setShowInfo] = useState(false);

  const handleCountriesChange = (countries) => {
    setSelectedCountries(countries);
  };

  const handleDateClick = (dayInfo) => {
    // Optional: Add any additional date click handling here
    console.log('Date clicked:', dayInfo);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-2 rounded-lg">
                <CalendarIcon className="text-white" size={24} />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  Global Holiday Calendar
                </h1>
                <p className="text-sm text-gray-600">
                  Discover cultural celebrations worldwide
                </p>
              </div>
            </div>
            
            <button
              onClick={() => setShowInfo(!showInfo)}
              className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors duration-200"
            >
              <Info size={18} />
              <span className="hidden sm:inline">About</span>
            </button>
          </div>
        </div>
      </header>

      {/* Info Panel */}
      {showInfo && (
        <div className="bg-blue-50 border-b border-blue-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center space-x-2">
                <Globe className="text-blue-600" size={20} />
                <span>About Global Holiday Calendar</span>
              </h3>
              <div className="text-gray-700 space-y-2 text-sm">
                <p>
                  Explore cultural celebrations from around the world! This interactive calendar showcases 
                  major holidays, festivals, and cultural observances from different countries and regions.
                </p>
                <p>
                  <strong>How to use:</strong>
                </p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Click on dates with colored dots to learn about holidays</li>
                  <li>Use the country filter to focus on specific regions</li>
                  <li>Navigate between months using the arrow buttons</li>
                  <li>Click "Today" to return to the current date</li>
                </ul>
                <p className="text-xs text-gray-500 mt-3">
                  Holiday information includes cultural significance, traditional customs, and historical context.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Country Filter Sidebar */}
          <div className="lg:col-span-1">
            <CountryFilter
              selectedCountries={selectedCountries}
              onCountriesChange={handleCountriesChange}
            />
            
            {/* Legend */}
            <div className="mt-6 bg-white rounded-lg shadow-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Legend</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-blue-600 rounded-full" />
                  <span className="text-gray-700">National Holiday</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-600 rounded-full" />
                  <span className="text-gray-700">Cultural Festival</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-purple-600 rounded-full" />
                  <span className="text-gray-700">Religious Observance</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-orange-600 rounded-full" />
                  <span className="text-gray-700">Traditional Celebration</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-gray-600 rounded-full" />
                  <span className="text-gray-700">International Day</span>
                </div>
              </div>
              
              <div className="mt-4 pt-3 border-t border-gray-200">
                <p className="text-xs text-gray-500">
                  Multiple holidays on the same date are shown with multiple dots.
                  Click any date with indicators to learn more.
                </p>
              </div>
            </div>
          </div>

          {/* Calendar Main Area */}
          <div className="lg:col-span-3">
            <Calendar
              selectedCountries={selectedCountries}
              onDateClick={handleDateClick}
            />
            
            {/* Quick Stats */}
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white rounded-lg shadow-lg p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">50+</div>
                <div className="text-sm text-gray-600">Global Holidays</div>
              </div>
              <div className="bg-white rounded-lg shadow-lg p-4 text-center">
                <div className="text-2xl font-bold text-green-600">15+</div>
                <div className="text-sm text-gray-600">Countries</div>
              </div>
              <div className="bg-white rounded-lg shadow-lg p-4 text-center">
                <div className="text-2xl font-bold text-purple-600">12</div>
                <div className="text-sm text-gray-600">Months</div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <CalendarIcon size={20} />
              <span className="text-lg font-semibold">Global Holiday Calendar</span>
            </div>
            <p className="text-gray-400 text-sm mb-4">
              Celebrating cultural diversity through shared traditions and holidays
            </p>
            <div className="flex items-center justify-center space-x-6 text-sm text-gray-400">
              <span>Built with React & Tailwind CSS</span>
              <span>•</span>
              <span>Cultural education through technology</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;