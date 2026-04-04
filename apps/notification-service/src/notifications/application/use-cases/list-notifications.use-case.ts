import { Inject, Injectable } from '@nestjs/common';

import type { PaginatedResult } from '@shared/types/api-response.type';

import type { Notification } from '../../domain/entities/notification.entity';
import type { INotificationRepository } from '../../domain/repositories/notification.repository.interface';
import { NOTIFICATION_REPOSITORY_TOKEN } from '../../tokens';

export interface ListNotificationsCommand {
  userId: string;
  page: number;
  limit: number;
  unreadOnly: boolean;
}

@Injectable()
export class ListNotificationsUseCase {
  constructor(
    @Inject(NOTIFICATION_REPOSITORY_TOKEN)
    private readonly notificationRepository: INotificationRepository,
  ) {}

  async execute(command: ListNotificationsCommand): Promise<PaginatedResult<Notification>> {
    return this.notificationRepository.findAllByUser(command.userId, {
      page: command.page,
      limit: command.limit,
      unreadOnly: command.unreadOnly,
    });
  }
}
