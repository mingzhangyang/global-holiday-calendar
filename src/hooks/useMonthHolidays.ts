import { useCallback, useEffect, useRef, useState } from 'react';
import { getHolidaysForMonth } from '../services/holidayApi';
import { useStableCountries } from './useStableCountries';
import type { HolidaysByDate, RequestScope } from '../types';

interface MonthHolidaysState {
  holidaysByDate: HolidaysByDate;
  failedCountries: string[];
  loading: boolean;
  error: 'fetch-failed' | null;
}

/**
 * The single source of month data for the whole app.
 *
 * The calendar, the list view and the insight widgets used to each fetch the
 * same month independently — three requests for one screen. They now all read
 * this hook's result from App.
 */
export function useMonthHolidays({
  year,
  month,
  countries,
  scope = 'public'
}: {
  year: number;
  month: number;
  countries: string[];
  scope?: RequestScope;
}) {
  const [state, setState] = useState<MonthHolidaysState>({
    holidaysByDate: {},
    failedCountries: [],
    loading: false,
    error: null
  });
  const [reloadToken, setReloadToken] = useState(0);
  const requestIdRef = useRef(0);

  const selected = useStableCountries(countries);

  useEffect(() => {
    if (selected.length === 0) {
      setState({ holidaysByDate: {}, failedCountries: [], loading: false, error: null });
      return undefined;
    }

    const requestId = ++requestIdRef.current;
    let isActive = true;

    setState(previous => ({ ...previous, loading: true, error: null }));

    getHolidaysForMonth(year, month, selected, { scope })
      .then(({ holidaysByDate, failedCountries }) => {
        if (!isActive || requestId !== requestIdRef.current) return;

        setState({
          holidaysByDate,
          failedCountries,
          loading: false,
          // Only a total failure is an error state: a partial one still has
          // something worth showing.
          error: failedCountries.length === selected.length ? 'fetch-failed' : null
        });
      })
      .catch(error => {
        if (!isActive || requestId !== requestIdRef.current) return;

        console.error('Error fetching month holidays:', error);
        setState({
          holidaysByDate: {},
          failedCountries: selected,
          loading: false,
          error: 'fetch-failed'
        });
      });

    return () => {
      isActive = false;
    };
  }, [year, month, selected, scope, reloadToken]);

  const retry = useCallback(() => {
    setReloadToken(token => token + 1);
  }, []);

  return { ...state, retry };
}
