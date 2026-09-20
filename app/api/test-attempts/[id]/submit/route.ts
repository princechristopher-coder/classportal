import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/auth';
import { handleApiError, jsonError } from '@/lib/api-response';
import { SUBMIT_GRACE_MS, attemptEndsAt, finalizeAttempt } from '@/lib/tests';

interface Params {
  params: { id: string };
}

const submitSchema = z.object({
  answers: z.record(z.string(), z.number().int().min(0)).optional(),
  auto: z.boolean().optional()
});

/**
 * POST /api/test-attempts/[id]/submit
 * Grades on the server. Answers sent after the deadline (+ a short grace period)
 * are ignored; whatever was auto-saved before then is graded instead.
 */
export async function POST(req: NextRequest, { params }: Params) {
  try {
    const user = await requireUser(req);
    const body = submitSchema.parse(await req.json().catch(() => ({})));

    const attempt = await prisma.testAttempt.findUnique({
      where: { id: params.id },
      include: { test: { select: { durationMins: true } } }
    });
    if (!attempt || attempt.userId !== user.id) return jsonError('Attempt not found.', 404);

    if (attempt.submittedAt) {
      return NextResponse.json({ attemptId: attempt.id, score: attempt.score, total: attempt.total });
    }

    const deadline = attemptEndsAt(attempt.startedAt, attempt.test.durationMins).getTime() + SUBMIT_GRACE_MS;
    const late = Date.now() > deadline;

    const done = await finalizeAttempt(attempt.id, {
      answers: late ? undefined : body.answers,
      timedOut: late || body.auto === true
    });
    if (!done) return jsonError('Attempt not found.', 404);

    return NextResponse.json({ attemptId: done.id, score: done.score, total: done.total });
  } catch (err) {
    return handleApiError(err);
  }
}
