import { Controller, Inject, Logger } from '@nestjs/common';
import { Ctx, EventPattern, Payload, RmqContext } from '@nestjs/microservices';

import { RABBITMQ_PATTERNS } from '@shared/constants/rabbitmq-patterns.constants';
import { NotificationType } from '@shared/enums/notification-type.enum';
import type { BudgetAlert } from '@shared/types/budget-alert.type';
import type { ExpenseEvent } from '@shared/types/expense-event.type';

import type { CreateNotificationUseCase } from './application/use-cases/create-notification.use-case';
import { CREATE_NOTIFICATION_USE_CASE_TOKEN } from './tokens';

@Controller()
export class NotificationsEventHandler {
  private readonly logger = new Logger(NotificationsEventHandler.name);

  constructor(
    @Inject(CREATE_NOTIFICATION_USE_CASE_TOKEN)
    private readonly createNotification: CreateNotificationUseCase,
  ) {}

  @EventPattern(RABBITMQ_PATTERNS.BUDGET_THRESHOLD_WARNING)
  async handleBudgetWarning(
    @Payload() alert: BudgetAlert,
    @Ctx() context: RmqContext,
  ): Promise<void> {
    try {
      await this.createNotification.execute({
        userId: alert.userId,
        type: NotificationType.BUDGET_WARNING,
        title: `Budget warning: ${alert.category}`,
        message: `You have used ${alert.percentUsed}% of your ${alert.category} budget ($${(alert.spentCents / 100).toFixed(2)} of $${(alert.monthlyLimitCents / 100).toFixed(2)})`,
        metadata: { ...alert },
      });
      context.getChannelRef().ack(context.getMessage());
    } catch (error) {
      this.logger.error('Failed to process budget warning', error);
      context.getChannelRef().nack(context.getMessage(), false, false);
    }
  }

  @EventPattern(RABBITMQ_PATTERNS.BUDGET_THRESHOLD_EXCEEDED)
  async handleBudgetExceeded(
    @Payload() alert: BudgetAlert,
    @Ctx() context: RmqContext,
  ): Promise<void> {
    try {
      await this.createNotification.execute({
        userId: alert.userId,
        type: NotificationType.BUDGET_EXCEEDED,
        title: `Budget exceeded: ${alert.category}`,
        message: `You have exceeded your ${alert.category} budget! Spent $${(alert.spentCents / 100).toFixed(2)} of $${(alert.monthlyLimitCents / 100).toFixed(2)} (${alert.percentUsed}%)`,
        metadata: { ...alert },
      });
      context.getChannelRef().ack(context.getMessage());
    } catch (error) {
      this.logger.error('Failed to process budget exceeded', error);
      context.getChannelRef().nack(context.getMessage(), false, false);
    }
  }

  @EventPattern(RABBITMQ_PATTERNS.EXPENSE_LARGE_AMOUNT)
  async handleLargeExpense(
    @Payload() event: ExpenseEvent,
    @Ctx() context: RmqContext,
  ): Promise<void> {
    try {
      await this.createNotification.execute({
        userId: event.userId,
        type: NotificationType.LARGE_EXPENSE,
        title: 'Large expense recorded',
        message: `A large expense of $${(event.amountCents / 100).toFixed(2)} was recorded in ${event.category}`,
        metadata: {
          expenseId: event.expenseId,
          amountCents: event.amountCents,
          category: event.category,
        },
      });
      context.getChannelRef().ack(context.getMessage());
    } catch (error) {
      this.logger.error('Failed to process large expense notification', error);
      context.getChannelRef().nack(context.getMessage(), false, false);
    }
  }
}
