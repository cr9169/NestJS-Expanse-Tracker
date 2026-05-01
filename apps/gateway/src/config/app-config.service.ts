import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AppConfigService {
  constructor(private readonly config: ConfigService) {}

  get port(): number {
    return this.config.get<number>('GATEWAY_PORT', 3000);
  }

  get jwtSecret(): string {
    const secret = this.config.get<string>('JWT_SECRET');
    if (!secret) throw new Error('JWT_SECRET is not configured');
    return secret;
  }

  get jwtExpiration(): string {
    return this.config.get<string>('JWT_EXPIRATION', '15m');
  }

  get tcpHost(): string {
    return this.config.get<string>('TCP_HOST', 'localhost');
  }

  get tcpPort(): number {
    return this.config.get<number>('TCP_PORT', 3001);
  }

  get authTcpHost(): string {
    return this.config.get<string>('AUTH_TCP_HOST', 'localhost');
  }

  get authTcpPort(): number {
    return this.config.get<number>('AUTH_TCP_PORT', 3005);
  }

  get throttleTtl(): number {
    return this.config.get<number>('THROTTLE_TTL', 60000);
  }

  get throttleLimit(): number {
    return this.config.get<number>('THROTTLE_LIMIT', 10);
  }

  get budgetTcpHost(): string {
    return this.config.get<string>('BUDGET_TCP_HOST', 'localhost');
  }

  get budgetTcpPort(): number {
    return this.config.get<number>('BUDGET_TCP_PORT', 3002);
  }

  get analyticsTcpHost(): string {
    return this.config.get<string>('ANALYTICS_TCP_HOST', 'localhost');
  }

  get analyticsTcpPort(): number {
    return this.config.get<number>('ANALYTICS_TCP_PORT', 3003);
  }

  get notificationTcpHost(): string {
    return this.config.get<string>('NOTIFICATION_TCP_HOST', 'localhost');
  }

  get notificationTcpPort(): number {
    return this.config.get<number>('NOTIFICATION_TCP_PORT', 3004);
  }

  get corsOrigins(): string[] {
    const raw = this.config.get<string>(
      'CORS_ORIGINS',
      'http://localhost:5173,http://127.0.0.1:5173',
    );
    return raw
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  }
}
