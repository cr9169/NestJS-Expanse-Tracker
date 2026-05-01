import { Plus } from 'lucide-react';
import { useState } from 'react';

import { ExpenseCategory } from '@shared/enums/expense-category.enum';

import { Button } from '@/shared/components/ui/button';
import { Pagination } from '@/shared/components/ui/pagination';
import { QueryState } from '@/shared/components/ui/query-state';
import { useSearchParamState } from '@/shared/hooks/use-search-param-state';
import { ALL_CATEGORIES } from '@/shared/lib/category-meta';
import { DEFAULT_PAGE_SIZE } from '@/shared/lib/constants';
import type { Expense } from '@/shared/schemas/expense.schemas';

import { useExpensesListQuery } from '../api/expenses.queries';
import { DeleteExpenseDialog } from '../components/delete-expense-dialog';
import { ExpenseFilters } from '../components/expense-filters';
import { ExpenseFormDialog } from '../components/expense-form-dialog';
import { ExpenseTable } from '../components/expense-table';

const CATEGORY_VALUES = new Set<string>(ALL_CATEGORIES);

function parseCategoryParam(raw: string | undefined): ExpenseCategory | undefined {
  return raw && CATEGORY_VALUES.has(raw) ? (raw as ExpenseCategory) : undefined;
}

function parsePositiveInt(raw: string | undefined, fallback: number): number {
  const n = Number(raw);
  return Number.isInteger(n) && n > 0 ? n : fallback;
}

export function ExpensesListPage(): JSX.Element {
  const { get, setMany } = useSearchParamState();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Expense | null>(null);
  const [deleting, setDeleting] = useState<Expense | null>(null);

  const filters = {
    category: parseCategoryParam(get('category')),
    from: get('from'),
    to: get('to'),
    page: parsePositiveInt(get('page'), 1),
    limit: parsePositiveInt(get('limit'), DEFAULT_PAGE_SIZE),
  };

  const query = useExpensesListQuery(filters);

  const openCreate = (): void => {
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (expense: Expense): void => {
    setEditing(expense);
    setFormOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Expenses</h1>
          <p className="text-sm text-muted-foreground">
            Track every transaction. Amounts are stored as integer cents.
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" /> New expense
        </Button>
      </div>

      <ExpenseFilters
        category={filters.category}
        from={filters.from}
        to={filters.to}
        onChange={(next) =>
          setMany({
            category: next.category,
            from: next.from,
            to: next.to,
            page: '1',
          })
        }
      />

      <QueryState
        query={query}
        errorMessage="Failed to load expenses. Try again in a moment."
        empty={
          <div className="rounded-lg border bg-card p-8 text-center text-muted-foreground">
            No expenses match your filters yet.
          </div>
        }
      >
        {(data) => (
          <>
            <ExpenseTable expenses={data.items} onEdit={openEdit} onDelete={setDeleting} />
            <Pagination
              page={data.meta.page}
              totalPages={data.meta.totalPages}
              total={data.meta.total}
              onPageChange={(p) => setMany({ page: String(p) })}
            />
          </>
        )}
      </QueryState>

      <ExpenseFormDialog open={formOpen} onOpenChange={setFormOpen} expense={editing} />
      <DeleteExpenseDialog
        expense={deleting}
        onOpenChange={(open) => !open && setDeleting(null)}
      />
    </div>
  );
}
