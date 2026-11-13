import { Inject, Injectable, Logger, Optional } from '@nestjs/common';
import type { BaseChatModel } from '@langchain/core/language_models/chat_models';
import type { Embeddings } from '@langchain/core/embeddings';
import { HumanMessage, SystemMessage, type AIMessage, type BaseMessage, } from '@langchain/core/messages';
import { Runnable } from '@langchain/core/runnables';
import { cosineSimilarity } from '@langchain/core/utils/math';
import { CHAT_MODEL, EMBEDDINGS, FALLBACK_CHAT_MODEL } from '../ai.constants';
import { AiProviderUnavailableError } from '../models/ai-provider.error';
import type { AskDto, AskResponseDto, SimilarityDto, SimilarityResponseDto, } from './dto/ai-debug.dto';
import { fa } from 'zod/v4/locales';
import { start } from 'repl';
import { output } from 'zod';

const DEFAULT_SYSTEM =
    'Você é o assistente do Logistics SaaS. Responda em português do Brasil, de forma curta e direta.';

@Injectable()
export class AiDebugService {
    private readonly logger = new Logger(AiDebugService.name);
    private readonly chat: Runnable<BaseMessage[], AIMessage>;

    constructor(
        @Inject(CHAT_MODEL) private readonly primary: BaseChatModel,
        @Inject(EMBEDDINGS) private readonly embeddings: Embeddings,
        @Optional() @Inject(FALLBACK_CHAT_MODEL) fallback?: BaseChatModel | null,
    ) {
        // withFallbacks: se o principal falhar (já depois dos próprios retries),
        // a mesma chamada é feita no reserva. No tier gratuito a cota é por modelo.
        this.chat = fallback ? primary.withFallbacks([fallback]) : primary;
    }

    async ask({ question, system }: AskDto): Promise<AskResponseDto> {
        const startedAt = Date.now();

        let response: AIMessage;
        try {
            response = await this.chat.invoke([
                new SystemMessage(system ?? DEFAULT_SYSTEM),
                new HumanMessage(question),
            ]);
        } catch (error) {
            throw AiProviderUnavailableError.wrapIfTransient(error);
        }

        const latencyMs = Date.now() - startedAt;
        const usage = {
            input: response.usage_metadata?.input_tokens ?? 0,
            output: response.usage_metadata?.output_tokens ?? 0,
        };
        const model = this.modelName(response);

        // Atenção: o AppLoggerService mascara chaves que contêm "token" (ex.: inputTokens),
        // por isso o uso vai como { input, output }.
        this.logger.log('Chamada ao LLM concluída', { model, usage, latencyMs });

        return { answer: response.text, model, usage, latencyMs };
    }

    async similarity({ query, texts }: SimilarityDto): Promise<SimilarityResponseDto> {
        let queryVector: number[];
        let textVectors: number[][];

        try {
            // Pergunta e documentos são vetorizados de formas diferentes (prefixos de tarefa)
            [queryVector, textVectors] = await Promise.all([
                this.embeddings.embedQuery(query),
                this.embeddings.embedDocuments(texts)
            ])
        } catch (error) {
            throw AiProviderUnavailableError.wrapIfTransient(error)
        }

        // Compara 1 vetor (a pergunta) contra N vetores (os textos) de uma vez.
        // Na Fase 3 essa conta passa a ser feita pelo pgvector, dentro do SQL.
        const [scores] = cosineSimilarity([queryVector], textVectors)
        const results = texts.map((text, i) => ({ text, score: scores[i] })).sort((a, b) => b.score - a.score)

        const info = this.embeddings as unknown as { model?: string, dimensions?: number }

        return {
            model: info.model ?? "desconhecido",
            dimensions: queryVector.length,
            results
        }
    }

    private modelName(response: AIMessage): string {
        const meta = response.response_metadata as Record<string, unknown> | undefined;
        const fromResponse = meta?.model_name ?? meta?.model ?? meta?.modelVersion;
        if (typeof fromResponse === 'string') return fromResponse;
        return (this.primary as unknown as { model?: string }).model ?? 'desconhecido';
    }
}
