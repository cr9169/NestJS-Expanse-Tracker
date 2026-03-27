/**
 * ExpenseCategory defines all valid categories an expense can belong to.
 * Using a string enum (not numeric) so values are self-documenting in the DB,
 * API responses, and logs — no lookup table needed to decode a stored '2'.
 */
export enum ExpenseCategory {
  FOOD = 'FOOD',
  TRANSPORT = 'TRANSPORT',
  HOUSING = 'HOUSING',
  HEALTH = 'HEALTH',
  OTHER = 'OTHER',
}
