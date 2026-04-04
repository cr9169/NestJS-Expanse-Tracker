import { v4 as uuidv4 } from 'uuid';

import type { NotificationType } from '@shared/enums/notification-type.enum';

export interface CreateNotificationProps {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  metadata?: Record<string, unknown>;
}

export interface NotificationRow {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  metadata: string | null;
  read: number;
  created_at: string;
}

export class Notification {
  private constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly type: string,
    public readonly title: string,
    public readonly message: string,
    public readonly metadata: Record<string, unknown> | null,
    public readonly read: boolean,
    public readonly createdAt: Date,
  ) {}

  static create(props: CreateNotificationProps): Notification {
    return new Notification(
      uuidv4(),
      props.userId,
      props.type,
      props.title,
      props.message,
      props.metadata ?? null,
      false,
      new Date(),
    );
  }

  static reconstitute(row: NotificationRow): Notification {
    return new Notification(
      row.id,
      row.user_id,
      row.type,
      row.title,
      row.message,
      row.metadata ? (JSON.parse(row.metadata) as Record<string, unknown>) : null,
      row.read === 1,
      new Date(row.created_at),
    );
  }

  toJSON(): Record<string, unknown> {
    return {
      id: this.id,
      userId: this.userId,
      type: this.type,
      title: this.title,
      message: this.message,
      metadata: this.metadata,
      read: this.read,
      createdAt: this.createdAt.toISOString(),
    };
  }
}
