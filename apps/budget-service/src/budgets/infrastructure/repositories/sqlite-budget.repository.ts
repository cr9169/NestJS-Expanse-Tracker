import { Inject, Injectable } from '@nestjs/common';
import type Database from 'better-sqlite3';

import { DATABASE_TOKEN } from '../../../database/tokens';
import { Budget, type BudgetRow } from '../../domain/entities/budget.entity';
import type { IBudgetRepository, SpendingRecord } from '../../domain/repositories/budget.repository.interface';

@Injectable()
export class SqliteBudgetRepository implements IBudgetRepository {
  private readonly stmtFindById: Database.Statement;
  private readonly stmtFindByUserCategory: Database.Statement;
  private readonly stmtFindAllByUser: Database.Statement;
  private readonly stmtInsert: Database.Statement;
  private readonly stmtUpdate: Database.Statement;
  private readonly stmtDelete: Database.Statement;
  private readonly stmtGetSpending: Database.Statement;
  private readonly stmtUpsertSpending: Database.Statement;

  constructor(@Inject(DATABASE_TOKEN) private readonly db: Database.Database) {
    this.stmtFindById = db.prepare(
      'SELECT * FROM budgets WHERE id = @id AND user_id = @userId',
    );
    this.stmtFindByUserCategory = db.prepare(
      'SELECT * FROM budgets WHERE user_id = @userId AND (category = @category OR (category IS NULL AND @category IS NULL))',
    );
    this.stmtFindAllByUser = db.prepare(
      'SELECT * FROM budgets WHERE user_id = @userId ORDER BY category ASC',
    );
    this.stmtInsert = db.prepare(`
      INSERT INTO budgets (id, user_id, category, monthly_limit_cents, currency, created_at, updated_at)
      VALUES (@id, @user_id, @category, @monthly_limit_cents, @currency, @created_at, @updated_at)
    `);
    this.stmtUpdate = db.prepare(`
      UPDATE budgets SET monthly_limit_cents = @monthly_limit_cents, updated_at = @updated_at
      WHERE id = @id AND user_id = @user_id
    `);
    this.stmtDelete = db.prepare(
      'DELETE FROM budgets WHERE id = @id AND user_id = @userId',
    );
    this.stmtGetSpending = db.prepare(
      'SELECT category, period, spent_cents FROM budget_spending WHERE user_id = @userId AND period = @period',
    );
    this.stmtUpsertSpending = db.prepare(`
      INSERT INTO budget_spending (user_id, category, period, spent_cents)
      VALUES (@userId, @category, @period, @deltaCents)
      ON CONFLICT(user_id, category, period)
      DO UPDATE SET spent_cents = spent_cents + @deltaCents
    `);
  }

  async findById(id: string, userId: string): Promise<Budget | null> {
    const row = this.stmtFindById.get({ id, userId }) as BudgetRow | undefined;
    return row ? Budget.reconstitute(row) : null;
  }

  async findByUserAndCategory(userId: string, category: string | null): Promise<Budget | null> {
    const row = this.stmtFindByUserCategory.get({ userId, category }) as BudgetRow | undefined;
    return row ? Budget.reconstitute(row) : null;
  }

  async findAllByUser(userId: string): Promise<Budget[]> {
    const rows = this.stmtFindAllByUser.all({ userId }) as BudgetRow[];
    return rows.map((row) => Budget.reconstitute(row));
  }

  async save(budget: Budget): Promise<Budget> {
    this.stmtInsert.run({
      id: budget.id,
      user_id: budget.userId,
      category: budget.category,
      monthly_limit_cents: budget.monthlyLimitCents,
      currency: budget.currency,
      created_at: budget.createdAt.toISOString(),
      updated_at: budget.updatedAt.toISOString(),
    });
    return budget;
  }

  async update(budget: Budget): Promise<Budget> {
    this.stmtUpdate.run({
      id: budget.id,
      user_id: budget.userId,
      monthly_limit_cents: budget.monthlyLimitCents,
      updated_at: budget.updatedAt.toISOString(),
    });
    return budget;
  }

  async delete(id: string, userId: string): Promise<void> {
    this.stmtDelete.run({ id, userId });
  }

  async getSpending(userId: string, period: string): Promise<SpendingRecord[]> {
    return this.stmtGetSpending.all({ userId, period }) as SpendingRecord[];
  }

  async upsertSpending(
    userId: string,
    category: string,
    period: string,
    deltaCents: number,
  ): Promise<void> {
    this.stmtUpsertSpending.run({ userId, category, period, deltaCents });
  }
}
