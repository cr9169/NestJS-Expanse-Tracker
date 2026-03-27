import { Injectable, Logger } from '@nestjs/common';

export interface LogContext {
  context?: string;
  traceId?: string;
  [key: string]: unknown;
}

@Injectable()
export class LoggerService {
  private readonly logger = new Logger();

  log(message: string, meta: LogContext = {}): void {
    this.logger.log(this.format(message, meta), meta.context ?? 'Gateway');
  }

  error(message: string, error?: unknown, meta: LogContext = {}): void {
    const stack = error instanceof Error ? error.stack : undefined;
    this.logger.error(this.format(message, meta), stack, meta.context ?? 'Gateway');
  }

  warn(message: string, meta: LogContext = {}): void {
    this.logger.warn(this.format(message, meta), meta.context ?? 'Gateway');
  }

  debug(message: string, meta: LogContext = {}): void {
    this.logger.debug(this.format(message, meta), meta.context ?? 'Gateway');
  }

  private format(message: string, meta: LogContext): string {
    const { context: _context, ...rest } = meta;
    const hasExtra = Object.keys(rest).length > 0;
    return hasExtra ? `${message} ${JSON.stringify(rest)}` : message;
  }
}
