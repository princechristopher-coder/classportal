import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/auth';
import { progressUpdateSchema } from '@/lib/validation';
import { handleApiError, jsonError } from '@/lib/api-response';

interface Params {
  params: { lessonId: string };
}

/**
 * GET /api/lessons/[lessonId]/progress
 * Restores the authenticated user's saved position for a lesson.
 * Returns zeroed values (not a 404) when no progress row exists yet —
 * a brand-new lesson simply hasn't been watched, that's not an error.
 *
 * NOTE: the dynamic segment folder MUST be named exactly `[lessonId]`
 * (matching `params.lessonId` below). A mismatched casing/name here is
 * what previously caused "Argument lessonId is missing" from Prisma.
 */
export async function GET(req: NextRequest, { params }: Params) {
  try {
    const user = await requireUser(req);
    const { lessonId } = params;

    if (!lessonId) {
      return jsonError('Lesson id is missing from the request.', 400);
    }

    const lesson = await prisma.lesson.findUnique({ where: { id: lessonId } });
    if (!lesson) return jsonError('Lesson not found.', 404);

    const progress = await prisma.lessonProgress.findUnique({
      where: { userId_lessonId: { userId: user.id, lessonId } }
    });

    if (!progress) {
      return NextResponse.json({
        currentTime: 0,
        watchedPercent: 0,
        completed: false
      });
    }

    return NextResponse.json({
      currentTime: progress.currentTime,
      watchedPercent: progress.watchedPercent,
      completed: progress.completed
    });
  } catch (err) {
    return handleApiError(err);
  }
}

/**
 * POST /api/lessons/[lessonId]/progress
 * Saves the current playback position. Upserts on the [userId, lessonId]
 * composite unique key so repeated saves during playback update in place
 * rather than creating duplicate rows.
 */
export async function POST(req: NextRequest, { params }: Params) {
  try {
    const user = await requireUser(req);
    const { lessonId } = params;

    if (!lessonId) {
      return jsonError('Lesson id is missing from the request.', 400);
    }

    const lesson = await prisma.lesson.findUnique({ where: { id: lessonId } });
    if (!lesson) return jsonError('Lesson not found.', 404);

    const body = await req.json();
    const { currentTime, watchedPercent } = progressUpdateSchema.parse(body);

    // Verify the user is actually enrolled (or the lesson is free) before persisting progress.
    if (!lesson.isFree) {
      const enrollment = await prisma.enrollment.findUnique({
        where: { userId_courseId: { userId: user.id, courseId: lesson.courseId } }
      });
      if (!enrollment) {
        return jsonError('You must be enrolled in this course to track progress.', 403);
      }
    }

    const progress = await prisma.lessonProgress.upsert({
      where: { userId_lessonId: { userId: user.id, lessonId } },
      create: {
        userId: user.id,
        lessonId,
        currentTime,
        watchedPercent
      },
      update: {
        currentTime,
        watchedPercent
      }
    });

    return NextResponse.json({ progress });
  } catch (err) {
    return handleApiError(err);
  }
}
