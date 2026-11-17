import { index, integer, pgEnum, pgTable, text, timestamp, uniqueIndex, uuid, vector, } from 'drizzle-orm/pg-core';

/**
 * Tamanho do vetor gravado no banco. Precisa bater com AI_EMBEDDING_DIMENSIONS:
 * o pgvector recusa vetor de tamanho diferente do declarado na coluna.
 */
export const EMBEDDING_DIMENSIONS = 768;

export const KNOWLEDGE_DOCUMENT_STATUSES = [
    'PENDING', // na fila
    'PROCESSING', // o worker está trabalhando nele (inclui as novas tentativas)
    'INDEXED', // pronto para busca
    'FAILED', // desistiu; o motivo fica em error_message
] as const;

export type KnowledgeDocumentStatus = (typeof KNOWLEDGE_DOCUMENT_STATUSES)[number];

export const knowledgeDocumentStatus = pgEnum(
    'knowledge_document_status',
    KNOWLEDGE_DOCUMENT_STATUSES,
);

export const knowledgeDocuments = pgTable(
    'knowledge_documents',
    {
        id: uuid('id').primaryKey().defaultRandom(),
        // Sem FK: tenants e users moram no MySQL, outro banco
        tenantId: uuid('tenant_id').notNull(),
        uploadedBy: uuid('uploaded_by').notNull(),
        title: text('title').notNull(),
        fileName: text('file_name').notNull(),
        mimeType: text('mime_type').notNull(),
        sizeBytes: integer('size_bytes').notNull(),
        // Caminho relativo à pasta storage/ai-documents (funciona no Windows e no Linux)
        storagePath: text('storage_path').notNull(),
        contentHash: text('content_hash').notNull(),
        status: knowledgeDocumentStatus('status').notNull().default('PENDING'),
        errorMessage: text('error_message'),
        chunkCount: integer('chunk_count').notNull().default(0),
        createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
        indexedAt: timestamp('indexed_at', { withTimezone: true }),
    },
    (t) => [
        index('knowledge_documents_tenant_created_idx').on(t.tenantId, t.createdAt),
        // O mesmo arquivo não entra duas vezes na mesma empresa
        uniqueIndex('knowledge_documents_tenant_hash_uq').on(t.tenantId, t.contentHash),
    ],
);

export const knowledgeChunks = pgTable(
    'knowledge_chunks',
    {
        id: uuid('id').primaryKey().defaultRandom(),
        tenantId: uuid('tenant_id').notNull(),
        documentId: uuid('document_id')
            .notNull()
            .references(() => knowledgeDocuments.id, { onDelete: 'cascade' }),
        chunkIndex: integer('chunk_index').notNull(),
        content: text('content').notNull(),
        // Preenchido só na Fase 6 (contextual retrieval)
        context: text('context'),
        sectionTitle: text('section_title'),
        page: integer('page'),
        tokenCount: integer('token_count').notNull(),
        embedding: vector('embedding', { dimensions: EMBEDDING_DIMENSIONS }).notNull(),
        // Guardar o modelo permite reindexar só o que foi gerado por um modelo antigo
        embeddingModel: text('embedding_model').notNull(),
        createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    },
    (t) => [
        index('knowledge_chunks_tenant_idx').on(t.tenantId),
        uniqueIndex('knowledge_chunks_document_chunk_uq').on(t.documentId, t.chunkIndex),
        // HNSW com distância de cosseno: é o índice que o operador <=> usa na Fase 3
        index('knowledge_chunks_embedding_hnsw_idx').using(
            'hnsw',
            t.embedding.op('vector_cosine_ops'),
        ),
    ],
);

export type KnowledgeDocument = typeof knowledgeDocuments.$inferSelect;
export type NewKnowledgeChunk = typeof knowledgeChunks.$inferInsert;

export const aiSchema = {
    knowledgeDocumentStatus,
    knowledgeDocuments,
    knowledgeChunks,
};

export type AiDatabaseSchema = typeof aiSchema;