/**
 * Payload emitted by expenses-service whenever an expense is created, updated,
 * or deleted. Consumed by budget-service (via RabbitMQ) and analytics-service
 * (via Kafka) to maintain their own materialized state.
 */
export interface ExpenseEvent {
  eventType: 'CREATED' | 'UPDATED' | 'DELETED';
  expenseId: string;
  userId: string;
  amountCents: number;
  /** Present only for UPDATED events — the amount before the change */
  previousAmountCents?: number;
  currency: string;
  category: string;
  date: string;
  timestamp: string;
}
