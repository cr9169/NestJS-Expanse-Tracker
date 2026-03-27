import { Inject, Injectable } from '@nestjs/common';

import { NotFoundException } from '../../../common/exceptions/not-found.exception';
import type { Expense } from '../../domain/entities/expense.entity';
import type { IExpenseRepository } from '../../domain/repositories/expense.repository.interface';
import { EXPENSE_REPOSITORY_TOKEN } from '../../tokens';

export interface GetExpenseQuery {
  id: string;
  userId: string;
}

@Injectable()
export class GetExpenseUseCase {
  constructor(
    @Inject(EXPENSE_REPOSITORY_TOKEN)
    private readonly expenseRepository: IExpenseRepository,
  ) {}

  async execute(query: GetExpenseQuery): Promise<Expense> {
    const expense = await this.expenseRepository.findById(query.id, query.userId);

    if (!expense) {
      throw new NotFoundException('EXPENSE_NOT_FOUND', `Expense ${query.id} not found`);
    }

    return expense;
  }
}
