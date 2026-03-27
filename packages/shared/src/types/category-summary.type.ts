import type { ExpenseCategory } from '../enums/expense-category.enum';

/**
 * Result type for the GetExpenseSummary use-case.
 * Amounts are always in cents to avoid floating-point issues.
 */
export interface CategorySummary {
  category: ExpenseCategory;
  /** Total amount in cents (divide by 100 to display) */
  totalCents: number;
  count: number;
}
