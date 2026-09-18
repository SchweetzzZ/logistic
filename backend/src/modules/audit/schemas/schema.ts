import { randomUUID } from 'crypto';
import {
  mysqlTable,
  varchar,
  timestamp,
  mysqlEnum,
  json,
} from 'drizzle-orm/mysql-core';
import { sql } from 'drizzle-orm';
import { tenants } from '../../tenant/schemas/schema';
import { users } from '../../user/schemas/schema';

export const AUDIT_ACTIONS = [
  'AUTH_LOGIN',
  'AUTH_LOGOUT',
  'USER_CREATE',
  'USER_UPDATE',
  'USER_ROLE_CHANGE',
  'USER_DELETE',
  'CARRIER_CREATE',
  'CARRIER_UPDATE',
  'CARRIER_DELETE',
  'CUSTOMER_CREATE',
  'CUSTOMER_UPDATE',
  'CUSTOMER_DELETE',
] as const;

export type AuditAction = (typeof AUDIT_ACTIONS)[number];

export const auditLogsSchema = mysqlTable('audit_logs', {
  id: varchar('id', { length: 36 })
    .primaryKey()
    .$defaultFn(() => randomUUID()),
  tenantId: varchar('tenant_id', { length: 36 }).references(() => tenants.id, {
    onDelete: 'cascade',
  }),
  userId: varchar('user_id', { length: 36 }).references(() => users.id, {
    onDelete: 'set null',
  }),
  action: mysqlEnum('action', AUDIT_ACTIONS).notNull(),
  resource: varchar('resource', { length: 50 }).notNull(),
  resourceId: varchar('resource_id', { length: 36 }),
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: varchar('user_agent', { length: 255 }),
  details: json('details').$type<Record<string, any>>(),
  createdAt: timestamp('created_at', { mode: 'string' })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
});

export const auditLogs = auditLogsSchema;
export type AuditLog = typeof auditLogsSchema.$inferSelect;
export type NewAuditLog = typeof auditLogsSchema.$inferInsert;
