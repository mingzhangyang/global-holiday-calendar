const fs = require('fs');
let code = fs.readFileSync('src/App.jsx', 'utf8');

const regex = /<header[\s\S]*?<\/header>/m;

const newHeader = `<header
        className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/92 px-3 py-2 text-slate-900 backdrop-blur-xl sm:px-6 md:px-8"
        role="banner"
        aria-label="Site header"
      >
        <div className="mx-auto max-w-7xl relative z-10 flex items-center justify-between gap-4">
          {/* Logo and Title Section */}
          <div className="flex min-w-0 items-center gap-3 py-1">
            <Logo
              size="medium"
              showText={true}
              useImage={true}
              logoFormat="svg"
              titleAs="h1"
              variant="light"
              className="min-w-0 text-left"
            />
          </div>

          <div className="hidden lg:flex lg:items-center lg:justify-end py-1">
            {renderHeaderControls(false)}
          </div>

          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(open => !open)}
            className="lg:hidden inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white p-2.5 text-slate-700 shadow-sm transition-colors duration-200 hover:bg-slate-50"
            aria-label={isMobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={isMobileMenuOpen}
            aria-controls="mobile-header-menu"
          >
            {isMobileMenuOpen ? <X size={20} aria-hidden="true" /> : <Menu size={20} aria-hidden="true" />}
          </button>

          {isMobileMenuOpen && (
            <>
              <button
                type="button"
                className="lg:hidden fixed inset-0 top-[60px] bg-slate-950/15 backdrop-blur-sm"
                aria-label="Close navigation menu"
                onClick={() => setIsMobileMenuOpen(false)}
              />
              <div
                id="mobile-header-menu"
                className="lg:hidden absolute left-0 right-0 top-full mt-2 rounded-[24px] border border-slate-200 bg-white p-4 shadow-xl"
              >
                {renderHeaderControls(true)}
              </div>
            </>
          )}
        </div>
      </header>`;

code = code.replace(regex, newHeader);
fs.writeFileSync('src/App.jsx', code);
