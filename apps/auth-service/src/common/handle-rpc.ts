import { RpcException } from '@nestjs/microservices';

import { AppException } from './exceptions/app.exception';

/**
 * Wraps a use-case call and converts AppExceptions to RpcExceptions so the
 * gateway exception filter can reconstruct the correct HTTP response.
 * Unknown errors become a generic 500 to avoid leaking internals.
 */
export async function handleRpc<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (error instanceof AppException) {
      throw new RpcException({
        code: error.code,
        message: error.message,
        statusCode: error.statusCode,
      });
    }
    throw new RpcException({ code: 'INTERNAL_ERROR', message: 'Internal server error', statusCode: 500 });
  }
}
