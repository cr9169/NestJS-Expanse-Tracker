import { Controller, Inject } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';

import { TCP_PATTERNS } from '@shared/constants/tcp-patterns.constants';

import { handleRpc } from '../common/handle-rpc';

import type { GetUnreadCountUseCase } from './application/use-cases/get-unread-count.use-case';
import type { ListNotificationsUseCase } from './application/use-cases/list-notifications.use-case';
import type { MarkAsReadUseCase } from './application/use-cases/mark-as-read.use-case';
import {
  GET_UNREAD_COUNT_USE_CASE_TOKEN,
  LIST_NOTIFICATIONS_USE_CASE_TOKEN,
  MARK_AS_READ_USE_CASE_TOKEN,
} from './tokens';

@Controller()
export class NotificationsController {
  constructor(
    @Inject(LIST_NOTIFICATIONS_USE_CASE_TOKEN) private readonly listNotifications: ListNotificationsUseCase,
    @Inject(GET_UNREAD_COUNT_USE_CASE_TOKEN) private readonly getUnreadCount: GetUnreadCountUseCase,
    @Inject(MARK_AS_READ_USE_CASE_TOKEN) private readonly markAsRead: MarkAsReadUseCase,
  ) {}

  @MessagePattern(TCP_PATTERNS.NOTIFICATIONS_LIST)
  async list(
    @Payload() payload: { userId: string; page: number; limit: number; unreadOnly: boolean },
  ): Promise<unknown> {
    return handleRpc(async () => {
      const result = await this.listNotifications.execute({
        userId: payload.userId,
        page: payload.page,
        limit: payload.limit,
        unreadOnly: payload.unreadOnly,
      });
      return {
        items: result.items.map((n) => n.toJSON()),
        total: result.total,
        page: result.page,
        limit: result.limit,
      };
    });
  }

  @MessagePattern(TCP_PATTERNS.NOTIFICATIONS_UNREAD_COUNT)
  async unreadCount(
    @Payload() payload: { userId: string },
  ): Promise<{ count: number }> {
    return handleRpc(async () => {
      const count = await this.getUnreadCount.execute(payload.userId);
      return { count };
    });
  }

  @MessagePattern(TCP_PATTERNS.NOTIFICATIONS_MARK_READ)
  async markRead(
    @Payload() payload: { id: string; userId: string },
  ): Promise<void> {
    return handleRpc(async () => {
      await this.markAsRead.markOne(payload.id, payload.userId);
    });
  }

  @MessagePattern(TCP_PATTERNS.NOTIFICATIONS_MARK_ALL_READ)
  async markAllRead(
    @Payload() payload: { userId: string },
  ): Promise<void> {
    return handleRpc(async () => {
      await this.markAsRead.markAll(payload.userId);
    });
  }
}
