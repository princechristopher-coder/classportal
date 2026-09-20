import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import { forgotPasswordSchema, resetPasswordSchema } from '@/lib/validation';
import { handleApiError, jsonError } from '@/lib/api-response';
import { hashPassword } from '@/lib/auth';
import { sendEmail, buildResetPasswordEmail, EmailNotConfiguredError } from '@/services/mailer';

/**
 * POST /api/auth/forgot-password
 * Issues a real, single-use, expiring reset token in the database and
 * attempts to email it. Always returns a generic success message to the
 * client regardless of whether the email exists (prevents account
 * enumeration) — but the token itself is real and works via /reset-password.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email } = forgotPasswordSchema.parse(body);

    const user = await prisma.user.findUnique({ where: { email } });

    if (user) {
      const token = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      await prisma.passwordResetToken.create({
        data: { userId: user.id, token, expiresAt }
      });

      const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/forgot-password?token=${token}`;

      try {
        await sendEmail({
          to: user.email,
          subject: 'Reset your ClassPortal password',
          html: buildResetPasswordEmail(resetUrl)
        });
      } catch (err) {
        if (err instanceof EmailNotConfiguredError) {
          // Email isn't wired to a real provider yet. Don't fake success —
          // surface this clearly so it's obvious in development.
          return NextResponse.json({
            success: true,
            emailSent: false,
            devNote:
              'Email delivery is not configured on this server. The reset link was logged to the server console instead.'
          });
        }
        throw err;
      }
    }

    // Generic response whether or not the account exists.
    return NextResponse.json({
      success: true,
      emailSent: true,
      message: 'If an account exists with that email, a reset link has been sent.'
    });
  } catch (err) {
    return handleApiError(err);
  }
}

/**
 * PATCH /api/auth/forgot-password
 * Consumes a valid reset token and sets the new password.
 */
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { token, password } = resetPasswordSchema.parse(body);

    const record = await prisma.passwordResetToken.findUnique({ where: { token } });

    if (!record || record.used || record.expiresAt < new Date()) {
      return jsonError('This reset link is invalid or has expired. Please request a new one.', 400);
    }

    const hashed = await hashPassword(password);

    await prisma.$transaction([
      prisma.user.update({ where: { id: record.userId }, data: { password: hashed } }),
      prisma.passwordResetToken.update({ where: { id: record.id }, data: { used: true } })
    ]);

    return NextResponse.json({ success: true, message: 'Password reset successfully. You can now log in.' });
  } catch (err) {
    return handleApiError(err);
  }
}
