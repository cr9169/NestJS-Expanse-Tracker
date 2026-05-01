import { CheckCheck } from 'lucide-react';

import { Button } from '@/shared/components/ui/button';
import { Pagination } from '@/shared/components/ui/pagination';
import { QueryState } from '@/shared/components/ui/query-state';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { useSearchParamState } from '@/shared/hooks/use-search-param-state';
import { DEFAULT_PAGE_SIZE } from '@/shared/lib/constants';
import { toast, toastApiError } from '@/shared/lib/toast';

import {
  useMarkAllReadMutation,
  useMarkReadMutation,
  useNotificationsQuery,
} from '../api/notifications.queries';
import { NotificationItem } from '../components/notification-item';

const SKELETON_KEYS = ['s1', 's2', 's3', 's4'] as const;

const NotificationsLoading = (
  <div className="space-y-2">
    {SKELETON_KEYS.map((k) => (
      <Skeleton key={k} className="h-20 w-full" />
    ))}
  </div>
);

function parsePositiveInt(raw: string | undefined, fallback: number): number {
  const n = Number(raw);
  return Number.isInteger(n) && n > 0 ? n : fallback;
}

export function NotificationsPage(): JSX.Element {
  const { get, setMany } = useSearchParamState();
  const filters = {
    page: parsePositiveInt(get('page'), 1),
    limit: parsePositiveInt(get('limit'), DEFAULT_PAGE_SIZE),
    unreadOnly: get('unreadOnly') === 'true',
  };

  const query = useNotificationsQuery(filters);
  const markRead = useMarkReadMutation();
  const markAll = useMarkAllReadMutation();

  const onMarkAll = async (): Promise<void> => {
    try {
      await markAll.mutateAsync();
      toast.success('All notifications marked read');
    } catch (err) {
      toastApiError(err);
    }
  };

  const onMarkRead = (id: string): void => {
    if (markRead.isPending) return;
    markRead.mutate(id);
  };

  const emptyMessage = filters.unreadOnly ? 'No unread notifications.' : 'No notifications yet.';

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Notifications</h1>
          <p className="text-sm text-muted-foreground">
            Budget warnings, exceeded budgets, and large-expense alerts.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant={filters.unreadOnly ? 'default' : 'outline'}
            size="sm"
            onClick={() =>
              setMany({
                unreadOnly: filters.unreadOnly ? undefined : 'true',
                page: '1',
              })
            }
          >
            {filters.unreadOnly ? 'Showing unread' : 'Show unread only'}
          </Button>
          <Button variant="outline" size="sm" onClick={onMarkAll} disabled={markAll.isPending}>
            <CheckCheck className="mr-2 h-4 w-4" />
            Mark all read
          </Button>
        </div>
      </div>

      <QueryState
        query={query}
        loading={NotificationsLoading}
        errorMessage="Failed to load notifications."
        empty={
          <div className="rounded-lg border bg-card p-8 text-center text-muted-foreground">
            {emptyMessage}
          </div>
        }
      >
        {(data) => (
          <>
            <div className="space-y-2">
              {data.items.map((n) => (
                <NotificationItem
                  key={n.id}
                  notification={n}
                  isMarking={markRead.isPending && markRead.variables === n.id}
                  onMarkRead={(notif) => onMarkRead(notif.id)}
                />
              ))}
            </div>
            <Pagination
              page={data.meta.page}
              totalPages={data.meta.totalPages}
              total={data.meta.total}
              onPageChange={(p) => setMany({ page: String(p) })}
            />
          </>
        )}
      </QueryState>
    </div>
  );
}
