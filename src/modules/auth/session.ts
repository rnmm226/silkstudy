import { getServerSession } from 'next-auth/next';
import { authOptions } from './auth.config';
import type { Session } from 'next-auth';
import type { UserRole } from '@prisma/client';
import {
  UnauthorizedError,
  ForbiddenError,
} from '@/src/shared/errors';

/**
 * Returns the current server-side session or null.
 * Use this in Server Components and Route Handlers.
 */
export async function getSession(): Promise<Session | null> {
  return getServerSession(authOptions);
}

/**
 * Returns the session or throws UnauthorizedError (401).
 */
export async function requireSession(): Promise<Session> {
  const session = await getSession();
  if (!session) throw new UnauthorizedError();
  return session;
}

/**
 * Returns the session only if the authenticated user has one of the
 * allowed roles. Throws ForbiddenError (403) otherwise.
 */
export async function requireRole(
  ...roles: UserRole[]
): Promise<Session> {
  const session = await requireSession();
  if (!roles.includes(session.user.role)) {
    throw new ForbiddenError(
      `This action requires one of: ${roles.join(', ')}.`,
    );
  }
  return session;
}

/**
 * Convenience: require the caller to be a STUDENT.
 */
export async function requireStudent(): Promise<Session> {
  return requireRole('STUDENT');
}

/**
 * Convenience: require the caller to be an ADVISOR or ADMIN.
 */
export async function requireAdvisor(): Promise<Session> {
  return requireRole('ADVISOR', 'ADMIN');
}

/**
 * Convenience: require the caller to be an ADMIN.
 */
export async function requireAdmin(): Promise<Session> {
  return requireRole('ADMIN');
}
