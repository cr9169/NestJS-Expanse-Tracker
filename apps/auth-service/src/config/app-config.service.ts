import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AppConfigService {
  constructor(private readonly config: ConfigService) {}

  get tcpPort(): number {
    return this.config.get<number>('TCP_PORT', 3005);
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

  get jwtExpiration(): string {
    return this.config.get<string>('JWT_EXPIRATION', '15m');
  }

  get jwtRefreshExpiration(): string {
    return this.config.get<string>('JWT_REFRESH_EXPIRATION', '7d');
  }

  get sqlitePath(): string {
    return this.config.get<string>('SQLITE_PATH', '/data/auth.db');
  }

  get nodeEnv(): string {
    return this.config.get<string>('NODE_ENV', 'development');
  }

  get isDevelopment(): boolean {
    return this.nodeEnv === 'development';
  }
}
