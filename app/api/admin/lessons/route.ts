import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import { lessonSchema } from '@/lib/validation';
import { handleApiError } from '@/lib/api-response';

export async function POST(req: NextRequest) {
  try {
    await requireAdmin(req);
    const data = lessonSchema.parse(await req.json());

    const lesson = await prisma.lesson.create({ data });

    return NextResponse.json({ lesson }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
