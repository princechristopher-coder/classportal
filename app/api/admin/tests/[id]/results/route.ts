import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import { handleApiError, jsonError } from '@/lib/api-response';
import { expireIfNeeded } from '@/lib/tests';

interface Params {
  params: { id: string };
}

// Spreadsheet apps run cells starting with these characters as formulas.
function csvCell(value: unknown): string {
  let s = value === null || value === undefined ? '' : String(value);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
}

/**
 * GET /api/admin/tests/[id]/results            → JSON
 * GET /api/admin/tests/[id]/results?format=csv → CSV download
 */
export async function GET(req: NextRequest, { params }: Params) {
  try {
    await requireAdmin(req);

    const test = await prisma.test.findUnique({
      where: { id: params.id },
      include: { _count: { select: { questions: true } } }
    });
    if (!test) return jsonError('Test not found.', 404);

    const attempts = await prisma.testAttempt.findMany({
      where: { testId: test.id },
      include: { user: { select: { id: true, fullName: true, email: true } } },
      orderBy: { startedAt: 'desc' }
    });

    const rows = [];
    for (const raw of attempts) {
      const a = await expireIfNeeded(raw, test.durationMins);
      const submitted = !!a.submittedAt;
      const total = a.total ?? test._count.questions;
      const percent = submitted && total > 0 ? Math.round(((a.score ?? 0) / total) * 100) : null;
      rows.push({
        id: a.id,
        userId: raw.user.id,
        fullName: raw.user.fullName,
        email: raw.user.email,
        status: submitted ? 'SUBMITTED' : 'IN_PROGRESS',
        score: submitted ? a.score ?? 0 : null,
        total: submitted ? total : null,
        percent,
        passed: percent === null ? null : percent >= test.passMark,
        startedAt: a.startedAt,
        submittedAt: a.submittedAt,
        timedOut: a.timedOut
      });
    }

    const done = rows.filter((r) => r.percent !== null);
    const stats = {
      submitted: done.length,
      inProgress: rows.length - done.length,
      averagePercent: done.length ? Math.round(done.reduce((s, r) => s + (r.percent ?? 0), 0) / done.length) : 0,
      passRate: done.length ? Math.round((done.filter((r) => r.passed).length / done.length) * 100) : 0,
      highestPercent: done.length ? Math.max(...done.map((r) => r.percent ?? 0)) : 0
    };

    if (new URL(req.url).searchParams.get('format') === 'csv') {
      const header = ['Name', 'Email', 'Status', 'Score', 'Total', 'Percent', 'Result', 'Started', 'Submitted', 'Timed out'];
      const lines = rows.map((r) =>
        [
          r.fullName,
          r.email,
          r.status,
          r.score,
          r.total,
          r.percent,
          r.passed === null ? '' : r.passed ? 'PASS' : 'FAIL',
          r.startedAt.toISOString(),
          r.submittedAt ? r.submittedAt.toISOString() : '',
          r.timedOut ? 'yes' : 'no'
        ]
          .map(csvCell)
          .join(',')
      );
      const csv = [header.map(csvCell).join(','), ...lines].join('\r\n');
      const fileName = `${test.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'test'}-results.csv`;

      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="${fileName}"`
        }
      });
    }

    return NextResponse.json({
      test: { id: test.id, title: test.title, passMark: test.passMark, questionCount: test._count.questions },
      stats,
      attempts: rows
    });
  } catch (err) {
    return handleApiError(err);
  }
}
