import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';
import { prisma } from './prisma';
import type { Role } from '@prisma/client';

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  // Fail loudly in dev rather than silently signing tokens with an empty secret.
  console.warn(
    '[auth] JWT_SECRET is not set. Set it in your .env file before running in production.'
  );
}
const SECRET = JWT_SECRET || 'dev-only-insecure-secret-change-me';

export const AUTH_COOKIE = 'cfa_token';

export interface TokenPayload {
  userId: string;
  role: Role;
  email: string;
}

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function createToken(payload: TokenPayload): string {
  return jwt.sign(payload, SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, SECRET) as TokenPayload;
  } catch {
    return null;
  }
}

/**
 * Reads the auth cookie from a NextRequest (used inside API route handlers /
 * middleware, where next/headers cookies() may not reflect the incoming request).
 */
export function getTokenFromRequest(req: NextRequest): string | null {
  return req.cookies.get(AUTH_COOKIE)?.value ?? null;
}

/**
 * Reads the auth cookie via next/headers (Server Components, Route Handlers).
 */
export function getTokenFromCookieStore(): string | null {
  const store = cookies();
  return store.get(AUTH_COOKIE)?.value ?? null;
}

export class AuthError extends Error {
  status: number;
  constructor(message: string, status = 401) {
    super(message);
    this.status = status;
  }
}

/**
 * Resolves the authenticated user for a Route Handler request.
 * Throws AuthError(401) if there is no valid session.
 * ALWAYS derive identity from this — never trust a userId/role passed in the request body.
 */
export async function requireUser(req: NextRequest) {
  const token = getTokenFromRequest(req);
  if (!token) throw new AuthError('You must be logged in to do this.', 401);

  const payload = verifyToken(token);
  if (!payload) throw new AuthError('Your session has expired. Please log in again.', 401);

  const user = await prisma.user.findUnique({ where: { id: payload.userId } });
  if (!user) throw new AuthError('This account no longer exists.', 401);

  return user;
}

/**
 * Resolves the authenticated user AND enforces ADMIN role.
 * Throws AuthError(401) if not logged in, AuthError(403) if not an admin.
 */
export async function requireAdmin(req: NextRequest) {
  const user = await requireUser(req);
  if (user.role !== 'ADMIN') {
    throw new AuthError('You do not have permission to perform this action.', 403);
  }
  return user;
}
