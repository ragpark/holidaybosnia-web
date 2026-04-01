import { NextResponse } from 'next/server';
import { PlannerHandoffRequestSchema } from '../../../../packages/schemas/planner';

export async function POST(req: Request) {
  const json = await req.json();
  const parsed = PlannerHandoffRequestSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json({ error: { code: 'VALIDATION_ERROR', message: parsed.error.message } }, { status: 400 });
  }

  return NextResponse.json({
    handoffId: crypto.randomUUID(),
    leadId: crypto.randomUUID(),
    itineraryText: 'Stub itinerary text generated from planner conversation.',
    status: 'created',
  });
}
