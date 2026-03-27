import { Controller, Inject } from '@nestjs/common';
import { MessagePattern, Payload, RpcException } from '@nestjs/microservices';

import { TCP_PATTERNS } from '@shared/constants/tcp-patterns.constants';
import type { CreateExpenseDto } from '@shared/dtos/expense/create-expense.dto';
import type { UpdateExpenseDto } from '@shared/dtos/expense/update-expense.dto';
import type { ListExpensesQueryDto } from '@shared/dtos/expense/list-expenses-query.dto';
import type { ExpenseSummaryQueryDto } from '@shared/dtos/expense/expense-summary-query.dto';

import { AppException } from '../common/exceptions/app.exception';

import type { CreateExpenseUseCase } from './application/use-cases/create-expense.use-case';
import type { DeleteExpenseUseCase } from './application/use-cases/delete-expense.use-case';
import type { GetExpenseSummaryUseCase } from './application/use-cases/get-expense-summary.use-case';
import type { GetExpenseUseCase } from './application/use-cases/get-expense.use-case';
import type { ListExpensesUseCase } from './application/use-cases/list-expenses.use-case';
import type { UpdateExpenseUseCase } from './application/use-cases/update-expense.use-case';
import {
  CREATE_EXPENSE_USE_CASE_TOKEN,
  DELETE_EXPENSE_USE_CASE_TOKEN,
  GET_EXPENSE_SUMMARY_USE_CASE_TOKEN,
  GET_EXPENSE_USE_CASE_TOKEN,
  LIST_EXPENSES_USE_CASE_TOKEN,
  UPDATE_EXPENSE_USE_CASE_TOKEN,
} from './tokens';

/**
 * ARCHITECTURE NOTE:
 * This controller is a TCP message handler, not an HTTP controller. It has NO
 * business logic — it extracts the payload, delegates to the use-case, and
 * serialises errors as RpcExceptions so the gateway can reconstruct them.
 *
 * WHY wrap in RpcException: If we throw a raw AppException, NestJS microservices
 * will swallow the structured error and return a generic "Internal server error".
 * RpcException preserves the full error shape across the TCP boundary so the
 * gateway exception filter can map it back to the correct HTTP status.
 */
@Controller()
export class ExpensesController {
  constructor(
    @Inject(CREATE_EXPENSE_USE_CASE_TOKEN)
    private readonly createExpense: CreateExpenseUseCase,

    @Inject(GET_EXPENSE_USE_CASE_TOKEN)
    private readonly getExpense: GetExpenseUseCase,

    @Inject(LIST_EXPENSES_USE_CASE_TOKEN)
    private readonly listExpenses: ListExpensesUseCase,

    @Inject(UPDATE_EXPENSE_USE_CASE_TOKEN)
    private readonly updateExpense: UpdateExpenseUseCase,

    @Inject(DELETE_EXPENSE_USE_CASE_TOKEN)
    private readonly deleteExpense: DeleteExpenseUseCase,

    @Inject(GET_EXPENSE_SUMMARY_USE_CASE_TOKEN)
    private readonly getExpenseSummary: GetExpenseSummaryUseCase,
  ) {}

  @MessagePattern(TCP_PATTERNS.EXPENSES_CREATE)
  async create(
    @Payload() payload: { userId: string; dto: CreateExpenseDto },
  ): Promise<Record<string, unknown>> {
    return this.handle(async () => {
      const expense = await this.createExpense.execute({
        userId: payload.userId,
        dto: payload.dto,
      });
      return expense.toJSON();
    });
  }

  @MessagePattern(TCP_PATTERNS.EXPENSES_FIND_BY_ID)
  async findById(
    @Payload() payload: { id: string; userId: string },
  ): Promise<Record<string, unknown>> {
    return this.handle(async () => {
      const expense = await this.getExpense.execute({
        id: payload.id,
        userId: payload.userId,
      });
      return expense.toJSON();
    });
  }

  @MessagePattern(TCP_PATTERNS.EXPENSES_LIST)
  async list(
    @Payload() payload: { userId: string; filters: ListExpensesQueryDto },
  ): Promise<unknown> {
    return this.handle(async () => {
      const result = await this.listExpenses.execute({
        userId: payload.userId,
        filters: payload.filters,
      });
      return {
        items: result.items.map((e) => e.toJSON()),
        total: result.total,
        page: result.page,
        limit: result.limit,
      };
    });
  }

  @MessagePattern(TCP_PATTERNS.EXPENSES_UPDATE)
  async update(
    @Payload() payload: { id: string; userId: string; dto: UpdateExpenseDto },
  ): Promise<Record<string, unknown>> {
    return this.handle(async () => {
      const expense = await this.updateExpense.execute({
        id: payload.id,
        userId: payload.userId,
        dto: payload.dto,
      });
      return expense.toJSON();
    });
  }

  @MessagePattern(TCP_PATTERNS.EXPENSES_DELETE)
  async delete(@Payload() payload: { id: string; userId: string }): Promise<void> {
    return this.handle(async () => {
      await this.deleteExpense.execute({
        id: payload.id,
        userId: payload.userId,
      });
    });
  }

  @MessagePattern(TCP_PATTERNS.EXPENSES_SUMMARY)
  async getSummary(
    @Payload() payload: { userId: string; dto: ExpenseSummaryQueryDto },
  ): Promise<unknown> {
    return this.handle(async () => {
      return this.getExpenseSummary.execute({
        userId: payload.userId,
        dto: payload.dto,
      });
    });
  }

  /**
   * Centralised error wrapper.
   * AppExceptions become RpcExceptions with their full metadata preserved.
   * Unexpected errors become a generic RpcException to avoid leaking internals.
   */
  private async handle<T>(fn: () => Promise<T>): Promise<T> {
    try {
      return await fn();
    } catch (error) {
      if (error instanceof AppException) {
        throw new RpcException({
          code: error.code,
          message: error.message,
          statusCode: error.statusCode,
        });
      }
      // Unknown error — don't expose internals
      throw new RpcException({ code: 'INTERNAL_ERROR', message: 'Internal server error', statusCode: 500 });
    }
  }
}
