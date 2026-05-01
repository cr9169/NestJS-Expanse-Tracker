import { LogOut, Wallet } from 'lucide-react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';

import { useAuth } from '@/shared/auth/auth-context';
import { Button } from '@/shared/components/ui/button';
import { cn } from '@/shared/lib/cn';

// AppShell is the composition root for authenticated routes — it is allowed
// to import from features/ to wire up cross-feature widgets (the bell here).
// This is the single, documented exception to the inward-only dep rule.
import { NotificationBell } from '@/features/notifications/components/notification-bell';

import { NAV_ITEMS } from './nav-items';

export function AppShell(): JSX.Element {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = (): void => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="flex h-full w-full flex-col">
      <header className="flex h-14 shrink-0 items-center gap-4 border-b bg-background px-4 md:px-6">
        <div className="flex items-center gap-2 font-semibold">
          <Wallet className="h-5 w-5" />
          <span>Expense Tracker</span>
        </div>
        <nav className="ml-6 hidden items-center gap-1 md:flex">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  'rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground',
                  isActive && 'bg-accent text-accent-foreground',
                )
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <NotificationBell />
          <span className="hidden text-sm text-muted-foreground sm:inline">{user?.email}</span>
          <Button variant="ghost" size="icon" onClick={handleLogout} title="Log out">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </header>

      <nav className="flex items-center gap-1 overflow-x-auto border-b px-4 py-2 md:hidden">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              cn(
                'rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground',
                isActive && 'bg-accent text-accent-foreground',
              )
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>

      <main className="flex-1 overflow-y-auto bg-muted/20">
        <div className="mx-auto w-full max-w-6xl p-4 md:p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
