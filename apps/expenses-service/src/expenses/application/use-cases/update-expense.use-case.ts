import { Inject, Injectable } from '@nestjs/common';

import type { UpdateExpenseDto } from '@shared/dtos/expense/update-expense.dto';

import { NotFoundException } from '../../../common/exceptions/not-found.exception';
import type { Expense } from '../../domain/entities/expense.entity';
import type { IExpenseRepository } from '../../domain/repositories/expense.repository.interface';
import { EXPENSE_REPOSITORY_TOKEN } from '../../tokens';

export interface UpdateExpenseCommand {
  id: string;
  userId: string;
  dto: UpdateExpenseDto;
}

@Injectable()
export class UpdateExpenseUseCase {
  constructor(
    @Inject(EXPENSE_REPOSITORY_TOKEN)
    private readonly expenseRepository: IExpenseRepository,
  ) {}

  async execute(command: UpdateExpenseCommand): Promise<Expense> {
    // Fetch first to verify existence AND ownership — prevents IDOR vulnerabilities
    const existing = await this.expenseRepository.findById(command.id, command.userId);
    if (!existing) {
      throw new NotFoundException('EXPENSE_NOT_FOUND', `Expense ${command.id} not found`);
    }

    const updated = existing.update({
      amountCents: command.dto.amountCents,
      currency: command.dto.currency,
      category: command.dto.category,
      description: command.dto.description,
      date: command.dto.date,
    });

    return this.expenseRepository.update(updated);
  }
}
