import { GoogleGenAI } from '@google/genai';
import type { AiConfig } from '../../../config/ai.config';
import { GeminiEmbeddings } from './gemini-embeddings';

export function createEmbeddings(config: AiConfig): GeminiEmbeddings {
    if (!config.geminiApiKey) {
        throw new Error(
            'GEMINI_API_KEY não configurada. Gere uma chave em https://aistudio.google.com/apikey e coloque no backend/.env.',
        );
    }

    return new GeminiEmbeddings({
        client: new GoogleGenAI({ apiKey: config.geminiApiKey }),
        model: config.embeddingModel,
        dimensions: config.embeddingDimensions,
        maxRetries: config.maxRetries,
    });
}