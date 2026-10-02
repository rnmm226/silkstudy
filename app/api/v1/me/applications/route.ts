import { NextResponse } from 'next/server';
import { handler, parseBody } from '@/src/shared/api';
import { resolveStudentFromSession } from '@/src/modules/auth';
import { listApplications, createApplication, createApplicationSchema } from '@/src/modules/applications/service';

export const GET = handler(async () => {
  const { studentId } = await resolveStudentFromSession();
  const apps = await listApplications(studentId);
  return NextResponse.json({ data: apps });
});

export const POST = handler(async (req) => {
  const { studentId } = await resolveStudentFromSession();
  const input = await parseBody(req, createApplicationSchema);
  const app = await createApplication(studentId, input);
  return NextResponse.json({ data: app }, { status: 201 });
});
