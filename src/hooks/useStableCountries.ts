import { useMemo, useRef } from 'react';

/**
 * A sorted country list whose identity changes only when its contents do.
 *
 * Callers build their `countries` array inline, so it is a new object on
 * every render and any effect depending on it would re-run constantly. This
 * compares the sorted contents and hands back the previous array when nothing
 * moved — which is what an effect dependency is supposed to mean.
 */
export function useStableCountries(countries: string[]): string[] {
  const previousRef = useRef<string[]>([]);

  return useMemo(() => {
    const sorted = [...countries].sort();
    const previous = previousRef.current;

    if (previous.length === sorted.length && previous.every((code, index) => code === sorted[index])) {
      return previous;
    }

    previousRef.current = sorted;
    return sorted;
  }, [countries]);
}
