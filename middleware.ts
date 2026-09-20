import { NextRequest, NextResponse } from 'next/server';

// Kept in sync with lib/auth.ts's AUTH_COOKIE constant. Duplicated (rather than
// imported) deliberately: lib/auth.ts also imports the Prisma client and
// jsonwebtoken, neither of which run in the Edge runtime that middleware
// executes in. Importing that module here silently breaks JWT verification
// on every request (verifyToken always returns null), which causes an
// authenticated user to get bounced straight back to /login.
//
// Middleware therefore only checks whether the auth cookie is *present* —
// enough to avoid flashing protected UI to a logged-out visitor. Real
// verification of the token's signature/expiry/role always happens
// server-side in the Node.js runtime: requireUser()/requireAdmin() in every
// API route, and the /api/auth/me check in DashboardLayout/AdminLayout.
const AUTH_COOKIE = 'cfa_token';

const PROTECTED_PREFIXES = ['/dashboard', '/admin', '/take-test'];
const AUTH_PAGES = ['/login', '/signup', '/forgot-password'];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const hasSession = !!req.cookies.get(AUTH_COOKIE)?.value;

  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
  const isAuthPage = AUTH_PAGES.some((p) => pathname.startsWith(p));

  if (isProtected && !hasSession) {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthPage && hasSession) {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*', '/take-test/:path*', '/login', '/signup', '/forgot-password']
};
