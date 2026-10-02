import { NextResponse } from 'next/server';
import { handler, parseBody } from '@/src/shared/api';
import { resolveStudentFromSession } from '@/src/modules/auth';
import { patchApplication, deleteApplication, patchApplicationSchema } from '@/src/modules/applications/service';

type Ctx = { params: { id: string } };

export const PATCH = handler(async (req, ctx) => {
  const { studentId } = await resolveStudentFromSession();
  const { id } = (ctx as Ctx).params;
  const input = await parseBody(req, patchApplicationSchema);
  const updated = await patchApplication(studentId, id, input);
  return NextResponse.json({ data: updated });
});

export const DELETE = handler(async (_req, ctx) => {
  const { studentId } = await resolveStudentFromSession();
  const { id } = (ctx as Ctx).params;
  await deleteApplication(studentId, id);
  return new NextResponse(null, { status: 204 });
});
