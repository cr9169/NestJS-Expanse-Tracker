import { Pencil, Trash2 } from 'lucide-react';

import { Button } from '@/shared/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/components/ui/table';
import { formatDate } from '@/shared/lib/format-date';
import { formatMoney } from '@/shared/lib/format-money';
import type { Expense } from '@/shared/schemas/expense.schemas';

import { CategoryBadge } from './category-badge';

interface ExpenseTableProps {
  expenses: Expense[];
  onEdit: (expense: Expense) => void;
  onDelete: (expense: Expense) => void;
}

export function ExpenseTable({ expenses, onEdit, onDelete }: ExpenseTableProps): JSX.Element {
  if (expenses.length === 0) {
    return (
      <div className="rounded-lg border bg-card p-8 text-center text-muted-foreground">
        No expenses match your filters yet.
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Category</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            <TableHead className="w-[100px] text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {expenses.map((expense) => (
            <TableRow key={expense.id}>
              <TableCell className="whitespace-nowrap font-medium">
                {formatDate(expense.date)}
              </TableCell>
              <TableCell className="max-w-[300px] truncate" title={expense.description}>
                {expense.description}
              </TableCell>
              <TableCell>
                <CategoryBadge category={expense.category} />
              </TableCell>
              <TableCell className="whitespace-nowrap text-right font-mono">
                {formatMoney(expense.amountCents, expense.currency)}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onEdit(expense)}
                    title="Edit"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDelete(expense)}
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
