import type { ExpenseCategory } from '@shared/enums/expense-category.enum';

/** Backend `/analytics/trends`: SpendingTrend[] from get-spending-trends.use-case.ts */
export interface MonthlyTrendPoint {
  period: string;
  totalCents: number;
  count: number;
  categories: { category: ExpenseCategory; totalCents: number; count: number }[];
}

/** Backend `/analytics/breakdown`: returns CategoryBreakdown[] directly (not wrapped). */
export interface CategoryBreakdownEntry {
  category: ExpenseCategory;
  totalCents: number;
  count: number;
  percentage: number;
}

/** Backend `/analytics/anomalies`: SpendingAnomaly[] from detect-anomalies.use-case.ts */
export interface AnomalyEntry {
  category: ExpenseCategory;
  currentCents: number;
  averageCents: number;
  deviationPercent: number;
}
