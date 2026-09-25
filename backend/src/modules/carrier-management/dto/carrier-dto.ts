import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

export const createCarrierSchema = z.object({
  name: z.string().trim().min(2, 'O nome deve ter no mínimo 2 caracteres').max(150),
  document: z.string().trim().min(11, 'Documento inválido').max(20, 'Documento inválido'),
  email: z.string().trim().email('E-mail inválido').optional().nullable(),
  phone: z.string().trim().max(20).optional().nullable(),
  basePrice: z.number().min(0, 'Taxa base deve ser maior ou igual a zero').optional().default(0),
  pricePerKg: z.number().min(0, 'Preço por kg deve ser maior ou igual a zero').optional().default(0),
  deadlineDays: z.number().int().min(1, 'Prazo deve ser de no mínimo 1 dia').optional().default(3),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional().default('ACTIVE'),
});

export class CreateCarrierDto extends createZodDto(createCarrierSchema) { }

export const updateCarrierSchema = createCarrierSchema.partial();

export class UpdateCarrierDto extends createZodDto(updateCarrierSchema) { }

export const carrierResponseSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  name: z.string(),
  document: z.string(),
  email: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  basePrice: z.string(),
  pricePerKg: z.string(),
  deadlineDays: z.number(),
  status: z.enum(['ACTIVE', 'INACTIVE']),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export class CarrierResponseDto extends createZodDto(carrierResponseSchema) { }

export const carrierMessageResponseSchema = z.object({
  message: z.string(),
});

export class CarrierMessageResponseDto extends createZodDto(
  carrierMessageResponseSchema,
) { }

export const carrierImportErrorSchema = z.object({
  row: z.number(),
  error: z.string(),
});

export const carrierImportResponseSchema = z.object({
  totalProcessed: z.number(),
  totalImported: z.number(),
  errors: z.array(carrierImportErrorSchema),
});

export class CarrierImportResponseDto extends createZodDto(
  carrierImportResponseSchema,
) { }
