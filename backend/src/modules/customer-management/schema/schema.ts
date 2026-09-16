import { mysqlTable, varchar, timestamp, uniqueIndex, } from 'drizzle-orm/mysql-core';
import { sql } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { tenants } from '../../tenant/schemas/schema';

export const customers = mysqlTable('customers', {
    id: varchar('id', { length: 36 }).primaryKey().$defaultFn(() => randomUUID()),
    name: varchar('name', { length: 150 }).notNull(),
    email: varchar('email', { length: 100 }),
    cpf: varchar('cpf', { length: 14 }).notNull(),
    phone: varchar('phone', { length: 20 }),
    zipCode: varchar('zip_code', { length: 9 }),
    street: varchar('street', { length: 150 }),
    number: varchar('number', { length: 20 }),
    complement: varchar('complement', { length: 100 }),
    city: varchar('city', { length: 100 }),
    state: varchar('state', { length: 20 }),
    tenantId: varchar('tenant_id', { length: 36 }).notNull().references(() => tenants.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
    updatedAt: timestamp('updated_at', { mode: 'string' }).default(sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`).notNull(),
},
    (table) => [
        uniqueIndex('tenant_customer_cpf_idx').on(table.tenantId, table.cpf),
    ],
);

export const customer_management = customers;

export type Customer = typeof customers.$inferSelect;
export type NewCustomer = typeof customers.$inferInsert;
