import { NextResponse } from 'next/server';
import { handler, parseBody } from '@/src/shared/api';
import { resolveStudentFromSession } from '@/src/modules/auth';
import {
  patchAcademicRecord,
  deleteAcademicRecord,
} from '@/src/modules/students/service';
import { patchAcademicRecordSchema } from '@/src/modules/students/validation';

type Ctx = { params: { recordId: string } };

/**
 * PATCH /api/v1/me/academic-records/:recordId
 * Partial update of a specific academic record.
 */
export const PATCH = handler(async (req, ctx) => {
  const { studentId } = await resolveStudentFromSession();
  const { recordId } = (ctx as Ctx).params;
  const input = await parseBody(req, patchAcademicRecordSchema);
  const updated = await patchAcademicRecord(studentId, recordId, input);
  return NextResponse.json({ data: updated });
});

/**
 * DELETE /api/v1/me/academic-records/:recordId
 * Deletes a specific academic record.
 */
export const DELETE = handler(async (_req, ctx) => {
  const { studentId } = await resolveStudentFromSession();
  const { recordId } = (ctx as Ctx).params;
  await deleteAcademicRecord(studentId, recordId);
  return new NextResponse(null, { status: 204 });
});
