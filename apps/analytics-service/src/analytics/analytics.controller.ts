import { Controller, Inject } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';

import { TCP_PATTERNS } from '@shared/constants/tcp-patterns.constants';

import { handleRpc } from '../common/handle-rpc';

import type { DetectAnomaliesUseCase } from './application/use-cases/detect-anomalies.use-case';
import type { GetCategoryBreakdownUseCase } from './application/use-cases/get-category-breakdown.use-case';
import type { GetSpendingTrendsUseCase } from './application/use-cases/get-spending-trends.use-case';
import {
  DETECT_ANOMALIES_USE_CASE_TOKEN,
  GET_CATEGORY_BREAKDOWN_USE_CASE_TOKEN,
  GET_SPENDING_TRENDS_USE_CASE_TOKEN,
} from './tokens';

@Controller()
export class AnalyticsController {
  constructor(
    @Inject(GET_SPENDING_TRENDS_USE_CASE_TOKEN) private readonly getSpendingTrends: GetSpendingTrendsUseCase,
    @Inject(GET_CATEGORY_BREAKDOWN_USE_CASE_TOKEN) private readonly getCategoryBreakdown: GetCategoryBreakdownUseCase,
    @Inject(DETECT_ANOMALIES_USE_CASE_TOKEN) private readonly detectAnomalies: DetectAnomaliesUseCase,
  ) {}

  @MessagePattern(TCP_PATTERNS.ANALYTICS_TRENDS)
  async trends(
    @Payload() payload: { userId: string; months: number },
  ): Promise<unknown> {
    return handleRpc(async () => {
      return this.getSpendingTrends.execute(payload.userId, payload.months);
    });
  }

  @MessagePattern(TCP_PATTERNS.ANALYTICS_BREAKDOWN)
  async breakdown(
    @Payload() payload: { userId: string; month: string },
  ): Promise<unknown> {
    return handleRpc(async () => {
      return this.getCategoryBreakdown.execute(payload.userId, payload.month);
    });
  }

  @MessagePattern(TCP_PATTERNS.ANALYTICS_ANOMALIES)
  async anomalies(
    @Payload() payload: { userId: string },
  ): Promise<unknown> {
    return handleRpc(async () => {
      return this.detectAnomalies.execute(payload.userId);
    });
  }
}
