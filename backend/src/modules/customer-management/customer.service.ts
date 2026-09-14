import { Injectable, Inject, ConflictException, NotFoundException, } from '@nestjs/common';
import { eq, and, ne, desc, like, or } from 'drizzle-orm';
import { DRIZZLE, type DrizzleDB } from '../database/database.module';
import { customers, Customer } from './schema/schema';
import { CreateCustomerDto, UpdateCustomerDto, } from './dto/customer-manegement-dto';

@Injectable()
export class CustomerManagementService {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) { }

  async create(tenantId: string, dto: CreateCustomerDto): Promise<Customer> {
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
  ): Promise<Customer> {
    const current = await this.findById(tenantId, id);

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

    return this.findById(tenantId, id);
  }

  async remove(tenantId: string, id: string): Promise<{ message: string }> {
    await this.findById(tenantId, id);

    await this.db
      .delete(customers)
      .where(and(eq(customers.id, id), eq(customers.tenantId, tenantId)));

    return { message: 'Cliente removido com sucesso' };
  }
}