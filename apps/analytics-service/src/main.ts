import 'reflect-metadata';

import { NestFactory } from '@nestjs/core';
import { type MicroserviceOptions, Transport } from '@nestjs/microservices';

import { AppModule } from './app.module';

/**
 * analytics-service is a hybrid app: TCP (for gateway queries like
 * "get spending trends") + Kafka consumer (for building materialized
 * views from the expense event stream).
 */
async function bootstrap(): Promise<void> {
  const tcpPort = parseInt(process.env['TCP_PORT'] ?? '3003', 10);
  const kafkaBroker = process.env['KAFKA_BROKER'] ?? 'localhost:9092';

  const app = await NestFactory.create(AppModule);

  // TCP transport — handles @MessagePattern from the gateway
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.TCP,
    options: { host: '0.0.0.0', port: tcpPort },
  });

  // Kafka transport — consumes expense.lifecycle topic
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.KAFKA,
    options: {
      client: {
        clientId: 'analytics-service',
        brokers: [kafkaBroker],
      },
      consumer: {
        groupId: 'analytics-service-consumer',
      },
    },
  });

  await app.startAllMicroservices();

  // eslint-disable-next-line no-console
  console.log(`analytics-service listening on TCP :${tcpPort} and Kafka`);
}

void bootstrap();
