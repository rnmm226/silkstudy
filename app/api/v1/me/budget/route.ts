import { NextResponse } from 'next/server';
import { handler, parseBody } from '@/src/shared/api';
import { resolveStudentFromSession } from '@/src/modules/auth';
import { getBudget, upsertBudget } from '@/src/modules/students/service';
import { putBudgetSchema } from '@/src/modules/students/validation';

/**
 * GET /api/v1/me/budget
 * Returns the student's budget (or null if not yet set).
 * Budget always carries: amount, currency, period (MONTHLY|YEARLY|TOTAL),
 * scope (TUITION_ONLY|LIVING_ONLY|TOTAL_COST|OTHER).
 */
export const GET = handler(async () => {
  const { studentId } = await resolveStudentFromSession();
  const budget = await getBudget(studentId);
  return NextResponse.json({ data: budget ?? null });
});

/**
 * PUT /api/v1/me/budget
 * Creates or replaces the student's budget.
 * All four fields (amount, currency, period, scope) are required.
 */
export const PUT = handler(async (req) => {
  const { studentId } = await resolveStudentFromSession();
  const input = await parseBody(req, putBudgetSchema);
  const budget = await upsertBudget(studentId, input);
  return NextResponse.json({ data: budget });
});
