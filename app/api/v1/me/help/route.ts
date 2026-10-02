import { NextResponse } from 'next/server';
import { handler, parseBody } from '@/src/shared/api';
import { resolveStudentFromSession } from '@/src/modules/auth';
import { listHelpRequests, createHelpRequest, createHelpRequestSchema } from '@/src/modules/advisors/service';

export const GET = handler(async () => {
  const { studentId } = await resolveStudentFromSession();
  const reqs = await listHelpRequests(studentId);
  return NextResponse.json({ data: reqs });
});

export const POST = handler(async (req) => {
  const { studentId } = await resolveStudentFromSession();
  const input = await parseBody(req, createHelpRequestSchema);
  const helpReq = await createHelpRequest(studentId, input);
  return NextResponse.json({ data: helpReq }, { status: 201 });
});
