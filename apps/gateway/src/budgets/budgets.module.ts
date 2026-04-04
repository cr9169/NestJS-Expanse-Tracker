import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';

import { AppConfigService } from '../config/app-config.service';

import { BudgetsController } from './budgets.controller';
import { BUDGET_CLIENT_TOKEN } from './tokens';

@Module({
  imports: [
    ClientsModule.registerAsync([
      {
        name: BUDGET_CLIENT_TOKEN,
        inject: [AppConfigService],
        useFactory: (config: AppConfigService) => ({
          transport: Transport.TCP,
          options: {
            host: config.budgetTcpHost,
            port: config.budgetTcpPort,
          },
        }),
      },
    ]),
  ],
  controllers: [BudgetsController],
})
export class BudgetsModule {}
