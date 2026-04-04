import { Module } from '@nestjs/common';

import { DATABASE_TOKEN } from './tokens';
import { DatabaseProvider } from './database.provider';

@Module({
  providers: [DatabaseProvider],
  exports: [DATABASE_TOKEN],
})
export class DatabaseModule {}
