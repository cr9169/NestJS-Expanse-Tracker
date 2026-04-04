import { Controller, Inject } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';

import { TCP_PATTERNS } from '@shared/constants/tcp-patterns.constants';
import type { CreateBudgetDto } from '@shared/dtos/budget/create-budget.dto';
import type { UpdateBudgetDto } from '@shared/dtos/budget/update-budget.dto';

import { handleRpc } from '../common/handle-rpc';

import type { CreateBudgetUseCase } from './application/use-cases/create-budget.use-case';
import type { DeleteBudgetUseCase } from './application/use-cases/delete-budget.use-case';
import type { GetBudgetStatusUseCase } from './application/use-cases/get-budget-status.use-case';
import type { ListBudgetsUseCase } from './application/use-cases/list-budgets.use-case';
import type { UpdateBudgetUseCase } from './application/use-cases/update-budget.use-case';
import {
  CREATE_BUDGET_USE_CASE_TOKEN,
  DELETE_BUDGET_USE_CASE_TOKEN,
  GET_BUDGET_STATUS_USE_CASE_TOKEN,
  LIST_BUDGETS_USE_CASE_TOKEN,
  UPDATE_BUDGET_USE_CASE_TOKEN,
} from './tokens';

@Controller()
export class BudgetsController {
  constructor(
    @Inject(CREATE_BUDGET_USE_CASE_TOKEN) private readonly createBudget: CreateBudgetUseCase,
    @Inject(LIST_BUDGETS_USE_CASE_TOKEN) private readonly listBudgets: ListBudgetsUseCase,
    @Inject(GET_BUDGET_STATUS_USE_CASE_TOKEN) private readonly getBudgetStatus: GetBudgetStatusUseCase,
    @Inject(UPDATE_BUDGET_USE_CASE_TOKEN) private readonly updateBudget: UpdateBudgetUseCase,
    @Inject(DELETE_BUDGET_USE_CASE_TOKEN) private readonly deleteBudget: DeleteBudgetUseCase,
  ) {}

  @MessagePattern(TCP_PATTERNS.BUDGETS_CREATE)
  async create(
    @Payload() payload: { userId: string; dto: CreateBudgetDto },
  ): Promise<Record<string, unknown>> {
    return handleRpc(async () => {
      const budget = await this.createBudget.execute({
        userId: payload.userId,
        dto: payload.dto,
      });
      return budget.toJSON();
    });
  }

  @MessagePattern(TCP_PATTERNS.BUDGETS_LIST)
  async list(
    @Payload() payload: { userId: string },
  ): Promise<Record<string, unknown>[]> {
    return handleRpc(async () => {
      const budgets = await this.listBudgets.execute(payload.userId);
      return budgets.map((b) => b.toJSON());
    });
  }

  @MessagePattern(TCP_PATTERNS.BUDGETS_STATUS)
  async status(
    @Payload() payload: { userId: string; month?: string },
  ): Promise<Record<string, unknown>[]> {
    return handleRpc(async () => {
      const statuses = await this.getBudgetStatus.execute({
        userId: payload.userId,
        month: payload.month,
      });
      return statuses.map((s) => s.toJSON());
    });
  }

  @MessagePattern(TCP_PATTERNS.BUDGETS_UPDATE)
  async update(
    @Payload() payload: { id: string; userId: string; dto: UpdateBudgetDto },
  ): Promise<Record<string, unknown>> {
    return handleRpc(async () => {
      const budget = await this.updateBudget.execute({
        id: payload.id,
        userId: payload.userId,
        dto: payload.dto,
      });
      return budget.toJSON();
    });
  }

  @MessagePattern(TCP_PATTERNS.BUDGETS_DELETE)
  async delete(
    @Payload() payload: { id: string; userId: string },
  ): Promise<void> {
    return handleRpc(async () => {
      await this.deleteBudget.execute({ id: payload.id, userId: payload.userId });
    });
  }
}
