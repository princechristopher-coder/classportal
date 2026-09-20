import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import { lessonSchema } from '@/lib/validation';
import { handleApiError, jsonError } from '@/lib/api-response';

interface Params {
  params: { id: string };
}

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    await requireAdmin(req);
    const data = lessonSchema.partial().parse(await req.json());

    const existing = await prisma.lesson.findUnique({ where: { id: params.id } });
    if (!existing) return jsonError('Lesson not found.', 404);

    const lesson = await prisma.lesson.update({ where: { id: params.id }, data });
    return NextResponse.json({ lesson });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    await requireAdmin(req);
    const existing = await prisma.lesson.findUnique({ where: { id: params.id } });
    if (!existing) return jsonError('Lesson not found.', 404);

    // Cascade removes related LessonProgress rows automatically (schema onDelete: Cascade).
    await prisma.lesson.delete({ where: { id: params.id } });

    return NextResponse.json({ success: true });
  } catch (err) {
    return handleApiError(err);
  }
}
