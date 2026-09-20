import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin, getTokenFromRequest, verifyToken } from '@/lib/auth';
import { courseSchema } from '@/lib/validation';
import { handleApiError } from '@/lib/api-response';

/**
 * GET /api/courses
 * Public: returns published courses only.
 * Admins (when authenticated) also see unpublished courses via ?all=true.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const wantsAll = searchParams.get('all') === 'true';

    let includeUnpublished = false;
    if (wantsAll) {
      const token = getTokenFromRequest(req);
      const payload = token ? verifyToken(token) : null;
      includeUnpublished = payload?.role === 'ADMIN';
    }

    const courses = await prisma.course.findMany({
      where: includeUnpublished ? {} : { published: true },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { lessons: true, enrollments: true } }
      }
    });

    return NextResponse.json({ courses });
  } catch (err) {
    return handleApiError(err);
  }
}

/**
 * POST /api/courses
 * Admin only: create a new course.
 */
export async function POST(req: NextRequest) {
  try {
    await requireAdmin(req);
    const body = await req.json();
    const data = courseSchema.parse(body);

    const course = await prisma.course.create({ data });

    return NextResponse.json({ course }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
