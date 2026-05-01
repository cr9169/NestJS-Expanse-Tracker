import { useAuth } from '@/shared/auth/auth-context';

import { RecentExpenses } from '../components/recent-expenses';
import { SummaryTiles } from '../components/summary-tiles';

export function DashboardPage(): JSX.Element {
  const { user } = useAuth();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">
          Welcome{user?.email ? `, ${user.email.split('@')[0]}` : ''}
        </h1>
        <p className="text-sm text-muted-foreground">Here's your spending at a glance.</p>
      </div>

      <SummaryTiles />
      <RecentExpenses />
    </div>
  );
}
