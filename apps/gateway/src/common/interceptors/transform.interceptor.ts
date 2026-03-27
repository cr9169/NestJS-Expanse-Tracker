import {
  type CallHandler,
  type ExecutionContext,
  Injectable,
  type NestInterceptor,
} from '@nestjs/common';
import type { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import type { ApiResponse, PaginatedResult } from '@shared/types/api-response.type';

/**
 * ARCHITECTURE NOTE:
 * This interceptor wraps every successful response in ApiResponse<T>.
 * Without it, each controller would need to manually construct { data: result }
 * — a convention that would inevitably be missed on some routes.
 *
 * The interceptor detects paginated responses (items + total + page + limit)
 * and promotes the pagination metadata to the `meta` field, keeping `data`
 * as just the items array. This makes the response contract predictable for
 * every consumer — success is always { data, meta? }, error is always { code, message, statusCode }.
 */
@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, ApiResponse<T>> {
  intercept(_context: ExecutionContext, next: CallHandler<T>): Observable<ApiResponse<T>> {
    return next.handle().pipe(
      map((data) => {
        if (this.isPaginatedResult(data)) {
          const paginated = data as unknown as PaginatedResult<unknown>;
          return {
            data: paginated.items as unknown as T,
            meta: {
              page: paginated.page,
              limit: paginated.limit,
              total: paginated.total,
              totalPages: Math.ceil(paginated.total / paginated.limit),
            },
          };
        }
        return { data };
      }),
    );
  }

  private isPaginatedResult(data: unknown): boolean {
    return (
      typeof data === 'object' &&
      data !== null &&
      'items' in data &&
      'total' in data &&
      'page' in data &&
      'limit' in data
    );
  }
}
