import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/auth';
import { handleApiError, jsonError } from '@/lib/api-response';
import { z } from 'zod';

const enrollSchema = z.object({ courseId: z.string().min(1) });

/**
 * POST /api/enrollment
 * Enrolls the AUTHENTICATED user in a course. Free courses enroll immediately;
 * paid courses should be enrolled via /api/payment/confirm after payment succeeds,
 * but this endpoint still refuses duplicate enrollment either way.
 */
export async function POST(req: NextRequest) {
  try {
    const user = await requireUser(req);
    const { courseId } = enrollSchema.parse(await req.json());

    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course || !course.published) return jsonError('Course not found.', 404);

    const existing = await prisma.enrollment.findUnique({
      where: { userId_courseId: { userId: user.id, courseId } }
    });
    if (existing) {
      return NextResponse.json({ enrollment: existing, alreadyEnrolled: true });
    }

    if (course.price > 0) {
      return jsonError('This is a paid course. Please complete checkout to enroll.', 402);
    }

    const enrollment = await prisma.enrollment.create({
      data: { userId: user.id, courseId }
    });

    return NextResponse.json({ enrollment }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}

/**
 * GET /api/enrollment
 * Returns all of the authenticated user's enrollments with course + progress info.
 */
export async function GET(req: NextRequest) {
  try {
    const user = await requireUser(req);

    const enrollments = await prisma.enrollment.findMany({
      where: { userId: user.id },
      include: {
        course: {
          include: { _count: { select: { lessons: true } } }
        }
      },
      orderBy: { updatedAt: 'desc' }
    });

    return NextResponse.json({ enrollments });
  } catch (err) {
    return handleApiError(err);
  }
}
