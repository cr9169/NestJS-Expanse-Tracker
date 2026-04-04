import type { Provider } from '@nestjs/common';
import Database from 'better-sqlite3';

import { AppConfigService } from '../config/app-config.service';

import { DATABASE_TOKEN } from './tokens';

const INIT_SQL = `
PRAGMA journal_mode=WAL;

CREATE TABLE IF NOT EXISTS notifications (
  id          TEXT    PRIMARY KEY,
  user_id     TEXT    NOT NULL,
  type        TEXT    NOT NULL,
  title       TEXT    NOT NULL,
  message     TEXT    NOT NULL,
  metadata    TEXT,
  read        INTEGER NOT NULL DEFAULT 0,
  created_at  TEXT    NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_notifications_user
  ON notifications(user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS notification_preferences (
  user_id TEXT NOT NULL,
  type    TEXT NOT NULL,
  enabled INTEGER NOT NULL DEFAULT 1,
  PRIMARY KEY(user_id, type)
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
