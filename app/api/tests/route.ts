import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { handleApiError } from '@/lib/api-response';
import { studentTestSummaries } from '@/lib/tests';

/** GET /api/tests — published tests plus the signed-in student's attempt history. */
export async function GET(req: NextRequest) {
  try {
    const user = await requireUser(req);
    const tests = await studentTestSummaries(user.id);
    return NextResponse.json({ tests });
  } catch (err) {
    return handleApiError(err);
  }
}
