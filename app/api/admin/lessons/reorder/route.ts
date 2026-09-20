import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import { handleApiError } from '@/lib/api-response';
import { z } from 'zod';

const reorderSchema = z.object({
  lessons: z.array(z.object({ id: z.string().min(1), order: z.number().int().min(0) }))
});

/**
 * PATCH /api/admin/lessons/reorder
 * Body: { lessons: [{ id, order }, ...] }
 * Applied as a single transaction so reordering never leaves lessons
 * half-updated if one write fails.
 */
export async function PATCH(req: NextRequest) {
  try {
    await requireAdmin(req);
    const { lessons } = reorderSchema.parse(await req.json());

    await prisma.$transaction(
      lessons.map((l) => prisma.lesson.update({ where: { id: l.id }, data: { order: l.order } }))
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    return handleApiError(err);
  }
}
