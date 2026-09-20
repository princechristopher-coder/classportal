import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import { handleApiError, jsonError } from '@/lib/api-response';
import { testPatchSchema, toDateOrNull, windowIsValid } from '@/lib/test-validation';
import { readOptions } from '@/lib/tests';

interface Params {
  params: { id: string };
}

/** GET /api/admin/tests/[id] — the test with all questions AND their correct answers. */
export async function GET(req: NextRequest, { params }: Params) {
  try {
    await requireAdmin(req);
    const test = await prisma.test.findUnique({
      where: { id: params.id },
      include: {
        questions: { orderBy: { order: 'asc' } },
        _count: { select: { attempts: true } }
      }
    });
    if (!test) return jsonError('Test not found.', 404);

    return NextResponse.json({
      test: { ...test, questions: test.questions.map((q) => ({ ...q, options: readOptions(q.options) })) }
    });
  } catch (err) {
    return handleApiError(err);
  }
}

/** PATCH /api/admin/tests/[id] — update settings or publish/unpublish. */
export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    await requireAdmin(req);
    const data = testPatchSchema.parse(await req.json());

    const existing = await prisma.test.findUnique({
      where: { id: params.id },
      include: { _count: { select: { questions: true } } }
    });
    if (!existing) return jsonError('Test not found.', 404);

    if (data.published === true && existing._count.questions === 0) {
      return jsonError('Add at least one question before publishing this test.', 400);
    }

    const opensAt = data.opensAt === undefined ? existing.opensAt?.toISOString() ?? null : data.opensAt;
    const closesAt = data.closesAt === undefined ? existing.closesAt?.toISOString() ?? null : data.closesAt;
    if (!windowIsValid(opensAt, closesAt)) {
      return jsonError('Closing time must be after the opening time.', 400);
    }

    const test = await prisma.test.update({
      where: { id: params.id },
      data: {
        title: data.title,
        description: data.description === undefined ? undefined : data.description || null,
        durationMins: data.durationMins,
        maxAttempts: data.maxAttempts,
        passMark: data.passMark,
        showReview: data.showReview,
        published: data.published,
        opensAt: toDateOrNull(data.opensAt),
        closesAt: toDateOrNull(data.closesAt)
      }
    });

    return NextResponse.json({ test });
  } catch (err) {
    return handleApiError(err);
  }
}

/** DELETE /api/admin/tests/[id] — removes the test, its questions and all attempts. */
export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    await requireAdmin(req);
    const existing = await prisma.test.findUnique({ where: { id: params.id } });
    if (!existing) return jsonError('Test not found.', 404);

    await prisma.test.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    return handleApiError(err);
  }
}
