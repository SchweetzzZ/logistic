import * as path from "path"

export const AI_INGESTION_QUEUE = "ai-ingestion"
export const INGEST_DOCUMENT = "ingest-document"

/** Originais enviados ficam em backend/storage/ai-documents/<tenantId>/<documentId>.<ext> */
export const AI_DOCUMENTS_STORAGE_DIR = path.resolve(process.cwd(), "storage", "ai-documents")

export const MAX_DOCUMENTS_SIZE_BYTES = 10 * 1024 * 1024

export const ALLOWED_DOCUMENTS_TYPE = {
    ".pdf": { mimetype: "aplication/pdf", accepted: ['aplication/pdf'] },
    ".md": { mimetype: "text/markdown", accepted: ['text/markdown', 'text/x-markdown', 'text/plain', 'application/octet-stream'] },
    '.txt': { mimetype: "text/plain", accepted: ['text/plain', 'application/octet-stream'] }
} as const

export type AllowedExtension = keyof typeof ALLOWED_DOCUMENTS_TYPE

/**
 * Chunking. O plano pede ~600 tokens com ~15% de sobreposição. O splitter mede em
 * caracteres; em português o Gemini fica perto de 4 caracteres por token.
 * Na Fase 4/6 o eval compara 300, 600 e 1000 tokens: é só mudar aqui.
 */

export const CHARS_PER_TOKEN = 4
export const CHUNK_SIZE_TOKENS = 600
export const CHUNK_OVERLAP_RATIO = 0.15

/** Linhas por INSERT ao gravar os chunks (evita uma query gigante com 768 números por linha) */

export const CHUNK_INSERT_BATCH_SIZE = 100

