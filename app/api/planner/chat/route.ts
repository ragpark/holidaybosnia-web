import { NextResponse } from 'next/server';
import { PlannerChatRequestSchema } from '../../../../packages/schemas/planner';
import { generateAssistantReply, getOrCreateSession } from '../../../../lib/planner';
import { prisma } from '../../../../lib/prisma';

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const parsed = PlannerChatRequestSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json({ error: { code: 'VALIDATION_ERROR', message: parsed.error.message } }, { status: 400 });
    }

    const session = await getOrCreateSession(parsed.data.sessionId);

    await prisma.plannerMessage.create({
      data: {
        sessionId: session.id,
        role: 'user',
        content: parsed.data.message,
      },
    });

    const recent = await prisma.plannerMessage.findMany({
      where: { sessionId: session.id },
      orderBy: { createdAt: 'asc' },
      take: 20,
      select: { role: true, content: true },
    });

    const history = recent
      .filter((m) => m.role === 'user' || m.role === 'assistant')
      .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }));

    const reply = await generateAssistantReply(history);

    const assistantMessage = await prisma.plannerMessage.create({
      data: {
        sessionId: session.id,
        role: 'assistant',
        content: reply.content,
        provider: reply.provider,
        model: reply.model,
        inputTokens: reply.usage?.inputTokens,
        outputTokens: reply.usage?.outputTokens,
      },
    });

    return NextResponse.json({
      sessionId: session.id,
      assistantMessage: {
        id: assistantMessage.id,
        role: 'assistant',
        content: assistantMessage.content,
      },
      usage: reply.usage,
    });
  } catch (error) {
    console.error('Planner chat failed', error);
    return NextResponse.json(
      { error: { code: 'PLANNER_CHAT_ERROR', message: 'Unable to generate a planner response right now.' } },
      { status: 502 },
    );
  }
}
