import { Inject, Injectable, Logger } from '@nestjs/common';

import type { ExpenseEvent } from '@shared/types/expense-event.type';

import type { IAnalyticsRepository } from '../../domain/repositories/analytics.repository.interface';
import { ANALYTICS_REPOSITORY_TOKEN } from '../../tokens';

/**
 * Processes expense lifecycle events from Kafka and updates
 * the daily and monthly materialized views.
 */
@Injectable()
export class ProcessExpenseEventUseCase {
  private readonly logger = new Logger(ProcessExpenseEventUseCase.name);

  constructor(
    @Inject(ANALYTICS_REPOSITORY_TOKEN)
    private readonly analyticsRepository: IAnalyticsRepository,
  ) {}

  async execute(event: ExpenseEvent): Promise<void> {
    const period = event.date.substring(0, 7); // YYYY-MM

    switch (event.eventType) {
      case 'CREATED':
        await this.analyticsRepository.upsertDailySpending(
          event.userId, event.date, event.category, event.amountCents, 1,
        );
        await this.analyticsRepository.upsertMonthlySpending(
          event.userId, period, event.category, event.amountCents, 1,
        );
        break;

      case 'UPDATED': {
        const delta = event.amountCents - (event.previousAmountCents ?? event.amountCents);
        if (delta !== 0) {
          await this.analyticsRepository.upsertDailySpending(
            event.userId, event.date, event.category, delta, 0,
          );
          await this.analyticsRepository.upsertMonthlySpending(
            event.userId, period, event.category, delta, 0,
          );
        }
        break;
      }

      case 'DELETED':
        await this.analyticsRepository.upsertDailySpending(
          event.userId, event.date, event.category, -event.amountCents, -1,
        );
        await this.analyticsRepository.upsertMonthlySpending(
          event.userId, period, event.category, -event.amountCents, -1,
        );
        break;
    }

    this.logger.debug(`Processed ${event.eventType} event for expense ${event.expenseId}`);
  }
}
