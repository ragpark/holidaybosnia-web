import { NextResponse } from 'next/server';
import { TriageClassifyRequestSchema } from '../../../../packages/schemas/triage';

export async function POST(req: Request) {
  const json = await req.json();
  const parsed = TriageClassifyRequestSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json({ error: { code: 'VALIDATION_ERROR', message: parsed.error.message } }, { status: 400 });
  }

  return NextResponse.json({
    triageId: crypto.randomUUID(),
    priority: 'Medium',
    priorityReason: 'Stub classification pending model integration.',
    tripType: 'Mixed',
    duration: 'Unknown',
    groupSize: 'Unknown',
    budget: 'Unknown',
    dates: 'Flexible',
    halalRequired: false,
    urgency: 'Exploratory',
    summary: `Stub triage for inquiry ${parsed.data.inquiryId}.`,
    recommendedPackage: '7-Day Classic Tour',
    actions: ['Review inquiry', 'Generate quote options'],
    draftReply: 'Hi, thanks for your message. We would be happy to help plan your Bosnia trip.',
  });
}
