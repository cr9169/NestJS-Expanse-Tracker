import { Inject, Injectable, Logger } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';

import { RABBITMQ_PATTERNS } from '@shared/constants/rabbitmq-patterns.constants';
import type { BudgetAlert } from '@shared/types/budget-alert.type';
import type { ExpenseEvent } from '@shared/types/expense-event.type';

import type { IBudgetRepository } from '../../domain/repositories/budget.repository.interface';
import { BudgetStatus } from '../../domain/value-objects/budget-status.value-object';
import { BUDGET_REPOSITORY_TOKEN, RABBITMQ_CLIENT_TOKEN } from '../../tokens';

/**
 * Processes expense lifecycle events from RabbitMQ.
 * Updates the budget_spending table and checks if any budget threshold is crossed.
 * If so, emits a threshold alert event for the notification-service.
 */
@Injectable()
export class ProcessExpenseEventUseCase {
  private readonly logger = new Logger(ProcessExpenseEventUseCase.name);

  constructor(
    @Inject(BUDGET_REPOSITORY_TOKEN)
    private readonly budgetRepository: IBudgetRepository,
    @Inject(RABBITMQ_CLIENT_TOKEN)
    private readonly rabbitClient: ClientProxy,
  ) {}

  async execute(event: ExpenseEvent): Promise<void> {
    const period = event.date.substring(0, 7); // YYYY-MM

    switch (event.eventType) {
      case 'CREATED':
        await this.budgetRepository.upsertSpending(
          event.userId,
          event.category,
          period,
          event.amountCents,
        );
        break;

      case 'UPDATED': {
        if (event.previousAmountCents === undefined) {
          this.logger.warn(
            `UPDATED event for expense ${event.expenseId} missing previousAmountCents — skipping`,
          );
          break;
        }
        const delta = event.amountCents - event.previousAmountCents;
        if (delta !== 0) {
          await this.budgetRepository.upsertSpending(
            event.userId,
            event.category,
            period,
            delta,
          );
        }
        break;
      }

      case 'DELETED':
        await this.budgetRepository.upsertSpending(
          event.userId,
          event.category,
          period,
          -event.amountCents,
        );
        break;
    }

    // Check thresholds for this user's budgets
    await this.checkThresholds(event.userId, period);
  }

  private async checkThresholds(userId: string, period: string): Promise<void> {
    const budgets = await this.budgetRepository.findAllByUser(userId);
    const spending = await this.budgetRepository.getSpending(userId, period);

    const spendingMap = new Map<string, number>();
    for (const record of spending) {
      spendingMap.set(record.category, record.spentCents);
    }

    for (const budget of budgets) {
      let spentCents: number;
      if (budget.category === null) {
        spentCents = 0;
        for (const amount of spendingMap.values()) {
          spentCents += amount;
        }
      } else {
        spentCents = spendingMap.get(budget.category) ?? 0;
      }

      const status = new BudgetStatus(budget, spentCents, period);

      if (status.isExceeded) {
        this.emitAlert(RABBITMQ_PATTERNS.BUDGET_THRESHOLD_EXCEEDED, budget, status);
      } else if (status.isWarning) {
        this.emitAlert(RABBITMQ_PATTERNS.BUDGET_THRESHOLD_WARNING, budget, status);
      }
    }
  }

  private emitAlert(
    pattern: string,
    budget: { userId: string; category: string | null; monthlyLimitCents: number },
    status: BudgetStatus,
  ): void {
    const alert: BudgetAlert = {
      userId: budget.userId,
      category: budget.category ?? 'OVERALL',
      monthlyLimitCents: budget.monthlyLimitCents,
      spentCents: status.spentCents,
      percentUsed: status.percentUsed,
      period: status.period,
    };

    this.rabbitClient.emit(pattern, alert);
    this.logger.log(
      `Emitted ${pattern} for user ${budget.userId}, category ${alert.category}: ${status.percentUsed}%`,
    );
  }
}
