import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
import { AUDIT_ACTIONS, type AuditAction } from '../schemas/schema';

export interface CreateAuditLogDto {
  tenantId?: string | null;
  userId?: string | null;
  action: AuditAction;
  resource: string;
  resourceId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  details?: Record<string, any> | null;
}

export const auditFilterSchema = z.object({
  action: z.enum(AUDIT_ACTIONS).optional(),
  resource: z.string().trim().optional(),
  userId: z.string().uuid().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export class AuditFilterDto extends createZodDto(auditFilterSchema) {}
