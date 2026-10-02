import { NextResponse } from 'next/server';
import { handler } from '@/src/shared/api';
import { resolveStudentFromSession } from '@/src/modules/auth';
import { getStudentMatches } from '@/src/modules/matching/service';
import { z } from 'zod';

const querySchema = z.object({
  page:     z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
  minScore: z.coerce.number().min(0).max(100).optional(),
});

/**
 * GET /api/v1/me/matches
 * Returns the authenticated student's ranked match results.
 */
export const GET = handler(async (req) => {
  const { studentId } = await resolveStudentFromSession();
  const url = new URL(req.url);
  const parsed = querySchema.safeParse(Object.fromEntries(url.searchParams));
  if (!parsed.success) {
    return NextResponse.json({ code: 'VALIDATION_ERROR', message: 'Invalid query params.' }, { status: 422 });
  }
  const result = await getStudentMatches(studentId, parsed.data);
  return NextResponse.json(result);
});
