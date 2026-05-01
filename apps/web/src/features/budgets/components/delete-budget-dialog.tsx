import { ConfirmDialog } from '@/shared/components/ui/confirm-dialog';
import { toast, toastApiError } from '@/shared/lib/toast';
import type { Budget } from '@/shared/schemas/budget.schemas';

import { useDeleteBudgetMutation } from '../api/budgets.queries';

interface DeleteBudgetDialogProps {
  budget: Budget | null;
  onOpenChange: (open: boolean) => void;
}

export function DeleteBudgetDialog({
  budget,
  onOpenChange,
}: DeleteBudgetDialogProps): JSX.Element {
  const remove = useDeleteBudgetMutation();

  const onConfirm = async (): Promise<void> => {
    if (!budget) return;
    try {
      await remove.mutateAsync(budget.id);
      toast.success('Budget deleted');
      onOpenChange(false);
    } catch (err) {
      toastApiError(err, 'Could not delete budget');
    }
  };

  return (
    <ConfirmDialog
      open={Boolean(budget)}
      onOpenChange={onOpenChange}
      title="Delete this budget?"
      description="You'll stop receiving alerts for this category. The expenses themselves are not affected."
      confirmLabel="Delete"
      variant="destructive"
      isPending={remove.isPending}
      onConfirm={onConfirm}
    />
  );
}
