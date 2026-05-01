/**
 * Project-wide tunables. Keep durations in milliseconds and named so call sites
 * read like prose — e.g. `refetchInterval: NOTIFICATION_POLL_INTERVAL_MS`.
 */

export const HTTP_TIMEOUT_MS = 15_000;

/** TanStack Query: how long fetched data is considered fresh. */
export const QUERY_STALE_TIME_MS = 30_000;

/** TanStack Query: how long unused cache entries are kept. */
export const QUERY_GC_TIME_MS = 5 * 60_000;

/** Notification bell + list polling cadence. */
export const NOTIFICATION_POLL_INTERVAL_MS = 30_000;

/** Default page size for paginated lists when the URL doesn't specify one. */
export const DEFAULT_PAGE_SIZE = 20;

/** Number of recent expenses to show on the dashboard. */
export const RECENT_EXPENSES_LIMIT = 5;

/** localStorage key for the persisted refresh token. */
export const REFRESH_TOKEN_STORAGE_KEY = 'expense-tracker.refreshToken';
