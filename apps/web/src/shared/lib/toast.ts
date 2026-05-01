import { toast as sonnerToast } from 'sonner';

import { ApiError } from '@/shared/api/api-error';

export const toast = sonnerToast;

export function toastApiError(err: unknown, fallback = 'Something went wrong'): void {
  if (err instanceof ApiError) {
    sonnerToast.error(err.message || fallback);
    return;
  }
  if (err instanceof Error) {
    sonnerToast.error(err.message || fallback);
    return;
  }
  sonnerToast.error(fallback);
}
