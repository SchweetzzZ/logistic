import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const createCustomerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'O nome deve ter no mínimo 2 caracteres')
    .max(150, 'O nome deve ter no máximo 150 caracteres'),
  cpf: z
    .string()
    .trim()
    .min(11, 'O CPF deve ter no mínimo 11 caracteres')
    .max(14, 'O CPF deve ter no máximo 14 caracteres')
    .regex(/^[0-9.-]+$/, 'CPF com formato inválido'),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email('E-mail em formato inválido')
    .max(100, 'O e-mail deve ter no máximo 100 caracteres')
    .optional()
    .nullable(),
  phone: z
    .string()
    .trim()
    .max(20, 'O telefone deve ter no máximo 20 caracteres')
    .optional()
    .nullable(),
  zipCode: z
    .string()
    .trim()
    .max(9, 'O CEP deve ter no máximo 9 caracteres')
    .optional()
    .nullable(),
  street: z
    .string()
    .trim()
    .max(150, 'O logradouro deve ter no máximo 150 caracteres')
    .optional()
    .nullable(),
  number: z
    .string()
    .trim()
    .max(20, 'O número deve ter no máximo 20 caracteres')
    .optional()
    .nullable(),
  complement: z
    .string()
    .trim()
    .max(100, 'O complemento deve ter no máximo 100 caracteres')
    .optional()
    .nullable(),
  city: z
    .string()
    .trim()
    .max(100, 'A cidade deve ter no máximo 100 caracteres')
    .optional()
    .nullable(),
  state: z
    .string()
    .trim()
    .max(20, 'O estado deve ter no máximo 20 caracteres')
    .optional()
    .nullable(),
});

export class CreateCustomerDto extends createZodDto(createCustomerSchema) {}

export const updateCustomerSchema = createCustomerSchema.partial();

export class UpdateCustomerDto extends createZodDto(updateCustomerSchema) {}

export const customerResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().nullable().optional(),
  cpf: z.string(),
  phone: z.string().nullable().optional(),
  zipCode: z.string().nullable().optional(),
  street: z.string().nullable().optional(),
  number: z.string().nullable().optional(),
  complement: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  state: z.string().nullable().optional(),
  tenantId: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export class CustomerResponseDto extends createZodDto(customerResponseSchema) {}

export const messageResponseSchema = z.object({
  message: z.string(),
});

export class MessageResponseDto extends createZodDto(messageResponseSchema) {}

export const customerImportErrorSchema = z.object({
  row: z.number(),
  error: z.string(),
});

export const customerImportResponseSchema = z.object({
  totalProcessed: z.number(),
  totalImported: z.number(),
  errors: z.array(customerImportErrorSchema),
});

export class CustomerImportResponseDto extends createZodDto(
  customerImportResponseSchema,
) {}
