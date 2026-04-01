import { z } from 'zod';
import { EmailSchema, IdSchema } from './common';

export const PlannerChatRequestSchema = z.object({
  sessionId: IdSchema.optional(),
  message: z.string().min(1).max(4000),
  context: z
    .object({
      locale: z.string().default('en-GB'),
      source: z.enum(['web', 'ops']).default('web'),
    })
    .optional(),
});

export const PlannerChatResponseSchema = z.object({
  sessionId: IdSchema,
  assistantMessage: z.object({
    id: IdSchema,
    role: z.literal('assistant'),
    content: z.string(),
  }),
  usage: z
    .object({
      inputTokens: z.number().int().nonnegative().optional(),
      outputTokens: z.number().int().nonnegative().optional(),
    })
    .optional(),
});

export const PlannerHandoffRequestSchema = z.object({
  sessionId: IdSchema,
  guestName: z.string().min(1).max(120),
  guestEmail: EmailSchema,
  notes: z.string().max(3000).optional(),
});

export const PlannerHandoffResponseSchema = z.object({
  handoffId: IdSchema,
  itineraryText: z.string(),
  leadId: IdSchema,
  status: z.enum(['created', 'emailed', 'failed']),
  integrations: z
    .object({
      crm: z.enum(['webhook', 'none']),
      email: z.enum(['resend', 'none']),
    })
    .optional(),
});
