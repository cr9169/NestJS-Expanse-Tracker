import { Inject, Injectable } from '@nestjs/common';

import type { INotificationRepository } from '../../domain/repositories/notification.repository.interface';
import { NOTIFICATION_REPOSITORY_TOKEN } from '../../tokens';

@Injectable()
export class GetUnreadCountUseCase {
  constructor(
    @Inject(NOTIFICATION_REPOSITORY_TOKEN)
    private readonly notificationRepository: INotificationRepository,
  ) {}

  async execute(userId: string): Promise<number> {
    return this.notificationRepository.getUnreadCount(userId);
  }
}
