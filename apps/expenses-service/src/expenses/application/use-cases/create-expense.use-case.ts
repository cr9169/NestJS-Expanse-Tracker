import { Inject, Injectable } from '@nestjs/common';

import type { CreateExpenseDto } from '@shared/dtos/expense/create-expense.dto';

import { Expense } from '../../domain/entities/expense.entity';
import type { IExpenseRepository } from '../../domain/repositories/expense.repository.interface';
import type { ExpenseEventPublisher } from '../../infrastructure/expense-event.publisher';
import { EXPENSE_EVENT_PUBLISHER_TOKEN, EXPENSE_REPOSITORY_TOKEN } from '../../tokens';

export interface CreateExpenseCommand {
  userId: string;
  dto: CreateExpenseDto;
}

/**
 * Single Responsibility: this class does exactly one thing — create an expense.
 * All validation of business invariants (amount > 0, etc.) is delegated to
 * Expense.create() where they cannot be bypassed.
 *
 * After persistence, emits events to RabbitMQ (budget/notification side effects)
 * and Kafka (analytics event log). Events are fire-and-forget.
 */
@Injectable()
export class CreateExpenseUseCase {
  constructor(
    @Inject(EXPENSE_REPOSITORY_TOKEN)
    private readonly expenseRepository: IExpenseRepository,
    @Inject(EXPENSE_EVENT_PUBLISHER_TOKEN)
    private readonly eventPublisher: ExpenseEventPublisher,
  ) {}

  async execute(command: CreateExpenseCommand): Promise<Expense> {
    const expense = Expense.create({
      userId: command.userId,
      amountCents: command.dto.amountCents,
      currency: command.dto.currency,
      category: command.dto.category,
      description: command.dto.description,
      date: command.dto.date,
    });

    const saved = await this.expenseRepository.save(expense);

    // Fire-and-forget: events emitted after successful persistence
    this.eventPublisher.publishCreated(saved);

    // Configurable threshold for large expense alerts (default $500 = 50000 cents)
    const threshold = parseInt(process.env['LARGE_EXPENSE_THRESHOLD_CENTS'] ?? '50000', 10);
    if (saved.amount.amountCents >= threshold) {
      this.eventPublisher.publishLargeExpense(saved);
    }

    return saved;
  }
}
