import { v4 as uuidv4 } from 'uuid';

import type { ExpenseCategory } from '@shared/enums/expense-category.enum';

import { DomainException } from '../../../common/exceptions/domain.exception';
import { Money } from '../value-objects/money.value-object';

/**
 * ARCHITECTURE NOTE:
 * The Expense entity has a private constructor and two static factory methods:
 *
 * 1. Expense.create() — for NEW expenses. Generates ID, sets timestamps,
 *    runs ALL invariant validation. The constructor cannot be called directly,
 *    so it's impossible to create an invalid Expense anywhere in the codebase.
 *
 * 2. Expense.reconstitute() — for loading FROM the database. Skips validation
 *    because the data is trusted (it passed validation when first saved).
 *    Running validation on load would be wrong: if validation rules change,
 *    old data would fail to load.
 *
 * The entity knows NOTHING about NestJS, HTTP, or SQLite — no decorators,
 * no imports from infrastructure. This is the Dependency Inversion Principle
 * applied at the architectural level.
 */

export interface CreateExpenseProps {
  userId: string;
  amountCents: number;
  currency: string;
  category: ExpenseCategory;
  description: string;
  /** ISO 8601 date string (YYYY-MM-DD) */
  date: string;
}

export interface ExpenseRow {
  id: string;
  user_id: string;
  amount_cents: number;
  currency: string;
  category: string;
  description: string;
  date: string;
  created_at: string;
  updated_at: string;
}

export interface UpdateExpenseProps {
  amountCents?: number;
  currency?: string;
  category?: ExpenseCategory;
  description?: string;
  date?: string;
}

/** Max description length enforced as a domain invariant */
const MAX_DESCRIPTION_LENGTH = 500;

export class Expense {
  private constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly amount: Money,
    public readonly category: ExpenseCategory,
    public readonly description: string,
    public readonly date: Date,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}

  /**
   * Factory for creating NEW expenses.
   * This is the single place where Expense invariants are checked.
   */
  static create(props: CreateExpenseProps): Expense {
    if (!props.userId?.trim()) {
      throw new DomainException('INVALID_USER', 'userId is required');
    }
    if (props.description.length > MAX_DESCRIPTION_LENGTH) {
      throw new DomainException(
        'DESCRIPTION_TOO_LONG',
        `Description must not exceed ${MAX_DESCRIPTION_LENGTH} characters`,
      );
    }
    if (!props.description.trim()) {
      throw new DomainException('INVALID_DESCRIPTION', 'Description cannot be empty');
    }

    const money = Money.fromCents(props.amountCents, props.currency);
    const date = new Date(props.date);
    if (isNaN(date.getTime())) {
      throw new DomainException('INVALID_DATE', `Invalid date: ${props.date}`);
    }

    const now = new Date();
    return new Expense(
      uuidv4(),
      props.userId,
      money,
      props.category,
      props.description.trim(),
      date,
      now,
      now,
    );
  }

  /**
   * Factory for reconstituting expenses loaded from storage.
   * Skips invariant checks — trusted data path.
   */
  static reconstitute(row: ExpenseRow): Expense {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    const money = Money.fromCents(row.amount_cents, row.currency);
    return new Expense(
      row.id,
      row.user_id,
      money,
      row.category as ExpenseCategory,
      row.description,
      new Date(row.date),
      new Date(row.created_at),
      new Date(row.updated_at),
    );
  }

  /**
   * Produce a new Expense with updated fields.
   * Returns a new instance — entities are immutable after creation.
   */
  update(props: UpdateExpenseProps): Expense {
    const newAmountCents = props.amountCents ?? this.amount.amountCents;
    const newCurrency = props.currency ?? this.amount.currency;
    const newCategory = props.category ?? this.category;
    const newDescription = props.description ?? this.description;
    const newDate = props.date ? new Date(props.date) : this.date;

    if (newDescription.length > MAX_DESCRIPTION_LENGTH) {
      throw new DomainException(
        'DESCRIPTION_TOO_LONG',
        `Description must not exceed ${MAX_DESCRIPTION_LENGTH} characters`,
      );
    }

    return new Expense(
      this.id,
      this.userId,
      Money.fromCents(newAmountCents, newCurrency),
      newCategory,
      newDescription,
      newDate,
      this.createdAt,
      new Date(),
    );
  }

  /** Serialize to a plain object for TCP transport */
  toJSON(): Record<string, unknown> {
    return {
      id: this.id,
      userId: this.userId,
      amountCents: this.amount.amountCents,
      currency: this.amount.currency,
      category: this.category,
      description: this.description,
      date: this.date.toISOString().split('T')[0],
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
    };
  }
}
