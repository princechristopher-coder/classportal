/**
 * Email delivery service.
 *
 * No email provider is wired up yet. This module intentionally isolates all
 * outbound email behind one function so that plugging in a real provider
 * (Resend, SendGrid, AWS SES, Postmark, etc.) later only requires editing
 * this file — nothing else in the codebase needs to change.
 *
 * IMPORTANT: this does NOT fake success. If EMAIL_PROVIDER_API_KEY is not
 * configured, sendEmail() throws so callers can tell the user honestly that
 * delivery isn't available yet, instead of pretending an email went out.
 */

interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
}

export class EmailNotConfiguredError extends Error {
  constructor() {
    super('Email delivery is not configured on this server yet.');
    this.name = 'EmailNotConfiguredError';
  }
}

export async function sendEmail({ to, subject, html }: SendEmailInput): Promise<void> {
  const apiKey = process.env.EMAIL_PROVIDER_API_KEY;

  if (!apiKey) {
    // Dev-friendly fallback: log instead of sending, but do NOT tell the
    // caller it succeeded as if it were delivered to a real inbox.
    console.log('--- EMAIL (no provider configured, logging instead) ---');
    console.log('To:', to);
    console.log('Subject:', subject);
    console.log('Body:', html);
    console.log('--------------------------------------------------------');
    throw new EmailNotConfiguredError();
  }

  // Example real integration (Resend), left commented so it's a one-step
  // swap once EMAIL_PROVIDER_API_KEY is set:
  //
  // await fetch('https://api.resend.com/emails', {
  //   method: 'POST',
  //   headers: {
  //     Authorization: `Bearer ${apiKey}`,
  //     'Content-Type': 'application/json'
  //   },
  //   body: JSON.stringify({
  //     from: 'ClassPortal <no-reply@classportal.example>',
  //     to,
  //     subject,
  //     html
  //   })
  // });
}

export function buildResetPasswordEmail(resetUrl: string) {
  return `
    <div style="font-family: sans-serif; background:#0a0a0b; color:#f8f7f4; padding:32px;">
      <h2 style="color:#d4af37;">ClassPortal</h2>
      <p>We received a request to reset your password. Click the link below to choose a new one. This link expires in 1 hour.</p>
      <p><a href="${resetUrl}" style="color:#c81e3a;">${resetUrl}</a></p>
      <p>If you didn't request this, you can safely ignore this email.</p>
    </div>
  `;
}
