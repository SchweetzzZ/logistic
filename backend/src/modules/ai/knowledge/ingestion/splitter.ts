import { Document } from "@google/genai";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters"
import { CHARS_PER_TOKEN, CHUNK_OVERLAP_RATIO, CHUNK_SIZE_TOKENS } from "../knowledge.constants";
import type { ExtractedPage } from "./text-extractor";

export interface ChunkMetaData {
    page: number | null,
    sectionTittle: string | null
}

export interface TextChunk extends ChunkMetaData {
    chucnkIndex: number,
    content: string,
    tokenCount: number
}

const chunkSize = CHUNK_SIZE_TOKENS * CHARS_PER_TOKEN
const chunkOverlap = Math.round(chunkSize * CHUNK_OVERLAP_RATIO)

// O splitter tenta cortar primeiro em parágrafo, depois linha, frase, palavra.
// A versão de markdown também prefere cortar antes de títulos, listas e blocos de código.

const textsplitters = new RecursiveCharacterTextSplitter({ chunkSize, chunkOverlap })
const markdownSplitter = RecursiveCharacterTextSplitter.fromLanguage('markdown', {
    chunkSize,
    chunkOverlap
})

/**
 * Divide as páginas em chunks, guardando página e seção em cada um.
 * O corte é do LangChain; a seção é nossa, porque o LangChain.js não tem
 * o MarkdownHeaderTextSplitter do Python.
 */



