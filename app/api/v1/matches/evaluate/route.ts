import { NextResponse } from 'next/server';
import { handler, parseBody } from '@/src/shared/api';
import { resolveStudentFromSession } from '@/src/modules/auth';
import { evaluateStudentEligibility } from '@/src/modules/eligibility/service';
import { z } from 'zod';

const evaluateSchema = z.object({
  opportunityId: z.string().uuid(),
});

/**
 * POST /api/v1/matches/evaluate
 *
 * Evaluate the authenticated student's eligibility for a given opportunity.
 * The student_id is always derived from the session — never from the request body.
 */
export const POST = handler(async (req) => {
  const { studentId } = await resolveStudentFromSession();
  const { opportunityId } = await parseBody(req, evaluateSchema);

  const { evaluation, output } = await evaluateStudentEligibility(studentId, opportunityId);

  return NextResponse.json({
    data: {
      evaluationId:   evaluation.id,
      result:         output.result,
      reasons:        output.reasons,
      ruleVersionId:  output.ruleVersionId,
      schemaVersion:  output.schemaVersion,
      evaluatedAt:    output.evaluatedAt,
    },
  }, { status: 201 });
});
