import 'reflect-metadata';

import { NestFactory } from '@nestjs/core';
import { type MicroserviceOptions, Transport } from '@nestjs/microservices';

import { AppModule } from './app.module';

/**
 * budget-service is a hybrid app: it listens on TCP (for gateway RPC queries)
 * and consumes from RabbitMQ (for expense lifecycle events).
 *
 * NestFactory.create() + connectMicroservice() is the NestJS pattern for
 * combining multiple transports in one process.
 */
async function bootstrap(): Promise<void> {
  const tcpPort = parseInt(process.env['TCP_PORT'] ?? '3002', 10);
  const rabbitmqUrl = process.env['RABBITMQ_URL'] ?? 'amqp://localhost:5672';

  const app = await NestFactory.create(AppModule);

  // TCP transport — handles @MessagePattern from the gateway
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.TCP,
    options: { host: '0.0.0.0', port: tcpPort },
  });

  // RabbitMQ transport — handles @EventPattern from expenses-service
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.RMQ,
    options: {
      urls: [rabbitmqUrl],
      queue: 'budget_expense_events',
      queueOptions: { durable: true },
      noAck: false, // Manual acknowledgment for reliable processing
    },
  });

  await app.startAllMicroservices();

  // eslint-disable-next-line no-console
  console.log(`budget-service listening on TCP :${tcpPort} and RabbitMQ`);
}

void bootstrap();
