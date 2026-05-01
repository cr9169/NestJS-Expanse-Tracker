import { X } from 'lucide-react';

import { ExpenseCategory } from '@shared/enums/expense-category.enum';

import { Button } from '@/shared/components/ui/button';
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

const ALL_VALUE = '__all__';

interface ExpenseFiltersProps {
  category: ExpenseCategory | undefined;
  from: string | undefined;
  to: string | undefined;
  onChange: (next: {
    category?: ExpenseCategory;
    from?: string;
    to?: string;
  }) => void;
}

export function ExpenseFilters({
  category,
  from,
  to,
  onChange,
}: ExpenseFiltersProps): JSX.Element {
  const hasFilters = Boolean(category || from || to);

  return (
    <div className="flex flex-col gap-3 rounded-lg border bg-card p-4 sm:flex-row sm:items-end">
      <div className="flex-1 space-y-1">
        <Label htmlFor="filter-category">Category</Label>
        <Select
          value={category ?? ALL_VALUE}
          onValueChange={(v) => {
            onChange({
              category: v === ALL_VALUE ? undefined : (v as ExpenseCategory),
              from,
              to,
            });
          }}
        >
          <SelectTrigger id="filter-category">
            <SelectValue placeholder="All categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_VALUE}>All categories</SelectItem>
            {ALL_CATEGORIES.map((c) => (
              <SelectItem key={c} value={c}>
                {CATEGORY_META[c].label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex-1 space-y-1">
        <Label htmlFor="filter-from">From</Label>
        <Input
          id="filter-from"
          type="date"
          value={from ?? ''}
          onChange={(e) => onChange({ category, from: e.target.value || undefined, to })}
        />
      </div>
      <div className="flex-1 space-y-1">
        <Label htmlFor="filter-to">To</Label>
        <Input
          id="filter-to"
          type="date"
          value={to ?? ''}
          onChange={(e) => onChange({ category, from, to: e.target.value || undefined })}
        />
      </div>
      {hasFilters && (
        <Button
          type="button"
          variant="ghost"
          onClick={() => onChange({})}
          className="self-end"
        >
          <X className="mr-2 h-4 w-4" /> Clear
        </Button>
      )}
    </div>
  );
}
