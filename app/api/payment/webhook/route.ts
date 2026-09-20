import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyWebhookSignature } from '@/services/payment';

/**
 * POST /api/payment/webhook
 * Called by the real payment provider (server-to-server), NOT by the browser.
 * This is the ONLY place a Payment is allowed to transition to SUCCESS and
 * an Enrollment gets created as a result of a paid checkout — the client
 * landing on /payment/success never grants access by itself.
 *
 * Until a real provider is configured, verifyWebhookSignature() always
 * rejects, so this endpoint safely no-ops rather than trusting forged calls.
 */
export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get('x-webhook-signature');

  if (!verifyWebhookSignature(rawBody, signature)) {
    return NextResponse.json({ error: 'Invalid or unverifiable webhook signature.' }, { status: 401 });
  }

  // Parsing/handling below only runs once a real provider + signature
  // verification is wired up in services/payment.ts.
  const event = JSON.parse(rawBody);
  const reference: string | undefined = event?.data?.reference;
  const providerStatus: string | undefined = event?.data?.status;

  if (!reference) {
    return NextResponse.json({ error: 'Missing payment reference.' }, { status: 400 });
  }

  const payment = await prisma.payment.findUnique({ where: { reference } });
  if (!payment) {
    return NextResponse.json({ error: 'Unknown payment reference.' }, { status: 404 });
  }

  if (providerStatus === 'success') {
    await prisma.$transaction([
      prisma.payment.update({ where: { id: payment.id }, data: { status: 'SUCCESS' } }),
      prisma.enrollment.upsert({
        where: { userId_courseId: { userId: payment.userId, courseId: payment.courseId } },
        create: { userId: payment.userId, courseId: payment.courseId },
        update: {}
      })
    ]);
  } else {
    await prisma.payment.update({ where: { id: payment.id }, data: { status: 'FAILED' } });
  }

  return NextResponse.json({ received: true });
}
