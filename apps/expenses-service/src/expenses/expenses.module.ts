import { Module } from '@nestjs/common';

import { DatabaseModule } from '../database/database.module';

import { CreateExpenseUseCase } from './application/use-cases/create-expense.use-case';
import { DeleteExpenseUseCase } from './application/use-cases/delete-expense.use-case';
import { GetExpenseSummaryUseCase } from './application/use-cases/get-expense-summary.use-case';
import { GetExpenseUseCase } from './application/use-cases/get-expense.use-case';
import { ListExpensesUseCase } from './application/use-cases/list-expenses.use-case';
import { UpdateExpenseUseCase } from './application/use-cases/update-expense.use-case';
import { ExpensesController } from './expenses.controller';
import { SqliteExpenseRepository } from './infrastructure/repositories/sqlite-expense.repository';
import {
  CREATE_EXPENSE_USE_CASE_TOKEN,
  DELETE_EXPENSE_USE_CASE_TOKEN,
  EXPENSE_REPOSITORY_TOKEN,
  GET_EXPENSE_SUMMARY_USE_CASE_TOKEN,
  GET_EXPENSE_USE_CASE_TOKEN,
  LIST_EXPENSES_USE_CASE_TOKEN,
  UPDATE_EXPENSE_USE_CASE_TOKEN,
} from './tokens';

@Module({
  imports: [DatabaseModule],
  controllers: [ExpensesController],
  providers: [
    // ── Repository (infrastructure → domain interface) ───────────────────────
    {
      provide: EXPENSE_REPOSITORY_TOKEN,
      useClass: SqliteExpenseRepository,
    },

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
