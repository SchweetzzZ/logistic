import { Injectable, Inject, ConflictException, NotFoundException, } from '@nestjs/common';
import { eq, and, ne } from 'drizzle-orm';
import { DRIZZLE, type DrizzleDB } from '../database/database.module';
import { tenants, Tenant } from './schemas/schema';
import { CreateTenantDto, UpdateTenantDto } from './dto/tenant.dto';

type TransactionClient = Parameters<Parameters<DrizzleDB['transaction']>[0]>[0];

@Injectable()
export class TenantService {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) { }

  async create(dto: CreateTenantDto, tx?: TransactionClient | DrizzleDB): Promise<Tenant> {
    const client = tx ?? this.db;
    const document = dto.document.trim();

    const [existing] = await client.select().from(tenants)
      .where(eq(tenants.document, document)).limit(1);

    if (existing) {
      throw new ConflictException(
        'Já existe uma empresa cadastrada com este documento',
      );
    }

    await client.insert(tenants).values({
      name: dto.name.trim(),
      document,
    });

    const [created] = await client.select().from(tenants)
      .where(eq(tenants.document, document))
      .limit(1);

    return created;
  }

  async findById(id: string): Promise<Tenant> {
    const [tenant] = await this.db.select().from(tenants).where(eq(tenants.id, id)).limit(1);

    if (!tenant) {
      throw new NotFoundException('Empresa não encontrada');
    }

    return tenant;
  }

  async findByDocument(document: string): Promise<Tenant | null> {
    const [tenant] = await this.db.select().from(tenants).where(eq(tenants.document, document.trim())).limit(1);

    return tenant || null;
  }

  async update(id: string, dto: UpdateTenantDto): Promise<Tenant> {
    if (dto.document) {
      const [existing] = await this.db.select().from(tenants).where(and(eq(tenants.document, dto.document.trim()), ne(tenants.id, id)),).limit(1);

      if (existing) {
        throw new ConflictException(
          'Já existe outra empresa cadastrada com este documento',
        );
      }
    }

    await this.db.update(tenants)
      .set({
        ...(dto.name ? { name: dto.name.trim() } : {}),
        ...(dto.document ? { document: dto.document.trim() } : {}),
        ...(dto.status ? { status: dto.status } : {}),
      })
      .where(eq(tenants.id, id));

    return this.findById(id);
  }
}
