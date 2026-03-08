import { useCallback, useState } from 'react';

function getInitialMonthFromUrl() {
  if (typeof window === 'undefined') {
    return new Date();
  }

  const monthParam = new URLSearchParams(window.location.search).get('month');
  if (!monthParam || !/^\d{4}-\d{2}$/.test(monthParam)) {
    return new Date();
  }

  const [year, month] = monthParam.split('-').map(Number);
  return new Date(year, month - 1, 1);
}

function getInitialViewFromUrl() {
  if (typeof window === 'undefined') {
    return 'calendar';
  }

  const viewParam = new URLSearchParams(window.location.search).get('view');
  return viewParam === 'list' ? 'list' : 'calendar';
}

export function useViewState() {
  const [currentView, setCurrentView] = useState(getInitialViewFromUrl);
  const [currentDate, setCurrentDate] = useState(getInitialMonthFromUrl);

  const changeView = useCallback((view) => {
    setCurrentView(view);
  }, []);

  return {
    currentView,
    changeView,
    currentDate,
    setCurrentDate
  };
}
