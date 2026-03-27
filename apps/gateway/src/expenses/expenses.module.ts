import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';

import { AppConfigService } from '../config/app-config.service';

import { ExpensesController } from './expenses.controller';
import { EXPENSES_CLIENT_TOKEN } from './tokens';

@Module({
  imports: [
    ClientsModule.registerAsync([
      {
        name: EXPENSES_CLIENT_TOKEN,
        inject: [AppConfigService],
        useFactory: (config: AppConfigService) => ({
          transport: Transport.TCP,
          options: {
            host: config.tcpHost,
            port: config.tcpPort,
          },
        }),
      },
    ]),
  ],
  controllers: [ExpensesController],
  providers: [AppConfigService],
})
export class ExpensesModule {}
