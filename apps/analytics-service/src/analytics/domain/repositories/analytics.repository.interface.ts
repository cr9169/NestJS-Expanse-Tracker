export interface MonthlySpendingRow {
  period: string;
  category: string;
  total_cents: number;
  count: number;
}

export interface IAnalyticsRepository {
  upsertDailySpending(
    userId: string,
    date: string,
    category: string,
    deltaCents: number,
    deltaCount: number,
  ): Promise<void>;

  upsertMonthlySpending(
    userId: string,
    period: string,
    category: string,
    deltaCents: number,
    deltaCount: number,
  ): Promise<void>;

  getMonthlySpending(userId: string, periods: string[]): Promise<MonthlySpendingRow[]>;

  getMonthlySpendingForPeriod(userId: string, period: string): Promise<MonthlySpendingRow[]>;
}
