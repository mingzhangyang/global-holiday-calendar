# Global Holiday Calendar 🌍

An interactive React.js application that showcases cultural celebrations and holidays from around the world. Discover the rich diversity of global traditions through an intuitive calendar interface.

## ✨ Features

### 🗓️ Interactive Calendar
- Clean, intuitive calendar interface with month/year navigation
- Visual indicators (colored dots) showing holidays from different countries
- Responsive design that works seamlessly on desktop and mobile devices
- Easy navigation between months and years with "Today" quick access

### 🎉 Holiday Information
- **Real-time holiday data** fetched from multiple APIs via Cloudflare Workers
- **AI-powered detailed information** using Gemini (with Zhipu BigModel fallback) for comprehensive holiday backgrounds
- Comprehensive holiday coverage including:
  - Holiday name and significance
  - Country/region of origin
  - Cultural background and historical context
  - Traditional customs and celebrations
  - Visual country flags and themed colors
- **Smart caching** for improved performance and reduced API calls
- **Multiple data sources** including Nager.Date and Calendarific APIs

### 🌐 Country Filtering
- Advanced country filter system to focus on specific regions
- Toggle between different country views or show all holidays
- Visual country selection with flags and intuitive interface
- Real-time filtering with smooth transitions

### 📱 User Experience
- Smooth popup animations for holiday details
- Accessible interface designed for public use
- Clear visual hierarchy distinguishing regular days from holidays
- Modal system with detailed holiday information
- Keyboard navigation support (ESC to close modals)

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
- **JavaScript (ES6+)** - Modern ES Modules

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
- **ESLint** - Code linting and quality assurance
- **Wrangler** - Cloudflare developer platform CLI

## 📁 Project Structure

```
global-holiday-calendar/
├── public/                       # Static public assets, icons, manifest, sitemap
│   ├── logo.svg
│   ├── logo.png
│   ├── site.webmanifest
│   └── sitemap.xml
├── src/
│   ├── components/
│   │   ├── AboutModal.jsx        # About and FAQ modal dialog
│   │   ├── Calendar.jsx          # Main 6-week interactive calendar grid
│   │   ├── CountryFilter.jsx     # Country selection & filter sidebar
│   │   ├── HolidayListView.jsx   # Chronological list view
│   │   ├── HolidayModal.jsx      # Detailed holiday modal with AI background
│   │   ├── LanguageSelector.jsx  # Multi-language selector dropdown
│   │   ├── Legend.jsx            # Color legend for holiday categories
│   │   └── Logo.jsx              # Responsive brand logo component
│   ├── hooks/
│   │   ├── useAppInitialization.js # Geolocation & language auto-detection
│   │   ├── useI18n.js            # Internationalization hook & state
│   │   ├── useSeo.js             # Dynamic SEO metadata & JSON-LD injection
│   │   ├── useUrlStateSync.js    # Bidirectional URL search param synchronization
│   │   └── useViewState.js       # View mode & month state management
│   ├── locales/
│   │   └── translations.js       # Dictionaries for 8 supported languages
│   ├── services/
│   │   ├── holidayApi.js         # API client & client-side localStorage caching
│   │   ├── i18nService.js        # Locale detection & language mapping
│   │   └── locationService.js    # IP geolocation & browser language resolver
│   ├── utils/
│   │   ├── dateUtils.js          # Timezone-safe calendar date formatting & parsing
│   │   └── dateUtils.test.js     # Vitest suite for extreme timezones
│   ├── App.jsx                   # Main application root
│   ├── main.jsx                  # Application entry point
│   └── index.css                 # Global Tailwind styles & design tokens
├── worker/
│   ├── holiday-info.js           # Cloudflare Worker for AI cultural background
│   ├── holidays.js               # Cloudflare Worker for holiday data & observances
│   └── index.js                  # Worker entry point routing /api/* & static assets
├── index.html                    # HTML template with SEO meta & schema tags
├── package.json                  # Dependencies and scripts
├── wrangler.toml                 # Cloudflare Worker & Assets configuration
└── README.md                     # Project documentation
```

## 🎨 Component Architecture

### Calendar Component
- Manages calendar state and navigation
- Generates calendar grid with proper date handling
- Handles holiday display and user interactions
- Responsive grid layout with mobile optimization

### HolidayModal Component
- Displays detailed holiday information
- Smooth animations and transitions
- Keyboard accessibility (ESC to close)
- Scrollable content for multiple holidays

### CountryFilter Component
- Country selection and filtering logic
- Expandable/collapsible interface
- Visual country representation with flags
- Real-time filter application

### Holiday Data Architecture
- **Real-time API integration** via Cloudflare Workers
- **Multiple data sources** (Nager.Date, Calendarific)
- **AI-powered enrichment** using Gemini (with Zhipu BigModel fallback)
- **Smart caching** for performance optimization
- **Fallback mechanisms** for reliable data delivery

## 🌟 Key Features in Detail

## 🔧 API Architecture

### Cloudflare Workers Integration
The application uses a modern serverless architecture with Cloudflare Workers:

#### Holiday Data Worker (`holidays.js`)
- **Multiple API Sources**: Fetches data from Nager.Date and Calendarific APIs
- **Smart Caching**: Implements intelligent caching with configurable TTL
- **CORS Support**: Handles cross-origin requests for web applications
- **Error Handling**: Robust fallback mechanisms and error recovery
- **Data Normalization**: Standardizes holiday data from different sources

#### Holiday Info Worker (`holiday-info.js`)
- **AI Integration**: Uses Gemini (primary) with Zhipu BigModel as fallback for detailed holiday background information
- **JWT Authentication**: Secure API authentication with token generation
- **Cultural Context**: Provides rich cultural and historical information
- **Async Processing**: Handles AI API calls with proper error handling

### Data Flow
1. **Frontend Request**: React app requests holiday data for specific month/country
2. **Worker Processing**: Cloudflare Worker fetches from multiple APIs
3. **Data Enrichment**: Optional AI-powered detailed information
4. **Caching**: Results cached for improved performance
5. **Response**: Normalized data returned to frontend

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
- **Supported Country Codes:** Update `SUPPORTED_COUNTRIES` and `COUNTRY_NAMES` in [`src/services/holidayApi.js`](file:///home/mingzhang/github/global-holiday-calendar/src/services/holidayApi.js) and [`src/services/locationService.js`](file:///home/mingzhang/github/global-holiday-calendar/src/services/locationService.js).
- **Custom Cultural Observances:** Add or adjust algorithmic holiday rules in [`worker/holidays.js`](file:///home/mingzhang/github/global-holiday-calendar/worker/holidays.js) (under `getCulturalObservances`).

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
