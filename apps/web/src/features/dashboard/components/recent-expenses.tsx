import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

import { useExpensesListQuery } from '@/features/expenses/api/expenses.queries';
import { CategoryBadge } from '@/features/expenses/components/category-badge';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { formatDate } from '@/shared/lib/format-date';
import { formatMoney } from '@/shared/lib/format-money';

export function RecentExpenses(): JSX.Element {
  const query = useExpensesListQuery({ page: 1, limit: 5 });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle>Recent expenses</CardTitle>
        <Button asChild variant="ghost" size="sm">
          <Link to="/expenses">
            View all <ArrowRight className="ml-1 h-3 w-3" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent className="space-y-2">
        {query.isPending ? (
          [0, 1, 2, 3, 4].map((k) => <Skeleton key={k} className="h-10 w-full" />)
        ) : query.data && query.data.items.length > 0 ? (
          query.data.items.map((expense) => (
            <div
              key={expense.id}
              className="flex items-center justify-between gap-3 rounded-md border bg-background p-2 text-sm"
            >
              <div className="flex min-w-0 flex-col">
                <span className="truncate font-medium">{expense.description}</span>
                <span className="text-xs text-muted-foreground">
                  {formatDate(expense.date)}
                </span>
              </div>
              <CategoryBadge category={expense.category} />
              <span className="ml-2 font-mono">
                {formatMoney(expense.amountCents, expense.currency)}
              </span>
            </div>
          ))
        ) : (
          <p className="py-4 text-center text-sm text-muted-foreground">
            No expenses yet — add your first one.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
