import { Inject, Injectable } from '@nestjs/common';

import type { CategorySummary } from '@shared/types/category-summary.type';
import type { ExpenseSummaryQueryDto } from '@shared/dtos/expense/expense-summary-query.dto';

import type { IExpenseRepository } from '../../domain/repositories/expense.repository.interface';
import { EXPENSE_REPOSITORY_TOKEN } from '../../tokens';

export interface GetExpenseSummaryQuery {
  userId: string;
  dto: ExpenseSummaryQueryDto;
}

@Injectable()
export class GetExpenseSummaryUseCase {
  constructor(
    @Inject(EXPENSE_REPOSITORY_TOKEN)
    private readonly expenseRepository: IExpenseRepository,
  ) {}

  async execute(query: GetExpenseSummaryQuery): Promise<CategorySummary[]> {
    return this.expenseRepository.getSummary(query.userId, {
      from: query.dto.from,
      to: query.dto.to,
    });
  }
}
