import { Module } from '@nestjs/common';

import { DatabaseModule } from '../database/database.module';

import { CreateNotificationUseCase } from './application/use-cases/create-notification.use-case';
import { GetUnreadCountUseCase } from './application/use-cases/get-unread-count.use-case';
import { ListNotificationsUseCase } from './application/use-cases/list-notifications.use-case';
import { MarkAsReadUseCase } from './application/use-cases/mark-as-read.use-case';
import { NotificationsController } from './notifications.controller';
import { NotificationsEventHandler } from './notifications.event-handler';
import { SqliteNotificationRepository } from './infrastructure/repositories/sqlite-notification.repository';
import {
  CREATE_NOTIFICATION_USE_CASE_TOKEN,
  GET_UNREAD_COUNT_USE_CASE_TOKEN,
  LIST_NOTIFICATIONS_USE_CASE_TOKEN,
  MARK_AS_READ_USE_CASE_TOKEN,
  NOTIFICATION_REPOSITORY_TOKEN,
} from './tokens';

@Module({
  imports: [DatabaseModule],
  controllers: [NotificationsController, NotificationsEventHandler],
  providers: [
    { provide: NOTIFICATION_REPOSITORY_TOKEN, useClass: SqliteNotificationRepository },
    { provide: CREATE_NOTIFICATION_USE_CASE_TOKEN, useClass: CreateNotificationUseCase },
    { provide: LIST_NOTIFICATIONS_USE_CASE_TOKEN, useClass: ListNotificationsUseCase },
    { provide: MARK_AS_READ_USE_CASE_TOKEN, useClass: MarkAsReadUseCase },
    { provide: GET_UNREAD_COUNT_USE_CASE_TOKEN, useClass: GetUnreadCountUseCase },
  ],
})
export class NotificationsModule {}
