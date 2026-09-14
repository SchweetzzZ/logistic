import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
export const createCarrierSchema = z.object({
    name: z.string().trim().min(2, 'O nome deve ter no mínimo 2 caracteres').max(150),
    document: z.string().trim().min(11, 'Documento inválido').max(20, 'Documento inválido'), // CNPJ ou CPF
    email: z.string().trim().email('E-mail inválido').optional().nullable(),
    phone: z.string().trim().max(20).optional().nullable(),
    basePrice: z.number().min(0, 'Taxa base deve ser maior ou igual a zero').default(0),
    pricePerKg: z.number().min(0, 'Preço por kg deve ser maior ou igual a zero').default(0),
    deadlineDays: z.number().int().min(1, 'Prazo deve ser de no mínimo 1 dia').default(3),
});
export class CreateCarrierDto extends createZodDto(createCarrierSchema) { }
export const updateCarrierSchema = createCarrierSchema.partial();
export class UpdateCarrierDto extends createZodDto(updateCarrierSchema) { }