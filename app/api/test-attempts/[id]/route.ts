import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/auth';
import { handleApiError, jsonError } from '@/lib/api-response';
import {
  SUBMIT_GRACE_MS,
  attemptEndsAt,
  cleanAnswers,
  expireIfNeeded,
  finalizeAttempt,
  readAnswers,
  readOptions
} from '@/lib/tests';

interface Params {
  params: { id: string };
}

const loadAttempt = (id: string) =>
  prisma.testAttempt.findUnique({
    where: { id },
    include: {
      test: { include: { questions: { orderBy: { order: 'asc' } } } },
      user: { select: { fullName: true, email: true } }
    }
  });

/**
 * GET /api/test-attempts/[id]
 * Result of a finished attempt (owner or admin). Includes the answer review only
 * when the test allows it (admins always see it).
 */
export async function GET(req: NextRequest, { params }: Params) {
  try {
    const user = await requireUser(req);
    let attempt = await loadAttempt(params.id);
    if (!attempt || (attempt.userId !== user.id && user.role !== 'ADMIN')) {
      return jsonError('Result not found.', 404);
    }

    if (!attempt.submittedAt) {
      const fresh = await expireIfNeeded(attempt, attempt.test.durationMins);
      if (!fresh.submittedAt) return jsonError('This attempt is still in progress.', 409);
      attempt = await loadAttempt(params.id);
      if (!attempt) return jsonError('Result not found.', 404);
    }

    const { test } = attempt;
    const answers = readAnswers(attempt.answers);
    const score = attempt.score ?? 0;
    const total = attempt.total ?? test.questions.length;
    const percent = total > 0 ? Math.round((score / total) * 100) : 0;
    const canReview = test.showReview || user.role === 'ADMIN';

    return NextResponse.json({
      attempt: {
        id: attempt.id,
        score,
        total,
        percent,
        passed: percent >= test.passMark,
        startedAt: attempt.startedAt,
        submittedAt: attempt.submittedAt,
        timedOut: attempt.timedOut,
        student: user.role === 'ADMIN' ? attempt.user : undefined
      },
      test: { id: test.id, title: test.title, passMark: test.passMark, showReview: test.showReview },
      review: canReview
        ? test.questions.map((q) => ({
            id: q.id,
            topic: q.topic,
            text: q.text,
            options: readOptions(q.options),
            correctIndex: q.correctIndex,
            yourIndex: answers[q.id] ?? null,
            explanation: q.explanation
          }))
        : null
    });
  } catch (err) {
    return handleApiError(err);
  }
}

const saveSchema = z.object({ answers: z.record(z.string(), z.number().int().min(0)) });

/** PATCH /api/test-attempts/[id] — auto-save answers while the test is running. */
export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const user = await requireUser(req);
    const { answers } = saveSchema.parse(await req.json());

    const attempt = await loadAttempt(params.id);
    if (!attempt || attempt.userId !== user.id) return jsonError('Attempt not found.', 404);
    if (attempt.submittedAt) return jsonError('This attempt has already been submitted.', 409);

    const endsAt = attemptEndsAt(attempt.startedAt, attempt.test.durationMins);
    if (Date.now() > endsAt.getTime() + SUBMIT_GRACE_MS) {
      await finalizeAttempt(attempt.id, { timedOut: true });
      return jsonError('Time is up — your saved answers were submitted.', 409);
    }

    const merged = cleanAnswers(attempt.test.questions, { ...readAnswers(attempt.answers), ...answers });
    await prisma.testAttempt.update({ where: { id: attempt.id }, data: { answers: merged } });

    return NextResponse.json({ ok: true, endsAt });
  } catch (err) {
    return handleApiError(err);
  }
}
