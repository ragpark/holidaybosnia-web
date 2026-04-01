import { z } from 'zod';
import { IdSchema } from './common';

export const PricingRunRequestSchema = z.object({
  scope: z.enum(['all_tours', 'summer', 'winter']).default('all_tours'),
  forceRefresh: z.boolean().default(false),
});

export const PricingTourSchema = z.object({
  id: z.string(),
  occupancyPct: z.number().min(0).max(100),
  alertLevel: z.enum(['high', 'med', 'low', 'none']),
  alertLabel: z.string(),
  recommendedPrice: z.number(),
  priceAction: z.enum(['increase', 'maintain', 'reduce']),
  priceReason: z.string().optional(),
});

export const PricingAirlineSchema = z.object({
  airline: z.string(),
  route: z.string(),
  avgFare: z.string(),
  trend: z.enum(['up', 'down', 'flat']),
  status: z.string(),
});

export const PricingRecommendationSchema = z.object({
  type: z.enum(['price', 'alert', 'window', 'flight']),
  title: z.string(),
  body: z.string(),
  meta: z.string().optional(),
});

export const PricingReportSchema = z.object({
  summary: z.string(),
  tours: z.array(PricingTourSchema),
  airlines: z.array(PricingAirlineSchema),
  recommendations: z.array(PricingRecommendationSchema),
});

export const PricingRunResponseSchema = z.object({
  runId: IdSchema,
  status: z.enum(['queued', 'running', 'completed', 'failed']),
});

export const PricingRunStatusResponseSchema = z.object({
  runId: IdSchema,
  status: z.enum(['queued', 'running', 'completed', 'failed']),
  progress: z.number().min(0).max(100).optional(),
  result: PricingReportSchema.optional(),
});
