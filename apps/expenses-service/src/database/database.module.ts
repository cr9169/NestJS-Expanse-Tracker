import { Module } from '@nestjs/common';

import { DATABASE_TOKEN } from './tokens';
import { DatabaseProvider } from './database.provider';

/**
 * DatabaseModule is a shared module — any module that imports it gets access
 * to the DATABASE_TOKEN provider. Marking it @Global() was considered but
 * rejected: explicit imports make dependency flow visible in the module graph.
 */
@Module({
  providers: [DatabaseProvider],
  exports: [DATABASE_TOKEN],
})
export class DatabaseModule {}
