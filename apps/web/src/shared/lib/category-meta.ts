import { Apple, Briefcase, Car, Heart, Home, type LucideIcon } from 'lucide-react';

import { ExpenseCategory } from '@shared/enums/expense-category.enum';

interface CategoryMeta {
  label: string;
  icon: LucideIcon;
  /** Tailwind class fragments for badge / chip backgrounds. */
  badgeClass: string;
  /** Hex for charts. */
  color: string;
}

export const CATEGORY_META: Record<ExpenseCategory, CategoryMeta> = {
  [ExpenseCategory.FOOD]: {
    label: 'Food',
    icon: Apple,
    badgeClass: 'bg-emerald-100 text-emerald-900 dark:bg-emerald-900/40 dark:text-emerald-100',
    color: '#10b981',
  },
  [ExpenseCategory.TRANSPORT]: {
    label: 'Transport',
    icon: Car,
    badgeClass: 'bg-sky-100 text-sky-900 dark:bg-sky-900/40 dark:text-sky-100',
    color: '#0ea5e9',
  },
  [ExpenseCategory.HOUSING]: {
    label: 'Housing',
    icon: Home,
    badgeClass: 'bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-100',
    color: '#f59e0b',
  },
  [ExpenseCategory.HEALTH]: {
    label: 'Health',
    icon: Heart,
    badgeClass: 'bg-rose-100 text-rose-900 dark:bg-rose-900/40 dark:text-rose-100',
    color: '#f43f5e',
  },
  [ExpenseCategory.OTHER]: {
    label: 'Other',
    icon: Briefcase,
    badgeClass: 'bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-100',
    color: '#64748b',
  },
};

export const ALL_CATEGORIES: readonly ExpenseCategory[] = [
  ExpenseCategory.FOOD,
  ExpenseCategory.TRANSPORT,
  ExpenseCategory.HOUSING,
  ExpenseCategory.HEALTH,
  ExpenseCategory.OTHER,
];
