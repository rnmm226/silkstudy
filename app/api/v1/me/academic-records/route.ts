import { NextResponse } from 'next/server';
import { handler, parseBody } from '@/src/shared/api';
import { resolveStudentFromSession } from '@/src/modules/auth';
import {
  listAcademicRecords,
  createAcademicRecord,
} from '@/src/modules/students/service';
import { createAcademicRecordSchema } from '@/src/modules/students/validation';

/**
 * GET /api/v1/me/academic-records
 * Returns all academic records for the authenticated student.
 */
export const GET = handler(async () => {
  const { studentId } = await resolveStudentFromSession();
  const records = await listAcademicRecords(studentId);
  return NextResponse.json({ data: records });
});

/**
 * POST /api/v1/me/academic-records
 * Creates a new academic record for the authenticated student.
 */
export const POST = handler(async (req) => {
  const { studentId } = await resolveStudentFromSession();
  const input = await parseBody(req, createAcademicRecordSchema);
  const record = await createAcademicRecord(studentId, input);
  return NextResponse.json({ data: record }, { status: 201 });
});
