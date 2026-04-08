import 'reflect-metadata';

import { NestFactory } from '@nestjs/core';
import { type MicroserviceOptions, Transport } from '@nestjs/microservices';

import { AppModule } from './app.module';

/**
 * auth-service bootstraps as a pure TCP microservice — no HTTP server.
 * Only reachable via the internal Docker network or localhost in dev.
 */
async function bootstrap(): Promise<void> {
  const tcpPort = parseInt(process.env['TCP_PORT'] ?? '3005', 10);

  const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
    transport: Transport.TCP,
    options: {
      host: '0.0.0.0',
      port: tcpPort,
    },
  });

  await app.listen();

  // eslint-disable-next-line no-console
  console.log(`auth-service TCP microservice listening on port ${tcpPort}`);
}

void bootstrap();
