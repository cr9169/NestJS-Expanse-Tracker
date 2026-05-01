import { z } from 'zod';

import { ExpenseCategory } from '@shared/enums/expense-category.enum';

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use format YYYY-MM-DD');

/**
 * Mirrors packages/shared/src/dtos/expense/create-expense.dto.ts.
 * Backend constraints (must stay byte-identical):
 *   amountCents: int 1..10_000_000
 *   currency:    length 3 (default USD)
 *   category:    ExpenseCategory enum
 *   description: 1..500 chars
 *   date:        YYYY-MM-DD
 */
export const createExpenseSchema = z.object({
  amountCents: z.number().int().min(1).max(10_000_000),
  currency: z.string().length(3).default('USD'),
  category: z.nativeEnum(ExpenseCategory),
  description: z.string().min(1).max(500),
  date: isoDate,
});

export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;

export const updateExpenseSchema = createExpenseSchema.partial();
export type UpdateExpenseInput = z.infer<typeof updateExpenseSchema>;

// What the user types in the form — strings + decimal money.
export const expenseFormSchema = z.object({
  amountDecimal: z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/, 'Enter a positive amount, e.g. 12.50'),
  currency: z.string().length(3).default('USD'),
  category: z.nativeEnum(ExpenseCategory),
  description: z.string().min(1, 'Required').max(500),
  date: isoDate,
});

export type ExpenseFormValues = z.infer<typeof expenseFormSchema>;

export interface Expense {
  id: string;
  userId: string;
  amountCents: number;
  currency: string;
  category: ExpenseCategory;
  description: string;
  date: string;
  createdAt: string;
  updatedAt: string;
}

export interface CategorySummary {
  category: ExpenseCategory;
  totalCents: number;
  count: number;
}
