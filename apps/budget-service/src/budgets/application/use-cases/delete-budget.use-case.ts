import { Inject, Injectable } from '@nestjs/common';

import { NotFoundException } from '../../../common/exceptions/not-found.exception';
import type { IBudgetRepository } from '../../domain/repositories/budget.repository.interface';
import { BUDGET_REPOSITORY_TOKEN } from '../../tokens';

export interface DeleteBudgetCommand {
  id: string;
  userId: string;
}

@Injectable()
export class DeleteBudgetUseCase {
  constructor(
    @Inject(BUDGET_REPOSITORY_TOKEN)
    private readonly budgetRepository: IBudgetRepository,
  ) {}

  async execute(command: DeleteBudgetCommand): Promise<void> {
    const existing = await this.budgetRepository.findById(command.id, command.userId);
    if (!existing) {
      throw new NotFoundException('BUDGET_NOT_FOUND', `Budget ${command.id} not found`);
    }

    await this.budgetRepository.delete(command.id, command.userId);
  }
}
