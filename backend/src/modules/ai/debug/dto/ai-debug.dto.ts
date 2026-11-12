import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const AskSchema = z.object({
    question: z.string().trim().min(1).max(2000),
    // Opcional: testar system prompts diferentes sem mudar código
    system: z.string().trim().max(4000).optional(),
});
export class AskDto extends createZodDto(AskSchema) { }

export const AskResponseSchema = z.object({
    answer: z.string(),
    model: z.string(),
    usage: z.object({ input: z.number(), output: z.number() }),
    latencyMs: z.number(),
});
export class AskResponseDto extends createZodDto(AskResponseSchema) { }

export const SimilaritySchema = z.object({
    query: z.string().trim().min(1).max(1000),
    texts: z.array(z.string().trim().min(1).max(2000)).min(2).max(20),
});
export class SimilarityDto extends createZodDto(SimilaritySchema) { }

export const SimilarityResponseSchema = z.object({
    model: z.string(),
    dimensions: z.number(),
    results: z.array(z.object({ text: z.string(), score: z.number() })),
});
export class SimilarityResponseDto extends createZodDto(
    SimilarityResponseSchema,
) { }