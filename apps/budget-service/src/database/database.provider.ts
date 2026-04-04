import type { Provider } from '@nestjs/common';
import Database from 'better-sqlite3';

import { AppConfigService } from '../config/app-config.service';

import { DATABASE_TOKEN } from './tokens';

const INIT_SQL = `
PRAGMA journal_mode=WAL;
PRAGMA foreign_keys=ON;

CREATE TABLE IF NOT EXISTS budgets (
  id                  TEXT    PRIMARY KEY,
  user_id             TEXT    NOT NULL,
  category            TEXT,
  monthly_limit_cents INTEGER NOT NULL CHECK(monthly_limit_cents > 0),
  currency            TEXT    NOT NULL DEFAULT 'USD',
  created_at          TEXT    NOT NULL,
  updated_at          TEXT    NOT NULL,
  UNIQUE(user_id, category)
);

CREATE TABLE IF NOT EXISTS budget_spending (
  user_id    TEXT    NOT NULL,
  category   TEXT    NOT NULL,
  period     TEXT    NOT NULL,
  spent_cents INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY(user_id, category, period)
);
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
