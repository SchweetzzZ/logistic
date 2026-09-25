import type { CsvHeaderAliases } from './csv-import.types';

/** Remove BOM, quebra em linhas, descarta vazias */
export function splitCsvLines(buffer: Buffer): string[] {
  return buffer
    .toString('utf-8')
    .replace(/^\uFEFF/, '')
    .split(/\r\n|\n|\r/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
}

/** Detecta se o delimitador predominante é ';' ou ',' */
export function detectDelimiter(headerLine: string): string {
  const semicolons = (headerLine.match(/;/g) || []).length;
  const commas = (headerLine.match(/,/g) || []).length;
  return semicolons >= commas ? ';' : ',';
}

/** Parser de uma linha CSV respeitando campos entre aspas */
export function parseCsvLine(line: string, delim: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === delim && !inQuotes) {
      result.push(current.trim().replace(/^"|"$/g, ''));
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim().replace(/^"|"$/g, ''));
  return result;
}

/**
 * Resolve o índice de cada chave canônica a partir dos aliases.
 * Retorna um mapa { chaveCanonica -> indiceNoCsvComoString }.
 */
export function buildHeaderMap(
  rawHeaders: string[],
  aliases: CsvHeaderAliases,
): Record<string, string> {
  const normalized = rawHeaders.map((h) =>
    h.toLowerCase().trim().replace(/[\s_-]+/g, ''),
  );

  const map: Record<string, string> = {};
  for (const [key, variants] of Object.entries(aliases)) {
    const idx = normalized.findIndex((h) => variants.includes(h));
    if (idx !== -1) {
      map[key] = String(idx);
    }
  }
  return map;
}

/** Retorna o valor de uma coluna pelo nome canônico (string vazia se ausente) */
export function getCol(cols: string[], headerMap: Record<string, string>, key: string): string {
  const idx = headerMap[key];
  return idx !== undefined && cols[Number(idx)] !== undefined ? cols[Number(idx)].trim() : '';
}

/** Insere rows no banco em lotes de batchSize */
export async function insertInBatches<T>(insertFn: (batch: T[]) => Promise<any>, rows: T[], batchSize = 100): Promise<void> {
  for (let i = 0; i < rows.length; i += batchSize) {
    await insertFn(rows.slice(i, i + batchSize));
  }
}
