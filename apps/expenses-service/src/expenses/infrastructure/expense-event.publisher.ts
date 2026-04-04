import { Inject, Injectable, Logger, type OnModuleInit } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';

import { KAFKA_TOPICS } from '@shared/constants/kafka-topics.constants';
import { RABBITMQ_PATTERNS } from '@shared/constants/rabbitmq-patterns.constants';
import type { ExpenseEvent } from '@shared/types/expense-event.type';

import type { Expense } from '../domain/entities/expense.entity';
import { KAFKA_CLIENT_TOKEN, RABBITMQ_CLIENT_TOKEN } from '../tokens';

/**
 * Publishes expense lifecycle events to both RabbitMQ (for immediate side effects
 * like budget checks) and Kafka (for the analytics event log).
 *
 * Events are fire-and-forget after the DB write succeeds. In a production system
 * you would use the transactional outbox pattern to guarantee delivery; for this
 * project we accept at-most-once event delivery as a trade-off for simplicity.
 */
@Injectable()
export class ExpenseEventPublisher implements OnModuleInit {
  private readonly logger = new Logger(ExpenseEventPublisher.name);

  constructor(
    @Inject(RABBITMQ_CLIENT_TOKEN) private readonly rabbitClient: ClientProxy,
    @Inject(KAFKA_CLIENT_TOKEN) private readonly kafkaClient: ClientProxy,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.rabbitClient.connect();
    await this.kafkaClient.connect();
  }

  publishCreated(expense: Expense): void {
    const event = this.toEvent('CREATED', expense);

    this.rabbitClient.emit(RABBITMQ_PATTERNS.EXPENSE_CREATED, event);
    this.kafkaClient.emit(KAFKA_TOPICS.EXPENSE_LIFECYCLE, {
      key: expense.userId,
      value: event,
    });

    this.logger.log(`Emitted CREATED event for expense ${expense.id}`);
  }

  publishUpdated(previous: Expense, updated: Expense): void {
    const event: ExpenseEvent = {
      ...this.toEvent('UPDATED', updated),
      previousAmountCents: previous.amount.amountCents,
    };

    this.rabbitClient.emit(RABBITMQ_PATTERNS.EXPENSE_UPDATED, event);
    this.kafkaClient.emit(KAFKA_TOPICS.EXPENSE_LIFECYCLE, {
      key: updated.userId,
      value: event,
    });

    this.logger.log(`Emitted UPDATED event for expense ${updated.id}`);
  }

  publishDeleted(expense: Expense): void {
    const event = this.toEvent('DELETED', expense);

    this.rabbitClient.emit(RABBITMQ_PATTERNS.EXPENSE_DELETED, event);
    this.kafkaClient.emit(KAFKA_TOPICS.EXPENSE_LIFECYCLE, {
      key: expense.userId,
      value: event,
    });

    this.logger.log(`Emitted DELETED event for expense ${expense.id}`);
  }

  publishLargeExpense(expense: Expense): void {
    const event = this.toEvent('CREATED', expense);
    this.rabbitClient.emit(RABBITMQ_PATTERNS.EXPENSE_LARGE_AMOUNT, event);
    this.logger.log(
      `Emitted LARGE_AMOUNT event for expense ${expense.id} (${expense.amount.amountCents} cents)`,
    );
  }

  private toEvent(
    eventType: ExpenseEvent['eventType'],
    expense: Expense,
  ): ExpenseEvent {
    return {
      eventType,
      expenseId: expense.id,
      userId: expense.userId,
      amountCents: expense.amount.amountCents,
      currency: expense.amount.currency,
      category: expense.category,
      date: expense.date.toISOString().split('T')[0]!,
      timestamp: new Date().toISOString(),
    };
  }
}
