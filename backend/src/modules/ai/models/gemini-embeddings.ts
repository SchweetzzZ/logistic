import { Embeddings, type EmbeddingsParams } from "@langchain/core/embeddings"
import type { GoogleGenAI } from '@google/genai';
import { AI_LIMITS } from "../ai.constants";

export type EmbedClient = Pick<GoogleGenAI, 'models'>

export interface GeminiEmbeddingsParams extends EmbeddingsParams {
    client: EmbedClient,
    model: string,
    dimensions: number
}

export class GeminiEmbeddings extends Embeddings {
    private readonly client: EmbedClient
    readonly model: string
    readonly dimensions: number

    constructor({ client, model, dimensions, ...params }: GeminiEmbeddingsParams) {
        super(params);
        this.client = client;
        this.model = model;
        this.dimensions = dimensions;
    }

    /**
 * Vetoriza trechos de documento (usado na ingestão).
 * Formato exigido pelo modelo: "title: {título} | text: {conteúdo}".
 */

    async embedDocuments(texts: string[], tittle = 'none'): Promise<number[][]> {
        const inputs = texts.map((text) => `title: ${tittle} | text: ${text}`)
        const vectors: number[][] = []

        for (let i = 0; i < inputs.length; i += AI_LIMITS.embeddingBatchSize) {
            const batch = inputs.slice(i, i + AI_LIMITS.embeddingBatchSize)
            vectors.push(...(await this.embedBatch(batch)))
        }
        return vectors
    }

    /**
 * Vetoriza a pergunta do usuário (usado na busca).
 * Formato exigido pelo modelo: "task: search result | query: {pergunta}".
 */

    async embedQuery(text: string): Promise<number[]> {
        const [vector] = await this.embedBatch([
            `task: search result | query ${text}`
        ])
        return vector
    }

    private async embedBatch(contents: string[]): Promise<number[][]> {
        const response = await this.caller.call(() => this.client.models.embedContent({
            model: this.model,
            contents,
            config: { outputDimensionality: this.dimensions }
        }),
        )
        const vectors = (response.embeddings ?? []).map((e) => e.values ?? [])

        if (vectors.length !== contents.length) {
            throw new Error(
                `Embedding: esperava ${contents.length} vetores, recebi ${vectors.length}`
            )
        }
        for (const vector of vectors) {
            if (vector.length !== this.dimensions) {
                throw new Error(
                    `Embedding: esperava ${this.dimensions} dimensões, recebi ${vectors.length}`
                )
            }
        }
        return vectors
    }
}