import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationOptions,
  type UseQueryOptions,
} from '@tanstack/react-query';

import { ExpenseCategory } from '@shared/enums/expense-category.enum';

import {
  apiDelete,
  apiGet,
  apiGetPaginated,
  apiPatch,
  apiPost,
  type PaginatedResult,
} from '@/shared/api/http-client';
import type {
  CategorySummary,
  CreateExpenseInput,
  Expense,
  UpdateExpenseInput,
} from '@/shared/schemas/expense.schemas';

export interface ListExpensesFilters {
  category?: ExpenseCategory;
  from?: string;
  to?: string;
  page: number;
  limit: number;
}

export const expenseKeys = {
  all: ['expenses'] as const,
  list: (filters: ListExpensesFilters) => ['expenses', 'list', filters] as const,
  detail: (id: string) => ['expenses', 'detail', id] as const,
  summary: (range: { from: string; to: string }) => ['expenses', 'summary', range] as const,
};

function buildQuery(filters: ListExpensesFilters): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.category) params.set('category', filters.category);
  if (filters.from) params.set('from', filters.from);
  if (filters.to) params.set('to', filters.to);
  params.set('page', String(filters.page));
  params.set('limit', String(filters.limit));
  return params;
}

export function useExpensesListQuery(
  filters: ListExpensesFilters,
  options?: Partial<UseQueryOptions<PaginatedResult<Expense>>>,
) {
  return useQuery<PaginatedResult<Expense>>({
    queryKey: expenseKeys.list(filters),
    queryFn: () => apiGetPaginated<Expense>(`/api/v1/expenses?${buildQuery(filters).toString()}`),
    ...options,
  });
}

export function useExpenseQuery(id: string | null) {
  return useQuery<Expense>({
    queryKey: id ? expenseKeys.detail(id) : ['expenses', 'detail', 'noop'],
    queryFn: () => apiGet<Expense>(`/api/v1/expenses/${id}`),
    enabled: Boolean(id),
  });
}

export function useExpenseSummaryQuery(range: { from: string; to: string } | null) {
  return useQuery<CategorySummary[]>({
    queryKey: range ? expenseKeys.summary(range) : ['expenses', 'summary', 'noop'],
    queryFn: () => {
      const params = new URLSearchParams({ from: range!.from, to: range!.to });
      return apiGet<CategorySummary[]>(`/api/v1/expenses/summary?${params.toString()}`);
    },
    enabled: Boolean(range),
  });
}

export function useCreateExpenseMutation(
  options?: Partial<UseMutationOptions<Expense, Error, CreateExpenseInput>>,
) {
  const qc = useQueryClient();
  return useMutation<Expense, Error, CreateExpenseInput>({
    mutationFn: (input) => apiPost<Expense, CreateExpenseInput>('/api/v1/expenses', input),
    ...options,
    onSuccess: (data, variables, context) => {
      void qc.invalidateQueries({ queryKey: expenseKeys.all });
      options?.onSuccess?.(data, variables, context);
    },
  });
}

export function useUpdateExpenseMutation(
  options?: Partial<UseMutationOptions<Expense, Error, { id: string; input: UpdateExpenseInput }>>,
) {
  const qc = useQueryClient();
  return useMutation<Expense, Error, { id: string; input: UpdateExpenseInput }>({
    mutationFn: ({ id, input }) =>
      apiPatch<Expense, UpdateExpenseInput>(`/api/v1/expenses/${id}`, input),
    ...options,
    onSuccess: (data, variables, context) => {
      void qc.invalidateQueries({ queryKey: expenseKeys.all });
      options?.onSuccess?.(data, variables, context);
    },
  });
}

export function useDeleteExpenseMutation(
  options?: Partial<UseMutationOptions<void, Error, string>>,
) {
  const qc = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: (id) => apiDelete(`/api/v1/expenses/${id}`),
    ...options,
    onSuccess: (data, variables, context) => {
      void qc.invalidateQueries({ queryKey: expenseKeys.all });
      options?.onSuccess?.(data, variables, context);
    },
  });
}
