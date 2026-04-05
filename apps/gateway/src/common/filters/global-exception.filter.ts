import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import type { Response } from 'express';

import type { ApiErrorResponse } from '@shared/types/api-response.type';

/**
 * ARCHITECTURE NOTE:
 * A single global exception filter catches ALL unhandled exceptions and maps
 * them to the uniform ApiErrorResponse shape. Without this, different exception
 * types would produce inconsistent response shapes (NestJS built-in 404s look
 * different from our domain exceptions, which look different from unexpected errors).
 *
 * The filter handles three exception categories:
 * 1. RpcException from TCP microservice — deserialise the structured payload
 * 2. NestJS HttpException (e.g. from ValidationPipe) — map directly
 * 3. Everything else — return 500, never leak internal details
 *
 * Stack traces are never included in responses — they stay in server logs only.
 */
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let code = 'INTERNAL_ERROR';
    let message = 'An unexpected error occurred';

    if (exception instanceof RpcException) {
      const rpcError = exception.getError();
      const parsed = this.parseRpcError(rpcError);
      statusCode = parsed.statusCode;
      code = parsed.code;
      message = parsed.message;
    } else if (this.isRpcErrorObject(exception)) {
      // NestJS TCP ClientProxy delivers microservice errors as plain objects,
      // not wrapped in RpcException. Handle them the same way.
      const parsed = this.parseRpcError(exception);
      statusCode = parsed.statusCode;
      code = parsed.code;
      message = parsed.message;
    } else if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const res = exception.getResponse();
      if (typeof res === 'object' && res !== null && 'message' in res) {
        const msg = (res as Record<string, unknown>)['message'];
        message = Array.isArray(msg) ? (msg as string[]).join(', ') : String(msg);
      } else {
        message = exception.message;
      }
      code = this.httpStatusToCode(statusCode);
    } else if (exception instanceof Error) {
      this.logger.error('Unhandled exception', exception.stack);
    }

    const errorResponse: ApiErrorResponse = { statusCode, error: code, message, code };
    response.status(statusCode).json(errorResponse);
  }

  private isRpcErrorObject(exception: unknown): boolean {
    return (
      typeof exception === 'object' &&
      exception !== null &&
      !(exception instanceof Error) &&
      'statusCode' in exception &&
      'message' in exception
    );
  }

  private parseRpcError(error: unknown): { statusCode: number; code: string; message: string } {
    if (typeof error === 'object' && error !== null) {
      const e = error as Record<string, unknown>;
      return {
        statusCode: typeof e['statusCode'] === 'number' ? e['statusCode'] : 500,
        code: typeof e['code'] === 'string' ? e['code'] : 'INTERNAL_ERROR',
        message: typeof e['message'] === 'string' ? e['message'] : 'Service error',
      };
    }
    return { statusCode: 500, code: 'INTERNAL_ERROR', message: 'Service error' };
  }

  private httpStatusToCode(status: number): string {
    const map: Record<number, string> = {
      400: 'BAD_REQUEST',
      401: 'UNAUTHORIZED',
      403: 'FORBIDDEN',
      404: 'NOT_FOUND',
      409: 'CONFLICT',
      422: 'UNPROCESSABLE_ENTITY',
      429: 'TOO_MANY_REQUESTS',
      500: 'INTERNAL_ERROR',
    };
    return map[status] ?? 'ERROR';
  }
}
