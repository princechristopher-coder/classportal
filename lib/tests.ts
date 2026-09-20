import type { TestAttempt } from '@prisma/client';
import { prisma } from './prisma';

/** How long after the deadline we still accept a final submit (slow networks). */
export const SUBMIT_GRACE_MS = 30_000;
export const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];

export type AnswerMap = Record<string, number>;

export function readOptions(value: unknown): string[] {
  return Array.isArray(value) ? value.map((v) => String(v)) : [];
}

export function readAnswers(value: unknown): AnswerMap {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  const out: AnswerMap = {};
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    if (typeof v === 'number' && Number.isInteger(v) && v >= 0) out[k] = v;
  }
  return out;
}

/** Keeps only answers for real questions with a valid option index. */
export function cleanAnswers(questions: { id: string; options: unknown }[], raw: AnswerMap): AnswerMap {
  const out: AnswerMap = {};
  for (const q of questions) {
    const v = raw[q.id];
    if (v !== undefined && v < readOptions(q.options).length) out[q.id] = v;
  }
  return out;
}

export function attemptEndsAt(startedAt: Date, durationMins: number): Date {
  return new Date(startedAt.getTime() + durationMins * 60_000);
}

export function testWindowStatus(
  test: { opensAt: Date | null; closesAt: Date | null },
  now: Date = new Date()
): 'upcoming' | 'open' | 'closed' {
  if (test.opensAt && now < test.opensAt) return 'upcoming';
  if (test.closesAt && now > test.closesAt) return 'closed';
  return 'open';
}

/**
 * Grades and locks an attempt. Safe to call more than once: only the first call
 * writes (updateMany is guarded by submittedAt: null), later calls just return the record.
 */
export async function finalizeAttempt(
  attemptId: string,
  opts: { answers?: AnswerMap; timedOut?: boolean } = {}
): Promise<TestAttempt | null> {
  const attempt = await prisma.testAttempt.findUnique({
    where: { id: attemptId },
    include: { test: { include: { questions: { orderBy: { order: 'asc' } } } } }
  });
  if (!attempt) return null;
  if (attempt.submittedAt) return attempt;

  const questions = attempt.test.questions;
  const merged = cleanAnswers(questions, { ...readAnswers(attempt.answers), ...(opts.answers ?? {}) });
  let score = 0;
  for (const q of questions) {
    if (merged[q.id] === q.correctIndex) score++;
  }

  await prisma.testAttempt.updateMany({
    where: { id: attemptId, submittedAt: null },
    data: {
      submittedAt: new Date(),
      score,
      total: questions.length,
      answers: merged,
      timedOut: !!opts.timedOut
    }
  });

  return prisma.testAttempt.findUnique({ where: { id: attemptId } });
}

/** If an unsubmitted attempt is past its deadline, submit it with whatever was auto-saved. */
export async function expireIfNeeded(attempt: TestAttempt, durationMins: number): Promise<TestAttempt> {
  if (attempt.submittedAt) return attempt;
  const deadline = attemptEndsAt(attempt.startedAt, durationMins).getTime() + SUBMIT_GRACE_MS;
  if (Date.now() > deadline) {
    const done = await finalizeAttempt(attempt.id, { timedOut: true });
    return done ?? attempt;
  }
  return attempt;
}

export interface StudentTestSummary {
  id: string;
  title: string;
  description: string | null;
  durationMins: number;
  maxAttempts: number;
  passMark: number;
  showReview: boolean;
  opensAt: Date | null;
  closesAt: Date | null;
  questionCount: number;
  status: 'upcoming' | 'open' | 'closed';
  inProgressAttemptId: string | null;
  attempts: { id: string; score: number; total: number; submittedAt: Date; timedOut: boolean }[];
  attemptsLeft: number;
  canStart: boolean;
}

/** Published tests (with at least one question) plus this student's attempt history. */
export async function studentTestSummaries(userId: string, onlyIds?: string[]): Promise<StudentTestSummary[]> {
  const tests = await prisma.test.findMany({
    where: { published: true, ...(onlyIds ? { id: { in: onlyIds } } : {}) },
    include: { _count: { select: { questions: true } } },
    orderBy: { createdAt: 'desc' }
  });
  const visible = tests.filter((t) => t._count.questions > 0);
  if (visible.length === 0) return [];

  const attempts = await prisma.testAttempt.findMany({
    where: { userId, testId: { in: visible.map((t) => t.id) } },
    orderBy: { startedAt: 'desc' }
  });

  const durationById = new Map(visible.map((t) => [t.id, t.durationMins]));
  const byTest = new Map<string, TestAttempt[]>();
  for (const raw of attempts) {
    const a = await expireIfNeeded(raw, durationById.get(raw.testId) ?? 0);
    byTest.set(a.testId, [...(byTest.get(a.testId) ?? []), a]);
  }

  return visible.map((t) => {
    const mine = byTest.get(t.id) ?? [];
    const submitted = mine.filter((a) => a.submittedAt);
    const inProgress = mine.find((a) => !a.submittedAt) ?? null;
    const status = testWindowStatus(t);
    const attemptsLeft = Math.max(0, t.maxAttempts - submitted.length);
    return {
      id: t.id,
      title: t.title,
      description: t.description,
      durationMins: t.durationMins,
      maxAttempts: t.maxAttempts,
      passMark: t.passMark,
      showReview: t.showReview,
      opensAt: t.opensAt,
      closesAt: t.closesAt,
      questionCount: t._count.questions,
      status,
      inProgressAttemptId: inProgress?.id ?? null,
      attempts: submitted.map((a) => ({
        id: a.id,
        score: a.score ?? 0,
        total: a.total ?? 0,
        submittedAt: a.submittedAt as Date,
        timedOut: a.timedOut
      })),
      attemptsLeft,
      canStart: !!inProgress || (status === 'open' && attemptsLeft > 0)
    };
  });
}
