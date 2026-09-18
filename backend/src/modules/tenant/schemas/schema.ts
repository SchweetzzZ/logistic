import {
  mysqlTable,
  varchar,
  timestamp,
  mysqlEnum,
} from 'drizzle-orm/mysql-core';
import { sql } from 'drizzle-orm';
import { randomUUID } from 'crypto';

export const tenants = mysqlTable('tenants', {
  id: varchar('id', { length: 36 })
    .primaryKey()
    .$defaultFn(() => randomUUID()),
  name: varchar('name', { length: 150 }).notNull(),
  document: varchar('document', { length: 20 }).notNull().unique(),
  status: mysqlEnum('status', ['ACTIVE', 'INACTIVE', 'SUSPENDED'])
    .default('ACTIVE')
    .notNull(),
  createdAt: timestamp('created_at', { mode: 'string' })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: timestamp('updated_at', { mode: 'string' })
    .default(sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`)
    .notNull(),
});

export type Tenant = typeof tenants.$inferSelect;
export type NewTenant = typeof tenants.$inferInsert;
