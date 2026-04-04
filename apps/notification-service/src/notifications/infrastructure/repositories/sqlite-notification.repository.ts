import { Inject, Injectable } from '@nestjs/common';
import type Database from 'better-sqlite3';

import type { PaginatedResult } from '@shared/types/api-response.type';

import { DATABASE_TOKEN } from '../../../database/tokens';
import { Notification, type NotificationRow } from '../../domain/entities/notification.entity';
import type {
  INotificationRepository,
  NotificationFilters,
} from '../../domain/repositories/notification.repository.interface';

@Injectable()
export class SqliteNotificationRepository implements INotificationRepository {
  private readonly stmtInsert: Database.Statement;
  private readonly stmtMarkRead: Database.Statement;
  private readonly stmtMarkAllRead: Database.Statement;
  private readonly stmtUnreadCount: Database.Statement;

  constructor(@Inject(DATABASE_TOKEN) private readonly db: Database.Database) {
    this.stmtInsert = db.prepare(`
      INSERT INTO notifications (id, user_id, type, title, message, metadata, read, created_at)
      VALUES (@id, @user_id, @type, @title, @message, @metadata, @read, @created_at)
    `);
    this.stmtMarkRead = db.prepare(
      'UPDATE notifications SET read = 1 WHERE id = @id AND user_id = @userId',
    );
    this.stmtMarkAllRead = db.prepare(
      'UPDATE notifications SET read = 1 WHERE user_id = @userId AND read = 0',
    );
    this.stmtUnreadCount = db.prepare(
      'SELECT COUNT(*) as count FROM notifications WHERE user_id = @userId AND read = 0',
    );
  }

  async save(notification: Notification): Promise<Notification> {
    this.stmtInsert.run({
      id: notification.id,
      user_id: notification.userId,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      metadata: notification.metadata ? JSON.stringify(notification.metadata) : null,
      read: notification.read ? 1 : 0,
      created_at: notification.createdAt.toISOString(),
    });
    return notification;
  }

  async findAllByUser(
    userId: string,
    filters: NotificationFilters,
  ): Promise<PaginatedResult<Notification>> {
    const conditions = ['user_id = @userId'];
    const params: Record<string, unknown> = { userId };

    if (filters.unreadOnly) {
      conditions.push('read = 0');
    }

    const where = conditions.join(' AND ');

    const countRow = this.db
      .prepare(`SELECT COUNT(*) as count FROM notifications WHERE ${where}`)
      .get(params) as { count: number };
    const total = countRow.count;

    const offset = (filters.page - 1) * filters.limit;
    const rows = this.db
      .prepare(
        `SELECT * FROM notifications WHERE ${where} ORDER BY created_at DESC LIMIT @limit OFFSET @offset`,
      )
      .all({ ...params, limit: filters.limit, offset }) as NotificationRow[];

    return {
      items: rows.map((row) => Notification.reconstitute(row)),
      total,
      page: filters.page,
      limit: filters.limit,
    };
  }

  async markAsRead(id: string, userId: string): Promise<void> {
    this.stmtMarkRead.run({ id, userId });
  }

  async markAllAsRead(userId: string): Promise<void> {
    this.stmtMarkAllRead.run({ userId });
  }

  async getUnreadCount(userId: string): Promise<number> {
    const row = this.stmtUnreadCount.get({ userId }) as { count: number };
    return row.count;
  }
}
