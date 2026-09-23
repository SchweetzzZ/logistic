import { Global, Module } from '@nestjs/common';
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
      useFactory: (): DrizzleDB => {
        const databaseUrl = process.env.DATABASE_URL;
        if (!databaseUrl) {
          throw new Error('A variável de ambiente DATABASE_URL não foi configurada.');
        }

        const pool = mysql.createPool(databaseUrl);

        return drizzle({ client: pool, schema, mode: 'default' });
      },
    },
  ],
  exports: [DRIZZLE],
})
export class DatabaseModule {}
