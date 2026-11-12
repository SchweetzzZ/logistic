import { ChatGoogle } from "@langchain/google/node"
import type { AiConfig } from "src/config/ai.config"
import { AI_LIMITS } from "../ai.constants"

export function createChatModel(config: AiConfig, model: string): ChatGoogle {
    if (!config.geminiApiKey) {
        throw new Error(
            'GEMINI_API_KEY não configurada. Gere uma chave em https://aistudio.google.com/apikey e coloque no backend/.env.',
        )
    }

    return new ChatGoogle({
        apiKey: config.geminiApiKey, model,
        maxRetries: config.maxRetries,
        maxOutputTokens: AI_LIMITS.maxOutputTokens
    })
}