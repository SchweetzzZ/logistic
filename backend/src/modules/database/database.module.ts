import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { drizzle, MySql2Database } from 'drizzle-orm/mysql2';
import * as mysql from 'mysql2/promise';

import { schema } from './schema';
import { DRIZZLE, type DrizzleDB } from './database.constants';

export * from './database.constants';

@Global()
@Module({
  providers: [
    {
      provide: DRIZZLE,
      inject: [ConfigService],
      useFactory: (configService: ConfigService): DrizzleDB => {
        const databaseUrl =
          configService.get<string>('DATABASE_URL') ||
          'mysql://logistics_user:logistics_password@localhost:3306/logistics_db';

        const pool = mysql.createPool(databaseUrl);

        return drizzle({ client: pool, schema, mode: 'default' });
      },
    },
  ],
  exports: [DRIZZLE],
})
export class DatabaseModule {}
