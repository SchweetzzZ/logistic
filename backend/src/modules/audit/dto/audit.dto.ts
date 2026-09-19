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

export const auditLogItemSchema = z.object({
  id: z.string(),
  tenantId: z.string().nullable().optional(),
  userId: z.string().nullable().optional(),
  userName: z.string().nullable().optional(),
  userEmail: z.string().nullable().optional(),
  action: z.enum(AUDIT_ACTIONS),
  resource: z.string(),
  resourceId: z.string().nullable().optional(),
  ipAddress: z.string().nullable().optional(),
  userAgent: z.string().nullable().optional(),
  details: z.record(z.string(), z.any()).nullable().optional(),
  createdAt: z.string(),
});

export const auditLogPaginatedResponseSchema = z.object({
  data: z.array(auditLogItemSchema),
  total: z.number(),
  page: z.number(),
  limit: z.number(),
  totalPages: z.number(),
});

export class AuditLogPaginatedResponseDto extends createZodDto(
  auditLogPaginatedResponseSchema,
) {}

export const auditLogDetailResponseSchema = z.object({
  id: z.string(),
  tenantId: z.string().nullable().optional(),
  userId: z.string().nullable().optional(),
  action: z.enum(AUDIT_ACTIONS),
  resource: z.string(),
  resourceId: z.string().nullable().optional(),
  ipAddress: z.string().nullable().optional(),
  userAgent: z.string().nullable().optional(),
  details: z.record(z.string(), z.any()).nullable().optional(),
  createdAt: z.string(),
});

export class AuditLogDetailResponseDto extends createZodDto(
  auditLogDetailResponseSchema,
) {}
