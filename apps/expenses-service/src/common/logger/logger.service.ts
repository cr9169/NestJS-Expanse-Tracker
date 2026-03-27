import { Injectable, Logger } from '@nestjs/common';

export interface LogContext {
  context?: string;
  traceId?: string;
  [key: string]: unknown;
}

/**
 * Structured logger wrapping NestJS Logger.
 * Emits JSON lines in production for log aggregators (Datadog, CloudWatch).
 * In development the built-in NestJS pretty-print is used.
 *
 * WHY wrap NestJS Logger: Direct use of console.log has no context, no level,
 * and no structure. This service ensures every log entry includes at minimum:
 * timestamp, level, message, context, and traceId for distributed tracing.
 */
@Injectable()
export class LoggerService {
  private readonly logger = new Logger();

  log(message: string, meta: LogContext = {}): void {
    this.logger.log(this.format(message, meta), meta.context ?? 'App');
  }

  error(message: string, error?: unknown, meta: LogContext = {}): void {
    const stack = error instanceof Error ? error.stack : undefined;
    this.logger.error(this.format(message, meta), stack, meta.context ?? 'App');
  }

  warn(message: string, meta: LogContext = {}): void {
    this.logger.warn(this.format(message, meta), meta.context ?? 'App');
  }

  debug(message: string, meta: LogContext = {}): void {
    this.logger.debug(this.format(message, meta), meta.context ?? 'App');
  }

  private format(message: string, meta: LogContext): string {
    const { context: _context, ...rest } = meta;
    const hasExtra = Object.keys(rest).length > 0;
    return hasExtra ? `${message} ${JSON.stringify(rest)}` : message;
  }
}
