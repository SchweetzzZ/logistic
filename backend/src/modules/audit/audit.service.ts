import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { and, desc, eq, sql } from 'drizzle-orm';
import { DRIZZLE, type DrizzleDB } from '../database/database.constants';
import { auditLogsSchema, type AuditLog } from './schemas/schema';
import { users } from '../user/schemas/schema';
import type { CreateAuditLogDto, AuditFilterDto } from './dto/audit.dto';

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  /**
   * Registra uma ação de auditoria no sistema de forma segura (fail-safe).
   * Erros de gravação de auditoria são logados mas não interrompem o fluxo do usuário.
   */
  async log(entry: CreateAuditLogDto): Promise<void> {
    try {
      await this.db.insert(auditLogsSchema).values({
        tenantId: entry.tenantId ?? null,
        userId: entry.userId ?? null,
        action: entry.action,
        resource: entry.resource,
        resourceId: entry.resourceId ?? null,
        ipAddress: entry.ipAddress ?? null,
        userAgent: entry.userAgent ?? null,
        details: entry.details ?? null,
      });
    } catch (error: any) {
      this.logger.error(
        `Falha ao registrar auditoria para ação [${entry.action}] no recurso [${entry.resource}]: ${error?.message || error}`,
        error?.stack,
      );
    }
  }

  /**
   * Consulta os logs de auditoria do tenant com paginação e filtros.
   */
  async findAll(tenantId: string, filters: AuditFilterDto) {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const offset = (page - 1) * limit;

    const whereConditions = [eq(auditLogsSchema.tenantId, tenantId)];

    if (filters.action) {
      whereConditions.push(eq(auditLogsSchema.action, filters.action));
    }
    if (filters.resource) {
      whereConditions.push(eq(auditLogsSchema.resource, filters.resource));
    }
    if (filters.userId) {
      whereConditions.push(eq(auditLogsSchema.userId, filters.userId));
    }

    const whereClause = and(...whereConditions);

    const [totalResult] = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(auditLogsSchema)
      .where(whereClause);

    const total = Number(totalResult?.count || 0);

    const data = await this.db
      .select({
        id: auditLogsSchema.id,
        tenantId: auditLogsSchema.tenantId,
        userId: auditLogsSchema.userId,
        userName: users.name,
        userEmail: users.email,
        action: auditLogsSchema.action,
        resource: auditLogsSchema.resource,
        resourceId: auditLogsSchema.resourceId,
        ipAddress: auditLogsSchema.ipAddress,
        userAgent: auditLogsSchema.userAgent,
        details: auditLogsSchema.details,
        createdAt: auditLogsSchema.createdAt,
      })
      .from(auditLogsSchema)
      .leftJoin(users, eq(auditLogsSchema.userId, users.id))
      .where(whereClause)
      .orderBy(desc(auditLogsSchema.createdAt))
      .limit(limit)
      .offset(offset);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  /**
   * Busca um registro de auditoria específico por ID.
   */
  async findById(tenantId: string, id: string): Promise<AuditLog> {
    const [log] = await this.db
      .select()
      .from(auditLogsSchema)
      .where(and(eq(auditLogsSchema.tenantId, tenantId), eq(auditLogsSchema.id, id)))
      .limit(1);

    if (!log) {
      throw new NotFoundException('Registro de auditoria não encontrado');
    }

    return log;
  }
}
