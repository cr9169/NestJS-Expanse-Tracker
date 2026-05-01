import type { ReactNode } from 'react';

import { Skeleton } from './skeleton';

/**
 * Renders the right thing for a TanStack Query: skeletons while loading,
 * an error card on failure, an empty state when the result has no rows,
 * and the children otherwise. The render-prop pattern keeps `children`
 * statically typed against `T` without optional-chaining at the call site.
 *
 * Use it for any list page so the loading/error/empty UX is identical and
 * the page body stays focused on the success-path layout.
 */

export interface QueryLike<T> {
  isPending: boolean;
  isError: boolean;
  data: T | undefined;
}

interface QueryStateProps<T> {
  query: QueryLike<T>;
  /** Predicate that decides whether the result is empty. Defaults to length===0. */
  isEmpty?: (data: T) => boolean;
  loading?: ReactNode;
  errorMessage?: string;
  empty?: ReactNode;
  children: (data: T) => ReactNode;
}

export function QueryState<T>({
  query,
  isEmpty = defaultIsEmpty,
  loading,
  errorMessage = 'Failed to load. Try again in a moment.',
  empty,
  children,
}: QueryStateProps<T>): JSX.Element {
  if (query.isPending) {
    return <>{loading ?? <DefaultLoading />}</>;
  }
  if (query.isError || query.data === undefined) {
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
        {errorMessage}
      </div>
    );
  }
  if (isEmpty(query.data)) {
    return <>{empty ?? <DefaultEmpty />}</>;
  }
  return <>{children(query.data)}</>;
}

function defaultIsEmpty(data: unknown): boolean {
  if (Array.isArray(data)) return data.length === 0;
  if (data && typeof data === 'object' && 'items' in data) {
    const items = (data as { items: unknown }).items;
    return Array.isArray(items) && items.length === 0;
  }
  return false;
}

function DefaultLoading(): JSX.Element {
  return (
    <div className="space-y-2">
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
    </div>
  );
}

function DefaultEmpty(): JSX.Element {
  return (
    <div className="rounded-lg border bg-card p-8 text-center text-muted-foreground">
      Nothing here yet.
    </div>
  );
}
