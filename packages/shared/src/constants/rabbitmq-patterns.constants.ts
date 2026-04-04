/**
 * RabbitMQ event patterns for async inter-service communication.
 *
 * Unlike TCP patterns (request/response), these are fire-and-forget events.
 * A service emits an event and does not wait for a reply. Multiple consumers
 * can independently subscribe to the same pattern via separate queues.
 */
export const RABBITMQ_PATTERNS = {
  // ── Expense lifecycle events (emitted by expenses-service) ─────────────
  EXPENSE_CREATED: 'expense.created',
  EXPENSE_UPDATED: 'expense.updated',
  EXPENSE_DELETED: 'expense.deleted',
  EXPENSE_LARGE_AMOUNT: 'expense.large_amount',

  // ── Budget threshold events (emitted by budget-service) ────────────────
  BUDGET_THRESHOLD_WARNING: 'budget.threshold.warning',
  BUDGET_THRESHOLD_EXCEEDED: 'budget.threshold.exceeded',
} as const;

export type RabbitmqPattern =
  (typeof RABBITMQ_PATTERNS)[keyof typeof RABBITMQ_PATTERNS];
