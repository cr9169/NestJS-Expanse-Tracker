import { Plus } from 'lucide-react';
import { useMemo, useState } from 'react';

import { Button } from '@/shared/components/ui/button';
import { QueryState } from '@/shared/components/ui/query-state';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { useSearchParamState } from '@/shared/hooks/use-search-param-state';
import { currentMonth, isValidMonth } from '@/shared/lib/month';
import type { Budget } from '@/shared/schemas/budget.schemas';

import { useBudgetsQuery, useBudgetStatusQuery } from '../api/budgets.queries';
import { BudgetCard } from '../components/budget-card';
import { BudgetFormDialog } from '../components/budget-form-dialog';
import { DeleteBudgetDialog } from '../components/delete-budget-dialog';
import { MonthPicker } from '../components/month-picker';

const SKELETON_KEYS = ['s1', 's2', 's3'] as const;

const BudgetsLoading = (
  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
    {SKELETON_KEYS.map((k) => (
      <Skeleton key={k} className="h-44 w-full" />
    ))}
  </div>
);

const BudgetsEmpty = (
  <div className="rounded-lg border bg-card p-8 text-center text-muted-foreground">
    No budgets yet — create one to start tracking spending against limits.
  </div>
);

export function BudgetsPage(): JSX.Element {
  const { get, setMany } = useSearchParamState();
  const monthParam = get('month');
  const month = monthParam && isValidMonth(monthParam) ? monthParam : currentMonth();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Budget | null>(null);
  const [deleting, setDeleting] = useState<Budget | null>(null);

  const budgetsQuery = useBudgetsQuery();
  const statusQuery = useBudgetStatusQuery(month);

  const statusByBudgetId = useMemo(() => {
    const map = new Map<string, NonNullable<typeof statusQuery.data>[number]>();
    if (statusQuery.data) {
      for (const entry of statusQuery.data) {
        map.set(entry.id, entry);
      }
    }
    return map;
  }, [statusQuery.data]);

  const openCreate = (): void => {
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (budget: Budget): void => {
    setEditing(budget);
    setFormOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Budgets</h1>
          <p className="text-sm text-muted-foreground">
            Set monthly limits per category. Crossing 80% triggers a warning notification.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <MonthPicker value={month} onChange={(m) => setMany({ month: m })} />
          <Button onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" /> New budget
          </Button>
        </div>
      </div>

      <QueryState
        query={budgetsQuery}
        errorMessage="Failed to load budgets."
        loading={BudgetsLoading}
        empty={BudgetsEmpty}
      >
        {(budgets) => (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {budgets.map((b) => (
              <BudgetCard
                key={b.id}
                budget={b}
                status={statusByBudgetId.get(b.id) ?? null}
                onEdit={openEdit}
                onDelete={setDeleting}
              />
            ))}
          </div>
        )}
      </QueryState>

      <BudgetFormDialog open={formOpen} onOpenChange={setFormOpen} budget={editing} />
      <DeleteBudgetDialog
        budget={deleting}
        onOpenChange={(open) => !open && setDeleting(null)}
      />
    </div>
  );
}
