import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/auth';
import { profileUpdateSchema } from '@/lib/validation';
import { handleApiError } from '@/lib/api-response';

/**
 * PATCH /api/profile
 * The authenticated user may update their own fullName/avatar.
 * Email, password, and role are intentionally NOT editable here —
 * role changes require the separate admin endpoint, password changes
 * go through /api/profile/password, and email changes are out of scope
 * to avoid breaking login/verification flows without re-verification.
 */
export async function PATCH(req: NextRequest) {
  try {
    const user = await requireUser(req);
    const data = profileUpdateSchema.parse(await req.json());

    const updated = await prisma.user.update({
      where: { id: user.id },
      data,
      select: { id: true, fullName: true, email: true, avatar: true, role: true }
    });

    return NextResponse.json({ user: updated });
  } catch (err) {
    return handleApiError(err);
  }
}
