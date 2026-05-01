import { ChevronLeft, ChevronRight } from 'lucide-react';

import { Button } from '@/shared/components/ui/button';
import { formatMonth, shiftMonth } from '@/shared/lib/month';

interface MonthPickerProps {
  value: string;
  onChange: (month: string) => void;
}

export function MonthPicker({ value, onChange }: MonthPickerProps): JSX.Element {
  return (
    <div className="inline-flex items-center gap-1 rounded-md border bg-card p-1">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => onChange(shiftMonth(value, -1))}
        title="Previous month"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <span className="min-w-[10ch] px-2 text-center text-sm font-medium">
        {formatMonth(value)}
      </span>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => onChange(shiftMonth(value, 1))}
        title="Next month"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
