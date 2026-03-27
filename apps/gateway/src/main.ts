import 'reflect-metadata';

import { NestFactory, Reflector } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import { AppModule } from './app.module';
import { AppConfigService } from './config/app-config.service';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';

/**
 * ARCHITECTURE NOTE:
 * All cross-cutting concerns (auth guard, exception filter, response transform,
 * logging, validation) are registered globally in bootstrap(), NOT inside
 * individual modules. This is intentional:
 *
 * - Module-level guards can be bypassed if a module is imported without them.
 * - Bootstrap-level registration applies to EVERY route unconditionally.
 * - The only exception is rate limiting, which is intentionally applied only
 *   to specific routes via @UseGuards(ThrottlerGuard).
 *
 * This means there is ONE place to audit the global middleware stack, not N
 * places spread across N modules.
 */
async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  const config = app.get(AppConfigService);
  const reflector = app.get(Reflector);

  // ── Global exception filter ───────────────────────────────────────────────
  // Must be registered BEFORE interceptors so that interceptor errors are also caught.
  app.useGlobalFilters(new GlobalExceptionFilter());

  // ── Global auth guard ─────────────────────────────────────────────────────
  // Secure by default — all routes require JWT unless @Public() is applied.
  app.useGlobalGuards(new JwtAuthGuard(reflector));

  // ── Global interceptors ───────────────────────────────────────────────────
  // Order matters: logging wraps transform so we log the final response shape.
  app.useGlobalInterceptors(new LoggingInterceptor(), new TransformInterceptor());

  // ── Global validation pipe ────────────────────────────────────────────────
  // whitelist: strip unknown properties before they reach controllers
  // forbidNonWhitelisted: 400 if unknown properties are present (not silent)
  // transform: auto-convert query strings to typed instances (e.g. page: "1" → 1)
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: false },
    }),
  );

  // ── Swagger / OpenAPI ─────────────────────────────────────────────────────
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Expense Tracker API')
    .setDescription(
      'Production-grade expense tracking API. All endpoints return ApiResponse<T> on success ' +
        'and ApiErrorResponse on failure.',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: { persistAuthorization: true },
  });

  await app.listen(config.port);

  // eslint-disable-next-line no-console
  console.log(`Gateway HTTP server listening on port ${config.port}`);
  // eslint-disable-next-line no-console
  console.log(`Swagger UI: http://localhost:${config.port}/api/docs`);
}

void bootstrap();
