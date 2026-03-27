import { Inject, Injectable } from '@nestjs/common';
import type { Database, Statement } from 'better-sqlite3';

import { ExpenseCategory } from '@shared/enums/expense-category.enum';
import type { PaginatedResult } from '@shared/types/api-response.type';
import type { CategorySummary } from '@shared/types/category-summary.type';

import { DATABASE_TOKEN } from '../../../database/tokens';
import {
  Expense,
  type ExpenseRow,
} from '../../domain/entities/expense.entity';
import type {
  IExpenseRepository,
  ExpenseFilters,
  DateRange,
} from '../../domain/repositories/expense.repository.interface';

interface SummaryRow {
  category: string;
  total_cents: number;
  count: number;
}

/**
 * ARCHITECTURE NOTE:
 * Prepared statements are compiled ONCE at construction time and stored as
 * class properties. Each `.get()` / `.run()` call reuses the compiled query plan,
 * avoiding reparsing SQL on every request. For a high-throughput service, this
 * measurably improves latency and reduces CPU under load.
 *
 * We use raw SQL rather than an ORM because:
 * 1. SQLite's strengths (WAL mode, full-text search, JSON functions) are often
 *    hidden or misused by ORMs that treat it as a lesser Postgres.
 * 2. The queries here are simple enough that an ORM adds more indirection than value.
 * 3. In Week 3, the repository is swapped for DynamoDB — the SQL is thrown away
 *    anyway, so there's no benefit to an ORM abstraction.
 */
@Injectable()
export class SqliteExpenseRepository implements IExpenseRepository {
  private readonly stmtFindById: Statement;
  private readonly stmtInsert: Statement;
  private readonly stmtUpdate: Statement;
  private readonly stmtDelete: Statement;
  private readonly stmtCount: Statement;

  constructor(@Inject(DATABASE_TOKEN) private readonly db: Database) {
    this.stmtFindById = db.prepare(
      'SELECT * FROM expenses WHERE id = ? AND user_id = ?',
    );

    this.stmtInsert = db.prepare(`
      INSERT INTO expenses (id, user_id, amount_cents, currency, category, description, date, created_at, updated_at)
      VALUES (@id, @user_id, @amount_cents, @currency, @category, @description, @date, @created_at, @updated_at)
    `);

    this.stmtUpdate = db.prepare(`
      UPDATE expenses
      SET amount_cents = @amount_cents,
          currency     = @currency,
          category     = @category,
          description  = @description,
          date         = @date,
          updated_at   = @updated_at
      WHERE id = @id AND user_id = @user_id
    `);

    this.stmtDelete = db.prepare(
      'DELETE FROM expenses WHERE id = ? AND user_id = ?',
    );

    this.stmtCount = db.prepare(
      'SELECT COUNT(*) as count FROM expenses WHERE user_id = ?',
    );
  }

  async findById(id: string, userId: string): Promise<Expense | null> {
    const row = this.stmtFindById.get(id, userId) as ExpenseRow | undefined;
    return Promise.resolve(row ? Expense.reconstitute(row) : null);
  }

  async findAll(userId: string, filters: ExpenseFilters): Promise<PaginatedResult<Expense>> {
    const conditions: string[] = ['user_id = @userId'];
    const params: Record<string, unknown> = { userId };

    if (filters.category) {
      conditions.push('category = @category');
      params['category'] = filters.category;
    }
    if (filters.from) {
      conditions.push('date >= @from');
      params['from'] = filters.from;
    }
    if (filters.to) {
      conditions.push('date <= @to');
      params['to'] = filters.to;
    }

    const where = conditions.join(' AND ');
    const offset = (filters.page - 1) * filters.limit;

    // Count total matches for pagination metadata
    const countSql = `SELECT COUNT(*) as count FROM expenses WHERE ${where}`;
    const countRow = this.db.prepare(countSql).get(params) as { count: number };
    const total = countRow.count;

    const dataSql = `
      SELECT * FROM expenses
      WHERE ${where}
      ORDER BY date DESC, created_at DESC
      LIMIT @limit OFFSET @offset
    `;
    const rows = this.db.prepare(dataSql).all({
      ...params,
      limit: filters.limit,
      offset,
    }) as ExpenseRow[];

    return Promise.resolve({
      items: rows.map((row) => Expense.reconstitute(row)),
      total,
      page: filters.page,
      limit: filters.limit,
    });
  }

  async save(expense: Expense): Promise<Expense> {
    this.stmtInsert.run({
      id: expense.id,
      user_id: expense.userId,
      amount_cents: expense.amount.amountCents,
      currency: expense.amount.currency,
      category: expense.category,
      description: expense.description,
      date: expense.date.toISOString().split('T')[0],
      created_at: expense.createdAt.toISOString(),
      updated_at: expense.updatedAt.toISOString(),
    });
    return Promise.resolve(expense);
  }

  async update(expense: Expense): Promise<Expense> {
    this.stmtUpdate.run({
      id: expense.id,
      user_id: expense.userId,
      amount_cents: expense.amount.amountCents,
      currency: expense.amount.currency,
      category: expense.category,
      description: expense.description,
      date: expense.date.toISOString().split('T')[0],
      updated_at: expense.updatedAt.toISOString(),
    });
    return Promise.resolve(expense);
  }

  async delete(id: string, userId: string): Promise<void> {
    this.stmtDelete.run(id, userId);
    return Promise.resolve();
  }

  async getSummary(userId: string, dateRange: DateRange): Promise<CategorySummary[]> {
    const rows = this.db
      .prepare(`
        SELECT category,
               SUM(amount_cents) as total_cents,
               COUNT(*)          as count
        FROM expenses
        WHERE user_id = @userId
          AND date >= @from
          AND date <= @to
        GROUP BY category
        ORDER BY total_cents DESC
      `)
      .all({ userId, from: dateRange.from, to: dateRange.to }) as SummaryRow[];

    return Promise.resolve(
      rows.map((row) => ({
        // row.category is a string from SQLite — we know it matches ExpenseCategory
        // because the DB has a CHECK constraint and we only ever insert valid enum values.
        // The cast is safe and narrowed through the SummaryRow type above.
        category: row.category as ExpenseCategory,
        totalCents: row.total_cents,
        count: row.count,
      })),
    );
  }
}
