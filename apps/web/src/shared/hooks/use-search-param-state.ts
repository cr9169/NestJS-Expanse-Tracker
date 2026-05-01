import { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';

/**
 * Encapsulates URL search-param state so it can be read/written like local state
 * but persists across reloads and is shareable.
 */
export function useSearchParamState() {
  const [searchParams, setSearchParams] = useSearchParams();

  const get = useCallback(
    (key: string): string | undefined => searchParams.get(key) ?? undefined,
    [searchParams],
  );

  const setMany = useCallback(
    (updates: Record<string, string | undefined | null>) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          for (const [key, value] of Object.entries(updates)) {
            if (value === undefined || value === null || value === '') {
              next.delete(key);
            } else {
              next.set(key, value);
            }
          }
          return next;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  return { get, setMany };
}
