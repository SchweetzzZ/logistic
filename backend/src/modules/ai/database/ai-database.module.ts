import { Inject, Logger, Module, type OnApplicationBootstrap, type OnApplicationShutdown, } from '@nestjs/common';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { aiConfig, type AiConfig } from '../../../config/ai.config';
import { AI_DB, AI_PG_POOL, type AiDb } from './ai-database.constants';
import { aiSchema } from './schema';

/**
 * Conexão com o Postgres + pgvector, separado do MySQL do resto do sistema.
 * Segue o mesmo desenho do DatabaseModule: um pool de conexões + o Drizzle por cima.
 */
@Module({
    providers: [
        {
            provide: AI_PG_POOL,
            inject: [aiConfig.KEY],
            useFactory: (config: AiConfig): Pool => {
                if (!config.databaseUrl) {
                    throw new Error(
                        'A variável de ambiente AI_DATABASE_URL não foi configurada.',
                    );
                }
                return new Pool({ connectionString: config.databaseUrl, max: 10 });
            },
        },
        {
            provide: AI_DB,
            inject: [AI_PG_POOL],
            useFactory: (pool: Pool): AiDb =>
                drizzle({ client: pool, schema: aiSchema }),
        },
    ],
    exports: [AI_DB],
})
export class AiDatabaseModule
    implements OnApplicationBootstrap, OnApplicationShutdown {
    private readonly logger = new Logger(AiDatabaseModule.name);

    constructor(@Inject(AI_PG_POOL) private readonly pool: Pool) { }

    /** Confere a conexão e a extensão vector ao subir, para o erro aparecer logo. */
    async onApplicationBootstrap(): Promise<void> {
        const { rows } = await this.pool.query<{ extversion: string }>(
            "SELECT extversion FROM pg_extension WHERE extname = 'vector'",
        );

        if (rows.length === 0) {
            this.logger.warn(
                'Postgres de IA conectado, mas a extensão vector não está instalada. Rode: npm run db:ai:migrate',
            );
            return;
        }
        this.logger.log(
            `Postgres de IA conectado (pgvector ${rows[0].extversion})`,
        );
    }

    /** Fecha as conexões quando a aplicação para (Ctrl+C, deploy). */
    async onApplicationShutdown(): Promise<void> {
        await this.pool.end();
    }
}