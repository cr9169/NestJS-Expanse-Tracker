interface NavItem {
  to: string;
  label: string;
  end?: boolean;
}

export const NAV_ITEMS: readonly NavItem[] = [
  { to: '/', label: 'Dashboard', end: true },
  { to: '/expenses', label: 'Expenses' },
  { to: '/budgets', label: 'Budgets' },
  { to: '/analytics', label: 'Analytics' },
  { to: '/notifications', label: 'Notifications' },
];
