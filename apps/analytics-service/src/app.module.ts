import { Module, ValidationPipe } from '@nestjs/common';
import { APP_PIPE } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';

import { appConfigSchema } from './config/app.config';
import { AppConfigModule } from './config/app-config.module';
import { DatabaseModule } from './database/database.module';
import { AnalyticsModule } from './analytics/analytics.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: appConfigSchema,
      validationOptions: { abortEarly: true },
    }),
    AppConfigModule,
    DatabaseModule,
    AnalyticsModule,
  ],
  providers: [
    {
      provide: APP_PIPE,
      useFactory: () =>
        new ValidationPipe({
          whitelist: true,
          forbidNonWhitelisted: true,
          transform: true,
          transformOptions: { enableImplicitConversion: false },
        }),
    },
  ],
})
export class AppModule {}
