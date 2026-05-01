import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationOptions,
} from '@tanstack/react-query';

import {
  apiDelete,
  apiGet,
  apiPatch,
  apiPost,
} from '@/shared/api/http-client';
import type {
  Budget,
  BudgetStatusEntry,
  CreateBudgetInput,
  UpdateBudgetInput,
} from '@/shared/schemas/budget.schemas';

export const budgetKeys = {
  all: ['budgets'] as const,
  list: () => ['budgets', 'list'] as const,
  status: (month: string) => ['budgets', 'status', month] as const,
};

export function useBudgetsQuery() {
  return useQuery<Budget[]>({
    queryKey: budgetKeys.list(),
    queryFn: () => apiGet<Budget[]>('/api/v1/budgets'),
  });
}

export function useBudgetStatusQuery(month: string) {
  return useQuery<BudgetStatusEntry[]>({
    queryKey: budgetKeys.status(month),
    queryFn: () => apiGet<BudgetStatusEntry[]>(`/api/v1/budgets/status?month=${month}`),
  });
}

export function useCreateBudgetMutation(
  options?: Partial<UseMutationOptions<Budget, Error, CreateBudgetInput>>,
) {
  const qc = useQueryClient();
  return useMutation<Budget, Error, CreateBudgetInput>({
    mutationFn: (input) => apiPost<Budget, CreateBudgetInput>('/api/v1/budgets', input),
    ...options,
    onSuccess: (data, variables, context) => {
      void qc.invalidateQueries({ queryKey: budgetKeys.all });
      options?.onSuccess?.(data, variables, context);
    },
  });
}

export function useUpdateBudgetMutation(
  options?: Partial<UseMutationOptions<Budget, Error, { id: string; input: UpdateBudgetInput }>>,
) {
  const qc = useQueryClient();
  return useMutation<Budget, Error, { id: string; input: UpdateBudgetInput }>({
    mutationFn: ({ id, input }) =>
      apiPatch<Budget, UpdateBudgetInput>(`/api/v1/budgets/${id}`, input),
    ...options,
    onSuccess: (data, variables, context) => {
      void qc.invalidateQueries({ queryKey: budgetKeys.all });
      options?.onSuccess?.(data, variables, context);
    },
  });
}

export function useDeleteBudgetMutation(
  options?: Partial<UseMutationOptions<void, Error, string>>,
) {
  const qc = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: (id) => apiDelete(`/api/v1/budgets/${id}`),
    ...options,
    onSuccess: (data, variables, context) => {
      void qc.invalidateQueries({ queryKey: budgetKeys.all });
      options?.onSuccess?.(data, variables, context);
    },
  });
}
