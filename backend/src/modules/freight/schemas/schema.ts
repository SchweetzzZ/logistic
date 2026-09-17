import { randomUUID } from 'crypto';
import { mysqlTable, varchar, timestamp, decimal, int, mysqlEnum, json } from 'drizzle-orm/mysql-core';
import { sql } from 'drizzle-orm';
import { tenants } from '../../tenant/schemas/schema';
import { users } from '../../user/schemas/schema';
import type { FreightQuote } from '../dto/freight.types';

export const auditFreightSchema = mysqlTable('audit_freight', {
  id: varchar('id', { length: 36 }).primaryKey().$defaultFn(() => randomUUID()),
  tenantId: varchar('tenant_id', { length: 36 }).notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  userId: varchar('user_id', { length: 36 }).references(() => users.id, { onDelete: 'set null' }),
  originZipCode: varchar('origin_zip_code', { length: 8 }).notNull(),
  destinationZipCode: varchar('destination_zip_code', { length: 8 }).notNull(),
  originCity: varchar('origin_city', { length: 100 }),
  originState: varchar('origin_state', { length: 2 }),
  destinationCity: varchar('destination_city', { length: 100 }),
  destinationState: varchar('destination_state', { length: 2 }),
  actualWeightKg: decimal('actual_weight_kg', { precision: 10, scale: 3 }).notNull(),
  volumetricWeightKg: decimal('volumetric_weight_kg', { precision: 10, scale: 3 }).notNull(),
  chargedWeightKg: decimal('charged_weight_kg', { precision: 10, scale: 3 }).notNull(),
  declaredValue: decimal('declared_value', { precision: 10, scale: 2 }).notNull(),
  dimensionsLength: decimal('dimensions_length', { precision: 10, scale: 2 }).notNull(),
  dimensionsWidth: decimal('dimensions_width', { precision: 10, scale: 2 }).notNull(),
  dimensionsHeight: decimal('dimensions_height', { precision: 10, scale: 2 }).notNull(),
  deliveryType: mysqlEnum('delivery_type', ['LOCAL', 'STATE', 'INTERSTATE']).notNull(),
  cheapestCarrierId: varchar('cheapest_carrier_id', { length: 36 }),
  cheapestCarrierName: varchar('cheapest_carrier_name', { length: 150 }),
  cheapestPrice: decimal('cheapest_price', { precision: 10, scale: 2 }),
  cheapestDeadlineDays: int('cheapest_deadline_days'),
  quotes: json('quotes').$type<FreightQuote[]>().notNull(),
  createdAt: timestamp('created_at', { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const auditFreight = auditFreightSchema;
export type AuditFreight = typeof auditFreightSchema.$inferSelect;
export type NewAuditFreight = typeof auditFreightSchema.$inferInsert;
