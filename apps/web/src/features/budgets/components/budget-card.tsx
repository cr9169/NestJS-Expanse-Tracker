import { Pencil, Trash2 } from 'lucide-react';

import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Progress } from '@/shared/components/ui/progress';
import { CATEGORY_META } from '@/shared/lib/category-meta';
import { cn } from '@/shared/lib/cn';
import { formatMoney } from '@/shared/lib/format-money';
import type { Budget, BudgetStatusEntry } from '@/shared/schemas/budget.schemas';

interface BudgetCardProps {
  budget: Budget;
  status: BudgetStatusEntry | null;
  onEdit: (budget: Budget) => void;
  onDelete: (budget: Budget) => void;
}

export function BudgetCard({ budget, status, onEdit, onDelete }: BudgetCardProps): JSX.Element {
  const isOverall = budget.category === null;
  const meta = budget.category ? CATEGORY_META[budget.category] : null;
  const Icon = meta?.icon;

  const spent = status?.spentCents ?? 0;
  const limit = budget.monthlyLimitCents;
  const percent = limit > 0 ? Math.round((spent / limit) * 100) : 0;
  const remaining = Math.max(limit - spent, 0);

  const tone =
    percent >= 100 ? 'destructive' : percent >= 80 ? 'warning' : 'success';

  const indicatorClass =
    tone === 'destructive'
      ? 'bg-destructive'
      : tone === 'warning'
      ? 'bg-warning'
      : 'bg-success';

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0 pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          {Icon ? <Icon className="h-4 w-4" /> : null}
          <span>{isOverall ? 'Overall budget' : meta?.label}</span>
          {isOverall && (
            <Badge variant="outline" className="ml-1">
              All categories
            </Badge>
          )}
        </CardTitle>
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" onClick={() => onEdit(budget)} title="Edit">
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => onDelete(budget)} title="Delete">
            <Trash2 className="h-3.5 w-3.5 text-destructive" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-baseline justify-between text-sm">
          <span className="font-mono text-base font-semibold">
            {formatMoney(spent, budget.currency)}
          </span>
          <span className="text-muted-foreground">
            of {formatMoney(limit, budget.currency)}
          </span>
        </div>
        <Progress value={percent} indicatorClassName={indicatorClass} />
        <div className="flex justify-between text-xs">
          <span
            className={cn(
              'font-medium',
              tone === 'destructive' && 'text-destructive',
              tone === 'warning' && 'text-warning',
            )}
          >
            {percent}% used
          </span>
          <span className="text-muted-foreground">
            {percent >= 100
              ? `${formatMoney(spent - limit, budget.currency)} over`
              : `${formatMoney(remaining, budget.currency)} left`}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
