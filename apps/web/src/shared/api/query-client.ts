import { QueryClient } from '@tanstack/react-query';

import { QUERY_GC_TIME_MS, QUERY_STALE_TIME_MS } from '@/shared/lib/constants';

import { ApiError } from './api-error';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: QUERY_STALE_TIME_MS,
      gcTime: QUERY_GC_TIME_MS,
      refetchOnWindowFocus: false,
      retry: (failureCount, err) => {
        if (err instanceof ApiError) {
          if (err.statusCode === 401 || err.statusCode === 403) return false;
          if (err.statusCode >= 400 && err.statusCode < 500) return false;
        }
        return failureCount < 2;
      },
    },
    mutations: {
      retry: false,
    },
  },
});
