import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

export const packageDimensionsSchema = z.object({
  length: z.number().positive('O comprimento deve ser maior que zero (cm)'),
  width: z.number().positive('A largura deve ser maior que zero (cm)'),
  height: z.number().positive('A altura deve ser maior que zero (cm)'),
});

export const simulateFreightSchema = z.object({
  destinationZipCode: z
    .string()
    .trim()
    .transform((val) => val.replace(/\D/g, ''))
    .refine((val) => val.length === 8, 'O CEP de destino deve conter 8 dígitos'),
  originZipCode: z
    .string()
    .trim()
    .transform((val) => val.replace(/\D/g, ''))
    .refine((val) => val.length === 8, 'O CEP de origem deve conter 8 dígitos')
    .optional(),
  weight: z
    .number()
    .positive('O peso real deve ser maior que zero (em kg)'),
  dimensions: packageDimensionsSchema,
  declaredValue: z
    .number()
    .min(0, 'O valor declarado da carga não pode ser negativo'),
  carrierId: z
    .string()
    .uuid('O ID da transportadora deve ser um UUID válido')
    .optional(),
});

export class SimulateFreightDto extends createZodDto(simulateFreightSchema) {}
