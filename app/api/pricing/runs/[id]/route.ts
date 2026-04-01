import { NextResponse } from 'next/server';

type Ctx = { params: { id: string } };

export async function GET(_req: Request, ctx: Ctx) {
  return NextResponse.json({
    runId: ctx.params.id,
    status: 'running',
    progress: 42,
  });
}
