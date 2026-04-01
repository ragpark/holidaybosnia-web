import { NextResponse } from 'next/server';
import { PlannerHandoffRequestSchema } from '../../../../packages/schemas/planner';
import { generateHandoffSummary, pushToCRM, sendHandoffEmail } from '../../../../lib/planner';
import { prisma } from '../../../../lib/prisma';

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const parsed = PlannerHandoffRequestSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json({ error: { code: 'VALIDATION_ERROR', message: parsed.error.message } }, { status: 400 });
    }

    const session = await prisma.plannerSession.findUnique({
      where: { id: parsed.data.sessionId },
      include: { messages: { orderBy: { createdAt: 'asc' } } },
    });

    if (!session) {
      return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Planner session not found' } }, { status: 404 });
    }

    const conversation = session.messages
      .filter((m) => m.role === 'user' || m.role === 'assistant')
      .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }));

    const itineraryText = await generateHandoffSummary({
      guestName: parsed.data.guestName,
      notes: parsed.data.notes,
      conversation,
    });

    const handoff = await prisma.handoffRequest.create({
      data: {
        sessionId: session.id,
        guestName: parsed.data.guestName,
        guestEmail: parsed.data.guestEmail,
        notes: parsed.data.notes,
        itineraryText,
        status: 'created',
      },
    });

    const crmResult = await pushToCRM({
      handoffId: handoff.id,
      sessionId: session.id,
      guestName: parsed.data.guestName,
      guestEmail: parsed.data.guestEmail,
      notes: parsed.data.notes,
      itineraryText,
      createdAt: handoff.createdAt.toISOString(),
    });

    const mailResult = await sendHandoffEmail({
      to: parsed.data.guestEmail,
      name: parsed.data.guestName,
      itineraryText,
    });

    const status = mailResult.delivered ? 'emailed' : 'created';

    await prisma.handoffRequest.update({
      where: { id: handoff.id },
      data: { status },
    });

    await prisma.plannerSession.update({
      where: { id: session.id },
      data: { status: 'handed_off' },
    });

    return NextResponse.json({
      handoffId: handoff.id,
      leadId: handoff.id,
      itineraryText,
      status,
      integrations: {
        crm: crmResult.channel,
        email: mailResult.channel,
      },
    });
  } catch (error) {
    console.error('Planner handoff failed', error);
    return NextResponse.json(
      { error: { code: 'PLANNER_HANDOFF_ERROR', message: 'Unable to create handoff itinerary right now.' } },
      { status: 502 },
    );
  }
}
