import { ConfirmDialog } from '@/shared/components/ui/confirm-dialog';
import { toast, toastApiError } from '@/shared/lib/toast';
import type { Expense } from '@/shared/schemas/expense.schemas';

import { useDeleteExpenseMutation } from '../api/expenses.queries';

interface DeleteExpenseDialogProps {
  expense: Expense | null;
  onOpenChange: (open: boolean) => void;
}

export function DeleteExpenseDialog({
  expense,
  onOpenChange,
}: DeleteExpenseDialogProps): JSX.Element {
  const remove = useDeleteExpenseMutation();

  const onConfirm = async (): Promise<void> => {
    if (!expense) return;
    try {
      await remove.mutateAsync(expense.id);
      toast.success('Expense deleted');
      onOpenChange(false);
    } catch (err) {
      toastApiError(err, 'Could not delete expense');
    }
  };

  return (
    <ConfirmDialog
      open={Boolean(expense)}
      onOpenChange={onOpenChange}
      title="Delete this expense?"
      description="This is permanent. The expense will also be removed from budgets and analytics."
      confirmLabel="Delete"
      variant="destructive"
      isPending={remove.isPending}
      onConfirm={onConfirm}
    />
  );
}
