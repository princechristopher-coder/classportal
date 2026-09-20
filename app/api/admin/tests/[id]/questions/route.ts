import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import { handleApiError, jsonError } from '@/lib/api-response';
import { ImportError, normalizeImportedQuestions, questionSchema } from '@/lib/test-validation';
import { readOptions } from '@/lib/tests';

interface Params {
  params: { id: string };
}

/**
 * POST /api/admin/tests/[id]/questions
 *  - one question:  { topic?, text, options[], correctIndex, explanation? }
 *  - bulk import:   { import: [ ...questions in the JSON import format ], replace?: boolean }
 */
export async function POST(req: NextRequest, { params }: Params) {
  try {
    await requireAdmin(req);
    const body = await req.json();

    const test = await prisma.test.findUnique({ where: { id: params.id } });
    if (!test) return jsonError('Test not found.', 404);

    const last = await prisma.testQuestion.aggregate({
      where: { testId: test.id },
      _max: { order: true }
    });

    if (body && typeof body === 'object' && 'import' in body) {
      let items;
      try {
        items = normalizeImportedQuestions(body.import);
      } catch (e) {
        if (e instanceof ImportError) return jsonError(e.message, 400);
        throw e;
      }

      const replace = body.replace === true;
      const startOrder = replace ? 0 : (last._max.order ?? -1) + 1;
      const rows = items.map((q, i) => ({
        testId: test.id,
        order: startOrder + i,
        topic: q.topic || null,
        text: q.text,
        options: q.options,
        correctIndex: q.correctIndex,
        explanation: q.explanation || null
      }));

      await prisma.$transaction([
        ...(replace ? [prisma.testQuestion.deleteMany({ where: { testId: test.id } })] : []),
        prisma.testQuestion.createMany({ data: rows })
      ]);

      return NextResponse.json({ imported: rows.length }, { status: 201 });
    }

    const q = questionSchema.parse(body);
    const question = await prisma.testQuestion.create({
      data: {
        testId: test.id,
        order: (last._max.order ?? -1) + 1,
        topic: q.topic || null,
        text: q.text,
        options: q.options,
        correctIndex: q.correctIndex,
        explanation: q.explanation || null
      }
    });

    return NextResponse.json({ question: { ...question, options: readOptions(question.options) } }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
