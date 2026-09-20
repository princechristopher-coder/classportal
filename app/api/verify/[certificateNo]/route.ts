import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { handleApiError } from '@/lib/api-response';

interface Params {
  params: { certificateNo: string };
}

/**
 * GET /api/verify/[certificateNo]
 * PUBLIC — no authentication required. Anyone with a certificate number
 * (or who scans the QR code) can confirm a certificate is genuine.
 * Never exposes password or any sensitive account data.
 */
export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const certificate = await prisma.certificate.findUnique({
      where: { certificateNo: params.certificateNo },
      include: {
        course: { select: { title: true, level: true, slug: true } },
        user: { select: { fullName: true } }
      }
    });

    if (!certificate) {
      return NextResponse.json({ valid: false });
    }

    return NextResponse.json({
      valid: true,
      certificate: {
        certificateNo: certificate.certificateNo,
        issuedAt: certificate.issuedAt,
        studentName: certificate.user.fullName,
        courseTitle: certificate.course.title,
        courseLevel: certificate.course.level
      }
    });
  } catch (err) {
    return handleApiError(err);
  }
}
