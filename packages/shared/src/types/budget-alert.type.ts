/**
 * Payload emitted by budget-service when a user's spending crosses
 * a budget threshold (80% warning or 100% exceeded).
 * Consumed by notification-service via RabbitMQ.
 */
export interface BudgetAlert {
  userId: string;
  /** Category name or 'OVERALL' for total budget */
  category: string;
  monthlyLimitCents: number;
  spentCents: number;
  percentUsed: number;
  /** Budget period in YYYY-MM format */
  period: string;
}
