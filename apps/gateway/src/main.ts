import 'reflect-metadata';

import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import { AppModule } from './app.module';
import { AppConfigService } from './config/app-config.service';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  const config = app.get(AppConfigService);

  // ── CORS ──────────────────────────────────────────────────────────────
  // Browser-only concern. Allowlist comes from CORS_ORIGINS (comma-separated).
  // Tools like curl/Swagger don't send Origin and aren't restricted by CORS.
  app.enableCors({
    origin: config.corsOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Authorization', 'Content-Type', 'Accept'],
  });

  // ── Swagger / OpenAPI ─────────────────────────────────────────────────
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
