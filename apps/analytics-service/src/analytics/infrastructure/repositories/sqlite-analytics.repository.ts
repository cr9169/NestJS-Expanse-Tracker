import { Inject, Injectable } from '@nestjs/common';
import type Database from 'better-sqlite3';

import { DATABASE_TOKEN } from '../../../database/tokens';
import type {
  IAnalyticsRepository,
  MonthlySpendingRow,
} from '../../domain/repositories/analytics.repository.interface';

@Injectable()
export class SqliteAnalyticsRepository implements IAnalyticsRepository {
  private readonly stmtUpsertDaily: Database.Statement;
  private readonly stmtUpsertMonthly: Database.Statement;

  constructor(@Inject(DATABASE_TOKEN) private readonly db: Database.Database) {
    this.stmtUpsertDaily = db.prepare(`
      INSERT INTO daily_spending (user_id, date, category, total_cents, count)
      VALUES (@userId, @date, @category, @deltaCents, @deltaCount)
      ON CONFLICT(user_id, date, category)
      DO UPDATE SET total_cents = total_cents + @deltaCents, count = count + @deltaCount
    `);

    this.stmtUpsertMonthly = db.prepare(`
      INSERT INTO monthly_spending (user_id, period, category, total_cents, count)
      VALUES (@userId, @period, @category, @deltaCents, @deltaCount)
      ON CONFLICT(user_id, period, category)
      DO UPDATE SET total_cents = total_cents + @deltaCents, count = count + @deltaCount
    `);
  }

  async upsertDailySpending(
    userId: string,
    date: string,
    category: string,
    deltaCents: number,
    deltaCount: number,
  ): Promise<void> {
    this.stmtUpsertDaily.run({ userId, date, category, deltaCents, deltaCount });
  }

  async upsertMonthlySpending(
    userId: string,
    period: string,
    category: string,
    deltaCents: number,
    deltaCount: number,
  ): Promise<void> {
    this.stmtUpsertMonthly.run({ userId, period, category, deltaCents, deltaCount });
  }

  async getMonthlySpending(
    userId: string,
    periods: string[],
  ): Promise<MonthlySpendingRow[]> {
    if (periods.length === 0) return [];

    const placeholders = periods.map(() => '?').join(', ');
    return this.db
      .prepare(
        `SELECT period, category, total_cents, count
         FROM monthly_spending
         WHERE user_id = ? AND period IN (${placeholders})
         ORDER BY period ASC, category ASC`,
      )
      .all(userId, ...periods) as MonthlySpendingRow[];
  }

  async getMonthlySpendingForPeriod(
    userId: string,
    period: string,
  ): Promise<MonthlySpendingRow[]> {
    return this.db
      .prepare(
        `SELECT period, category, total_cents, count
         FROM monthly_spending
         WHERE user_id = ? AND period = ?
         ORDER BY total_cents DESC`,
      )
      .all(userId, period) as MonthlySpendingRow[];
  }
}
