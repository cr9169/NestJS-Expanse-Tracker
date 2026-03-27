-- ─────────────────────────────────────────────────────────────────────────────
-- ARCHITECTURE NOTE:
-- Using TEXT for dates (ISO 8601 strings) and IDs (UUIDs) rather than
-- SQLite's DATETIME type. SQLite has no real date type — DATETIME is just
-- TEXT/REAL/INTEGER anyway. Storing ISO 8601 strings is unambiguous,
-- timezone-safe, and sorts lexicographically.
--
-- Amounts are stored as INTEGER (cents) — never REAL — to avoid floating-point
-- representation errors in the database layer itself.
--
-- All tables use IF NOT EXISTS so this migration is idempotent and safe to
-- run on every startup in development without a migration runner.
-- ─────────────────────────────────────────────────────────────────────────────

PRAGMA journal_mode=WAL;
PRAGMA foreign_keys=ON;

CREATE TABLE IF NOT EXISTS users (
  id                 TEXT    PRIMARY KEY,
  email              TEXT    UNIQUE NOT NULL,
  password_hash      TEXT    NOT NULL,
  refresh_token_hash TEXT,
  created_at         TEXT    NOT NULL,
  updated_at         TEXT    NOT NULL
);

CREATE TABLE IF NOT EXISTS expenses (
  id           TEXT    PRIMARY KEY,
  user_id      TEXT    NOT NULL,
  amount_cents INTEGER NOT NULL CHECK(amount_cents > 0),
  currency     TEXT    NOT NULL DEFAULT 'USD',
  category     TEXT    NOT NULL,
  description  TEXT    NOT NULL,
  date         TEXT    NOT NULL,
  created_at   TEXT    NOT NULL,
  updated_at   TEXT    NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Indexes tuned for the query patterns in the repository:
-- 1. findAll by userId (most common)
-- 2. findAll with date range filter
-- 3. findAll with category filter
-- 4. getSummary (GROUP BY category for a userId + date range)
CREATE INDEX IF NOT EXISTS idx_expenses_user_id       ON expenses(user_id);
CREATE INDEX IF NOT EXISTS idx_expenses_user_date     ON expenses(user_id, date);
CREATE INDEX IF NOT EXISTS idx_expenses_user_category ON expenses(user_id, category);
