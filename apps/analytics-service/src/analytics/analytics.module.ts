import { Module } from '@nestjs/common';

import { DatabaseModule } from '../database/database.module';

import { DetectAnomaliesUseCase } from './application/use-cases/detect-anomalies.use-case';
import { GetCategoryBreakdownUseCase } from './application/use-cases/get-category-breakdown.use-case';
import { GetSpendingTrendsUseCase } from './application/use-cases/get-spending-trends.use-case';
import { ProcessExpenseEventUseCase } from './application/use-cases/process-expense-event.use-case';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsEventHandler } from './analytics.event-handler';
import { SqliteAnalyticsRepository } from './infrastructure/repositories/sqlite-analytics.repository';
import {
  ANALYTICS_REPOSITORY_TOKEN,
  DETECT_ANOMALIES_USE_CASE_TOKEN,
  GET_CATEGORY_BREAKDOWN_USE_CASE_TOKEN,
  GET_SPENDING_TRENDS_USE_CASE_TOKEN,
  PROCESS_EXPENSE_EVENT_USE_CASE_TOKEN,
} from './tokens';

@Module({
  imports: [DatabaseModule],
  controllers: [AnalyticsController, AnalyticsEventHandler],
  providers: [
    { provide: ANALYTICS_REPOSITORY_TOKEN, useClass: SqliteAnalyticsRepository },
    { provide: PROCESS_EXPENSE_EVENT_USE_CASE_TOKEN, useClass: ProcessExpenseEventUseCase },
    { provide: GET_SPENDING_TRENDS_USE_CASE_TOKEN, useClass: GetSpendingTrendsUseCase },
    { provide: GET_CATEGORY_BREAKDOWN_USE_CASE_TOKEN, useClass: GetCategoryBreakdownUseCase },
    { provide: DETECT_ANOMALIES_USE_CASE_TOKEN, useClass: DetectAnomaliesUseCase },
  ],
})
export class AnalyticsModule {}
