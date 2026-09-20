import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword, createToken, AUTH_COOKIE } from '@/lib/auth';
import { signupSchema } from '@/lib/validation';
import { handleApiError, jsonError } from '@/lib/api-response';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = signupSchema.parse(body);

    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) {
      return jsonError('An account with this email already exists. Try logging in instead.', 409);
    }

    const hashed = await hashPassword(data.password);

    const user = await prisma.user.create({
      data: {
        fullName: data.fullName,
        email: data.email,
        password: hashed,
        role: 'STUDENT'
      }
    });

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
