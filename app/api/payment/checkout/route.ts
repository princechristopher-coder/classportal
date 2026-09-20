import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/auth';
import { handleApiError, jsonError } from '@/lib/api-response';
import { createCheckoutSession } from '@/services/payment';
import { z } from 'zod';

const checkoutSchema = z.object({ courseId: z.string().min(1) });

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser(req);
    const { courseId } = checkoutSchema.parse(await req.json());

    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course || !course.published) return jsonError('Course not found.', 404);

    const existingEnrollment = await prisma.enrollment.findUnique({
      where: { userId_courseId: { userId: user.id, courseId } }
    });
    if (existingEnrollment) {
      return jsonError('You are already enrolled in this course.', 409);
    }

    const reference = `CFA-PAY-${crypto.randomBytes(8).toString('hex').toUpperCase()}`;

    const payment = await prisma.payment.create({
      data: {
        userId: user.id,
        courseId,
        amount: course.price,
        status: 'PENDING',
        reference
      }
    });

    const session = await createCheckoutSession({
      amount: course.price,
      reference,
      customerEmail: user.email,
      courseTitle: course.title
    });

    return NextResponse.json({
      payment,
      checkoutUrl: session.checkoutUrl,
      providerConfigured: !!process.env.PAYMENT_PROVIDER_SECRET_KEY
    });
  } catch (err) {
    return handleApiError(err);
  }
}
