import { Navigate, Outlet, useLocation } from 'react-router-dom';

import { useAuth } from './auth-context';

export function RequireAuth(): JSX.Element {
  const { status } = useAuth();
  const location = useLocation();

  if (status === 'booting') {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        Loading…
      </div>
    );
  }

  if (status === 'unauthenticated') {
    const redirect = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?redirect=${redirect}`} replace />;
  }

  return <Outlet />;
}

export function RequireGuest(): JSX.Element {
  const { status } = useAuth();

  if (status === 'booting') {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        Loading…
      </div>
    );
  }

  if (status === 'authenticated') {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
