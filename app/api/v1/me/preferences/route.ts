import { NextResponse } from 'next/server';
import { handler, parseBody } from '@/src/shared/api';
import { resolveStudentFromSession } from '@/src/modules/auth';
import { getPreferences, upsertPreferences } from '@/src/modules/students/service';
import { putPreferencesSchema } from '@/src/modules/students/validation';

/**
 * GET /api/v1/me/preferences
 * Returns the student's study preferences (or null if not yet set).
 */
export const GET = handler(async () => {
  const { studentId } = await resolveStudentFromSession();
  const prefs = await getPreferences(studentId);
  return NextResponse.json({ data: prefs ?? null });
});

/**
 * PUT /api/v1/me/preferences
 * Creates or fully replaces the student's study preferences.
 */
export const PUT = handler(async (req) => {
  const { studentId } = await resolveStudentFromSession();
  const input = await parseBody(req, putPreferencesSchema);
  const prefs = await upsertPreferences(studentId, input);
  return NextResponse.json({ data: prefs });
});
