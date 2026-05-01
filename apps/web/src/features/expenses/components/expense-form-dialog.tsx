import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';

import { ExpenseCategory } from '@shared/enums/expense-category.enum';

import { Button } from '@/shared/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import { ALL_CATEGORIES, CATEGORY_META } from '@/shared/lib/category-meta';
import { centsToDecimal, decimalToCents } from '@/shared/lib/format-money';
import { todayIsoDate } from '@/shared/lib/format-date';
import { toast, toastApiError } from '@/shared/lib/toast';
import {
  expenseFormSchema,
  type Expense,
  type ExpenseFormValues,
} from '@/shared/schemas/expense.schemas';

import {
  useCreateExpenseMutation,
  useUpdateExpenseMutation,
} from '../api/expenses.queries';

interface ExpenseFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  expense?: Expense | null;
}

export function ExpenseFormDialog({
  open,
  onOpenChange,
  expense,
}: ExpenseFormDialogProps): JSX.Element {
  const isEdit = Boolean(expense);
  const create = useCreateExpenseMutation();
  const update = useUpdateExpenseMutation();

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseFormSchema),
    defaultValues: defaultValues(expense),
  });

  // Re-initialize when the target expense (or open state) changes.
  useEffect(() => {
    if (open) reset(defaultValues(expense));
  }, [open, expense, reset]);

  const onSubmit = handleSubmit(async (values) => {
    const amountCents = decimalToCents(values.amountDecimal);
    if (amountCents === null || amountCents < 1) {
      toast.error('Amount must be greater than zero');
      return;
    }

    const payload = {
      amountCents,
      currency: values.currency.toUpperCase(),
      category: values.category,
      description: values.description,
      date: values.date,
    };

    try {
      if (isEdit && expense) {
        await update.mutateAsync({ id: expense.id, input: payload });
        toast.success('Expense updated');
      } else {
        await create.mutateAsync(payload);
        toast.success('Expense created');
      }
      onOpenChange(false);
    } catch (err) {
      toastApiError(err, isEdit ? 'Could not update expense' : 'Could not create expense');
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit expense' : 'New expense'}</DialogTitle>
          <DialogDescription>
            All amounts are recorded as integer cents on the server — no precision loss.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2 space-y-2">
              <Label htmlFor="amountDecimal">Amount</Label>
              <Input
                id="amountDecimal"
                inputMode="decimal"
                placeholder="0.00"
                {...register('amountDecimal')}
              />
              {errors.amountDecimal && (
                <p className="text-sm text-destructive">{errors.amountDecimal.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <Input
                id="currency"
                maxLength={3}
                className="uppercase"
                {...register('currency')}
              />
              {errors.currency && (
                <p className="text-sm text-destructive">{errors.currency.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Controller
              control={control}
              name="category"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Pick a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {ALL_CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {CATEGORY_META[c].label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.category && (
              <p className="text-sm text-destructive">{errors.category.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input id="description" maxLength={500} {...register('description')} />
            {errors.description && (
              <p className="text-sm text-destructive">{errors.description.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="date">Date</Label>
            <Input id="date" type="date" {...register('date')} />
            {errors.date && <p className="text-sm text-destructive">{errors.date.message}</p>}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving…' : isEdit ? 'Save changes' : 'Create expense'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function defaultValues(expense?: Expense | null): ExpenseFormValues {
  if (expense) {
    return {
      amountDecimal: centsToDecimal(expense.amountCents),
      currency: expense.currency,
      category: expense.category,
      description: expense.description,
      date: expense.date,
    };
  }
  return {
    amountDecimal: '',
    currency: 'USD',
    category: ExpenseCategory.FOOD,
    description: '',
    date: todayIsoDate(),
  };
}
