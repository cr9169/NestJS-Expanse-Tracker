import 'reflect-metadata';

import { NestFactory } from '@nestjs/core';
import { type MicroserviceOptions, Transport } from '@nestjs/microservices';

import { AppModule } from './app.module';

/**
 * notification-service is a hybrid app: TCP (for gateway queries like
 * "list my notifications") + RabbitMQ consumer (for budget alerts and
 * large expense events).
 */
async function bootstrap(): Promise<void> {
  const tcpPort = parseInt(process.env['TCP_PORT'] ?? '3004', 10);
  const rabbitmqUrl = process.env['RABBITMQ_URL'] ?? 'amqp://localhost:5672';

  const app = await NestFactory.create(AppModule);

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.TCP,
    options: { host: '0.0.0.0', port: tcpPort },
  });

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.RMQ,
    options: {
      urls: [rabbitmqUrl],
      queue: 'notification_events',
      queueOptions: { durable: true },
      noAck: false,
    },
  });

  await app.startAllMicroservices();

  // eslint-disable-next-line no-console
  console.log(`notification-service listening on TCP :${tcpPort} and RabbitMQ`);
}

void bootstrap();
