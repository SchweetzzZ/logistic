import { Injectable, Inject, ConflictException, NotFoundException, } from '@nestjs/common';
import { eq, and, ne } from 'drizzle-orm';
import { DRIZZLE, type DrizzleDB } from '../database/database.module';
import { tenants, Tenant } from './schemas/schema';
import { CreateTenantDto, UpdateTenantDto } from './dto/tenant.dto';

@Injectable()
export class TenantService {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) { }

  async create(dto: CreateTenantDto): Promise<Tenant> {
    const [existing] = await this.db
      .select()
      .from(tenants)
      .where(eq(tenants.document, dto.document))
      .limit(1);

    if (existing) {
      throw new ConflictException(
        'Já existe uma empresa cadastrada com este documento',
      );
    }

    await this.db.insert(tenants).values(dto);

    const [created] = await this.db
      .select()
      .from(tenants)
      .where(eq(tenants.document, dto.document))
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
    await this.findById(id);

    if (dto.document) {
      const [existing] = await this.db
        .select()
        .from(tenants)
        .where(
          and(
            eq(tenants.document, dto.document),
            ne(tenants.id, id),
          ),
        )
        .limit(1);

      if (existing) {
        throw new ConflictException(
          'Já existe outra empresa cadastrada com este documento',
        );
      }
    }

    await this.db
      .update(tenants)
      .set(dto)
      .where(eq(tenants.id, id));

    return this.findById(id);
  }
}
