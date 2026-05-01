import { lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';

import { AppShell } from '@/shared/components/layout/app-shell';
import { AuthShell } from '@/shared/components/layout/auth-shell';
import { RouteErrorBoundary } from '@/shared/components/layout/route-error-boundary';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { RequireAuth, RequireGuest } from '@/shared/auth/require-auth';

const LoginPage = lazy(() =>
  import('@/features/auth/pages/login.page').then((m) => ({ default: m.LoginPage })),
);
const RegisterPage = lazy(() =>
  import('@/features/auth/pages/register.page').then((m) => ({ default: m.RegisterPage })),
);
const DashboardPage = lazy(() =>
  import('@/features/dashboard/pages/dashboard.page').then((m) => ({ default: m.DashboardPage })),
);
const ExpensesListPage = lazy(() =>
  import('@/features/expenses/pages/expenses-list.page').then((m) => ({ default: m.ExpensesListPage })),
);
const BudgetsPage = lazy(() =>
  import('@/features/budgets/pages/budgets.page').then((m) => ({ default: m.BudgetsPage })),
);
const NotificationsPage = lazy(() =>
  import('@/features/notifications/pages/notifications.page').then((m) => ({
    default: m.NotificationsPage,
  })),
);
const AnalyticsPage = lazy(() =>
  import('@/features/analytics/pages/analytics.page').then((m) => ({ default: m.AnalyticsPage })),
);
const NotFoundPage = lazy(() =>
  import('@/shared/components/layout/not-found-page').then((m) => ({ default: m.NotFoundPage })),
);

function RouteFallback(): JSX.Element {
  return (
    <div className="space-y-3 p-6">
      <Skeleton className="h-8 w-1/3" />
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-32 w-full" />
    </div>
  );
}

function withSuspense(node: JSX.Element): JSX.Element {
  return <Suspense fallback={<RouteFallback />}>{node}</Suspense>;
}

// errorElement on each shell scopes the boundary to its layout — auth pages
// keep the centered AuthShell, app pages keep their topbar, etc. A bug in one
// route never tears down the rest of the chrome.
export const router = createBrowserRouter([
  {
    element: <RequireGuest />,
    errorElement: <RouteErrorBoundary />,
    children: [
      {
        element: <AuthShell />,
        children: [
          { path: '/login', element: withSuspense(<LoginPage />) },
          { path: '/register', element: withSuspense(<RegisterPage />) },
        ],
      },
    ],
  },
  {
    element: <RequireAuth />,
    errorElement: <RouteErrorBoundary />,
    children: [
      {
        element: <AppShell />,
        errorElement: <RouteErrorBoundary />,
        children: [
          { index: true, element: withSuspense(<DashboardPage />) },
          { path: '/expenses', element: withSuspense(<ExpensesListPage />) },
          { path: '/budgets', element: withSuspense(<BudgetsPage />) },
          { path: '/notifications', element: withSuspense(<NotificationsPage />) },
          { path: '/analytics', element: withSuspense(<AnalyticsPage />) },
        ],
      },
    ],
  },
  { path: '/404', element: withSuspense(<NotFoundPage />) },
  { path: '*', element: <Navigate to="/404" replace /> },
]);
