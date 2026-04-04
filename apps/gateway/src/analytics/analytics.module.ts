import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';

import { AppConfigService } from '../config/app-config.service';

import { AnalyticsController } from './analytics.controller';
import { ANALYTICS_CLIENT_TOKEN } from './tokens';

@Module({
  imports: [
    ClientsModule.registerAsync([
      {
        name: ANALYTICS_CLIENT_TOKEN,
        inject: [AppConfigService],
        useFactory: (config: AppConfigService) => ({
          transport: Transport.TCP,
          options: {
            host: config.analyticsTcpHost,
            port: config.analyticsTcpPort,
          },
        }),
      },
    ]),
  ],
  controllers: [AnalyticsController],
})
export class AnalyticsModule {}
