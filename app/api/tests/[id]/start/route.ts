import { NextRequest, NextResponse } from 'next/server';
import type { TestAttempt } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/auth';
import { handleApiError, jsonError } from '@/lib/api-response';
import {
  attemptEndsAt,
  cleanAnswers,
  expireIfNeeded,
  readAnswers,
  readOptions,
  testWindowStatus
} from '@/lib/tests';

interface Params {
  params: { id: string };
}

/**
 * POST /api/tests/[id]/start
 * Starts a new attempt, or resumes the student's unfinished one. The response
 * never includes the correct answers.
 */
export async function POST(req: NextRequest, { params }: Params) {
  try {
    const user = await requireUser(req);

    const test = await prisma.test.findUnique({
      where: { id: params.id },
      include: {
        questions: { orderBy: { order: 'asc' } },
        assignments: { where: { userId: user.id }, select: { id: true } }
      }
    });
    if (!test || !test.published || test.questions.length === 0) return jsonError('Test not found.', 404);

    // Assigned tests can only be opened by the students the admin picked.
    if (test.audience === 'ASSIGNED' && test.assignments.length === 0) {
      return jsonError('This test has not been assigned to you.', 403);
    }

    const existing = await prisma.testAttempt.findMany({
      where: { userId: user.id, testId: test.id },
      orderBy: { startedAt: 'desc' }
    });

    let inProgress: TestAttempt | null = null;
    let submittedCount = 0;
    for (const a of existing) {
      const fresh = await expireIfNeeded(a, test.durationMins);
      if (fresh.submittedAt) submittedCount++;
      else if (!inProgress) inProgress = fresh;
    }

    let attempt = inProgress;
    if (!attempt) {
      const status = testWindowStatus(test);
      if (status === 'upcoming') return jsonError('This test has not opened yet.', 403);
      if (status === 'closed') return jsonError('This test is closed.', 403);
      if (submittedCount >= test.maxAttempts) {
        return jsonError('You have used all your attempts for this test.', 403);
      }
      const isNewParticipant = existing.length === 0;
      attempt = await prisma.testAttempt.create({ data: { testId: test.id, userId: user.id } });

      // Capped public test: keep only the first N students, ranked by when they first started.
      // Checked after creating the attempt so two students starting at the same moment can't
      // both squeeze into the last place.
      if (isNewParticipant && test.audience === 'PUBLIC' && test.maxParticipants !== null) {
        const firstN = await prisma.testAttempt.groupBy({
          by: ['userId'],
          where: { testId: test.id },
          _min: { startedAt: true },
          orderBy: { _min: { startedAt: 'asc' } },
          take: test.maxParticipants
        });
        if (!firstN.some((g) => g.userId === user.id)) {
          await prisma.testAttempt.delete({ where: { id: attempt.id } });
          return jsonError('This test is full. All places have been taken.', 403);
        }
      }
    }

    return NextResponse.json({
      attempt: {
        id: attempt.id,
        startedAt: attempt.startedAt,
        endsAt: attemptEndsAt(attempt.startedAt, test.durationMins)
      },
      serverNow: new Date(),
      test: { id: test.id, title: test.title, durationMins: test.durationMins },
      questions: test.questions.map((q) => ({
        id: q.id,
        topic: q.topic,
        text: q.text,
        options: readOptions(q.options)
      })),
      answers: cleanAnswers(test.questions, readAnswers(attempt.answers))
    });
  } catch (err) {
    return handleApiError(err);
  }
}
