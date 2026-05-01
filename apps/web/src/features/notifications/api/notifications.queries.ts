import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

import { apiGet, apiGetPaginated, apiPatch, type PaginatedResult } from '@/shared/api/http-client';
import { NOTIFICATION_POLL_INTERVAL_MS } from '@/shared/lib/constants';
import type { AppNotification } from '@/shared/schemas/notification.schemas';

export interface ListNotificationsFilters {
  page: number;
  limit: number;
  unreadOnly: boolean;
}

export const notificationKeys = {
  all: ['notifications'] as const,
  list: (filters: ListNotificationsFilters) => ['notifications', 'list', filters] as const,
  unreadCount: ['notifications', 'unread-count'] as const,
};

export function useNotificationsQuery(filters: ListNotificationsFilters) {
  return useQuery<PaginatedResult<AppNotification>>({
    queryKey: notificationKeys.list(filters),
    queryFn: () => {
      const params = new URLSearchParams({
        page: String(filters.page),
        limit: String(filters.limit),
        unreadOnly: String(filters.unreadOnly),
      });
      return apiGetPaginated<AppNotification>(
        `/api/v1/notifications?${params.toString()}`,
      );
    },
  });
}

export function useUnreadCountQuery() {
  return useQuery<{ unreadCount: number }>({
    queryKey: notificationKeys.unreadCount,
    queryFn: () => apiGet<{ unreadCount: number }>('/api/v1/notifications/unread-count'),
    refetchInterval: NOTIFICATION_POLL_INTERVAL_MS,
  });
}

export function useMarkReadMutation() {
  const qc = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: (id) => apiPatch<void>(`/api/v1/notifications/${id}/read`),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
}

export function useMarkAllReadMutation() {
  const qc = useQueryClient();
  return useMutation<void, Error, void>({
    mutationFn: () => apiPatch<void>('/api/v1/notifications/read-all'),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
}
