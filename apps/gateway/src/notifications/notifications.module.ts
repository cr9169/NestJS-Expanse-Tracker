import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';

import { AppConfigService } from '../config/app-config.service';

import { NotificationsController } from './notifications.controller';
import { NOTIFICATION_CLIENT_TOKEN } from './tokens';

@Module({
  imports: [
    ClientsModule.registerAsync([
      {
        name: NOTIFICATION_CLIENT_TOKEN,
        inject: [AppConfigService],
        useFactory: (config: AppConfigService) => ({
          transport: Transport.TCP,
          options: {
            host: config.notificationTcpHost,
            port: config.notificationTcpPort,
          },
        }),
      },
    ]),
  ],
  controllers: [NotificationsController],
})
export class NotificationsModule {}
