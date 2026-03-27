import 'reflect-metadata';

import { NestFactory } from '@nestjs/core';
import { type MicroserviceOptions, Transport } from '@nestjs/microservices';

import { AppModule } from './app.module';

/**
 * ARCHITECTURE NOTE:
 * The expenses-service bootstraps as a pure TCP microservice — no HTTP server.
 * This means it cannot be accidentally accessed from the public internet, only
 * via the internal Docker network. Even in local dev (non-Docker), port 3001
 * is only open on localhost.
 *
 * NestFactory.createMicroservice() requires the port at creation time (before
 * AppModule loads), so we read TCP_PORT directly from process.env here.
 * This is the only acceptable process.env access outside the config module —
 * main.ts is the bootstrap entry point and no config service exists yet.
 * The Joi schema in AppModule validates the value and crashes fast if invalid.
 */
async function bootstrap(): Promise<void> {
  // Read TCP_PORT before AppModule initialises — needed for microservice binding
  const tcpPort = parseInt(process.env['TCP_PORT'] ?? '3001', 10);

  const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
    transport: Transport.TCP,
    options: {
      host: '0.0.0.0',
      port: tcpPort,
    },
  });

  await app.listen();

  // eslint-disable-next-line no-console
  console.log(`expenses-service TCP microservice listening on port ${tcpPort}`);
}

void bootstrap();
