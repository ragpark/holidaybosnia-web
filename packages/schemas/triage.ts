import { z } from 'zod';
import { IdSchema } from './common';

export const PrioritySchema = z.enum(['High', 'Medium', 'Low']);

export const TriageResultSchema = z.object({
  triageId: IdSchema.optional(),
  priority: PrioritySchema,
  priorityReason: z.string(),
  tripType: z.string(),
  duration: z.string(),
  groupSize: z.string(),
  budget: z.string(),
  dates: z.string(),
  halalRequired: z.boolean(),
  urgency: z.enum(['Book soon', 'Planning ahead', 'Exploratory']),
  summary: z.string(),
  recommendedPackage: z.string(),
  actions: z.array(z.string()).min(1),
  draftReply: z.string(),
});

export const TriageClassifyRequestSchema = z.object({
  inquiryId: IdSchema,
});

export const TriageRegenerateRequestSchema = z.object({
  style: z.enum(['warm', 'formal', 'concise']).default('warm'),
  length: z.enum(['short', 'medium', 'long']).default('medium'),
});

export const TriageRegenerateResponseSchema = z.object({
  inquiryId: IdSchema,
  draftReply: z.string(),
});

export const TriageSendReplyRequestSchema = z.object({
  inquiryId: IdSchema,
  draftReply: z.string().min(1),
});

export const TriageSendReplyResponseSchema = z.object({
  inquiryId: IdSchema,
  status: z.enum(['queued', 'sent']),
});
