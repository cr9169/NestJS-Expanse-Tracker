import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';

import { AppConfigModule } from '../config/app-config.module';
import { AppConfigService } from '../config/app-config.service';
import { DatabaseModule } from '../database/database.module';

import { CreateBudgetUseCase } from './application/use-cases/create-budget.use-case';
import { DeleteBudgetUseCase } from './application/use-cases/delete-budget.use-case';
import { GetBudgetStatusUseCase } from './application/use-cases/get-budget-status.use-case';
import { ListBudgetsUseCase } from './application/use-cases/list-budgets.use-case';
import { ProcessExpenseEventUseCase } from './application/use-cases/process-expense-event.use-case';
import { UpdateBudgetUseCase } from './application/use-cases/update-budget.use-case';
import { BudgetsController } from './budgets.controller';
import { BudgetsEventHandler } from './budgets.event-handler';
import { SqliteBudgetRepository } from './infrastructure/repositories/sqlite-budget.repository';
import {
  BUDGET_REPOSITORY_TOKEN,
  CREATE_BUDGET_USE_CASE_TOKEN,
  DELETE_BUDGET_USE_CASE_TOKEN,
  GET_BUDGET_STATUS_USE_CASE_TOKEN,
  LIST_BUDGETS_USE_CASE_TOKEN,
  PROCESS_EXPENSE_EVENT_USE_CASE_TOKEN,
  RABBITMQ_CLIENT_TOKEN,
  UPDATE_BUDGET_USE_CASE_TOKEN,
} from './tokens';

@Module({
  imports: [
    DatabaseModule,
    AppConfigModule,

    // RabbitMQ client for emitting budget threshold alerts to notification-service
    ClientsModule.registerAsync([
      {
        name: RABBITMQ_CLIENT_TOKEN,
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
  ],
  controllers: [BudgetsController, BudgetsEventHandler],
  providers: [
    { provide: BUDGET_REPOSITORY_TOKEN, useClass: SqliteBudgetRepository },
    { provide: CREATE_BUDGET_USE_CASE_TOKEN, useClass: CreateBudgetUseCase },
    { provide: UPDATE_BUDGET_USE_CASE_TOKEN, useClass: UpdateBudgetUseCase },
    { provide: DELETE_BUDGET_USE_CASE_TOKEN, useClass: DeleteBudgetUseCase },
    { provide: LIST_BUDGETS_USE_CASE_TOKEN, useClass: ListBudgetsUseCase },
    { provide: GET_BUDGET_STATUS_USE_CASE_TOKEN, useClass: GetBudgetStatusUseCase },
    { provide: PROCESS_EXPENSE_EVENT_USE_CASE_TOKEN, useClass: ProcessExpenseEventUseCase },
  ],
})
export class BudgetsModule {}
