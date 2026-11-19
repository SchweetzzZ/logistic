import { Inject, Logger } from '@nestjs/common';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job, UnrecoverableError } from 'bullmq';
import type { Embeddings } from '@langchain/core/embeddings';
import { and, eq } from 'drizzle-orm';
import { readFile } from 'fs/promises';
import * as path from 'path';
import { aiConfig, type AiConfig } from '../../../../config/ai.config';
import { SseNotificationService } from '../../../notification/sse-notification.service';
import { EMBEDDINGS } from '../../ai.constants';
import { AI_DB, type AiDb } from '../../database/ai-database.constants';
import { knowledgeChunks, knowledgeDocuments, type KnowledgeDocument, type NewKnowledgeChunk, } from '../../database/schema';
import { AI_DOCUMENTS_STORAGE_DIR, AI_INGESTION_QUEUE, CHUNK_INSERT_BATCH_SIZE, } from '../knowledge.constants';
import { DocumentContentError } from './document-content.error';
import { splitIntoChunks } from './splitter';
import { extratcText } from './text-extractor';

export interface InjestionJobData {
    documentId: string,
    tenantId: string
}

export interface IngestionResult {
    chunkCount: number,
    skipped: boolean
}

const GENERIC_FAILURE = 'Não foi possível indexar o documento agora. Tente reenviar o arquivo mais tarde.';

/**
 * Worker da ingestão: arquivo → texto → chunks → vetores → Postgres → SSE.
 * concurrency 1: um documento por vez, para não estourar a cota por minuto do Gemini.
 */

@Processor(AI_INGESTION_QUEUE, { concurrency: 1 })
export class IngestionProcessor extends WorkerHost {
    private readonly logger = new Logger(IngestionProcessor.name)
    constructor(
        @Inject(AI_DB) private readonly db: AiDb,
        @Inject(EMBEDDINGS) private readonly embeddings: Embeddings,
        @Inject(aiConfig.KEY) private readonly config: AiConfig,
        private readonly sse: SseNotificationService,
    ) {
        super()
    }
    async process(job: Job<IngestionJobData>): Promise<IngestionResult> {
        const { documentId, tenantId } = job.data
        const startedAt = Date.now()

        const document = await this.findDocument(documentId, tenantId)
        if (!document) {
            this.logger.warn(`Documento ${documentId} não existe mais; job ignorado`)
            return { chunkCount: 0, skipped: true }
        }
        await this.db.update(knowledgeDocuments).set({ status: "PROCESSING", errorMes })
    }
}