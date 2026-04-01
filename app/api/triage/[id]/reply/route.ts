import { NextResponse } from 'next/server';
import { TriageSendReplyRequestSchema } from '../../../../../../packages/schemas/triage';

type Ctx = { params: { id: string } };

export async function POST(req: Request, ctx: Ctx) {
  const json = await req.json();
  const parsed = TriageSendReplyRequestSchema.safeParse({ ...json, inquiryId: ctx.params.id });

  if (!parsed.success) {
    return NextResponse.json({ error: { code: 'VALIDATION_ERROR', message: parsed.error.message } }, { status: 400 });
  }

  return NextResponse.json({ inquiryId: ctx.params.id, status: 'queued' });
}
