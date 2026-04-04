import { Inject, Injectable } from '@nestjs/common';

import type { INotificationRepository } from '../../domain/repositories/notification.repository.interface';
import { NOTIFICATION_REPOSITORY_TOKEN } from '../../tokens';

@Injectable()
export class MarkAsReadUseCase {
  constructor(
    @Inject(NOTIFICATION_REPOSITORY_TOKEN)
    private readonly notificationRepository: INotificationRepository,
  ) {}

  async markOne(id: string, userId: string): Promise<void> {
    await this.notificationRepository.markAsRead(id, userId);
  }

  async markAll(userId: string): Promise<void> {
    await this.notificationRepository.markAllAsRead(userId);
  }
}
