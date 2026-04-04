import { Inject, Injectable } from '@nestjs/common';

import type { IAnalyticsRepository } from '../../domain/repositories/analytics.repository.interface';
import { ANALYTICS_REPOSITORY_TOKEN } from '../../tokens';

export interface SpendingTrend {
  period: string;
  totalCents: number;
  count: number;
  categories: { category: string; totalCents: number; count: number }[];
}

@Injectable()
export class GetSpendingTrendsUseCase {
  constructor(
    @Inject(ANALYTICS_REPOSITORY_TOKEN)
    private readonly analyticsRepository: IAnalyticsRepository,
  ) {}

  async execute(userId: string, months: number): Promise<SpendingTrend[]> {
    const periods = this.generatePeriods(months);
    const rows = await this.analyticsRepository.getMonthlySpending(userId, periods);

    // Group by period
    const periodMap = new Map<string, SpendingTrend>();
    for (const p of periods) {
      periodMap.set(p, { period: p, totalCents: 0, count: 0, categories: [] });
    }

    for (const row of rows) {
      const trend = periodMap.get(row.period);
      if (trend) {
        trend.totalCents += row.total_cents;
        trend.count += row.count;
        trend.categories.push({
          category: row.category,
          totalCents: row.total_cents,
          count: row.count,
        });
      }
    }

    return Array.from(periodMap.values());
  }

  private generatePeriods(months: number): string[] {
    const periods: string[] = [];
    const now = new Date();

    for (let i = 0; i < months; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      periods.push(`${year}-${month}`);
    }

    return periods.reverse();
  }
}
