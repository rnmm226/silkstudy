import { NextResponse } from 'next/server';
import { handler } from '@/src/shared/api';
import { resolveStudentFromSession } from '@/src/modules/auth';
import { recomputeStudentMatches } from '@/src/modules/matching/service';

/**
 * POST /api/v1/me/matches/recompute
 *
 * Triggers a full recomputation of all match results for the authenticated student.
 * Idempotent — safe to call multiple times.
 * Returns 202 Accepted with a summary.
 */
export const POST = handler(async () => {
  const { studentId } = await resolveStudentFromSession();
  const result = await recomputeStudentMatches(studentId);
  return NextResponse.json({ data: result }, { status: 202 });
});
