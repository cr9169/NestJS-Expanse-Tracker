/**
 * Types of notifications the system can generate.
 * Each maps to a specific event source and message template.
 */
export enum NotificationType {
  BUDGET_WARNING = 'BUDGET_WARNING',
  BUDGET_EXCEEDED = 'BUDGET_EXCEEDED',
  LARGE_EXPENSE = 'LARGE_EXPENSE',
}
