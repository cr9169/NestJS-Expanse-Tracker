import { Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';

import { appConfigSchema } from './config/app.config';
import { AppConfigModule } from './config/app-config.module';
import { AuthModule } from './auth/auth.module';
import { ExpensesModule } from './expenses/expenses.module';
import { BudgetsModule } from './budgets/budgets.module';
import { NotificationsModule } from './notifications/notifications.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { HealthController } from './health/health.controller';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';

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
    BudgetsModule,
    NotificationsModule,
    AnalyticsModule,
  ],
  controllers: [HealthController],
  providers: [
    // ── Global exception filter ───────────────────────────────────────────
    // Registered first — catches exceptions from guards, interceptors, and pipes.
    { provide: APP_FILTER, useClass: GlobalExceptionFilter },

    // ── Global auth guard ─────────────────────────────────────────────────
    // Secure by default — all routes require JWT unless @Public() is applied.
    { provide: APP_GUARD, useClass: JwtAuthGuard },

    // ── Global interceptors ───────────────────────────────────────────────
    // Order matters: logging wraps transform so we log the final response shape.
    { provide: APP_INTERCEPTOR, useClass: LoggingInterceptor },
    { provide: APP_INTERCEPTOR, useClass: TransformInterceptor },

    // ── Global validation pipe ────────────────────────────────────────────
    // whitelist: strip unknown properties before they reach controllers
    // forbidNonWhitelisted: 400 if unknown properties are present (not silent)
    // transform: auto-convert query strings to typed instances (e.g. page: "1" → 1)
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
