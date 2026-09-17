import type { MySql2Database } from 'drizzle-orm/mysql2';
import type { DatabaseSchema } from './schema';

export const DRIZZLE = 'DRIZZLE';
export type DrizzleDB = MySql2Database<DatabaseSchema>;
