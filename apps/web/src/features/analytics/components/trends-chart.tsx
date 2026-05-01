import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { formatMoney } from '@/shared/lib/format-money';
import { formatMonth } from '@/shared/lib/month';
import type { MonthlyTrendPoint } from '@/shared/schemas/analytics.schemas';

interface TrendsChartProps {
  data: MonthlyTrendPoint[] | undefined;
  isLoading: boolean;
}

export function TrendsChart({ data, isLoading }: TrendsChartProps): JSX.Element {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Monthly spending</CardTitle>
      </CardHeader>
      <CardContent className="h-72">
        {isLoading ? (
          <Skeleton className="h-full w-full" />
        ) : !data || data.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            Not enough data yet.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data.map((d) => ({ ...d, label: formatMonth(d.period) }))}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="label" tick={{ fontSize: 12 }} />
              <YAxis tickFormatter={(v) => formatMoney(Number(v))} tick={{ fontSize: 12 }} />
              <Tooltip
                contentStyle={{ borderRadius: 8, fontSize: 13 }}
                formatter={(v: number) => formatMoney(v)}
              />
              <Line
                type="monotone"
                dataKey="totalCents"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
