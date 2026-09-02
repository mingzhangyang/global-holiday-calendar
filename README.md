# Global Holiday Calendar 🌍

An interactive React.js application that showcases cultural celebrations and holidays from around the world. Discover the rich diversity of global traditions through an intuitive calendar interface.

## ✨ Features

### 🗓️ Interactive Calendar
- Clean, intuitive calendar interface with month/year navigation
- Visual indicators (colored dots) showing holidays from different countries
- Responsive design that works seamlessly on desktop and mobile devices
- Easy navigation between months and years with "Today" quick access

### 🎉 Holiday Information
- **Statutory days by default**: the API answers with public holidays only; observances,
  festivals, solar terms and equinoxes live in the `extended` scope and load when asked for
- **One canonical taxonomy** — `public`, `religious`, `seasonal`, `cultural`, `observance` —
  shared by the API, the calendar dots, the category chips and the legend, so a colour on
  screen always means the same thing
- **Real-time holiday data** from Nager.Date and Calendarific, merged and de-duplicated at the edge
- **AI-powered detailed information** using Gemini (with Zhipu BigModel fallback)
- **Calculated observances** no provider offers: the 24 Chinese solar terms (China Standard
  Time), equinoxes and solstices (Meeus, resolved to each country's local date), and regional
  seasonal markers
- **Smart caching** at the edge and in the browser: a month is fetched once per country and year

### 🌐 Country Filtering
- Countries are addressed by **ISO 3166-1 alpha-2 code** everywhere — state, URLs, storage and API
- Country list comes from **Nager's live coverage**, with a curated short list of ~56 common
  countries shown first and a searchable long tail behind "show all"
- Names are localized per UI language via `Intl.DisplayNames`; flags are derived from the code
- Up to 12 countries at a time, matching what the API answers in one request

### 📱 User Experience
- Calendar first on phones, with a thumb-zone bottom bar that content never hides behind
- Week starts on the day the visitor's locale starts on (Monday in most of the world)
- Holiday names in the local language when the visitor can read it, English otherwise
- Focus-trapped, escape-closing dialogs that return focus where it came from
- Explicit error states with a retry, instead of an empty month

## 🚀 Getting Started

### Prerequisites
- Node.js (version 16 or higher)
- npm or yarn package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd global-holiday-calendar
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Worker Secrets & API Keys (Optional)**
   
   The application uses a unified Cloudflare Worker architecture (`worker/index.js`) serving both the static frontend and `/api/*` endpoints.

   Configure any desired upstream AI or data API keys as Worker secrets:
   ```bash
   # Set primary AI provider secret (Google Gemini 3.5 Flash-Lite)
   npx wrangler secret put GEMINI_API_KEY

   # Set fallback AI provider secret (Zhipu BigModel GLM-4.7-Flash, format: id.secret)
   npx wrangler secret put ZHIPU_API_KEY

   # (Optional) Set Calendarific API key for extended holiday data
   npx wrangler secret put CALENDARIFIC_API_KEY
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```
   To run both Vite and the local Cloudflare Worker backend concurrently:
   ```bash
   npm run dev:worker
   ```

5. **Open your browser**
   Navigate to `http://localhost:5173` to view the application.

### Checks

```bash
npm run lint          # ESLint over JS, JSX and TS
npm run typecheck     # tsc --noEmit
npm test              # Vitest, run twice at UTC+14 and UTC−11
npm run test:e2e      # Playwright against a production build (browsers: npm run test:e2e:install)
```

### Build & Deploy

```bash
# Build static assets for production
npm run build

# Deploy full-stack application (frontend assets + worker) to Cloudflare
npm run deploy
```

The built files will be in the `dist` directory and deployed alongside the worker.

## 🛠️ Technology Stack

### Frontend Framework
- **React 19.1.0** - Modern React with hooks for state management
- **Vite 7** - Fast build tool, dev server, and asset pipeline
- **TypeScript 5.9** - The data layer (services, hooks, utils, shared types) is typed;
  view components remain `.jsx` and are next in line

### Styling & UI
- **Tailwind CSS 4.1.11** - Utility-first modern CSS framework
- **Lucide React** - Modern, customizable icons
- **Custom CSS animations** - Glassmorphism, shimmers, and micro-interactions
- **Responsive design** - Mobile-first approach with touch swipe support

### Edge & Serverless Backend
- **Cloudflare Workers** - Serverless runtime hosting both static assets and API routes
- **Gemini 3.5 Flash-Lite & Zhipu GLM-4.7-Flash** - Dual-AI pipeline for detailed holiday backgrounds
- **Cloudflare Cache API** - Edge caching for upstream holiday and AI queries

### Development Tools
- **Vitest** - Unit and timezone regression testing
- **Playwright** - End-to-end tests over a production build, with every API call stubbed
- **ESLint + typescript-eslint** - Linting for JS, JSX and TS
- **Wrangler** - Cloudflare developer platform CLI

## 📁 Project Structure

```
global-holiday-calendar/
├── e2e/                          # Playwright specs (stubbed API, real build)
│   ├── calendar.spec.ts          # Month paging, holiday dialog, shared links
│   └── fixtures.ts               # API stubs and a deterministic starting URL
├── public/                       # Static assets, icons, manifest, robots.txt
├── src/
│   ├── components/
│   │   ├── AboutModal.jsx        # About and FAQ modal dialog
│   │   ├── Calendar.jsx          # Month grid (presentational — data comes from App)
│   │   ├── CategoryFilter.jsx    # Public / cultural / seasonal chips
│   │   ├── CountryFilter.jsx     # Searchable country picker (ISO codes)
│   │   ├── HolidayListView.jsx   # Chronological list view
│   │   ├── HolidayModal.jsx      # Holiday detail dialog with AI background
│   │   ├── HolidaySearchModal.jsx# ⌘K search over selected countries, worldwide on request
│   │   ├── HolidayFetchError.jsx # Shared error + retry state for both month views
│   │   ├── Legend.jsx            # Type → colour key, generated from the taxonomy
│   │   ├── MarkdownContent.jsx   # Lazy react-markdown boundary
│   │   ├── MonthNavigationHeader.jsx # The month header both views share
│   │   └── …                     # Widgets, selectors, logo
│   ├── data/trivia/              # Cultural trivia, one lazily loaded module per language
│   ├── hooks/
│   │   ├── useAppInitialization.ts # Geolocation, language, stored preferences
│   │   ├── useCountries.ts       # Country list, localized and sorted
│   │   ├── useDelayedLoading.ts  # Suppresses the spinner on a fast cache hit
│   │   ├── useFocusTrap.ts       # Dialog focus management
│   │   ├── useMonthHolidays.ts   # The single source of month data
│   │   ├── useMonthNavigation.ts # Month paging and the swipe gesture
│   │   ├── useStableCountries.ts # Content-keyed country list for effect deps
│   │   ├── useUpcomingHolidays.ts# Countdown that crosses month and year boundaries
│   │   ├── useSeo.ts             # Dynamic SEO metadata & JSON-LD injection
│   │   ├── useUrlStateSync.ts    # URL ↔ state synchronization
│   │   └── useViewState.ts       # View mode & month state
│   ├── locales/
│   │   ├── translations.ts       # Registry: English bundled, others loaded on demand
│   │   └── packs/                # One module per language
│   ├── services/
│   │   ├── countryService.ts     # ISO codes, localized names, flags
│   │   ├── holidayApi.ts         # Batched, cached, de-duplicated API client
│   │   ├── i18nService.ts        # Locale detection & language mapping
│   │   └── locationService.ts    # Geo/browser-language country resolution
│   ├── utils/
│   │   ├── calendarExport.ts     # .ics, Google Calendar, share links
│   │   ├── categoryUtils.ts      # Category chips → types → request scope
│   │   ├── dateUtils.ts          # Timezone-safe dates, locale week start
│   │   ├── holidayColors.ts      # The taxonomy's palette and per-holiday type
│   │   └── holidayDisplay.ts     # Which name and which countries to show
│   ├── types.ts                  # Shared Holiday / Country shapes
│   ├── App.jsx                   # Application root and data orchestration
│   └── index.css                 # Global Tailwind styles & design tokens
├── worker/
│   ├── countries.js              # ISO helpers, curated whitelist, Nager country list
│   ├── country-list.js           # GET /api/countries
│   ├── holiday-info.js           # POST /api/holiday-info (AI background)
│   ├── holidays.js               # GET /api/holidays (single + batch, scoped)
│   ├── ics.js                    # GET /api/holidays.ics (subscribable feed)
│   ├── observances.js            # Solar terms, equinoxes/solstices, regional markers
│   ├── pages.js                  # Edge-rendered /{cc}/{yyyy-mm} pages + sitemap
│   ├── search.js                 # GET /api/holidays/search
│   └── index.js                  # Routing for /api/*, indexable pages, static assets
├── shared/                       # Imported by BOTH the Worker and the bundle
│   ├── api-limits.js             # The batch ceiling the API and the picker share
│   ├── holiday-taxonomy.js       # Provider type → canonical type, the one copy
│   └── ics-format.js             # RFC 5545 escaping, dates, and octet-safe folding
├── playwright.config.ts          # E2E config (builds and previews the app)
├── tsconfig.json                 # TypeScript configuration
├── wrangler.toml                 # Cloudflare Worker & Assets configuration
└── README.md
```

## 🎨 Component Architecture

### Calendar Component
- Renders the month grid from the data `App` hands it — it fetches nothing itself
- Builds the grid around the locale's first day of the week
- Colours every dot through the shared taxonomy, so the legend explains the grid
- Responsive layout with touch swipe between months

### HolidayModal Component
- Displays detailed holiday information for every holiday on a date
- Focus trapped while open, escape closes, focus returns to the trigger
- Loads `react-markdown` only when AI background is actually shown
- Add to Google Calendar, download `.ics`, or copy a link that reopens the holiday

### CountryFilter Component
- Selection by ISO code, with search over the full list from `/api/countries`
- Curated countries first, the long tail behind "show all"
- Localized names and code-derived flag emoji
- Caps the selection at what the API answers in one request

### Holiday Data Architecture
- **Real-time API integration** via Cloudflare Workers
- **Multiple data sources** (Nager.Date, Calendarific)
- **AI-powered enrichment** using Gemini (with Zhipu BigModel fallback)
- **Smart caching** for performance optimization
- **Fallback mechanisms** for reliable data delivery

## 🌟 Key Features in Detail

## 🔧 API Architecture

Everything — the API, the indexable pages and the static assets — is served by one
Cloudflare Worker (`worker/index.js`).

### Endpoints

| Endpoint | What it does |
|---|---|
| `GET /api/holidays?year=2026&country=US` | Statutory public holidays for one country |
| `GET /api/holidays?year=2026&countries=US,GB,JP&scope=all` | Up to 12 countries in one request; `scope=all` adds observances, festivals and seasonal markers |
| `GET /api/holidays/search?q=diwali&year=2026` | Cross-country search, executed at the edge where the data is already cached |
| `GET /api/holidays.ics?country=CN&years=2` | Subscribable calendar feed (RFC 5545), refreshed daily by the client |
| `GET /api/countries` | Nager's live coverage, curated short list flagged `popular` |
| `POST /api/holiday-info` | AI-written cultural background (rate limited per IP) |
| `GET /api/geo` | Visitor's country from Cloudflare request metadata |
| `GET /{cc}/{yyyy-mm}` | Edge-rendered, indexable page, e.g. `/jp/2026-05` |
| `GET /sitemap.xml` | Generated over a rolling window of months |

`scope` defaults to `public`. The edge cache always stores the full set per country and
year, so switching scope in the UI is a filter, not another upstream fetch.

#### Holiday data (`holidays.js`, `observances.js`, `shared/holiday-taxonomy.js`)
- **Multiple sources**: Nager.Date and Calendarific, merged by date and name, with Nager
  authoritative for statutory days and a statutory classification from either winning
- **Canonical types**: every provider's free-form `type` is mapped onto the five-type
  taxonomy the client renders — one implementation in `shared/`, imported by both sides,
  so the Worker and the legend can never disagree about what a day is
- **Calculated observances**: solar terms via the 通用寿星公式 in China Standard Time (the
  leap-day correction changes at 惊蛰, and a short table covers the terms the linear fit
  misses by minutes), and equinoxes/solstices via Meeus' periodic series converted to each
  country's local date
- **Graceful degradation**: an upstream failure (or Nager's `204` for countries it does not
  cover) leaves the remaining sources and calculated observances in place; in a batch, a
  country that cannot be answered is reported in `failed` rather than returned empty, so
  the client can tell "no data" from "no holidays"

#### Holiday info (`holiday-info.js`)
- **AI Integration**: Gemini primary, Zhipu BigModel fallback
- **JWT Authentication**: token generation for the Zhipu API
- **Rate limited** per client IP through a Workers rate-limit binding

#### Indexable pages (`pages.js`)
- Server-rendered HTML for "public holidays in *country* in *month*", the query the SPA
  could never answer for a crawler
- Canonical URL, `Event` JSON-LD, prev/next month links, and a link into the app
- A rolling sitemap replaces the static file, which could not track a moving window

### Data Flow
1. **One month fetch**: `useMonthHolidays` in `App.jsx` is the only place a month is loaded;
   the calendar, the list and the widgets all read its result
2. **Batched**: the selected countries go out as one request, and each country's year is
   cached separately in memory, `localStorage`, and at the edge
3. **Scoped**: only categories beyond public holidays ask for the extended payload
4. **Enriched on demand**: AI background is fetched when a visitor asks for it, then cached
   for a week in the browser

### Holiday Database
The application provides comprehensive global holiday coverage:
- **Real-time data** from multiple authoritative sources
- **190+ countries** supported through API integration
- **Cultural significance** and historical context via AI
- **Traditional customs** and celebration methods
- **Color-coded indicators** for easy identification

### Responsive Design
- **Mobile-first approach** ensuring great experience on all devices
- **Flexible grid system** that adapts to screen sizes
- **Touch-friendly interactions** for mobile users
- **Optimized typography** for readability

### Accessibility Features
- **Keyboard navigation** support
- **Screen reader friendly** with proper ARIA labels
- **High contrast** color schemes
- **Focus management** for modal interactions

## 🔧 Customization

### Adding Supported Countries & Observances
Countries come from Nager's live list at runtime; to promote one into the curated short list,
add its ISO code to `POPULAR_COUNTRY_CODES` in `worker/countries.js` (and its English name to
`COUNTRY_NAMES`). Calculated observances for a country live in `worker/observances.js` —
extend `getCulturalObservances` there. Both are covered by `worker/*.test.js`.

### Styling Customization
Modify `tailwind.config.js` to customize:
- Color schemes
- Typography
- Spacing and layout
- Animation timings

### Component Customization
Each component is modular and can be easily customized:
- Modify component props for different behaviors
- Adjust styling classes for visual changes
- Extend functionality with additional features

## 📱 Browser Support

- **Chrome** (latest)
- **Firefox** (latest)
- **Safari** (latest)
- **Edge** (latest)
- **Mobile browsers** (iOS Safari, Chrome Mobile)

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

### Development Guidelines
1. Follow the existing code style and conventions
2. Add appropriate comments for complex logic
3. Test your changes on multiple screen sizes
4. Ensure accessibility standards are maintained

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🙏 Acknowledgments

- Holiday information sourced from various cultural and historical references
- Icons provided by [Lucide React](https://lucide.dev/)
- Built with [React](https://reactjs.org/) and [Tailwind CSS](https://tailwindcss.com/)
- Developed with [Vite](https://vitejs.dev/) for optimal performance

---

**Celebrate diversity. Explore cultures. Connect globally.** 🌍✨
