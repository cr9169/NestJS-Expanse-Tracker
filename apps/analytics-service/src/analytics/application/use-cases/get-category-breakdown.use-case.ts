import { Inject, Injectable } from '@nestjs/common';

import type { IAnalyticsRepository } from '../../domain/repositories/analytics.repository.interface';
import { ANALYTICS_REPOSITORY_TOKEN } from '../../tokens';

export interface CategoryBreakdown {
  category: string;
  totalCents: number;
  count: number;
  /** Percentage of total spending for the period */
  percentage: number;
}

@Injectable()
export class GetCategoryBreakdownUseCase {
  constructor(
    @Inject(ANALYTICS_REPOSITORY_TOKEN)
    private readonly analyticsRepository: IAnalyticsRepository,
  ) {}

  async execute(userId: string, month: string): Promise<CategoryBreakdown[]> {
    const rows = await this.analyticsRepository.getMonthlySpendingForPeriod(userId, month);

    const grandTotal = rows.reduce((sum, row) => sum + row.total_cents, 0);

    return rows.map((row) => ({
      category: row.category,
      totalCents: row.total_cents,
      count: row.count,
      percentage: grandTotal > 0 ? Math.round((row.total_cents / grandTotal) * 100) : 0,
    }));
  }
}
