import {
  type CallHandler,
  type ExecutionContext,
  Injectable,
  Logger,
  type NestInterceptor,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import type { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { v4 as uuidv4 } from 'uuid';

/**
 * Attaches a UUID traceId to every request lifecycle.
 * The traceId is:
 * 1. Added to the response header (X-Trace-Id) for client-side debugging
 * 2. Logged on request start and request end with duration
 * 3. Available in the request object for downstream use (e.g. per-request logging)
 *
 * In a distributed system, the same traceId can be forwarded via TCP to the
 * microservice, enabling cross-service log correlation (Week 2 enhancement).
 */
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = context.switchToHttp();
    const request = http.getRequest<Request & { traceId?: string }>();
    const response = http.getResponse<Response>();

    const traceId = uuidv4();
    request.traceId = traceId;
    response.setHeader('X-Trace-Id', traceId);

    const { method, url } = request;
    const startTime = Date.now();

    this.logger.log(`→ ${method} ${url}`, `HTTP [${traceId}]`);

    return next.handle().pipe(
      tap({
        next: () => {
          const duration = Date.now() - startTime;
          const statusCode = response.statusCode;
          this.logger.log(
            `← ${method} ${url} ${statusCode} +${duration}ms`,
            `HTTP [${traceId}]`,
          );
        },
        error: (err: unknown) => {
          const duration = Date.now() - startTime;
          const message = err instanceof Error ? err.message : 'Error';
          this.logger.error(
            `← ${method} ${url} ERROR +${duration}ms: ${message}`,
            undefined,
            `HTTP [${traceId}]`,
          );
        },
      }),
    );
  }
}
