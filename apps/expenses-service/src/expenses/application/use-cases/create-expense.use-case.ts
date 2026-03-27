import { Inject, Injectable } from '@nestjs/common';

import type { CreateExpenseDto } from '@shared/dtos/expense/create-expense.dto';

import { Expense } from '../../domain/entities/expense.entity';
import type { IExpenseRepository } from '../../domain/repositories/expense.repository.interface';
import { EXPENSE_REPOSITORY_TOKEN } from '../../tokens';

export interface CreateExpenseCommand {
  userId: string;
  dto: CreateExpenseDto;
}

/**
 * Single Responsibility: this class does exactly one thing — create an expense.
 * All validation of business invariants (amount > 0, etc.) is delegated to
 * Expense.create() where they cannot be bypassed.
 */
@Injectable()
export class CreateExpenseUseCase {
  constructor(
    @Inject(EXPENSE_REPOSITORY_TOKEN)
    private readonly expenseRepository: IExpenseRepository,
  ) {}

  async execute(command: CreateExpenseCommand): Promise<Expense> {
    const expense = Expense.create({
      userId: command.userId,
      amountCents: command.dto.amountCents,
      currency: command.dto.currency,
      category: command.dto.category,
      description: command.dto.description,
      date: command.dto.date,
    });

    return this.expenseRepository.save(expense);
  }
}
