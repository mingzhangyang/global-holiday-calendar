import { useEffect, useState } from 'react';

// Long enough that a cache hit never flashes a spinner, short enough that a
// real request still gets one.
const DEFAULT_DELAY_MS = 180;

/**
 * `true` once a load has been running long enough to be worth telling the
 * visitor about.
 */
export function useDelayedLoading(loading: boolean, delayMs = DEFAULT_DELAY_MS): boolean {
  const [showLoadingState, setShowLoadingState] = useState(false);

  useEffect(() => {
    if (!loading) {
      setShowLoadingState(false);
      return undefined;
    }

    const timeoutId = window.setTimeout(() => setShowLoadingState(true), delayMs);
    return () => window.clearTimeout(timeoutId);
  }, [loading, delayMs]);

  return showLoadingState;
}
