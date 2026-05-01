import { MonthPicker } from '@/features/budgets/components/month-picker';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { useSearchParamState } from '@/shared/hooks/use-search-param-state';
import { currentMonth, isValidMonth } from '@/shared/lib/month';

import {
  useAnomaliesQuery,
  useBreakdownQuery,
  useTrendsQuery,
} from '../api/analytics.queries';
import { AnomaliesList } from '../components/anomalies-list';
import { BreakdownChart } from '../components/breakdown-chart';
import { TrendsChart } from '../components/trends-chart';

const MONTH_OPTIONS = ['3', '6', '12', '24'] as const;

export function AnalyticsPage(): JSX.Element {
  const { get, setMany } = useSearchParamState();
  const monthsRaw = Number(get('months') ?? 6);
  const months = clamp(Number.isFinite(monthsRaw) ? monthsRaw : 6, 1, 24);
  const monthParam = get('month');
  const month = monthParam && isValidMonth(monthParam) ? monthParam : currentMonth();

  const trends = useTrendsQuery(months);
  const breakdown = useBreakdownQuery(month);
  const anomalies = useAnomaliesQuery();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Analytics</h1>
        <p className="text-sm text-muted-foreground">
          Trends, breakdowns, and anomaly detection — built from the Kafka event log.
        </p>
      </div>

      <Tabs defaultValue="trends">
        <TabsList>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="breakdown">Breakdown</TabsTrigger>
          <TabsTrigger value="anomalies">Anomalies</TabsTrigger>
        </TabsList>

        <TabsContent value="trends" className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Range:</span>
            <Select
              value={String(months)}
              onValueChange={(v) => setMany({ months: v })}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MONTH_OPTIONS.map((m) => (
                  <SelectItem key={m} value={m}>
                    Last {m} months
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <TrendsChart data={trends.data} isLoading={trends.isPending} />
        </TabsContent>

        <TabsContent value="breakdown" className="space-y-4">
          <MonthPicker value={month} onChange={(m) => setMany({ month: m })} />
          <BreakdownChart data={breakdown.data} isLoading={breakdown.isPending} />
        </TabsContent>

        <TabsContent value="anomalies">
          <AnomaliesList data={anomalies.data} isLoading={anomalies.isPending} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(Math.max(n, min), max);
}
