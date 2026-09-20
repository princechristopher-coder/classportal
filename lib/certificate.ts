import { prisma } from './prisma';

/**
 * Generates a unique certificate number in the format CFA-YYYY-000001.
 * Uses a single-row atomic counter (upsert + increment inside a transaction)
 * rather than COUNT(*) on the Certificate table, which is not safe under
 * concurrent completions (two students finishing at the same instant could
 * both compute the same "next" count).
 */
export async function generateCertificateNumber(): Promise<string> {
  const year = new Date().getFullYear();

  const counter = await prisma.$transaction(async (tx: typeof prisma) => {
    const existing = await tx.certificateCounter.upsert({
      where: { id: 'singleton' },
      create: { id: 'singleton', value: 1 },
      update: { value: { increment: 1 } }
    });
    return existing.value;
  });

  const padded = String(counter).padStart(6, '0');
  return `CFA-${year}-${padded}`;
}

/**
 * Idempotently issues a certificate for a completed course.
 * Safe to call multiple times — will never create a duplicate for the same
 * userId + courseId pair (enforced both here and by the DB unique constraint).
 */
export async function issueCertificateIfNeeded(userId: string, courseId: string) {
  const existing = await prisma.certificate.findUnique({
    where: { userId_courseId: { userId, courseId } }
  });
  if (existing) return existing;

  const certificateNo = await generateCertificateNumber();

  try {
    return await prisma.certificate.create({
      data: { userId, courseId, certificateNo }
    });
  } catch (err: any) {
    // Race condition guard: if a concurrent request created it first,
    // the unique constraint on [userId, courseId] will throw P2002 — just return it.
    if (err?.code === 'P2002') {
      const raceWinner = await prisma.certificate.findUnique({
        where: { userId_courseId: { userId, courseId } }
      });
      if (raceWinner) return raceWinner;
    }
    throw err;
  }
}
