import { v4 as uuidv4 } from 'uuid';

import type { ExpenseCategory } from '@shared/enums/expense-category.enum';

export interface CreateBudgetProps {
  userId: string;
  category?: ExpenseCategory;
  monthlyLimitCents: number;
  currency: string;
}

export interface BudgetRow {
  id: string;
  user_id: string;
  category: string | null;
  monthly_limit_cents: number;
  currency: string;
  created_at: string;
  updated_at: string;
}

export class Budget {
  private constructor(
    public readonly id: string,
    public readonly userId: string,
    /** null means "overall" budget across all categories */
    public readonly category: string | null,
    public readonly monthlyLimitCents: number,
    public readonly currency: string,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}

  static create(props: CreateBudgetProps): Budget {
    const now = new Date();
    return new Budget(
      uuidv4(),
      props.userId,
      props.category ?? null,
      props.monthlyLimitCents,
      props.currency,
      now,
      now,
    );
  }

  static reconstitute(row: BudgetRow): Budget {
    return new Budget(
      row.id,
      row.user_id,
      row.category,
      row.monthly_limit_cents,
      row.currency,
      new Date(row.created_at),
      new Date(row.updated_at),
    );
  }

  updateLimit(newLimitCents: number): Budget {
    return new Budget(
      this.id,
      this.userId,
      this.category,
      newLimitCents,
      this.currency,
      this.createdAt,
      new Date(),
    );
  }

  toJSON(): Record<string, unknown> {
    return {
      id: this.id,
      userId: this.userId,
      category: this.category,
      monthlyLimitCents: this.monthlyLimitCents,
      currency: this.currency,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
    };
  }
}
