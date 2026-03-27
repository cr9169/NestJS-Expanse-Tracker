/**
 * Uniform API response envelope used by ALL endpoints.
 *
 * WHY a wrapper: Clients can always rely on `data` being the payload and
 * `meta` being pagination info. This prevents ad-hoc shapes per endpoint
 * and makes frontend TypeScript generics trivial. Error shape is separate
 * (ApiErrorResponse) so success/error branches never overlap.
 */

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  data: T;
  meta?: PaginationMeta;
}

/**
 * All error responses share this shape regardless of which layer threw.
 * The `code` field is a stable machine-readable string (e.g. "EXPENSE_NOT_FOUND")
 * that frontends can use for i18n or conditional logic without parsing `message`.
 */
export interface ApiErrorResponse {
  statusCode: number;
  error: string;
  message: string;
  code: string;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}
