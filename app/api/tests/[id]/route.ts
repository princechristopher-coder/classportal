import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { handleApiError, jsonError } from '@/lib/api-response';
import { studentTestSummaries } from '@/lib/tests';

interface Params {
  params: { id: string };
}

/** GET /api/tests/[id] — one test's intro info for the signed-in student. */
export async function GET(req: NextRequest, { params }: Params) {
  try {
    const user = await requireUser(req);
    const [test] = await studentTestSummaries(user.id, [params.id]);
    if (!test) return jsonError('Test not found.', 404);
    return NextResponse.json({ test });
  } catch (err) {
    return handleApiError(err);
  }
}
