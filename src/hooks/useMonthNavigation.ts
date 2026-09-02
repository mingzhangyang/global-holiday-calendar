import { useRef } from 'react';
import type { TouchEvent } from 'react';

// A swipe has to travel this far, and be more horizontal than vertical, before
// it pages the month. Shared so the calendar and the list view can never
// disagree about what counts as a swipe.
const SWIPE_THRESHOLD_PX = 50;

type DateUpdater = (updater: (previous: Date) => Date) => void;

/**
 * Month paging for the two month views: the same arrows, the same gesture.
 */
export function useMonthNavigation(onCurrentDateChange: DateUpdater) {
  const touchStartRef = useRef({ x: 0, y: 0 });

  const navigateMonth = (direction: number) => {
    onCurrentDateChange(previous => {
      const next = new Date(previous);
      // Set the day before the month: stepping from the 31st would otherwise
      // overshoot a shorter month.
      next.setDate(1);
      next.setMonth(previous.getMonth() + direction);
      return next;
    });
  };

  const swipeHandlers = {
    onTouchStart: (event: TouchEvent) => {
      const touch = event.changedTouches[0];
      touchStartRef.current = { x: touch.clientX, y: touch.clientY };
    },
    onTouchEnd: (event: TouchEvent) => {
      const touch = event.changedTouches[0];
      const deltaX = touch.clientX - touchStartRef.current.x;
      const deltaY = touch.clientY - touchStartRef.current.y;

      if (Math.abs(deltaX) < SWIPE_THRESHOLD_PX || Math.abs(deltaX) < Math.abs(deltaY)) {
        return;
      }

      navigateMonth(deltaX < 0 ? 1 : -1);
    }
  };

  return { navigateMonth, swipeHandlers };
}
