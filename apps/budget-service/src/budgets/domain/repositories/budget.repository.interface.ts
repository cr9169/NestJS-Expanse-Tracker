import type { Budget } from '../entities/budget.entity';

export interface SpendingRecord {
  category: string;
  period: string;
  spentCents: number;
}

export interface IBudgetRepository {
  findById(id: string, userId: string): Promise<Budget | null>;
  findByUserAndCategory(userId: string, category: string | null): Promise<Budget | null>;
  findAllByUser(userId: string): Promise<Budget[]>;
  save(budget: Budget): Promise<Budget>;
  update(budget: Budget): Promise<Budget>;
  delete(id: string, userId: string): Promise<void>;

  // ── Spending tracking ──────────────────────────────────────────────────────
  getSpending(userId: string, period: string): Promise<SpendingRecord[]>;
  upsertSpending(userId: string, category: string, period: string, deltaCents: number): Promise<void>;
}
