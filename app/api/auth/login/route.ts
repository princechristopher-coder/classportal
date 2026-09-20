import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { comparePassword, createToken, AUTH_COOKIE } from '@/lib/auth';
import { loginSchema } from '@/lib/validation';
import { handleApiError, jsonError } from '@/lib/api-response';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = loginSchema.parse(body);

    const user = await prisma.user.findUnique({ where: { email: data.email } });
    if (!user) {
      return jsonError('No account found with this email address.', 404);
    }

    const valid = await comparePassword(data.password, user.password);
    if (!valid) {
      return jsonError('Incorrect password. Please try again.', 401);
    }

    const token = createToken({ userId: user.id, role: user.role, email: user.email });

    const res = NextResponse.json({
      user: { id: user.id, fullName: user.fullName, email: user.email, role: user.role, avatar: user.avatar }
    });

    res.cookies.set(AUTH_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7
    });

    return res;
  } catch (err) {
    return handleApiError(err);
  }
}
