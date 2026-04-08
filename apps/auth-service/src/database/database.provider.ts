import type { Provider } from '@nestjs/common';
import Database from 'better-sqlite3';

import { AppConfigService } from '../config/app-config.service';

import { DATABASE_TOKEN } from './tokens';

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
