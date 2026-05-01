import { z } from 'zod';

import { ExpenseCategory } from '@shared/enums/expense-category.enum';

/**
 * Mirrors packages/shared/src/dtos/budget/*.dto.ts
 *   monthlyLimitCents: int 1..10_000_000
 *   currency:          length 3 (default USD)
 *   category:          ExpenseCategory or omitted (= overall budget)
 */
export const createBudgetSchema = z.object({
  category: z.nativeEnum(ExpenseCategory).optional(),
  monthlyLimitCents: z.number().int().min(1).max(10_000_000),
  currency: z.string().length(3).default('USD'),
});

export type CreateBudgetInput = z.infer<typeof createBudgetSchema>;

export const updateBudgetSchema = z.object({
  monthlyLimitCents: z.number().int().min(1).max(10_000_000),
});

export type UpdateBudgetInput = z.infer<typeof updateBudgetSchema>;

export const budgetFormSchema = z.object({
  scope: z.enum(['CATEGORY', 'OVERALL']),
  category: z.nativeEnum(ExpenseCategory).optional(),
  limitDecimal: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Enter a positive amount'),
  currency: z.string().length(3).default('USD'),
});

export type BudgetFormValues = z.infer<typeof budgetFormSchema>;

export interface Budget {
  id: string;
  userId: string;
  category: ExpenseCategory | null;
  monthlyLimitCents: number;
  currency: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Backend `/api/v1/budgets/status` returns a flat array. Each item is a Budget
 * (id/userId/category/monthlyLimitCents/currency/createdAt/updatedAt) with the
 * computed status fields spread on top. There is no separate `budgetId` — the
 * `id` IS the budget id.
 */
export interface BudgetStatusEntry {
  id: string;
  userId: string;
  category: ExpenseCategory | null;
  monthlyLimitCents: number;
  currency: string;
  createdAt: string;
  updatedAt: string;
  spentCents: number;
  remainingCents: number;
  percentUsed: number;
  isWarning: boolean;
  isExceeded: boolean;
  period: string;
}
