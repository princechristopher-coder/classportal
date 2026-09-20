import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin, getTokenFromRequest, verifyToken } from '@/lib/auth';
import { courseSchema } from '@/lib/validation';
import { handleApiError, jsonError } from '@/lib/api-response';

interface Params {
  params: { slug: string };
}

export async function GET(req: NextRequest, { params }: Params) {
  try {
    const course = await prisma.course.findUnique({
      where: { slug: params.slug },
      include: {
        lessons: { orderBy: { order: 'asc' } },
        _count: { select: { enrollments: true } }
      }
    });

    if (!course) return jsonError('Course not found.', 404);

    if (!course.published) {
      const token = getTokenFromRequest(req);
      const payload = token ? verifyToken(token) : null;
      if (payload?.role !== 'ADMIN') {
        return jsonError('Course not found.', 404);
      }
    }

    // If the requester is authenticated, attach their enrollment + per-lesson progress.
    const token = getTokenFromRequest(req);
    const payload = token ? verifyToken(token) : null;

    let enrollment = null;
    let progressByLesson: Record<string, { currentTime: number; watchedPercent: number; completed: boolean }> = {};

    if (payload) {
      enrollment = await prisma.enrollment.findUnique({
        where: { userId_courseId: { userId: payload.userId, courseId: course.id } }
      });

      if (enrollment) {
        const progressRows = await prisma.lessonProgress.findMany({
          where: { userId: payload.userId, lesson: { courseId: course.id } }
        });
        progressByLesson = Object.fromEntries(
          progressRows.map((p: { lessonId: string; currentTime: number; watchedPercent: number; completed: boolean }) => [
            p.lessonId,
            { currentTime: p.currentTime, watchedPercent: p.watchedPercent, completed: p.completed }
          ])
        );
      }
    }

    return NextResponse.json({ course, enrollment, progressByLesson });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    await requireAdmin(req);
    const body = await req.json();
    const data = courseSchema.partial().parse(body);

    const existing = await prisma.course.findUnique({ where: { slug: params.slug } });
    if (!existing) return jsonError('Course not found.', 404);

    const course = await prisma.course.update({ where: { id: existing.id }, data });
    return NextResponse.json({ course });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    await requireAdmin(req);
    const existing = await prisma.course.findUnique({ where: { slug: params.slug } });
    if (!existing) return jsonError('Course not found.', 404);

    // Lessons cascade via schema (onDelete: Cascade), so this correctly
    // removes lessons, their progress rows, enrollments, and certificates.
    await prisma.course.delete({ where: { id: existing.id } });

    return NextResponse.json({ success: true });
  } catch (err) {
    return handleApiError(err);
  }
}
