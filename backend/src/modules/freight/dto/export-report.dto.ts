import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

export const exportFreightReportSchema = z.object({
  format: z.enum(['csv']).default('csv'),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  limit: z.coerce.number().int().positive().max(5000).default(1000).optional(),
});

export class ExportFreightReportDto extends createZodDto(
  exportFreightReportSchema,
) {}
