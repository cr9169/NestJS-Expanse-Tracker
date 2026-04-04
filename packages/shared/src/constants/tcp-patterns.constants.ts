/**
 * ARCHITECTURE NOTE:
 * TCP message patterns are defined as a typed const object in @app/shared so
 * both gateway (sender) and expenses-service (receiver) always reference the
 * same strings. A typo on either side is a compile-time error, not a silent
 * runtime failure where messages are dropped with no error surfaced.
 */
export const TCP_PATTERNS = {
  // ── Expenses ──────────────────────────────────────────────────────────────
  EXPENSES_CREATE: 'expenses.create',
  EXPENSES_FIND_BY_ID: 'expenses.findById',
  EXPENSES_LIST: 'expenses.list',
  EXPENSES_UPDATE: 'expenses.update',
  EXPENSES_DELETE: 'expenses.delete',
  EXPENSES_SUMMARY: 'expenses.summary',

  // ── Auth ──────────────────────────────────────────────────────────────────
  AUTH_REGISTER: 'auth.register',
  AUTH_LOGIN: 'auth.login',
  AUTH_REFRESH: 'auth.refresh',

  // ── Budgets ────────────────────────────────────────────────────────────────
  BUDGETS_CREATE: 'budgets.create',
  BUDGETS_LIST: 'budgets.list',
  BUDGETS_STATUS: 'budgets.status',
  BUDGETS_UPDATE: 'budgets.update',
  BUDGETS_DELETE: 'budgets.delete',

  // ── Notifications ──────────────────────────────────────────────────────────
  NOTIFICATIONS_LIST: 'notifications.list',
  NOTIFICATIONS_UNREAD_COUNT: 'notifications.unreadCount',
  NOTIFICATIONS_MARK_READ: 'notifications.markRead',
  NOTIFICATIONS_MARK_ALL_READ: 'notifications.markAllRead',

  // ── Analytics ──────────────────────────────────────────────────────────────
  ANALYTICS_TRENDS: 'analytics.trends',
  ANALYTICS_BREAKDOWN: 'analytics.breakdown',
  ANALYTICS_ANOMALIES: 'analytics.anomalies',
} as const;

export type TcpPattern = (typeof TCP_PATTERNS)[keyof typeof TCP_PATTERNS];
