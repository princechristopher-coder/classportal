import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import { handleApiError } from '@/lib/api-response';
import { testSchema, toDateOrNull } from '@/lib/test-validation';

/** GET /api/admin/tests — every test with question and attempt counts. */
export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req);
    const tests = await prisma.test.findMany({
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { questions: true, attempts: true } } }
    });
    return NextResponse.json({ tests });
  } catch (err) {
    return handleApiError(err);
  }
}

/** POST /api/admin/tests — create a test (starts as a draft). */
export async function POST(req: NextRequest) {
  try {
    await requireAdmin(req);
    const data = testSchema.parse(await req.json());

    const test = await prisma.test.create({
      data: {
        title: data.title,
        description: data.description || null,
        durationMins: data.durationMins,
        maxAttempts: data.maxAttempts,
        passMark: data.passMark,
        showReview: data.showReview,
        published: false,
        opensAt: toDateOrNull(data.opensAt) ?? null,
        closesAt: toDateOrNull(data.closesAt) ?? null
      }
    });

    return NextResponse.json({ test }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
