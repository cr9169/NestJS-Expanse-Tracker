import { Inject, Injectable, Logger } from '@nestjs/common';

import type { NotificationType } from '@shared/enums/notification-type.enum';

import { Notification } from '../../domain/entities/notification.entity';
import type { INotificationRepository } from '../../domain/repositories/notification.repository.interface';
import { NOTIFICATION_REPOSITORY_TOKEN } from '../../tokens';

export interface CreateNotificationCommand {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  metadata?: Record<string, unknown>;
}

@Injectable()
export class CreateNotificationUseCase {
  private readonly logger = new Logger(CreateNotificationUseCase.name);

  constructor(
    @Inject(NOTIFICATION_REPOSITORY_TOKEN)
    private readonly notificationRepository: INotificationRepository,
  ) {}

  async execute(command: CreateNotificationCommand): Promise<Notification> {
    const notification = Notification.create({
      userId: command.userId,
      type: command.type,
      title: command.title,
      message: command.message,
      metadata: command.metadata,
    });

    const saved = await this.notificationRepository.save(notification);

    // "Sending" the notification = logging it (no real email/SMS integration)
    this.logger.log(
      `[${command.type}] Notification for user ${command.userId}: ${command.title}`,
    );

    return saved;
  }
}
