import { Inject, Injectable } from '@nestjs/common';

import type { PaginatedResult } from '@shared/types/api-response.type';
import type { ListExpensesQueryDto } from '@shared/dtos/expense/list-expenses-query.dto';

import type { Expense } from '../../domain/entities/expense.entity';
import type {
  IExpenseRepository,
  ExpenseFilters,
} from '../../domain/repositories/expense.repository.interface';
import { EXPENSE_REPOSITORY_TOKEN } from '../../tokens';

export interface ListExpensesQuery {
  userId: string;
  filters: ListExpensesQueryDto;
}

@Injectable()
export class ListExpensesUseCase {
  constructor(
    @Inject(EXPENSE_REPOSITORY_TOKEN)
    private readonly expenseRepository: IExpenseRepository,
  ) {}

  async execute(query: ListExpensesQuery): Promise<PaginatedResult<Expense>> {
    const filters: ExpenseFilters = {
      category: query.filters.category,
      from: query.filters.from,
      to: query.filters.to,
      page: query.filters.page,
      limit: query.filters.limit,
    };

    return this.expenseRepository.findAll(query.userId, filters);
  }
}
