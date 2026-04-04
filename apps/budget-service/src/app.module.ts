import { Module, ValidationPipe } from '@nestjs/common';
import { APP_PIPE } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';

import { appConfigSchema } from './config/app.config';
import { AppConfigModule } from './config/app-config.module';
import { DatabaseModule } from './database/database.module';
import { BudgetsModule } from './budgets/budgets.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: appConfigSchema,
      validationOptions: { abortEarly: true },
    }),
    AppConfigModule,
    DatabaseModule,
    BudgetsModule,
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
