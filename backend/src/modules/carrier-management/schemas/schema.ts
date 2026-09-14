import { randomUUID } from "crypto";
import { mysqlTable, varchar, uniqueIndex, timestamp, decimal, int, mysqlEnum } from "drizzle-orm/mysql-core";
import { tenants } from "../../tenant/schemas/schema";
import { sql } from "drizzle-orm";

export const carrierSchema = mysqlTable('carrier_manegement', {
    id: varchar('id', { length: 255 }).primaryKey().$defaultFn(() => randomUUID()),
    tenantId: varchar('tenant_id', { length: 255 }).notNull().references(() => tenants.id),
    name: varchar('name', { length: 150 }).notNull(),
    document: varchar('document', { length: 20 }).notNull(),
    phone: varchar('phone', { length: 20 }),
    email: varchar('email', { length: 100 }),

    basePrice: decimal('base_price', { precision: 10, scale: 2 }).default('0.00').notNull(),
    pricePerKg: decimal('price_per_kg', { precision: 10, scale: 2 }).default('0.00').notNull(),
    deadlineDays: int('deadline_days').default(3).notNull(),
    status: mysqlEnum('status', ['ativo', 'inativo']).default('ativo').notNull(),
    createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
    updatedAt: timestamp('updated_at').default(sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`).notNull(),
},
    (table) => [
        uniqueIndex('tenant_carrier_name_idx').on(table.tenantId, table.name),
    ])

export type Carrier = typeof carrierSchema.$inferSelect;
export type NewCarrier = typeof carrierSchema.$inferInsert;
