import {
  Injectable,
  Inject,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { eq, and, ne, desc, like, or } from 'drizzle-orm';
import { DRIZZLE, type DrizzleDB } from '../database/database.module';
import { customers, Customer } from './schema/schema';
import {
  CreateCustomerDto,
  UpdateCustomerDto,
} from './dto/customer-manegement-dto';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class CustomerManagementService {
  constructor(
    @Inject(DRIZZLE) private readonly db: DrizzleDB,
    private readonly auditService: AuditService,
  ) {}

  async create(
    tenantId: string,
    dto: CreateCustomerDto,
    userId?: string,
  ): Promise<Customer> {
    const [existing] = await this.db
      .select()
      .from(customers)
      .where(and(eq(customers.tenantId, tenantId), eq(customers.cpf, dto.cpf)))
      .limit(1);

    if (existing) {
      throw new ConflictException(
        'Já existe um cliente cadastrado com este CPF nesta empresa',
      );
    }

    await this.db.insert(customers).values({
      ...dto,
      tenantId,
    });

    const [created] = await this.db
      .select()
      .from(customers)
      .where(and(eq(customers.tenantId, tenantId), eq(customers.cpf, dto.cpf)))
      .limit(1);

    await this.auditService.log({
      tenantId,
      userId: userId ?? null,
      action: 'CUSTOMER_CREATE',
      resource: 'customer',
      resourceId: created.id,
      details: {
        name: created.name,
        cpf: created.cpf,
        email: created.email,
        city: created.city,
        state: created.state,
      },
    });

    return created;
  }

  async findAll(tenantId: string, search?: string): Promise<Customer[]> {
    const searchFilter = search?.trim()
      ? or(
          like(customers.name, `%${search.trim()}%`),
          like(customers.cpf, `%${search.trim()}%`),
          like(customers.email, `%${search.trim()}%`),
        )
      : undefined;

    const whereClause = searchFilter
      ? and(eq(customers.tenantId, tenantId), searchFilter)
      : eq(customers.tenantId, tenantId);

    return this.db
      .select()
      .from(customers)
      .where(whereClause)
      .orderBy(desc(customers.createdAt));
  }

  async findById(tenantId: string, id: string): Promise<Customer> {
    const [customer] = await this.db
      .select()
      .from(customers)
      .where(and(eq(customers.id, id), eq(customers.tenantId, tenantId)))
      .limit(1);

    if (!customer) {
      throw new NotFoundException('Cliente não encontrado nesta empresa');
    }

    return customer;
  }

  async update(
    tenantId: string,
    id: string,
    dto: UpdateCustomerDto,
    userId?: string,
  ): Promise<Customer> {
    const current = await this.findById(tenantId, id);

    const diff: Record<string, { from: any; to: any }> = {};
    const fields = [
      'name',
      'email',
      'cpf',
      'phone',
      'zipCode',
      'street',
      'number',
      'complement',
      'city',
      'state',
    ] as const;
    for (const field of fields) {
      if (dto[field] !== undefined && dto[field] !== current[field]) {
        diff[field] = { from: current[field], to: dto[field] };
      }
    }

    if (Object.keys(diff).length === 0) {
      return current;
    }

    if (dto.cpf && dto.cpf !== current.cpf) {
      const [conflict] = await this.db
        .select()
        .from(customers)
        .where(
          and(
            eq(customers.tenantId, tenantId),
            eq(customers.cpf, dto.cpf),
            ne(customers.id, id),
          ),
        )
        .limit(1);

      if (conflict) {
        throw new ConflictException(
          'Já existe outro cliente cadastrado com este CPF nesta empresa',
        );
      }
    }

    await this.db
      .update(customers)
      .set(dto)
      .where(and(eq(customers.id, id), eq(customers.tenantId, tenantId)));

    const updated = await this.findById(tenantId, id);

    await this.auditService.log({
      tenantId,
      userId: userId ?? null,
      action: 'CUSTOMER_UPDATE',
      resource: 'customer',
      resourceId: id,
      details: {
        customerName: updated.name,
        diff,
      },
    });

    return updated;
  }

  async remove(
    tenantId: string,
    id: string,
    userId?: string,
  ): Promise<{ message: string }> {
    const current = await this.findById(tenantId, id);

    await this.db
      .delete(customers)
      .where(and(eq(customers.id, id), eq(customers.tenantId, tenantId)));

    await this.auditService.log({
      tenantId,
      userId: userId ?? null,
      action: 'CUSTOMER_DELETE',
      resource: 'customer',
      resourceId: id,
      details: {
        customerName: current.name,
        cpf: current.cpf,
      },
    });

    return { message: 'Cliente removido com sucesso' };
  }

  // Importa clientes em lote a partir de arquivo CSV
  async importCsv(
    tenantId: string,
    fileBuffer: Buffer,
    userId?: string,
    originalFilename?: string,
  ): Promise<{
    totalProcessed: number;
    totalImported: number;
    errors: { row: number; error: string }[];
  }> {
    const rawContent = fileBuffer.toString('utf-8').replace(/^\uFEFF/, '');
    const lines = rawContent
      .split(/\r\n|\n|\r/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

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
      };
    }

    // Detecta separador com base na primeira linha
    const headerLine = lines[0];
    const semicolonCount = (headerLine.match(/;/g) || []).length;
    const commaCount = (headerLine.match(/,/g) || []).length;
    const delimiter = semicolonCount >= commaCount ? ';' : ',';

    // Parser simples de linha CSV respeitando aspas
    const parseCsvLine = (line: string, delim: string): string[] => {
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
    };

    const rawHeaders = parseCsvLine(headerLine, delimiter).map((h) =>
      h.toLowerCase().trim(),
    );

    // Mapeamento de colunas suportadas (pt e en)
    const headerMap: Record<string, string> = {};
    rawHeaders.forEach((header, index) => {
      if (header === 'nome' || header === 'name')
        headerMap.name = String(index);
      else if (header === 'cpf') headerMap.cpf = String(index);
      else if (header === 'email' || header === 'e-mail')
        headerMap.email = String(index);
      else if (
        header === 'telefone' ||
        header === 'phone' ||
        header === 'celular' ||
        header === 'tel'
      )
        headerMap.phone = String(index);
      else if (
        header === 'cep' ||
        header === 'zipcode' ||
        header === 'zip_code'
      )
        headerMap.zipCode = String(index);
      else if (
        header === 'rua' ||
        header === 'street' ||
        header === 'logradouro' ||
        header === 'endereco'
      )
        headerMap.street = String(index);
      else if (header === 'numero' || header === 'number' || header === 'nro')
        headerMap.number = String(index);
      else if (header === 'complemento' || header === 'complement')
        headerMap.complement = String(index);
      else if (
        header === 'cidade' ||
        header === 'city' ||
        header === 'municipio'
      )
        headerMap.city = String(index);
      else if (header === 'estado' || header === 'state' || header === 'uf')
        headerMap.state = String(index);
    });

    if (!headerMap.name || !headerMap.cpf) {
      return {
        totalProcessed: 0,
        totalImported: 0,
        errors: [
          {
            row: 1,
            error:
              'Cabeçalho CSV inválido. As colunas "nome" (ou "name") e "cpf" são obrigatórias.',
          },
        ],
      };
    }

    // Busca CPFs existentes no tenant para validação rápida de duplicidade
    const existingRecords = await this.db
      .select({ cpf: customers.cpf })
      .from(customers)
      .where(eq(customers.tenantId, tenantId));

    const existingCpfs = new Set(
      existingRecords.map((r) => r.cpf.replace(/\D/g, '')),
    );
    const seenCpfsInFile = new Set<string>();

    const toInsert: Array<{
      tenantId: string;
      name: string;
      cpf: string;
      email: string | null;
      phone: string | null;
      zipCode: string | null;
      street: string | null;
      number: string | null;
      complement: string | null;
      city: string | null;
      state: string | null;
    }> = [];

    const dataLines = lines.slice(1);
    const totalProcessed = dataLines.length;

    for (let i = 0; i < dataLines.length; i++) {
      const rowNumber = i + 2;
      const line = dataLines[i];
      const cols = parseCsvLine(line, delimiter);

      const getCol = (key: string): string => {
        const idx = headerMap[key];
        return idx !== undefined && cols[Number(idx)] !== undefined
          ? cols[Number(idx)].trim()
          : '';
      };

      const name = getCol('name');
      const rawCpf = getCol('cpf');
      const cleanCpf = rawCpf.replace(/\D/g, '');
      const email = getCol('email');
      const phone = getCol('phone').replace(/\D/g, '');
      const zipCode = getCol('zipCode').replace(/\D/g, '');
      const street = getCol('street');
      const number = getCol('number');
      const complement = getCol('complement');
      const city = getCol('city');
      const state = getCol('state');

      if (!name || name.length < 2) {
        errors.push({
          row: rowNumber,
          error:
            'Nome do cliente é obrigatório e deve ter no mínimo 2 caracteres',
        });
        continue;
      }

      if (cleanCpf.length !== 11) {
        errors.push({
          row: rowNumber,
          error: `CPF inválido ("${rawCpf}"). Deve conter 11 dígitos numéricos`,
        });
        continue;
      }

      if (existingCpfs.has(cleanCpf)) {
        errors.push({
          row: rowNumber,
          error: `CPF ${cleanCpf} já cadastrado nesta empresa`,
        });
        continue;
      }

      if (seenCpfsInFile.has(cleanCpf)) {
        errors.push({
          row: rowNumber,
          error: `CPF ${cleanCpf} duplicado no próprio arquivo CSV`,
        });
        continue;
      }

      seenCpfsInFile.add(cleanCpf);

      toInsert.push({
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

    if (toInsert.length > 0) {
      // Inserção em lotes para performance
      const batchSize = 100;
      for (let i = 0; i < toInsert.length; i += batchSize) {
        const batch = toInsert.slice(i, i + batchSize);
        await this.db.insert(customers).values(batch);
      }

      await this.auditService.log({
        tenantId,
        userId: userId ?? null,
        action: 'CUSTOMER_CREATE',
        resource: 'customer',
        resourceId: 'batch-import',
        details: {
          importedCount: toInsert.length,
          totalProcessed,
          fileName: originalFilename || 'clientes.csv',
        },
      });
    }

    return {
      totalProcessed,
      totalImported: toInsert.length,
      errors,
    };
  }
}
