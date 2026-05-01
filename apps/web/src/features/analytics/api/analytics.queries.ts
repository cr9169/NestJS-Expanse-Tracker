import { useQuery } from '@tanstack/react-query';

import { apiGet } from '@/shared/api/http-client';
import type {
  AnomalyEntry,
  CategoryBreakdownEntry,
  MonthlyTrendPoint,
} from '@/shared/schemas/analytics.schemas';

export const analyticsKeys = {
  trends: (months: number) => ['analytics', 'trends', months] as const,
  breakdown: (month: string) => ['analytics', 'breakdown', month] as const,
  anomalies: () => ['analytics', 'anomalies'] as const,
};

export function useTrendsQuery(months: number) {
  return useQuery<MonthlyTrendPoint[]>({
    queryKey: analyticsKeys.trends(months),
    queryFn: () => apiGet<MonthlyTrendPoint[]>(`/api/v1/analytics/trends?months=${months}`),
  });
}

export function useBreakdownQuery(month: string) {
  return useQuery<CategoryBreakdownEntry[]>({
    queryKey: analyticsKeys.breakdown(month),
    queryFn: () =>
      apiGet<CategoryBreakdownEntry[]>(`/api/v1/analytics/breakdown?month=${month}`),
  });
}

export function useAnomaliesQuery() {
  return useQuery<AnomalyEntry[]>({
    queryKey: analyticsKeys.anomalies(),
    queryFn: () => apiGet<AnomalyEntry[]>('/api/v1/analytics/anomalies'),
  });
}
