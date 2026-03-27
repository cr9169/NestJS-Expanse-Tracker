import { Module } from '@nestjs/common';

import { AppConfigService } from '../config/app-config.service';

import { DatabaseProvider } from './database.provider';

/**
 * DatabaseModule is a shared module — any module that imports it gets access
 * to the DATABASE_TOKEN provider. Marking it @Global() was considered but
 * rejected: explicit imports make dependency flow visible in the module graph.
 */
@Module({
  providers: [AppConfigService, DatabaseProvider],
  exports: [DatabaseProvider],
})
export class DatabaseModule {}
