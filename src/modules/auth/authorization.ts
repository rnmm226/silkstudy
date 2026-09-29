import { db } from '@/src/infrastructure/database';
import { ForbiddenError, NotFoundError } from '@/src/shared/errors';
import { requireSession } from './session';

/**
 * Resolve the Student record for the currently authenticated user.
 * Throws ForbiddenError if the session user has no Student record.
 */
export async function resolveStudentFromSession(): Promise<{
  studentId: string;
  userId: string;
}> {
  const session = await requireSession();
  const userId = session.user.id;

  const student = await db.student.findFirst({
    where: { userId, deletedAt: null },
    select: { id: true },
  });

  if (!student) {
    throw new ForbiddenError('No student profile found for this account.');
  }

  return { studentId: student.id, userId };
}

/**
 * Assert that `requestedStudentId` belongs to the currently authenticated
 * user (or that the user is ADMIN). Throws ForbiddenError otherwise.
 */
export async function assertStudentOwnership(
  requestedStudentId: string,
): Promise<void> {
  const session = await requireSession();

  if (session.user.role === 'ADMIN') return; // admins can access any student

  const student = await db.student.findFirst({
    where: {
      id: requestedStudentId,
      userId: session.user.id,
      deletedAt: null,
    },
    select: { id: true },
  });

  if (!student) {
    // Return 403 (not 404) to avoid leaking whether the resource exists
    throw new ForbiddenError('Access denied to this student resource.');
  }
}

/**
 * Assert that the given studentId actually exists (for routes that need
 * a 404 rather than a 403 for non-existent resources — admin use).
 */
export async function assertStudentExists(studentId: string): Promise<void> {
  const student = await db.student.findFirst({
    where: { id: studentId, deletedAt: null },
    select: { id: true },
  });
  if (!student) throw new NotFoundError('Student');
}
