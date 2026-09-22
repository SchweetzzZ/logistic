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
    .refine(
      (val) => val.length === 8,
      'O CEP de destino deve conter 8 dígitos',
    ),
  originZipCode: z
    .string()
    .trim()
    .transform((val) => val.replace(/\D/g, ''))
    .refine((val) => val.length === 8, 'O CEP de origem deve conter 8 dígitos')
    .optional(),
  weight: z.number().positive('O peso real deve ser maior que zero (em kg)'),
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

export const locationInfoSchema = z.object({
  zipCode: z.string(),
  city: z.string(),
  state: z.string(),
  isEstimated: z.boolean().optional(),
});

export const freightQuoteBreakdownSchema = z.object({
  basePrice: z.number(),
  pricePerKg: z.number(),
  chargedWeightKg: z.number(),
  weightCost: z.number(),
  distanceMultiplier: z.number(),
  shippingSubtotal: z.number(),
  insuranceCost: z.number(),
});

export const freightQuoteSchema = z.object({
  carrierId: z.string(),
  carrierName: z.string(),
  deadlineDays: z.number(),
  breakdown: freightQuoteBreakdownSchema,
  totalPrice: z.number(),
});

export const simulationPackageInfoSchema = z.object({
  actualWeightKg: z.number(),
  volumetricWeightKg: z.number(),
  chargedWeightKg: z.number(),
  declaredValue: z.number(),
  dimensions: packageDimensionsSchema,
});

export const simulationResultSchema = z.object({
  origin: locationInfoSchema,
  destination: locationInfoSchema,
  package: simulationPackageInfoSchema,
  deliveryType: z.enum(['LOCAL', 'STATE', 'INTERSTATE']),
  quotes: z.array(freightQuoteSchema),
});

export class SimulateFreightResponseDto extends createZodDto(
  simulationResultSchema,
) {}

export const freightHistoryItemSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  userId: z.string().nullable(),
  originZipCode: z.string(),
  destinationZipCode: z.string(),
  originCity: z.string().nullable(),
  originState: z.string().nullable(),
  destinationCity: z.string().nullable(),
  destinationState: z.string().nullable(),
  actualWeightKg: z.string(),
  volumetricWeightKg: z.string(),
  chargedWeightKg: z.string(),
  declaredValue: z.string(),
  dimensionsLength: z.string(),
  dimensionsWidth: z.string(),
  dimensionsHeight: z.string(),
  deliveryType: z.enum(['LOCAL', 'STATE', 'INTERSTATE']),
  cheapestCarrierId: z.string().nullable(),
  cheapestCarrierName: z.string().nullable(),
  cheapestPrice: z.string().nullable(),
  cheapestDeadlineDays: z.number().nullable(),
  quotes: z.array(freightQuoteSchema),
  createdAt: z.string(),
});

export const freightHistoryResponseSchema = z.object({
  data: z.array(freightHistoryItemSchema),
  total: z.number(),
  page: z.number(),
  limit: z.number(),
  totalPages: z.number(),
});

export class FreightHistoryResponseDto extends createZodDto(
  freightHistoryResponseSchema,
) {}
