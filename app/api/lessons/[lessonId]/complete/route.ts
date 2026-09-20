import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/auth';
import { handleApiError, jsonError } from '@/lib/api-response';
import { issueCertificateIfNeeded } from '@/lib/certificate';

interface Params {
  params: { lessonId: string };
}

/**
 * POST /api/lessons/[lessonId]/complete
 * Marks a lesson complete for the authenticated user, recalculates the
 * parent course's overall Enrollment.progress, flips Enrollment.completed
 * to true when every lesson is done, and — only at that moment — issues a
 * certificate (idempotently; never duplicates one).
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

    const enrollment = await prisma.enrollment.findUnique({
      where: { userId_courseId: { userId: user.id, courseId: lesson.courseId } }
    });
    if (!enrollment) {
      return jsonError('You must be enrolled in this course to complete lessons.', 403);
    }

    // 1. Mark this lesson's progress complete (upsert — the student may not
    //    have an existing progress row if they jumped straight to "mark complete").
    await prisma.lessonProgress.upsert({
      where: { userId_lessonId: { userId: user.id, lessonId } },
      create: {
        userId: user.id,
        lessonId,
        currentTime: 0,
        watchedPercent: 100,
        completed: true,
        completedAt: new Date()
      },
      update: {
        completed: true,
        completedAt: new Date(),
        watchedPercent: 100
      }
    });

    // 2. Recalculate course-wide progress: completed lessons / total lessons * 100.
    const totalLessons = await prisma.lesson.count({ where: { courseId: lesson.courseId } });
    const completedLessons = await prisma.lessonProgress.count({
      where: { userId: user.id, completed: true, lesson: { courseId: lesson.courseId } }
    });

    const progressPercent = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
    const isCourseComplete = totalLessons > 0 && completedLessons >= totalLessons;

    const updatedEnrollment = await prisma.enrollment.update({
      where: { id: enrollment.id },
      data: {
        progress: progressPercent,
        completed: isCourseComplete
      }
    });

    // 3. Auto-issue certificate on course completion (idempotent — no duplicates).
    let certificate = null;
    if (isCourseComplete) {
      certificate = await issueCertificateIfNeeded(user.id, lesson.courseId);
    }

    return NextResponse.json({
      enrollment: updatedEnrollment,
      completedLessons,
      totalLessons,
      progressPercent,
      courseCompleted: isCourseComplete,
      certificate
    });
  } catch (err) {
    return handleApiError(err);
  }
}
