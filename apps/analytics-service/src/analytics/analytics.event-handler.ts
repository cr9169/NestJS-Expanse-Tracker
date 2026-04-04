import { Controller, Inject, Logger } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';

import { KAFKA_TOPICS } from '@shared/constants/kafka-topics.constants';
import type { ExpenseEvent } from '@shared/types/expense-event.type';

import type { ProcessExpenseEventUseCase } from './application/use-cases/process-expense-event.use-case';
import { PROCESS_EXPENSE_EVENT_USE_CASE_TOKEN } from './tokens';

/**
 * Consumes the expense.lifecycle Kafka topic and updates materialized views.
 * Kafka handles consumer group offset tracking automatically — if this service
 * crashes, it resumes from the last committed offset on restart.
 */
@Controller()
export class AnalyticsEventHandler {
  private readonly logger = new Logger(AnalyticsEventHandler.name);

  constructor(
    @Inject(PROCESS_EXPENSE_EVENT_USE_CASE_TOKEN)
    private readonly processExpenseEvent: ProcessExpenseEventUseCase,
  ) {}

  @EventPattern(KAFKA_TOPICS.EXPENSE_LIFECYCLE)
  async handleExpenseLifecycle(@Payload() event: ExpenseEvent): Promise<void> {
    try {
      await this.processExpenseEvent.execute(event);
    } catch (error) {
      this.logger.error(
        `Failed to process Kafka event: ${JSON.stringify(event)}`,
        error instanceof Error ? error.stack : String(error),
      );
    }
  }
}
