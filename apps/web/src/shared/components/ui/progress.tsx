import { forwardRef, type HTMLAttributes } from 'react';

import { cn } from '@/shared/lib/cn';

interface ProgressProps extends HTMLAttributes<HTMLDivElement> {
  value: number; // 0-100
  indicatorClassName?: string;
}

export const Progress = forwardRef<HTMLDivElement, ProgressProps>(
  ({ className, value, indicatorClassName, ...props }, ref) => {
    const clamped = Math.max(0, Math.min(100, value));
    return (
      <div
        ref={ref}
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={clamped}
        className={cn('relative h-2 w-full overflow-hidden rounded-full bg-secondary', className)}
        {...props}
      >
        <div
          className={cn('h-full transition-[width] duration-300', indicatorClassName ?? 'bg-primary')}
          style={{ width: `${clamped}%` }}
        />
      </div>
    );
  },
);
Progress.displayName = 'Progress';
