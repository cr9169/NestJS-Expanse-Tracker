import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';

import { appConfigSchema } from './config/app.config';
import { AppConfigModule } from './config/app-config.module';
import { AuthModule } from './auth/auth.module';
import { ExpensesModule } from './expenses/expenses.module';
import { HealthController } from './health/health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: appConfigSchema,
      validationOptions: { abortEarly: true },
    }),

    ThrottlerModule.forRootAsync({
      // Inject ConfigService directly (always globally available after ConfigModule.forRoot)
      // rather than AppConfigService to avoid a circular dependency in the async factory.
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        throttlers: [
          {
            ttl: config.get<number>('THROTTLE_TTL', 60000),
            limit: config.get<number>('THROTTLE_LIMIT', 10),
          },
        ],
      }),
    }),

    AppConfigModule,
    AuthModule,
    ExpensesModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
