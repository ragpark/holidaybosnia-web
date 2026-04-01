import { NextResponse } from 'next/server';
import { PricingRunRequestSchema } from '../../../../../packages/schemas/pricing';

export async function POST(req: Request) {
  const json = await req.json();
  const parsed = PricingRunRequestSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json({ error: { code: 'VALIDATION_ERROR', message: parsed.error.message } }, { status: 400 });
  }

  return NextResponse.json({ runId: crypto.randomUUID(), status: 'queued' });
}
