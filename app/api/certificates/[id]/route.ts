import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/auth';
import { handleApiError, jsonError } from '@/lib/api-response';

interface Params {
  params: { id: string };
}

/**
 * GET /api/certificates/[id]
 * Returns full certificate detail for rendering. Only the certificate's
 * owner or an admin may view it — ownership is derived from the
 * authenticated session, never from a client-supplied userId.
 */
export async function GET(req: NextRequest, { params }: Params) {
  try {
    const user = await requireUser(req);

    const certificate = await prisma.certificate.findUnique({
      where: { id: params.id },
      include: {
        course: true,
        user: { select: { id: true, fullName: true, email: true, avatar: true } }
      }
    });

    if (!certificate) return jsonError('Certificate not found.', 404);

    if (certificate.userId !== user.id && user.role !== 'ADMIN') {
      return jsonError('You do not have permission to view this certificate.', 403);
    }

    return NextResponse.json({ certificate });
  } catch (err) {
    return handleApiError(err);
  }
}
