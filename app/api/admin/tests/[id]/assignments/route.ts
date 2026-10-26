import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import { handleApiError, jsonError } from '@/lib/api-response';

interface Params {
  params: { id: string };
}

/** GET — every student this test is assigned to, and whether they have started it. */
export async function GET(req: NextRequest, { params }: Params) {
  try {
    await requireAdmin(req);
    const test = await prisma.test.findUnique({ where: { id: params.id }, select: { id: true } });
    if (!test) return jsonError('Test not found.', 404);

    const [rows, attempts] = await Promise.all([
      prisma.testAssignment.findMany({
        where: { testId: params.id },
        include: { user: { select: { id: true, fullName: true, email: true } } },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.testAttempt.groupBy({ by: ['userId'], where: { testId: params.id } })
    ]);
    const started = new Set(attempts.map((a) => a.userId));

    return NextResponse.json({
      assignments: rows.map((r) => ({
        userId: r.user.id,
        fullName: r.user.fullName,
        email: r.user.email,
        assignedAt: r.createdAt,
        started: started.has(r.user.id)
      }))
    });
  } catch (err) {
    return handleApiError(err);
  }
}

const addSchema = z
  .object({
    userIds: z.array(z.string().min(1)).max(2000).optional(),
    emails: z.array(z.string()).max(2000).optional()
  })
  .refine((d) => (d.userIds?.length ?? 0) + (d.emails?.length ?? 0) > 0, {
    message: 'Choose at least one student.'
  });

/**
 * POST — assign students by id and/or by email address.
 * Students who are already assigned are skipped, and emails that don't match an
 * account are reported back so the admin can fix them.
 */
export async function POST(req: NextRequest, { params }: Params) {
  try {
    await requireAdmin(req);
    const body = addSchema.parse(await req.json());

    const test = await prisma.test.findUnique({ where: { id: params.id }, select: { id: true } });
    if (!test) return jsonError('Test not found.', 404);

    const wantedEmails = Array.from(
      new Set((body.emails ?? []).map((e) => e.trim().toLowerCase()).filter(Boolean))
    );

    const [byId, byEmail] = await Promise.all([
      body.userIds?.length
        ? prisma.user.findMany({ where: { id: { in: body.userIds } }, select: { id: true } })
        : Promise.resolve([]),
      wantedEmails.length
        ? prisma.user.findMany({ where: { email: { in: wantedEmails } }, select: { id: true, email: true } })
        : Promise.resolve([])
    ]);

    const foundEmails = new Set(byEmail.map((u) => u.email.toLowerCase()));
    const notFound = wantedEmails.filter((e) => !foundEmails.has(e));
    const userIds = Array.from(new Set([...byId.map((u) => u.id), ...byEmail.map((u) => u.id)]));

    let added = 0;
    if (userIds.length > 0) {
      const result = await prisma.testAssignment.createMany({
        data: userIds.map((userId) => ({ testId: params.id, userId })),
        skipDuplicates: true
      });
      added = result.count;
    }

    return NextResponse.json({ added, alreadyAssigned: userIds.length - added, notFound });
  } catch (err) {
    return handleApiError(err);
  }
}

/**
 * DELETE ?userId=<id>  — unassign one student
 * DELETE ?all=true     — unassign everyone
 * Removing an assignment never deletes a student's existing attempts or scores.
 */
export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    await requireAdmin(req);
    const sp = new URL(req.url).searchParams;

    if (sp.get('all') === 'true') {
      const r = await prisma.testAssignment.deleteMany({ where: { testId: params.id } });
      return NextResponse.json({ removed: r.count });
    }

    const userId = sp.get('userId');
    if (!userId) return jsonError('Say which student to remove.', 400);

    const r = await prisma.testAssignment.deleteMany({ where: { testId: params.id, userId } });
    return NextResponse.json({ removed: r.count });
  } catch (err) {
    return handleApiError(err);
  }
}
