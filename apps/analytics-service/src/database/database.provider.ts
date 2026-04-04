import type { Provider } from '@nestjs/common';
import Database from 'better-sqlite3';

import { AppConfigService } from '../config/app-config.service';

import { DATABASE_TOKEN } from './tokens';

/**
 * Materialized view tables built from the Kafka expense event stream.
 * These are derived data — can be rebuilt by replaying from Kafka offset 0.
 */
const INIT_SQL = `
PRAGMA journal_mode=WAL;

CREATE TABLE IF NOT EXISTS daily_spending (
  user_id     TEXT    NOT NULL,
  date        TEXT    NOT NULL,
  category    TEXT    NOT NULL,
  total_cents INTEGER NOT NULL DEFAULT 0,
  count       INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY(user_id, date, category)
);

CREATE TABLE IF NOT EXISTS monthly_spending (
  user_id     TEXT    NOT NULL,
  period      TEXT    NOT NULL,
  category    TEXT    NOT NULL,
  total_cents INTEGER NOT NULL DEFAULT 0,
  count       INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY(user_id, period, category)
);
`;

export const DatabaseProvider: Provider = {
  provide: DATABASE_TOKEN,
  inject: [AppConfigService],
  useFactory: (config: AppConfigService): Database.Database => {
    const db = new Database(config.sqlitePath);

    db.pragma('journal_mode = WAL');

    db.exec(INIT_SQL);

    return db;
  },
};
