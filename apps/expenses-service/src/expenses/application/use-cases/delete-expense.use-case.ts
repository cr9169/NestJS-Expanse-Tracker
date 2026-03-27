import { Inject, Injectable } from '@nestjs/common';

import { NotFoundException } from '../../../common/exceptions/not-found.exception';
import type { IExpenseRepository } from '../../domain/repositories/expense.repository.interface';
import { EXPENSE_REPOSITORY_TOKEN } from '../../tokens';

export interface DeleteExpenseCommand {
  id: string;
  userId: string;
}

@Injectable()
export class DeleteExpenseUseCase {
  constructor(
    @Inject(EXPENSE_REPOSITORY_TOKEN)
    private readonly expenseRepository: IExpenseRepository,
  ) {}

  async execute(command: DeleteExpenseCommand): Promise<void> {
    // Ownership check before delete — repository delete also scopes by userId
    // but checking first gives us a meaningful error vs. silent no-op
    const existing = await this.expenseRepository.findById(command.id, command.userId);
    if (!existing) {
      throw new NotFoundException('EXPENSE_NOT_FOUND', `Expense ${command.id} not found`);
    }

    await this.expenseRepository.delete(command.id, command.userId);
  }
}
