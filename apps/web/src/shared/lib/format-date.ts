import { format, formatDistanceToNow, parseISO } from 'date-fns';

/** YYYY-MM-DD or full ISO string -> "Mar 15, 2025" */
export function formatDate(iso: string): string {
  try {
    return format(parseISO(iso), 'MMM d, yyyy');
  } catch {
    return iso;
  }
}

/** Full ISO timestamp -> "3 hours ago" */
export function formatRelativeTime(iso: string): string {
  try {
    return formatDistanceToNow(parseISO(iso), { addSuffix: true });
  } catch {
    return iso;
  }
}

/** Today as YYYY-MM-DD */
export function todayIsoDate(): string {
  return format(new Date(), 'yyyy-MM-dd');
}
