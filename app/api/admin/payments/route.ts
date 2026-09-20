import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import { handleApiError } from '@/lib/api-response';

export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req);

    const payments = await prisma.payment.findMany({
      include: {
        user: { select: { fullName: true, email: true } },
        course: { select: { title: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ payments });
  } catch (err) {
    return handleApiError(err);
  }
}
