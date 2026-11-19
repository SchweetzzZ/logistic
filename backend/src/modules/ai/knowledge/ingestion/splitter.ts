import { Document } from "@langchain/core/documents";
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { CHARS_PER_TOKEN, CHUNK_OVERLAP_RATIO, CHUNK_SIZE_TOKENS } from "../knowledge.constants";
import type { ExtractedPage } from "./text-extractor";

export interface ChunkMetaData {
    page: number | null,
    sectionTitle: string | null
}

export interface TextChunk extends ChunkMetaData {
    chunkIndex: number,
    content: string,
    tokenCount: number
}

const chunkSize = CHUNK_SIZE_TOKENS * CHARS_PER_TOKEN
const chunkOverlap = Math.round(chunkSize * CHUNK_OVERLAP_RATIO)

// O splitter tenta cortar primeiro em parágrafo, depois linha, frase, palavra.
// A versão de markdown também prefere cortar antes de títulos, listas e blocos de código.

const textsplitter = new RecursiveCharacterTextSplitter({ chunkSize, chunkOverlap })
const markdownSplitter = RecursiveCharacterTextSplitter.fromLanguage('markdown', {
    chunkSize,
    chunkOverlap
})

/**
 * Divide as páginas em chunks, guardando página e seção em cada um.
 * O corte é do LangChain; a seção é nossa, porque o LangChain.js não tem
 * o MarkdownHeaderTextSplitter do Python.
 */

export async function splitIntoChunks(pages: ExtractedPage[], mimeType: string,): Promise<TextChunk[]> {
    const isMarkdown = mimeType === 'text/markdown';

    const documents = pages.flatMap(({ page, text }) =>
        (isMarkdown ? splitMarkdownSections(text) : [{ title: null, text }]).map(
            (section) =>
                new Document<ChunkMetaData>({
                    pageContent: section.text,
                    metadata: { page, sectionTitle: section.title },
                }),
        ),
    )
    const splitter = isMarkdown ? markdownSplitter : textsplitter
    // splitDocuments devolve metadata genérico (Record<string, any>); o formato é o nosso
    const chunks = (await splitter.splitDocuments(documents) as Document<ChunkMetaData>[])
    return chunks.filter((chunk) => chunk.pageContent.trim().length > 0)
        .map((chunk, chunkIndex) => ({
            chunkIndex,
            content: chunk.pageContent,
            page: chunk.metadata.page,
            sectionTitle: chunk.metadata.sectionTitle,
            tokenCount: Math.ceil(chunk.pageContent.length / CHARS_PER_TOKEN)
        }))
}
const HEADING = /^(#{1,6})\s+(.+?)\s*#*\s*$/

/**
 * Quebra o markdown nos títulos. O título vira um caminho ("Contrato > Cláusula 3")
 * e continua dentro do texto, porque ajuda a busca.
 */

function splitMarkdownSections(text: string): { title: string | null; text: string }[] {
    const sections: { title: string | null; lines: string[] }[] = []
    const path: string[] = []
    let current: { title: string | null; lines: string[] } = { title: null, lines: [] }
    let inCodeBlock = false

    for (const line of text.split('\n')) {
        if (line.trimStart().startsWith('```')) inCodeBlock = !inCodeBlock
        const match = inCodeBlock ? null : HEADING.exec(line)

        if (match) {
            sections.push(current)
            const level = match[1].length
            path.length = level - 1
            path[level - 1] = match[2]
            current = { title: path.filter(Boolean).join(' > '), lines: [line] }
        } else {
            current.lines.push(line)
        }
    }
    sections.push(current)
    return sections.map((s) => ({ title: s.title, text: s.lines.join('\n').trim() }))
        .filter((s) => s.text.length > 0)
}




