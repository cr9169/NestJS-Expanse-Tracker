import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AppConfigService {
  constructor(private readonly config: ConfigService) {}

  get tcpPort(): number {
    return this.config.get<number>('TCP_PORT', 3003);
  }

  get kafkaBroker(): string {
    return this.config.get<string>('KAFKA_BROKER', 'localhost:9092');
  }

  get sqlitePath(): string {
    return this.config.get<string>('SQLITE_PATH', '/data/analytics.db');
  }

  get nodeEnv(): string {
    return this.config.get<string>('NODE_ENV', 'development');
  }
}
