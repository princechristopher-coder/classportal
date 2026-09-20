import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireUser, comparePassword, hashPassword } from '@/lib/auth';
import { passwordChangeSchema } from '@/lib/validation';
import { handleApiError, jsonError } from '@/lib/api-response';

export async function PATCH(req: NextRequest) {
  try {
    const user = await requireUser(req);
    const { currentPassword, newPassword } = passwordChangeSchema.parse(await req.json());

    const valid = await comparePassword(currentPassword, user.password);
    if (!valid) return jsonError('Your current password is incorrect.', 401);

    const hashed = await hashPassword(newPassword);
    await prisma.user.update({ where: { id: user.id }, data: { password: hashed } });

    return NextResponse.json({ success: true });
  } catch (err) {
    return handleApiError(err);
  }
}
