import { splitCsvLines, detectDelimiter, parseCsvLine, buildHeaderMap, getCol, } from '../common/csv/csv-parser.util';
import type { CsvImportResult } from '../common/csv/csv-import.types';
import type { NewCustomer } from './schema/schema';

// Aliases aceitos para cada coluna de cliente (pt e en)
const CUSTOMER_ALIASES = {
  name: ['nome', 'name'],
  cpf: ['cpf'],
  email: ['email', 'e-mail'],
  phone: ['telefone', 'phone', 'celular', 'tel'],
  zipCode: ['cep', 'zipcode', 'zip_code'],
  street: ['rua', 'street', 'logradouro', 'endereco'],
  number: ['numero', 'number', 'nro'],
  complement: ['complemento', 'complement'],
  city: ['cidade', 'city', 'municipio'],
  state: ['estado', 'state', 'uf'],
};

export type CustomerImportRow = Omit<NewCustomer, 'id' | 'createdAt' | 'updatedAt'>;

export function parseCustomersCsv(buffer: Buffer, tenantId: string, existingCpfs: Set<string>,): CsvImportResult & { rows: CustomerImportRow[] } {
  const lines = splitCsvLines(buffer);
  const errors: { row: number; error: string }[] = [];

  if (lines.length < 2) {
    return {
      totalProcessed: 0,
      totalImported: 0,
      errors: [{ row: 1, error: 'O arquivo CSV precisa conter ao menos uma linha de cabeçalho e uma linha de dados' }],
      rows: [],
    };
  }

  const delimiter = detectDelimiter(lines[0]);
  const headerMap = buildHeaderMap(
    parseCsvLine(lines[0], delimiter),
    CUSTOMER_ALIASES,
  );

  if (!headerMap.name || !headerMap.cpf) {
    return {
      totalProcessed: 0,
      totalImported: 0,
      errors: [{ row: 1, error: 'Cabeçalho CSV inválido. As colunas "nome" (ou "name") e "cpf" são obrigatórias.' }],
      rows: [],
    };
  }

  const dataLines = lines.slice(1);
  const seenCpfsInFile = new Set<string>();
  const rows: CustomerImportRow[] = [];

  for (let i = 0; i < dataLines.length; i++) {
    const rowNumber = i + 2;
    const cols = parseCsvLine(dataLines[i], delimiter);
    const get = (key: string) => getCol(cols, headerMap, key);

    const name = get('name');
    const rawCpf = get('cpf');
    const cleanCpf = rawCpf.replace(/\D/g, '');
    const email = get('email');
    const phone = get('phone').replace(/\D/g, '');
    const zipCode = get('zipCode').replace(/\D/g, '');
    const street = get('street');
    const number = get('number');
    const complement = get('complement');
    const city = get('city');
    const state = get('state');

    if (!name || name.length < 2) {
      errors.push({ row: rowNumber, error: 'Nome do cliente é obrigatório e deve ter no mínimo 2 caracteres' });
      continue;
    }

    if (cleanCpf.length !== 11) {
      errors.push({ row: rowNumber, error: `CPF inválido ("${rawCpf}"). Deve conter 11 dígitos numéricos` });
      continue;
    }

    if (existingCpfs.has(cleanCpf)) {
      errors.push({ row: rowNumber, error: `CPF ${cleanCpf} já cadastrado nesta empresa` });
      continue;
    }

    if (seenCpfsInFile.has(cleanCpf)) {
      errors.push({ row: rowNumber, error: `CPF ${cleanCpf} duplicado no próprio arquivo CSV` });
      continue;
    }

    seenCpfsInFile.add(cleanCpf);

    rows.push({
      tenantId,
      name: name.slice(0, 150),
      cpf: cleanCpf,
      email: email ? email.toLowerCase().slice(0, 100) : null,
      phone: phone ? phone.slice(0, 20) : null,
      zipCode: zipCode ? zipCode.slice(0, 9) : null,
      street: street ? street.slice(0, 150) : null,
      number: number ? number.slice(0, 20) : null,
      complement: complement ? complement.slice(0, 100) : null,
      city: city ? city.slice(0, 100) : null,
      state: state ? state.toUpperCase().slice(0, 20) : null,
    });
  }

  return {
    totalProcessed: dataLines.length,
    totalImported: rows.length,
    errors,
    rows,
  };
}
