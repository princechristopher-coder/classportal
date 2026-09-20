import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import { handleApiError, jsonError } from '@/lib/api-response';
import { z } from 'zod';

interface Params {
  params: { id: string };
}

export async function GET(req: NextRequest, { params }: Params) {
  try {
    await requireAdmin(req);

    const user = await prisma.user.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        fullName: true,
        email: true,
        avatar: true,
        role: true,
        createdAt: true,
        enrollments: { include: { course: { select: { title: true, slug: true } } } },
        certificates: { include: { course: { select: { title: true } } } }
      }
    });

    if (!user) return jsonError('User not found.', 404);

    return NextResponse.json({ user });
  } catch (err) {
    return handleApiError(err);
  }
}

const roleUpdateSchema = z.object({ role: z.enum(['STUDENT', 'ADMIN']) });

/**
 * PATCH /api/admin/users/[id]
 * Admin-only role management. Guarded so an admin can't accidentally demote themself
 * to zero admins existing (simple safety check: must leave at least one ADMIN).
 */
export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const requester = await requireAdmin(req);
    const { role } = roleUpdateSchema.parse(await req.json());

    if (requester.id === params.id && role !== 'ADMIN') {
      const adminCount = await prisma.user.count({ where: { role: 'ADMIN' } });
      if (adminCount <= 1) {
        return jsonError('You cannot remove the last remaining admin account.', 400);
      }
    }

    const user = await prisma.user.update({
      where: { id: params.id },
      data: { role },
      select: { id: true, fullName: true, email: true, role: true }
    });

    return NextResponse.json({ user });
  } catch (err) {
    return handleApiError(err);
  }
}
