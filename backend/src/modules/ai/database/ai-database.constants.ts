import type { NodePgDatabase } from "drizzle-orm/node-postgres"
import type { AiDatabaseSchema } from "./schema"

export const AI_DB = 'AI_DB'
export const AI_PG_POOL = "AI_PG_POOL"

export type AiDb = NodePgDatabase<AiDatabaseSchema>