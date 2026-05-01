import { BellRing, PiggyBank, Wallet, type LucideIcon } from 'lucide-react';
import { useMemo } from 'react';

import { useBudgetStatusQuery } from '@/features/budgets/api/budgets.queries';
import { useExpenseSummaryQuery } from '@/features/expenses/api/expenses.queries';
import { useUnreadCountQuery } from '@/features/notifications/api/notifications.queries';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { formatMoney } from '@/shared/lib/format-money';
import { currentMonth } from '@/shared/lib/month';

export function SummaryTiles(): JSX.Element {
  const month = currentMonth();
  const range = useMemo(() => {
    const [year, m] = month.split('-').map((p) => Number(p));
    if (!year || !m) return null;
    const from = `${year}-${String(m).padStart(2, '0')}-01`;
    // Last day of month: build the next-month-day-0 trick.
    const last = new Date(year, m, 0).getDate();
    const to = `${year}-${String(m).padStart(2, '0')}-${String(last).padStart(2, '0')}`;
    return { from, to };
  }, [month]);

  const summary = useExpenseSummaryQuery(range);
  const status = useBudgetStatusQuery(month);
  const unread = useUnreadCountQuery();

  const totalSpent = (summary.data ?? []).reduce((acc, c) => acc + c.totalCents, 0);
  const overall = status.data?.find((b) => b.category === null);
  const exceededCount = (status.data ?? []).filter((b) => b.isExceeded).length;
  const warningCount = (status.data ?? []).filter((b) => b.isWarning && !b.isExceeded).length;

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <Tile
        icon={Wallet}
        title="Spent this month"
        value={summary.isPending ? null : formatMoney(totalSpent)}
        sub={summary.data ? `${summary.data.length} categories` : ''}
      />
      <Tile
        icon={PiggyBank}
        title="Overall budget"
        value={
          status.isPending
            ? null
            : overall
            ? `${formatMoney(overall.spentCents, overall.currency)} / ${formatMoney(
                overall.monthlyLimitCents,
                overall.currency,
              )}`
            : 'Not set'
        }
        sub={
          status.isPending
            ? ''
            : `${exceededCount} exceeded · ${warningCount} warning`
        }
      />
      <Tile
        icon={BellRing}
        title="Unread notifications"
        value={unread.isPending ? null : String(unread.data?.unreadCount ?? 0)}
        sub="Updated every 30 seconds"
      />
    </div>
  );
}

interface TileProps {
  icon: LucideIcon;
  title: string;
  value: string | null;
  sub: string;
}

function Tile({ icon: Icon, title, value, sub }: TileProps): JSX.Element {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {value === null ? (
          <Skeleton className="h-8 w-32" />
        ) : (
          <div className="text-2xl font-semibold">{value}</div>
        )}
        <p className="mt-1 text-xs text-muted-foreground">{sub}</p>
      </CardContent>
    </Card>
  );
}
