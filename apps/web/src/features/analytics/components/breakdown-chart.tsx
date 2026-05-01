import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';

import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { CATEGORY_META } from '@/shared/lib/category-meta';
import { formatMoney } from '@/shared/lib/format-money';
import type { CategoryBreakdownEntry } from '@/shared/schemas/analytics.schemas';

import { CategoryBadge } from '@/features/expenses/components/category-badge';

interface BreakdownChartProps {
  data: CategoryBreakdownEntry[] | undefined;
  isLoading: boolean;
}

export function BreakdownChart({ data, isLoading }: BreakdownChartProps): JSX.Element {
  const entries = data ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Category breakdown</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-6 md:grid-cols-[2fr_3fr]">
        <div className="h-64">
          {isLoading ? (
            <Skeleton className="h-full w-full" />
          ) : entries.length === 0 ? (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              No data
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={entries}
                  dataKey="totalCents"
                  nameKey="category"
                  innerRadius={50}
                  outerRadius={90}
                  paddingAngle={2}
                >
                  {entries.map((entry) => (
                    <Cell key={entry.category} fill={CATEGORY_META[entry.category].color} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number) => formatMoney(v)} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
        <div className="space-y-2">
          {isLoading
            ? [0, 1, 2].map((k) => <Skeleton key={k} className="h-8 w-full" />)
            : entries.map((entry) => (
                <div
                  key={entry.category}
                  className="flex items-center justify-between gap-2 rounded-md border bg-background p-2 text-sm"
                >
                  <CategoryBadge category={entry.category} />
                  <div className="flex items-center gap-3">
                    <span className="font-mono">{formatMoney(entry.totalCents)}</span>
                    <span className="w-12 text-right text-muted-foreground">
                      {Math.round(entry.percentage)}%
                    </span>
                  </div>
                </div>
              ))}
        </div>
      </CardContent>
    </Card>
  );
}
