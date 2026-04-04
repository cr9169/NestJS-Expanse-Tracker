import { Inject, Injectable } from '@nestjs/common';

import type { CreateBudgetDto } from '@shared/dtos/budget/create-budget.dto';

import { ValidationException } from '../../../common/exceptions/validation.exception';
import { Budget } from '../../domain/entities/budget.entity';
import type { IBudgetRepository } from '../../domain/repositories/budget.repository.interface';
import { BUDGET_REPOSITORY_TOKEN } from '../../tokens';

export interface CreateBudgetCommand {
  userId: string;
  dto: CreateBudgetDto;
}

@Injectable()
export class CreateBudgetUseCase {
  constructor(
    @Inject(BUDGET_REPOSITORY_TOKEN)
    private readonly budgetRepository: IBudgetRepository,
  ) {}

  async execute(command: CreateBudgetCommand): Promise<Budget> {
    const category = command.dto.category ?? null;

    // One budget per category per user
    const existing = await this.budgetRepository.findByUserAndCategory(
      command.userId,
      category,
    );
    if (existing) {
      const label = category ?? 'OVERALL';
      throw new ValidationException(
        'BUDGET_ALREADY_EXISTS',
        `A budget for ${label} already exists`,
      );
    }

    const budget = Budget.create({
      userId: command.userId,
      category: command.dto.category,
      monthlyLimitCents: command.dto.monthlyLimitCents,
      currency: command.dto.currency,
    });

    return this.budgetRepository.save(budget);
  }
}
