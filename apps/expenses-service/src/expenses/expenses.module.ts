import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';

import { AppConfigModule } from '../config/app-config.module';
import { AppConfigService } from '../config/app-config.service';
import { DatabaseModule } from '../database/database.module';

import { CreateExpenseUseCase } from './application/use-cases/create-expense.use-case';
import { DeleteExpenseUseCase } from './application/use-cases/delete-expense.use-case';
import { GetExpenseSummaryUseCase } from './application/use-cases/get-expense-summary.use-case';
import { GetExpenseUseCase } from './application/use-cases/get-expense.use-case';
import { ListExpensesUseCase } from './application/use-cases/list-expenses.use-case';
import { UpdateExpenseUseCase } from './application/use-cases/update-expense.use-case';
import { ExpensesController } from './expenses.controller';
import { ExpenseEventPublisher } from './infrastructure/expense-event.publisher';
import { SqliteExpenseRepository } from './infrastructure/repositories/sqlite-expense.repository';
import {
  CREATE_EXPENSE_USE_CASE_TOKEN,
  DELETE_EXPENSE_USE_CASE_TOKEN,
  EXPENSE_EVENT_PUBLISHER_TOKEN,
  EXPENSE_REPOSITORY_TOKEN,
  GET_EXPENSE_SUMMARY_USE_CASE_TOKEN,
  GET_EXPENSE_USE_CASE_TOKEN,
  KAFKA_CLIENT_TOKEN,
  LIST_EXPENSES_USE_CASE_TOKEN,
  RABBITMQ_CLIENT_TOKEN,
  RABBITMQ_NOTIFICATION_CLIENT_TOKEN,
  UPDATE_EXPENSE_USE_CASE_TOKEN,
} from './tokens';

@Module({
  imports: [
    DatabaseModule,
    AppConfigModule,

    // ── RabbitMQ client for budget-service (expense lifecycle events) ─────────
    ClientsModule.registerAsync([
      {
        name: RABBITMQ_CLIENT_TOKEN,
        imports: [AppConfigModule],
        inject: [AppConfigService],
        useFactory: (config: AppConfigService) => ({
          transport: Transport.RMQ,
          options: {
            urls: [config.rabbitmqUrl],
            queue: 'budget_expense_events',
            queueOptions: { durable: true },
          },
        }),
      },
    ]),

    // ── RabbitMQ client for notification-service (large expense alerts) ──────
    ClientsModule.registerAsync([
      {
        name: RABBITMQ_NOTIFICATION_CLIENT_TOKEN,
        imports: [AppConfigModule],
        inject: [AppConfigService],
        useFactory: (config: AppConfigService) => ({
          transport: Transport.RMQ,
          options: {
            urls: [config.rabbitmqUrl],
            queue: 'notification_events',
            queueOptions: { durable: true },
          },
        }),
      },
    ]),

    // ── Kafka client (for analytics event log) ────────────────────────────────
    ClientsModule.registerAsync([
      {
        name: KAFKA_CLIENT_TOKEN,
        imports: [AppConfigModule],
        inject: [AppConfigService],
        useFactory: (config: AppConfigService) => ({
          transport: Transport.KAFKA,
          options: {
            client: {
              clientId: 'expenses-service',
              brokers: [config.kafkaBroker],
            },
            producer: {
              allowAutoTopicCreation: true,
            },
          },
        }),
      },
    ]),
  ],
  controllers: [ExpensesController],
  providers: [
    // ── Repository (infrastructure → domain interface) ───────────────────────
    {
      provide: EXPENSE_REPOSITORY_TOKEN,
      useClass: SqliteExpenseRepository,
    },

    // ── Event Publisher ──────────────────────────────────────────────────────
    { provide: EXPENSE_EVENT_PUBLISHER_TOKEN, useClass: ExpenseEventPublisher },

    // ── Use Cases (application layer) ────────────────────────────────────────
    { provide: CREATE_EXPENSE_USE_CASE_TOKEN, useClass: CreateExpenseUseCase },
    { provide: GET_EXPENSE_USE_CASE_TOKEN, useClass: GetExpenseUseCase },
    { provide: LIST_EXPENSES_USE_CASE_TOKEN, useClass: ListExpensesUseCase },
    { provide: UPDATE_EXPENSE_USE_CASE_TOKEN, useClass: UpdateExpenseUseCase },
    { provide: DELETE_EXPENSE_USE_CASE_TOKEN, useClass: DeleteExpenseUseCase },
    { provide: GET_EXPENSE_SUMMARY_USE_CASE_TOKEN, useClass: GetExpenseSummaryUseCase },
  ],
})
export class ExpensesModule {}
