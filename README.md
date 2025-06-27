# Global Holiday Calendar 🌍

An interactive React.js application that showcases cultural celebrations and holidays from around the world. Discover the rich diversity of global traditions through an intuitive calendar interface.

## ✨ Features

### 🗓️ Interactive Calendar
- Clean, intuitive calendar interface with month/year navigation
- Visual indicators (colored dots) showing holidays from different countries
- Responsive design that works seamlessly on desktop and mobile devices
- Easy navigation between months and years with "Today" quick access

### 🎉 Holiday Information
- Comprehensive holiday database covering major celebrations worldwide
- Detailed cultural information for each holiday including:
  - Holiday name and significance
  - Country/region of origin
  - Cultural background and historical context
  - Traditional customs and celebrations
  - Visual country flags and themed colors

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

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to `http://localhost:5173` to view the application

### Build for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## 🛠️ Technology Stack

### Frontend Framework
- **React 19.1.0** - Modern React with hooks for state management
- **Vite** - Fast build tool and development server
- **JavaScript (ES6+)** - Modern JavaScript features

### Styling & UI
- **Tailwind CSS 4.1.11** - Utility-first CSS framework
- **Lucide React** - Beautiful, customizable icons
- **Custom CSS animations** - Smooth transitions and interactions
- **Responsive design** - Mobile-first approach

### Development Tools
- **ESLint** - Code linting and quality assurance
- **PostCSS** - CSS processing and optimization
- **Autoprefixer** - Automatic vendor prefixing

## 📁 Project Structure

```
global-holiday-calendar/
├── public/
│   └── vite.svg
├── src/
│   ├── components/
│   │   ├── Calendar.jsx          # Main calendar component
│   │   ├── CountryFilter.jsx     # Country filtering system
│   │   └── HolidayModal.jsx      # Holiday detail modal
│   ├── data/
│   │   └── holidays.js           # Holiday database
│   ├── App.jsx                   # Main application component
│   ├── main.jsx                  # Application entry point
│   └── index.css                 # Global styles and Tailwind
├── index.html                    # HTML template
├── package.json                  # Dependencies and scripts
├── tailwind.config.js           # Tailwind configuration
├── postcss.config.js            # PostCSS configuration
├── vite.config.js               # Vite configuration
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

### Holiday Data Structure
- Comprehensive global holiday database
- Structured data with cultural information
- Color-coded by country/region
- Easy to extend with new holidays

## 🌟 Key Features in Detail

### Holiday Database
The application includes a rich database of global holidays featuring:
- **50+ holidays** from around the world
- **15+ countries** and regions
- **Cultural significance** and historical context
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

### Adding New Holidays
To add new holidays, edit `src/data/holidays.js`:

```javascript
'2024-MM-DD': [
  {
    name: 'Holiday Name',
    country: 'Country Name',
    color: '#HEX_COLOR',
    description: 'Brief description',
    significance: 'Cultural significance',
    customs: 'Traditional customs',
    history: 'Historical context'
  }
]
```

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
