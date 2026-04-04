import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AppConfigService {
  constructor(private readonly config: ConfigService) {}

  get tcpPort(): number {
    return this.config.get<number>('TCP_PORT', 3004);
  }

  get rabbitmqUrl(): string {
    return this.config.get<string>('RABBITMQ_URL', 'amqp://localhost:5672');
  }

  get sqlitePath(): string {
    return this.config.get<string>('SQLITE_PATH', '/data/notifications.db');
  }

  get nodeEnv(): string {
    return this.config.get<string>('NODE_ENV', 'development');
  }
}
