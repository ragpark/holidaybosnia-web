import { NextResponse } from 'next/server';
import { PlannerChatRequestSchema } from '../../../../packages/schemas/planner';

export async function POST(req: Request) {
  const json = await req.json();
  const parsed = PlannerChatRequestSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json({ error: { code: 'VALIDATION_ERROR', message: parsed.error.message } }, { status: 400 });
  }

  return NextResponse.json({
    sessionId: parsed.data.sessionId ?? crypto.randomUUID(),
    assistantMessage: {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: 'Stub response: planner chat endpoint wired. Implement LLM + persistence next.',
    },
  });
}
