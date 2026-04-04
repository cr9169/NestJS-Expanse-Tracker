import type { PaginatedResult } from '@shared/types/api-response.type';

import type { Notification } from '../entities/notification.entity';

export interface NotificationFilters {
  unreadOnly: boolean;
  page: number;
  limit: number;
}

export interface INotificationRepository {
  save(notification: Notification): Promise<Notification>;
  findAllByUser(userId: string, filters: NotificationFilters): Promise<PaginatedResult<Notification>>;
  markAsRead(id: string, userId: string): Promise<void>;
  markAllAsRead(userId: string): Promise<void>;
  getUnreadCount(userId: string): Promise<number>;
}
