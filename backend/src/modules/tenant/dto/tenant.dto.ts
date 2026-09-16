import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const CreateTenantSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'O nome da empresa deve ter no mínimo 2 caracteres')
    .max(150, 'O nome da empresa deve ter no máximo 150 caracteres'),
  document: z
    .string()
    .trim()
    .min(8, 'O documento deve ter no mínimo 8 caracteres')
    .max(20, 'O documento deve ter no máximo 20 caracteres')
    .regex(/^[a-zA-Z0-9.-/]+$/, 'Documento com formato inválido'),
});

export class CreateTenantDto extends createZodDto(CreateTenantSchema) {}

export const UpdateTenantSchema = CreateTenantSchema.partial().extend({
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED']).optional(),
});

export class UpdateTenantDto extends createZodDto(UpdateTenantSchema) {}

export const TenantResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  document: z.string(),
  status: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export class TenantResponseDto extends createZodDto(TenantResponseSchema) {}
