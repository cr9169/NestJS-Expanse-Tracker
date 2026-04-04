import { Inject, Injectable } from '@nestjs/common';

import type { IBudgetRepository } from '../../domain/repositories/budget.repository.interface';
import { BudgetStatus } from '../../domain/value-objects/budget-status.value-object';
import { BUDGET_REPOSITORY_TOKEN } from '../../tokens';

export interface GetBudgetStatusCommand {
  userId: string;
  /** YYYY-MM format. Defaults to current month. */
  month?: string;
}

@Injectable()
export class GetBudgetStatusUseCase {
  constructor(
    @Inject(BUDGET_REPOSITORY_TOKEN)
    private readonly budgetRepository: IBudgetRepository,
  ) {}

  async execute(command: GetBudgetStatusCommand): Promise<BudgetStatus[]> {
    const period = command.month ?? this.currentPeriod();
    const budgets = await this.budgetRepository.findAllByUser(command.userId);
    const spending = await this.budgetRepository.getSpending(command.userId, period);

    // Index spending by category for O(1) lookup
    const spendingMap = new Map<string, number>();
    for (const record of spending) {
      spendingMap.set(record.category, record.spentCents);
    }

    return budgets.map((budget) => {
      let spentCents: number;

      if (budget.category === null) {
        // OVERALL budget: sum all categories
        spentCents = 0;
        for (const amount of spendingMap.values()) {
          spentCents += amount;
        }
      } else {
        spentCents = spendingMap.get(budget.category) ?? 0;
      }

      return new BudgetStatus(budget, spentCents, period);
    });
  }

  private currentPeriod(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  }
}
