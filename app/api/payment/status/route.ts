import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/auth';
import { handleApiError, jsonError } from '@/lib/api-response';

/**
 * GET /api/payment/status?reference=CFA-PAY-XXXX
 * Lets the authenticated user poll their own payment's real status —
 * used by /payment/success to confirm enrollment before showing "Continue Course".
 */
export async function GET(req: NextRequest) {
  try {
    const user = await requireUser(req);
    const reference = new URL(req.url).searchParams.get('reference');
    if (!reference) return jsonError('Missing payment reference.', 400);

    const payment = await prisma.payment.findUnique({
      where: { reference },
      include: { course: { select: { slug: true, title: true } } }
    });

    if (!payment || payment.userId !== user.id) {
      return jsonError('Payment not found.', 404);
    }

    return NextResponse.json({ payment });
  } catch (err) {
    return handleApiError(err);
  }
}
