import { Bell } from 'lucide-react';
import { Link } from 'react-router-dom';

import { Button } from '@/shared/components/ui/button';

import { useUnreadCountQuery } from '../api/notifications.queries';

/**
 * Topbar bell. Polling cadence is owned by useUnreadCountQuery — call sites
 * here just render. Same query key as the notifications page so the count
 * shares its cache and stays in sync after mark-read mutations invalidate it.
 */
export function NotificationBell(): JSX.Element {
  const { data } = useUnreadCountQuery();
  const count = data?.unreadCount ?? 0;

  return (
    <Button asChild variant="ghost" size="icon" title="Notifications">
      <Link to="/notifications" className="relative">
        <Bell className="h-4 w-4" />
        {count > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold leading-none text-destructive-foreground">
            {count > 99 ? '99+' : count}
          </span>
        )}
      </Link>
    </Button>
  );
}
