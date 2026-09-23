import { splitCsvLines, detectDelimiter, parseCsvLine, buildHeaderMap, getCol, } from '../common/csv/csv-parser.util';
import type { CsvImportResult } from '../common/csv/csv-import.types';
import type { NewCarrier } from './schemas/schema';

// Aliases aceitos para cada coluna de transportadora
const CARRIER_ALIASES = {
  name: ['nome', 'name', 'transportadora', 'razaosocial'],
  document: ['documento', 'document', 'cnpj', 'cpf', 'cnpjcpf'],
  email: ['email'],
  phone: ['telefone', 'phone', 'celular', 'tel'],
  basePrice: ['taxabase', 'baseprice', 'precobase', 'valorbase'],
  pricePerKg: ['precoporkg', 'priceperkg', 'valorporkg', 'precokg', 'kg'],
  deadlineDays: ['prazo', 'prazodias', 'deadlinedays', 'prazoemdias', 'dias'],
  status: ['status', 'situacao', 'ativo'],
};

export type CarrierImportRow = Omit<
  NewCarrier,
  'id' | 'createdAt' | 'updatedAt'
>;

export function parseCarriersCsv(buffer: Buffer, tenantId: string, existingDocs: Set<string>, existingNames: Set<string>,): CsvImportResult & { rows: CarrierImportRow[] } {
  const lines = splitCsvLines(buffer);
  const errors: { row: number; error: string }[] = [];

  if (lines.length < 2) {
    return {
      totalProcessed: 0,
      totalImported: 0,
      errors: [
        {
          row: 1,
          error:
            'O arquivo CSV precisa conter ao menos uma linha de cabeçalho e uma linha de dados',
        },
      ],
      rows: [],
    };
  }

  const delimiter = detectDelimiter(lines[0]);
  const headerMap = buildHeaderMap(
    parseCsvLine(lines[0], delimiter),
    CARRIER_ALIASES,
  );

  if (!headerMap.name || !headerMap.document) {
    return {
      totalProcessed: 0,
      totalImported: 0,
      errors: [
        {
          row: 1,
          error:
            'Cabeçalho CSV inválido. As colunas "nome" (ou "transportadora") e "cnpj" (ou "documento") são obrigatórias.',
        },
      ],
      rows: [],
    };
  }

  const dataLines = lines.slice(1);
  const seenDocsInFile = new Set<string>();
  const seenNamesInFile = new Set<string>();
  const rows: CarrierImportRow[] = [];

  for (let i = 0; i < dataLines.length; i++) {
    const rowNumber = i + 2;
    const cols = parseCsvLine(dataLines[i], delimiter);
    const get = (key: string) => getCol(cols, headerMap, key);

    const name = get('name');
    const rawDoc = get('document');
    const cleanDoc = rawDoc.replace(/\D/g, '');
    const email = get('email');
    const phone = get('phone').replace(/\D/g, '');
    const rawBasePrice = get('basePrice');
    const rawPricePerKg = get('pricePerKg');
    const rawDeadlineDays = get('deadlineDays');
    const rawStatus = get('status').toUpperCase();

    if (!name || name.length < 2) {
      errors.push({
        row: rowNumber,
        error:
          'Nome da transportadora é obrigatório e deve ter no mínimo 2 caracteres',
      });
      continue;
    }

    const normalizedName = name.toLowerCase().trim();
    if (existingNames.has(normalizedName)) {
      errors.push({
        row: rowNumber,
        error: `Transportadora "${name}" já cadastrada nesta empresa`,
      });
      continue;
    }

    if (seenNamesInFile.has(normalizedName)) {
      errors.push({
        row: rowNumber,
        error: `Transportadora "${name}" duplicada no próprio arquivo CSV`,
      });
      continue;
    }

    if (cleanDoc.length !== 14 && cleanDoc.length !== 11) {
      errors.push({
        row: rowNumber,
        error: `Documento/CNPJ inválido ("${rawDoc}"). Deve conter 14 dígitos (CNPJ) ou 11 dígitos (CPF)`,
      });
      continue;
    }

    if (existingDocs.has(cleanDoc)) {
      errors.push({
        row: rowNumber,
        error: `Documento/CNPJ ${cleanDoc} já cadastrado nesta empresa`,
      });
      continue;
    }

    if (seenDocsInFile.has(cleanDoc)) {
      errors.push({
        row: rowNumber,
        error: `Documento/CNPJ ${cleanDoc} duplicado no próprio arquivo CSV`,
      });
      continue;
    }

    seenNamesInFile.add(normalizedName);
    seenDocsInFile.add(cleanDoc);

    const parsedBasePrice = Math.max(
      0,
      parseFloat(rawBasePrice.replace(',', '.')) || 0,
    );
    const parsedPricePerKg = Math.max(
      0,
      parseFloat(rawPricePerKg.replace(',', '.')) || 0,
    );
    const parsedDeadline = Math.max(
      1,
      parseInt(rawDeadlineDays, 10) || 3,
    );

    const status: 'ACTIVE' | 'INACTIVE' =
      rawStatus === 'INACTIVE' || rawStatus === 'INATIVO'
        ? 'INACTIVE'
        : 'ACTIVE';

    let validEmail: string | null = null;
    if (email) {
      const emailLower = email.toLowerCase().trim();
      if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailLower)) {
        validEmail = emailLower.slice(0, 100);
      }
    }

    rows.push({
      tenantId,
      name: name.slice(0, 150),
      document: cleanDoc,
      email: validEmail,
      phone: phone ? phone.slice(0, 20) : null,
      basePrice: parsedBasePrice.toFixed(2),
      pricePerKg: parsedPricePerKg.toFixed(2),
      deadlineDays: parsedDeadline,
      status,
    });
  }

  return {
    totalProcessed: dataLines.length,
    totalImported: rows.length,
    errors,
    rows,
  };
}
