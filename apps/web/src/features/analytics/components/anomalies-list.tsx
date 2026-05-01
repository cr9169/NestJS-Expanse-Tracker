import { TrendingUp } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { CATEGORY_META } from '@/shared/lib/category-meta';
import { formatMoney } from '@/shared/lib/format-money';
import type { AnomalyEntry } from '@/shared/schemas/analytics.schemas';

import { CategoryBadge } from '@/features/expenses/components/category-badge';

interface AnomaliesListProps {
  data: AnomalyEntry[] | undefined;
  isLoading: boolean;
}

export function AnomaliesList({ data, isLoading }: AnomaliesListProps): JSX.Element {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4" /> Anomalies this month
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {isLoading ? (
          [0, 1, 2].map((k) => <Skeleton key={k} className="h-12 w-full" />)
        ) : !data || data.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No spending categories are unusually high this month.
          </p>
        ) : (
          data.map((entry) => (
            <div
              key={entry.category}
              className="flex items-center justify-between gap-3 rounded-md border bg-background p-3 text-sm"
            >
              <div className="flex items-center gap-2">
                <CategoryBadge category={entry.category} />
                <span className="text-muted-foreground">
                  {entry.deviationPercent}% above 3-month avg
                </span>
              </div>
              <div className="text-right">
                <div className="font-mono font-medium">
                  {formatMoney(entry.currentCents)}
                </div>
                <div className="text-xs text-muted-foreground">
                  avg {formatMoney(entry.averageCents)}
                </div>
              </div>
            </div>
          ))
        )}
        <p className="pt-2 text-xs text-muted-foreground">
          Heuristic: current month exceeds 3-month rolling average by ≥ 30%.{' '}
          <span style={{ color: CATEGORY_META.OTHER.color }} />
        </p>
      </CardContent>
    </Card>
  );
}
