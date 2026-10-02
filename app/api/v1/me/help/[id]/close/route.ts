import { NextResponse } from 'next/server';
import { handler } from '@/src/shared/api';
import { resolveStudentFromSession } from '@/src/modules/auth';
import { closeHelpRequest } from '@/src/modules/advisors/service';

type Ctx = { params: { id: string } };

export const POST = handler(async (_req, ctx) => {
  const { studentId } = await resolveStudentFromSession();
  const { id } = (ctx as Ctx).params;
  const updated = await closeHelpRequest(studentId, id);
  return NextResponse.json({ data: updated });
});
