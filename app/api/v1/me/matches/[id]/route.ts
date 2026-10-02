import { NextResponse } from 'next/server';
import { handler } from '@/src/shared/api';
import { resolveStudentFromSession } from '@/src/modules/auth';
import { getMatchDetail } from '@/src/modules/matching/service';

type Ctx = { params: { id: string } };

/**
 * GET /api/v1/me/matches/:id
 * Returns the full match detail including explanations, eligibility, and fit score.
 */
export const GET = handler(async (_req, ctx) => {
  const { studentId } = await resolveStudentFromSession();
  const { id } = (ctx as Ctx).params;
  const match = await getMatchDetail(studentId, id);
  return NextResponse.json({ data: match });
});
