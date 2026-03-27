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

  get throttleTtl(): number {
    return this.config.get<number>('THROTTLE_TTL', 60000);
  }

  get throttleLimit(): number {
    return this.config.get<number>('THROTTLE_LIMIT', 10);
  }
}
