import { NotificationType } from '@shared/enums/notification-type.enum';

export interface AppNotification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  metadata: Record<string, unknown> | null;
  read: boolean;
  createdAt: string;
}
