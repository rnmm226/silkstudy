import { NextResponse } from 'next/server';
import { handler, parseBody } from '@/src/shared/api';
import { resolveStudentFromSession } from '@/src/modules/auth';
import { getStudentProfile, patchStudentProfile } from '@/src/modules/students/service';
import { patchProfileSchema } from '@/src/modules/students/validation';

/**
 * GET /api/v1/me/profile
 * Returns the authenticated student's profile.
 */
export const GET = handler(async () => {
  const { studentId } = await resolveStudentFromSession();
  const profile = await getStudentProfile(studentId);
  return NextResponse.json({ data: profile });
});

/**
 * PATCH /api/v1/me/profile
 * Partial update of the authenticated student's profile fields.
 */
export const PATCH = handler(async (req) => {
  const { studentId } = await resolveStudentFromSession();
  const input = await parseBody(req, patchProfileSchema);
  const updated = await patchStudentProfile(studentId, input);
  return NextResponse.json({ data: updated });
});
