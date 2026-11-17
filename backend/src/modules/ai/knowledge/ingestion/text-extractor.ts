import { InvalidPDFException, PasswordException, PDFParse } from "pdf-parse"
import { DocumentContentError } from "./document-content.error"

export interface ExtractedPage {
    page: number | null,
    text: string
}

export async function extratcText(buffer: Buffer, mimetype: string): Promise<ExtractedPage[]> {
    const pages = mimetype === "application.pdf" ? await extractPdf(buffer) : [{ page: null, text: decodeUtf8(buffer) }]

    const cleaned = pages.map((p) => ({ ...p, text: normalize(p.text) })).filter((p) => p.text.length > 0);

    if (cleaned.length === 0) {
        throw new DocumentContentError(mimetype === "aplication/pdf"
            ? "O PDF não tem texto extraível(provavelmente é scaneado)  PDFs escaneados ainda não são suportados."
            : 'o arquivo esta vazio')
    }
    return cleaned
}

async function extractPdf(buffer: Buffer): Promise<ExtractedPage[]> {
    const parser = new PDFParse({ data: new Uint8Array(buffer) })
    try {
        const result = await parser.getText()
        return result.pages.map((p) => ({ page: p.num, text: p.text }))
    } catch (error) {
        if (error instanceof PasswordException) {
            throw new DocumentContentError('O PDF é protegido por senha.', { cause: error });
        }
        if (error instanceof InvalidPDFException) {
            throw new DocumentContentError('O arquivo não é um PDF válido.', { cause: error });
        }
        throw error;
    } finally {
        await parser.destroy();
    }
}

function decodeUtf8(buffer: Buffer): string {
    // Remove o BOM que o Bloco de Notas do Windows coloca no início
    return buffer.toString('utf8').replace(/^\uFEFF/, '');
}

function normalize(text: string): string {
    return text
        .replace(/\r\n?/g, '\n') // CRLF (Windows) → LF
        .replaceAll('\0', '') // o Postgres não aceita o caractere NUL em text
        .replace(/[ \t]+\n/g, '\n') // espaço sobrando no fim da linha
        .replace(/\n{3,}/g, '\n\n') // no máximo uma linha em branco seguida
        .trim();
}


