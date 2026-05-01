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
import { toast, toastApiError } from '@/shared/lib/toast';
import {
  budgetFormSchema,
  type Budget,
  type BudgetFormValues,
} from '@/shared/schemas/budget.schemas';

import {
  useCreateBudgetMutation,
  useUpdateBudgetMutation,
} from '../api/budgets.queries';

interface BudgetFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  budget?: Budget | null;
}

export function BudgetFormDialog({
  open,
  onOpenChange,
  budget,
}: BudgetFormDialogProps): JSX.Element {
  const isEdit = Boolean(budget);
  const create = useCreateBudgetMutation();
  const update = useUpdateBudgetMutation();

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<BudgetFormValues>({
    resolver: zodResolver(budgetFormSchema),
    defaultValues: defaultValues(budget),
  });

  useEffect(() => {
    if (open) reset(defaultValues(budget));
  }, [open, budget, reset]);

  const scope = watch('scope');

  const onSubmit = handleSubmit(async (values) => {
    const cents = decimalToCents(values.limitDecimal);
    if (cents === null || cents < 1) {
      toast.error('Limit must be greater than zero');
      return;
    }

    try {
      if (isEdit && budget) {
        // Edit only changes the limit (backend constraint).
        await update.mutateAsync({ id: budget.id, input: { monthlyLimitCents: cents } });
        toast.success('Budget updated');
      } else {
        await create.mutateAsync({
          monthlyLimitCents: cents,
          currency: values.currency.toUpperCase(),
          ...(values.scope === 'CATEGORY' && values.category
            ? { category: values.category }
            : {}),
        });
        toast.success('Budget created');
      }
      onOpenChange(false);
    } catch (err) {
      toastApiError(err, isEdit ? 'Could not update budget' : 'Could not create budget');
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit budget limit' : 'New budget'}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Only the monthly limit can be changed after creation.'
              : 'Set a monthly cap for one category or for all spending combined.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          {!isEdit && (
            <div className="space-y-2">
              <Label htmlFor="scope">Scope</Label>
              <Controller
                control={control}
                name="scope"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="scope">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CATEGORY">Single category</SelectItem>
                      <SelectItem value="OVERALL">Overall (all categories)</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          )}

          {!isEdit && scope === 'CATEGORY' && (
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Controller
                control={control}
                name="category"
                render={({ field }) => (
                  <Select value={field.value ?? ''} onValueChange={field.onChange}>
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
            </div>
          )}

          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2 space-y-2">
              <Label htmlFor="limitDecimal">Monthly limit</Label>
              <Input
                id="limitDecimal"
                inputMode="decimal"
                placeholder="0.00"
                {...register('limitDecimal')}
              />
              {errors.limitDecimal && (
                <p className="text-sm text-destructive">{errors.limitDecimal.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <Input
                id="currency"
                maxLength={3}
                disabled={isEdit}
                className="uppercase"
                {...register('currency')}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving…' : isEdit ? 'Save changes' : 'Create budget'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function defaultValues(budget?: Budget | null): BudgetFormValues {
  if (budget) {
    return {
      scope: budget.category ? 'CATEGORY' : 'OVERALL',
      category: budget.category ?? undefined,
      limitDecimal: centsToDecimal(budget.monthlyLimitCents),
      currency: budget.currency,
    };
  }
  return {
    scope: 'CATEGORY',
    category: ExpenseCategory.FOOD,
    limitDecimal: '',
    currency: 'USD',
  };
}
