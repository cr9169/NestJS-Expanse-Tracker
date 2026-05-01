import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { Toaster } from 'sonner';

import { configureHttpClient } from '@/shared/api/http-client';
import { queryClient } from '@/shared/api/query-client';
import { AuthProvider } from '@/shared/auth/auth-context';
import { tokenStore } from '@/shared/auth/token-store';
import { router } from '@/routes/router';

// Module-level init: runs once at import, before any render. Done here (not
// inside a component) because the http client must be ready for the very first
// useQuery call. A useEffect would race with React 19 StrictMode double-render.
configureHttpClient({
  tokenStore,
  onAuthFailure: () => {
    queryClient.clear();
  },
});

export function App(): JSX.Element {
  // When the access token clears (logout / refresh failure), drop cached
  // server state so a future login starts clean.
  useEffect(() => {
    return tokenStore.subscribe(() => {
      if (!tokenStore.getAccessToken() && !tokenStore.getRefreshToken()) {
        queryClient.clear();
      }
    });
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <RouterProvider router={router} />
        <Toaster position="top-right" richColors closeButton />
      </AuthProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
