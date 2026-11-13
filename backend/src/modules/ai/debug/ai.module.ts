import { Module } from "@nestjs/common";
import { aiConfig, type AiConfig } from '../../../config/ai.config';
import { CHAT_MODEL, EMBEDDINGS, FALLBACK_CHAT_MODEL } from "../ai.constants";
import { createChatModel } from "../models/chat-model.factory";
import { createEmbeddings } from "../models/embeddings.factory";
import { AiDebugController } from "./ai-debug.controller";
import { AiDebugService } from "./ai-debug.service";

@Module({
    controllers: [AiDebugController],
    providers: [
        {
            provide: CHAT_MODEL,
            inject: [aiConfig.KEY],
            useFactory: (config: AiConfig) => createChatModel(config, config.chatModel)
        },
        {
            provide: FALLBACK_CHAT_MODEL,
            inject: [aiConfig.KEY],
            useFactory: (config: AiConfig) => config.fallbackModel && config.fallbackModel !== config.chatModel ? createChatModel(config, config.fallbackModel) : null
        },
        {
            provide: EMBEDDINGS,
            inject: [aiConfig.KEY],
            useFactory: (config: AiConfig) => createEmbeddings(config),
        },
        AiDebugService
    ],
    exports: [CHAT_MODEL, FALLBACK_CHAT_MODEL, EMBEDDINGS]
})
export class AiModule { }