import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import { handleApiError } from '@/lib/api-response';

/**
 * GET /api/admin/users?search=...
 * Admin only. Never returns password hashes.
 */
export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req);
    const search = new URL(req.url).searchParams.get('search')?.trim();

    const users = await prisma.user.findMany({
      where: search
        ? {
            OR: [
              { fullName: { contains: search, mode: 'insensitive' } },
              { email: { contains: search, mode: 'insensitive' } }
            ]
          }
        : undefined,
      select: {
        id: true,
        fullName: true,
        email: true,
        avatar: true,
        role: true,
        createdAt: true,
        _count: { select: { enrollments: true, certificates: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ users });
  } catch (err) {
    return handleApiError(err);
  }
}
