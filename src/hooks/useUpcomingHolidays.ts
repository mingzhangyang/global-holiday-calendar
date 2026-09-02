import { useEffect, useState } from 'react';
import { getUpcomingHolidays } from '../services/holidayApi';
import { useStableCountries } from './useStableCountries';
import type { Holiday, RequestScope } from '../types';

/**
 * The next holidays from today onwards, independent of the month being
 * browsed — the countdown must not go blank just because the visitor paged
 * back to March, and must find New Year's Day from late December.
 */
export function useUpcomingHolidays({
  countries,
  scope = 'public',
  limit = 3
}: {
  countries: string[];
  scope?: RequestScope;
  limit?: number;
}): Holiday[] {
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const selected = useStableCountries(countries);

  useEffect(() => {
    if (selected.length === 0) {
      setHolidays([]);
      return undefined;
    }

    let isActive = true;

    getUpcomingHolidays({ fromDate: new Date(), countries: selected, scope, limit })
      .then(result => {
        if (isActive) setHolidays(result);
      })
      .catch(error => {
        console.warn('Error loading upcoming holidays:', error);
        if (isActive) setHolidays([]);
      });

    return () => {
      isActive = false;
    };
  }, [selected, scope, limit]);

  return holidays;
}
