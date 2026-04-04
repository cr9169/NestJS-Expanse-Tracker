import { Inject, Injectable } from '@nestjs/common';

import type { IAnalyticsRepository } from '../../domain/repositories/analytics.repository.interface';
import { ANALYTICS_REPOSITORY_TOKEN } from '../../tokens';

export interface SpendingAnomaly {
  category: string;
  currentCents: number;
  averageCents: number;
  /** How much higher (or lower) than average, as a percentage */
  deviationPercent: number;
}

/**
 * Compares current month's spending per category against the average
 * of the previous 3 months. Flags categories that are >30% above average.
 */
@Injectable()
export class DetectAnomaliesUseCase {
  constructor(
    @Inject(ANALYTICS_REPOSITORY_TOKEN)
    private readonly analyticsRepository: IAnalyticsRepository,
  ) {}

  async execute(userId: string): Promise<SpendingAnomaly[]> {
    const now = new Date();
    const currentPeriod = this.formatPeriod(now);

    // Previous 3 months
    const previousPeriods: string[] = [];
    for (let i = 1; i <= 3; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      previousPeriods.push(this.formatPeriod(d));
    }

    const currentRows = await this.analyticsRepository.getMonthlySpendingForPeriod(
      userId,
      currentPeriod,
    );
    const historicalRows = await this.analyticsRepository.getMonthlySpending(
      userId,
      previousPeriods,
    );

    // Calculate average per category over previous 3 months
    const avgMap = new Map<string, { totalCents: number; months: Set<string> }>();
    for (const row of historicalRows) {
      const entry = avgMap.get(row.category) ?? { totalCents: 0, months: new Set() };
      entry.totalCents += row.total_cents;
      entry.months.add(row.period);
      avgMap.set(row.category, entry);
    }

    const anomalies: SpendingAnomaly[] = [];

    for (const row of currentRows) {
      const historical = avgMap.get(row.category);
      if (!historical || historical.months.size === 0) continue;

      const averageCents = Math.round(historical.totalCents / historical.months.size);
      if (averageCents === 0) continue;

      const deviationPercent = Math.round(
        ((row.total_cents - averageCents) / averageCents) * 100,
      );

      // Only flag if >30% above average
      if (deviationPercent > 30) {
        anomalies.push({
          category: row.category,
          currentCents: row.total_cents,
          averageCents,
          deviationPercent,
        });
      }
    }

    return anomalies.sort((a, b) => b.deviationPercent - a.deviationPercent);
  }

  private formatPeriod(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  }
}
