import type { Budget } from '../entities/budget.entity';

/**
 * Computed value object representing a budget's status for a given period.
 * Not stored — derived from budget definition + spending data.
 */
export class BudgetStatus {
  public readonly remainingCents: number;
  public readonly percentUsed: number;

  constructor(
    public readonly budget: Budget,
    public readonly spentCents: number,
    public readonly period: string,
  ) {
    this.remainingCents = Math.max(0, budget.monthlyLimitCents - spentCents);
    this.percentUsed =
      budget.monthlyLimitCents > 0
        ? Math.round((spentCents / budget.monthlyLimitCents) * 100)
        : 0;
  }

  get isExceeded(): boolean {
    return this.spentCents >= this.budget.monthlyLimitCents;
  }

  get isWarning(): boolean {
    return this.percentUsed >= 80 && !this.isExceeded;
  }

  toJSON(): Record<string, unknown> {
    return {
      ...this.budget.toJSON(),
      spentCents: this.spentCents,
      remainingCents: this.remainingCents,
      percentUsed: this.percentUsed,
      period: this.period,
      isExceeded: this.isExceeded,
      isWarning: this.isWarning,
    };
  }
}
