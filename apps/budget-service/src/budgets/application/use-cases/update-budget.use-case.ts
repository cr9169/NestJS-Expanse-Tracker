import { Inject, Injectable } from '@nestjs/common';

import type { UpdateBudgetDto } from '@shared/dtos/budget/update-budget.dto';

import { NotFoundException } from '../../../common/exceptions/not-found.exception';
import type { Budget } from '../../domain/entities/budget.entity';
import type { IBudgetRepository } from '../../domain/repositories/budget.repository.interface';
import { BUDGET_REPOSITORY_TOKEN } from '../../tokens';

export interface UpdateBudgetCommand {
  id: string;
  userId: string;
  dto: UpdateBudgetDto;
}

@Injectable()
export class UpdateBudgetUseCase {
  constructor(
    @Inject(BUDGET_REPOSITORY_TOKEN)
    private readonly budgetRepository: IBudgetRepository,
  ) {}

  async execute(command: UpdateBudgetCommand): Promise<Budget> {
    const existing = await this.budgetRepository.findById(command.id, command.userId);
    if (!existing) {
      throw new NotFoundException('BUDGET_NOT_FOUND', `Budget ${command.id} not found`);
    }

    const updated = command.dto.monthlyLimitCents
      ? existing.updateLimit(command.dto.monthlyLimitCents)
      : existing;

    return this.budgetRepository.update(updated);
  }
}
