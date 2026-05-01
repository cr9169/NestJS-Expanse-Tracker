import type { ExpenseCategory } from '@shared/enums/expense-category.enum';

import { CATEGORY_META } from '@/shared/lib/category-meta';
import { cn } from '@/shared/lib/cn';

interface CategoryBadgeProps {
  category: ExpenseCategory;
  className?: string;
}

export function CategoryBadge({ category, className }: CategoryBadgeProps): JSX.Element {
  const meta = CATEGORY_META[category];
  const Icon = meta.icon;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
        meta.badgeClass,
        className,
      )}
    >
      <Icon className="h-3 w-3" />
      {meta.label}
    </span>
  );
}
