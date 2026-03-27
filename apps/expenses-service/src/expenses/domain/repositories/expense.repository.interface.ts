import type { PaginatedResult } from '@shared/types/api-response.type';
import type { CategorySummary } from '@shared/types/category-summary.type';
import type { ExpenseCategory } from '@shared/enums/expense-category.enum';

import type { Expense } from '../entities/expense.entity';

export interface ExpenseFilters {
  category?: ExpenseCategory;
  from?: string;
  to?: string;
  page: number;
  limit: number;
}

export interface DateRange {
  from: string;
  to: string;
}

/**
 * ARCHITECTURE NOTE:
 * The repository interface lives in the DOMAIN layer — it expresses what the
 * domain needs in terms of persistence, without knowing HOW it's implemented.
 * The SQLite implementation (in infrastructure) depends on this interface,
 * not the other way around. This is classic Dependency Inversion.
 *
 * Consequence: swapping SQLite for DynamoDB in Week 3 means writing a new
 * implementation class — zero changes to domain or use-case code.
 */
export interface IExpenseRepository {
  findById(id: string, userId: string): Promise<Expense | null>;
  findAll(userId: string, filters: ExpenseFilters): Promise<PaginatedResult<Expense>>;
  save(expense: Expense): Promise<Expense>;
  update(expense: Expense): Promise<Expense>;
  delete(id: string, userId: string): Promise<void>;
  getSummary(userId: string, dateRange: DateRange): Promise<CategorySummary[]>;
}
