import { addMonths, format, parse } from 'date-fns';

const MONTH_RE = /^\d{4}-(0[1-9]|1[0-2])$/;

export function isValidMonth(value: string): boolean {
  return MONTH_RE.test(value);
}

export function currentMonth(): string {
  return format(new Date(), 'yyyy-MM');
}

export function shiftMonth(month: string, delta: number): string {
  const date = parse(month, 'yyyy-MM', new Date());
  return format(addMonths(date, delta), 'yyyy-MM');
}

export function formatMonth(month: string): string {
  try {
    return format(parse(month, 'yyyy-MM', new Date()), 'MMMM yyyy');
  } catch {
    return month;
  }
}
