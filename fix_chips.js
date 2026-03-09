const fs = require('fs');
let code = fs.readFileSync('src/App.jsx', 'utf8');

const regex = /<div className="mb-5 flex flex-wrap items-center gap-3 sm:mb-8">[\s\S]*?<\/div>\n\n        <div className="grid/m;

const newChips = `<div className="mb-5 flex flex-wrap items-center gap-2 sm:gap-3 sm:mb-8">
          <div className="pill-chip max-w-full border-teal-200/70 bg-teal-50/65 text-teal-800 text-sm">
            {currentView === 'calendar' ? <CalendarViewIcon size={16} aria-hidden="true" /> : <List size={16} aria-hidden="true" />}
            <span>{currentView === 'calendar' ? t('listView.calendarView') : t('listView.listView')}</span>
          </div>
          
          {selectedCountries.length === 0 ? (
            <div className="pill-chip max-w-full border-fuchsia-200/70 bg-fuchsia-50/65 text-fuchsia-800 text-sm">
              <Globe size={16} aria-hidden="true" />
              <span>{t('countryFilter.allCountries')}</span>
            </div>
          ) : (
            selectedCountries.map(country => (
              <button
                key={country}
                type="button"
                onClick={() => updateSelectedCountries(selectedCountries.filter(c => c !== country))}
                className="group flex items-center gap-1.5 rounded-full border border-fuchsia-200/70 bg-fuchsia-50/65 px-3 py-1.5 text-sm text-fuchsia-800 transition-colors hover:bg-fuchsia-100/80 focus:outline-none focus:ring-2 focus:ring-fuchsia-400 focus:ring-offset-1"
                aria-label={\`Remove \${country}\`}
              >
                <MapPin size={14} className="text-fuchsia-600/80" aria-hidden="true" />
                <span className="truncate max-w-[12rem]">{country}</span>
                <X size={14} className="ml-0.5 text-fuchsia-400 opacity-60 transition-all group-hover:text-fuchsia-600 group-hover:opacity-100" aria-hidden="true" />
              </button>
            ))
          )}
        </div>

        <div className="grid`;

code = code.replace(regex, newChips);
fs.writeFileSync('src/App.jsx', code);
