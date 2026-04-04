import { RpcException } from '@nestjs/microservices';

import { AppException } from './exceptions/app.exception';

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
