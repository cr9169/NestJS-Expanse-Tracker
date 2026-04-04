import { Inject, Injectable } from '@nestjs/common';

import type { Budget } from '../../domain/entities/budget.entity';
import type { IBudgetRepository } from '../../domain/repositories/budget.repository.interface';
import { BUDGET_REPOSITORY_TOKEN } from '../../tokens';

@Injectable()
export class ListBudgetsUseCase {
  constructor(
    @Inject(BUDGET_REPOSITORY_TOKEN)
    private readonly budgetRepository: IBudgetRepository,
  ) {}

  async execute(userId: string): Promise<Budget[]> {
    return this.budgetRepository.findAllByUser(userId);
  }
}
