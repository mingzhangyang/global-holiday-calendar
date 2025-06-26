import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import GlobalHolidayCalendar from './GlobalHolidayCalendar.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <GlobalHolidayCalendar />
  </StrictMode>,
)
