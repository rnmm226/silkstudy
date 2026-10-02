import { NextResponse } from 'next/server';
import { handler } from '@/src/shared/api';
import { resolveStudentFromSession } from '@/src/modules/auth';
import { softDeleteDocument } from '@/src/modules/documents/service';

type Ctx = { params: { id: string } };

export const DELETE = handler(async (_req, ctx) => {
  const { studentId } = await resolveStudentFromSession();
  const { id } = (ctx as Ctx).params;
  await softDeleteDocument(studentId, id);
  return new NextResponse(null, { status: 204 });
});
