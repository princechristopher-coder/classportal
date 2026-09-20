import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import { handleApiError, jsonError } from '@/lib/api-response';
import { questionSchema } from '@/lib/test-validation';
import { readOptions } from '@/lib/tests';

interface Params {
  params: { id: string; qid: string };
}

/** PATCH /api/admin/tests/[id]/questions/[qid] — replace a question's content. */
export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    await requireAdmin(req);
    const q = questionSchema.parse(await req.json());

    const existing = await prisma.testQuestion.findFirst({ where: { id: params.qid, testId: params.id } });
    if (!existing) return jsonError('Question not found.', 404);

    const question = await prisma.testQuestion.update({
      where: { id: params.qid },
      data: {
        topic: q.topic || null,
        text: q.text,
        options: q.options,
        correctIndex: q.correctIndex,
        explanation: q.explanation || null
      }
    });

    return NextResponse.json({ question: { ...question, options: readOptions(question.options) } });
  } catch (err) {
    return handleApiError(err);
  }
}

/** DELETE /api/admin/tests/[id]/questions/[qid] */
export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    await requireAdmin(req);
    const existing = await prisma.testQuestion.findFirst({ where: { id: params.qid, testId: params.id } });
    if (!existing) return jsonError('Question not found.', 404);

    await prisma.testQuestion.delete({ where: { id: params.qid } });
    return NextResponse.json({ success: true });
  } catch (err) {
    return handleApiError(err);
  }
}
