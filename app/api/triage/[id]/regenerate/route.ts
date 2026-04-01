import { NextResponse } from 'next/server';
import { TriageRegenerateRequestSchema } from '../../../../../../packages/schemas/triage';

type Ctx = { params: { id: string } };

export async function POST(req: Request, ctx: Ctx) {
  const json = await req.json();
  const parsed = TriageRegenerateRequestSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json({ error: { code: 'VALIDATION_ERROR', message: parsed.error.message } }, { status: 400 });
  }

  return NextResponse.json({
    inquiryId: ctx.params.id,
    draftReply: `Stub regenerated (${parsed.data.style}/${parsed.data.length}) reply for inquiry ${ctx.params.id}.`,
  });
}
