import { z } from 'zod';

export const IdSchema = z.string().uuid();
export const EmailSchema = z.string().email();
export const ISODateSchema = z.string().datetime({ offset: true });

export const ApiErrorSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.unknown().optional(),
  }),
});

export type ApiError = z.infer<typeof ApiErrorSchema>;
