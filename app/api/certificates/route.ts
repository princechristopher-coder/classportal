import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/auth';
import { handleApiError } from '@/lib/api-response';

/**
 * GET /api/certificates
 * Returns ONLY the authenticated user's own certificates. Never another user's.
 */
export async function GET(req: NextRequest) {
  try {
    const user = await requireUser(req);

    const certificates = await prisma.certificate.findMany({
      where: { userId: user.id },
      include: { course: true },
      orderBy: { issuedAt: 'desc' }
    });

    return NextResponse.json({ certificates });
  } catch (err) {
    return handleApiError(err);
  }
}
