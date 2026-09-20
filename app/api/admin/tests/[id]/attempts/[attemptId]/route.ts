import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import { handleApiError, jsonError } from '@/lib/api-response';

interface Params {
  params: { id: string; attemptId: string };
}

/** DELETE — removes one attempt, which gives that student the attempt back (a "reset"). */
export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    await requireAdmin(req);
    const existing = await prisma.testAttempt.findFirst({
      where: { id: params.attemptId, testId: params.id }
    });
    if (!existing) return jsonError('Attempt not found.', 404);

    await prisma.testAttempt.delete({ where: { id: params.attemptId } });
    return NextResponse.json({ success: true });
  } catch (err) {
    return handleApiError(err);
  }
}
