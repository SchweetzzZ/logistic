import 'dotenv/config'
import { defineConfig } from 'drizzle-kit'

export default defineConfig({
    schema: './src/modules/ai/database/schema.ts',
    out: './drizzle-ai',
    dialect: 'postgresql',
    dbCredentials: {
        url: process.env.AI_DATABASE_URL!
    }
})