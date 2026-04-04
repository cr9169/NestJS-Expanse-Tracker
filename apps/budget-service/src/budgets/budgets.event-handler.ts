import { Controller, Inject, Logger } from '@nestjs/common';
import { Ctx, EventPattern, Payload, RmqContext } from '@nestjs/microservices';

import { RABBITMQ_PATTERNS } from '@shared/constants/rabbitmq-patterns.constants';
import type { ExpenseEvent } from '@shared/types/expense-event.type';

import type { ProcessExpenseEventUseCase } from './application/use-cases/process-expense-event.use-case';
import { PROCESS_EXPENSE_EVENT_USE_CASE_TOKEN } from './tokens';

/**
 * Handles expense lifecycle events from RabbitMQ.
 * Uses @EventPattern (fire-and-forget) rather than @MessagePattern (RPC).
 * Manual acknowledgment ensures events are redelivered if processing fails.
 */
@Controller()
export class BudgetsEventHandler {
  private readonly logger = new Logger(BudgetsEventHandler.name);

  constructor(
    @Inject(PROCESS_EXPENSE_EVENT_USE_CASE_TOKEN)
    private readonly processExpenseEvent: ProcessExpenseEventUseCase,
  ) {}

  @EventPattern(RABBITMQ_PATTERNS.EXPENSE_CREATED)
  async handleExpenseCreated(
    @Payload() event: ExpenseEvent,
    @Ctx() context: RmqContext,
  ): Promise<void> {
    await this.handleEvent(event, context);
  }

  @EventPattern(RABBITMQ_PATTERNS.EXPENSE_UPDATED)
  async handleExpenseUpdated(
    @Payload() event: ExpenseEvent,
    @Ctx() context: RmqContext,
  ): Promise<void> {
    await this.handleEvent(event, context);
  }

  @EventPattern(RABBITMQ_PATTERNS.EXPENSE_DELETED)
  async handleExpenseDeleted(
    @Payload() event: ExpenseEvent,
    @Ctx() context: RmqContext,
  ): Promise<void> {
    await this.handleEvent(event, context);
  }

  private async handleEvent(event: ExpenseEvent, context: RmqContext): Promise<void> {
    const channel = context.getChannelRef();
    const originalMsg = context.getMessage();

    try {
      await this.processExpenseEvent.execute(event);
      channel.ack(originalMsg);
    } catch (error) {
      this.logger.error(
        `Failed to process ${event.eventType} event for expense ${event.expenseId}`,
        error instanceof Error ? error.stack : String(error),
      );
      // Nack without requeue to avoid infinite loop — message goes to DLQ if configured
      channel.nack(originalMsg, false, false);
    }
  }
}
