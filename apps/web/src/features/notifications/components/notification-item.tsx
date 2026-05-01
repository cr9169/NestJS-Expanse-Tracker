import { AlertTriangle, Ban, BellRing, type LucideIcon } from 'lucide-react';

import { NotificationType } from '@shared/enums/notification-type.enum';

import { Button } from '@/shared/components/ui/button';
import { cn } from '@/shared/lib/cn';
import { formatRelativeTime } from '@/shared/lib/format-date';
import type { AppNotification } from '@/shared/schemas/notification.schemas';

const TYPE_META: Record<
  NotificationType,
  { icon: LucideIcon; tone: 'warning' | 'destructive' | 'info'; label: string }
> = {
  [NotificationType.BUDGET_WARNING]: {
    icon: AlertTriangle,
    tone: 'warning',
    label: 'Budget warning',
  },
  [NotificationType.BUDGET_EXCEEDED]: {
    icon: Ban,
    tone: 'destructive',
    label: 'Budget exceeded',
  },
  [NotificationType.LARGE_EXPENSE]: {
    icon: BellRing,
    tone: 'info',
    label: 'Large expense',
  },
};

interface NotificationItemProps {
  notification: AppNotification;
  onMarkRead: (notification: AppNotification) => void;
  /** True while the parent's mark-read mutation is in flight for this row. */
  isMarking?: boolean;
}

export function NotificationItem({
  notification,
  onMarkRead,
  isMarking = false,
}: NotificationItemProps): JSX.Element {
  const meta = TYPE_META[notification.type];
  const Icon = meta.icon;

  return (
    <div
      className={cn(
        'flex items-start gap-3 rounded-lg border bg-card p-4 transition-colors',
        !notification.read && 'border-primary/40 bg-primary/5',
      )}
    >
      <div
        className={cn(
          'mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
          meta.tone === 'warning' && 'bg-warning/15 text-warning',
          meta.tone === 'destructive' && 'bg-destructive/15 text-destructive',
          meta.tone === 'info' && 'bg-primary/15 text-primary',
        )}
      >
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <p className="font-medium">{notification.title}</p>
          <span className="text-xs text-muted-foreground">
            {formatRelativeTime(notification.createdAt)}
          </span>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">{notification.message}</p>
      </div>
      {!notification.read && (
        <Button
          variant="ghost"
          size="sm"
          className="shrink-0"
          disabled={isMarking}
          onClick={() => onMarkRead(notification)}
        >
          {isMarking ? 'Marking…' : 'Mark read'}
        </Button>
      )}
    </div>
  );
}
