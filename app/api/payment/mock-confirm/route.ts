import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/auth';
import { handleApiError, jsonError } from '@/lib/api-response';
import { z } from 'zod';

const schema = z.object({ reference: z.string().min(1) });

/**
 * POST /api/payment/mock-confirm
 * DEVELOPMENT/TESTING ONLY. Simulates what the real payment webhook would do,
 * so the full checkout -> enrollment -> lessons flow can be exercised end to
 * end before a real payment provider is connected.
 *
 * Hard-disabled unless BOTH:
 *   - NODE_ENV !== 'production'
 *   - ALLOW_MOCK_PAYMENTS=true is set in the environment
 * This prevents this endpoint from ever being reachable in a real deployment.
 */
export async function POST(req: NextRequest) {
  try {
    if (process.env.NODE_ENV === 'production' || process.env.ALLOW_MOCK_PAYMENTS !== 'true') {
      return jsonError('Mock payment confirmation is disabled in this environment.', 403);
    }

    const user = await requireUser(req);
    const { reference } = schema.parse(await req.json());

    const payment = await prisma.payment.findUnique({ where: { reference } });
    if (!payment || payment.userId !== user.id) return jsonError('Payment not found.', 404);
    if (payment.status === 'SUCCESS') return jsonError('Payment already confirmed.', 409);

    const [updatedPayment] = await prisma.$transaction([
      prisma.payment.update({ where: { id: payment.id }, data: { status: 'SUCCESS' } }),
      prisma.enrollment.upsert({
        where: { userId_courseId: { userId: payment.userId, courseId: payment.courseId } },
        create: { userId: payment.userId, courseId: payment.courseId },
        update: {}
      })
    ]);

    return NextResponse.json({ payment: updatedPayment });
  } catch (err) {
    return handleApiError(err);
  }
}
