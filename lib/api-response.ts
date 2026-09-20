import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { AuthError } from './auth';

/**
 * Centralized API error handler. Ensures we always return correct, meaningful
 * HTTP status codes instead of a generic 500/"Invalid" for everything.
 */
export function handleApiError(err: unknown) {
  if (err instanceof AuthError) {
    return NextResponse.json({ error: err.message }, { status: err.status });
  }

  if (err instanceof ZodError) {
    const firstIssue = err.issues[0];
    return NextResponse.json(
      { error: firstIssue?.message || 'Invalid request data.', issues: err.issues },
      { status: 400 }
    );
  }

  // Prisma known error codes
  const prismaErr = err as { code?: string; meta?: Record<string, unknown> };
  if (prismaErr?.code === 'P2002') {
    const target = (prismaErr.meta?.target as string[] | undefined)?.join(', ') || 'field';
    return NextResponse.json(
      { error: `A record with this ${target} already exists.` },
      { status: 409 }
    );
  }
  if (prismaErr?.code === 'P2025') {
    return NextResponse.json({ error: 'The requested resource was not found.' }, { status: 404 });
  }
  if (prismaErr?.code === 'P2003') {
    return NextResponse.json(
      { error: 'This action references a resource that no longer exists.' },
      { status: 400 }
    );
  }

  console.error('[api error]', err);

  const message =
    process.env.NODE_ENV === 'development' && err instanceof Error
      ? err.message
      : 'Something went wrong on our end. Please try again.';

  return NextResponse.json({ error: message }, { status: 500 });
}

export function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}
