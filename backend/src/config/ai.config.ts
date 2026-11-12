import { registerAs } from '@nestjs/config';

/**
 * Configuração do módulo de IA, no mesmo padrão do auth.config.ts.
 * Lida uma vez na inicialização; injete com @Inject(aiConfig.KEY).
 */
export const aiConfig = registerAs('ai', () => ({
    geminiApiKey: process.env.GEMINI_API_KEY ?? '',
    chatModel: process.env.AI_CHAT_MODEL ?? 'gemini-3.5-flash-lite',
    // Vazio = sem modelo reserva
    fallbackModel: process.env.AI_FALLBACK_MODEL ?? '',
    embeddingModel: process.env.AI_EMBEDDING_MODEL ?? 'gemini-embedding-2',
    embeddingDimensions: Number(process.env.AI_EMBEDDING_DIMENSIONS ?? 768),
    // Tentativas por modelo antes de desistir (ou cair no reserva)
    maxRetries: Number(process.env.AI_MAX_RETRIES ?? 2),
}));

export type AiConfig = ReturnType<typeof aiConfig>;