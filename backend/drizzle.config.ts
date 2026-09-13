import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/modules/database/schema.ts',
  out: './drizzle',
  dialect: 'mysql',
  dbCredentials: {
    url:
      process.env.DATABASE_URL ||
      'mysql://logistics_user:logistics_password@localhost:3306/logistics_db',
  },
});
