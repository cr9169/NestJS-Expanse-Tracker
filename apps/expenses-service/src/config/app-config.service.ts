import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Typed wrapper around ConfigService.
 * WHY: Direct `configService.get<string>('JWT_SECRET')` returns `string | undefined`
 * everywhere it's called — the consumer must handle undefined or use non-null assertion.
 * This service centralises the assertion once and exports typed getters, so
 * every consumer gets `string`, never `string | undefined`.
 */
@Injectable()
export class AppConfigService {
  constructor(private readonly config: ConfigService) {}

  get tcpPort(): number {
    return this.config.get<number>('TCP_PORT', 3001);
  }

  get jwtSecret(): string {
    const secret = this.config.get<string>('JWT_SECRET');
    if (!secret) throw new Error('JWT_SECRET is not configured');
    return secret;
  }

  get jwtRefreshSecret(): string {
    const secret = this.config.get<string>('JWT_REFRESH_SECRET');
    if (!secret) throw new Error('JWT_REFRESH_SECRET is not configured');
    return secret;
  }

  get sqlitePath(): string {
    return this.config.get<string>('SQLITE_PATH', '/data/expenses.db');
  }

  get nodeEnv(): string {
    return this.config.get<string>('NODE_ENV', 'development');
  }

  get isDevelopment(): boolean {
    return this.nodeEnv === 'development';
  }
}
