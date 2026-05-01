import { Wallet } from 'lucide-react';
import { Outlet } from 'react-router-dom';

export function AuthShell(): JSX.Element {
  return (
    <div className="flex min-h-full items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-md">
        <div className="mb-6 flex items-center justify-center gap-2 text-foreground">
          <Wallet className="h-6 w-6" />
          <span className="text-lg font-semibold">Expense Tracker</span>
        </div>
        <Outlet />
      </div>
    </div>
  );
}
