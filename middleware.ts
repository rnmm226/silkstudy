import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';
import type { NextRequestWithAuth } from 'next-auth/middleware';

/**
 * Next.js edge middleware — enforces authentication on all private routes.
 *
 * Protected prefixes:
 *   /api/v1/me/*    — student-owned resources
 *   /api/v1/admin/* — admin-only resources
 *   /profile/*      — profile UI pages
 *   /admin/*        — admin UI pages
 *
 * Public routes (no auth required):
 *   /               — homepage
 *   /auth/*         — login / error pages
 *   /api/auth/*     — NextAuth endpoints
 *   /api/v1/search  — public opportunity search (read-only)
 *   /api/v1/opportunities/* — public catalog read
 */
export default withAuth(
  function middleware(req: NextRequestWithAuth) {
    const { pathname } = req.nextUrl;
    const token = req.nextauth.token;

    // Admin routes: require ADMIN role
    if (pathname.startsWith('/api/v1/admin') || pathname.startsWith('/admin')) {
      if (token?.role !== 'ADMIN') {
        if (pathname.startsWith('/api/')) {
          return NextResponse.json(
            { code: 'FORBIDDEN', message: 'Admin access required.' },
            { status: 403 },
          );
        }
        return NextResponse.redirect(new URL('/auth/login', req.url));
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      // Return true to allow the middleware function above to run;
      // return false to redirect straight to the signIn page.
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl;

        // Always allow public paths
        if (
          pathname.startsWith('/auth') ||
          pathname.startsWith('/api/auth') ||
          pathname === '/' ||
          pathname.startsWith('/api/v1/search') ||
          pathname.startsWith('/api/v1/opportunities')
        ) {
          return true;
        }

        // All other matched paths require a valid JWT
        return !!token;
      },
    },
  },
);

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
};
