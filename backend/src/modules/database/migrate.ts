import 'dotenv/config';
import * as path from 'path';
import * as mysql from 'mysql2/promise';
import { drizzle } from 'drizzle-orm/mysql2';
import { migrate } from 'drizzle-orm/mysql2/migrator';

async function runMigrations() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('❌ [Migration] Erro: A variável de ambiente DATABASE_URL não foi configurada.');
    process.exit(1);
  }

  console.log('⏳ [Migration] Conectando ao banco de dados para aplicar migrações...');

  let connection: mysql.Connection | null = null;
  try {
    connection = await mysql.createConnection(databaseUrl);
    const db = drizzle(connection);

    // Identifica o caminho da pasta de migrações
    const migrationsFolder = path.resolve(process.cwd(), 'drizzle');
    console.log(`📁 [Migration] Diretório de migrações: ${migrationsFolder}`);

    await migrate(db, { migrationsFolder });

    console.log('✅ [Migration] Migrações verificadas e aplicadas com sucesso!');
    process.exit(0);
  } catch (error) {
    console.error('❌ [Migration] Falha durante a execução das migrações:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

runMigrations();
