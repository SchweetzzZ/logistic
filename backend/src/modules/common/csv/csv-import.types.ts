export type CsvImportResult = {
  totalProcessed: number;
  totalImported: number;
  errors: { row: number; error: string }[];
};

// Mapa de aliases: chave canônica -> lista de variações aceitas no cabeçalho CSV
export type CsvHeaderAliases = Record<string, string[]>;
