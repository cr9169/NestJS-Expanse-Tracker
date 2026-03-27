import type { Provider } from '@nestjs/common';
import Database from 'better-sqlite3';

import { AppConfigService } from '../config/app-config.service';

import { DATABASE_TOKEN } from './tokens';

/**
 * ARCHITECTURE NOTE:
 * Running migrations on every startup (with IF NOT EXISTS guards) eliminates
 * the need for a separate migration tool in Week 1. The tradeoff: you can't
 * run destructive migrations this way. In Week 2+, when the schema stabilises,
 * swap this for a proper versioned migration runner (e.g. db-migrate).
 *
 * better-sqlite3 is synchronous by design — SQLite doesn't benefit from async
 * I/O since it's a single-file database. The sync API means no callback hell
 * and no accidental concurrent writes.
 *
 * WHY inline SQL instead of readFileSync: TypeScript's compiler does not copy
 * non-.ts assets (like .sql files) to dist/. Inlining avoids a separate copy
 * step in the build pipeline while keeping the SQL readable and auditable here.
 */

const INIT_SQL = `
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

CREATE INDEX IF NOT EXISTS idx_expenses_user_id       ON expenses(user_id);
CREATE INDEX IF NOT EXISTS idx_expenses_user_date     ON expenses(user_id, date);
CREATE INDEX IF NOT EXISTS idx_expenses_user_category ON expenses(user_id, category);
`;

export const DatabaseProvider: Provider = {
  provide: DATABASE_TOKEN,
  inject: [AppConfigService],
  useFactory: (config: AppConfigService): Database.Database => {
    const db = new Database(config.sqlitePath);

    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');

    db.exec(INIT_SQL);

    return db;
  },
};
