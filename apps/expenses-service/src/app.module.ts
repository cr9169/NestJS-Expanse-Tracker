import { Module, ValidationPipe } from '@nestjs/common';
import { APP_PIPE } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';

import { appConfigSchema } from './config/app.config';
import { AppConfigModule } from './config/app-config.module';
import { AuthModule } from './auth/auth.module';
import { DatabaseModule } from './database/database.module';
import { ExpensesModule } from './expenses/expenses.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: appConfigSchema,
      validationOptions: { abortEarly: true },
    }),
    AppConfigModule,
    DatabaseModule,
    ExpensesModule,
    AuthModule,
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
