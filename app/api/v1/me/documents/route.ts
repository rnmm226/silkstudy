import { NextResponse } from 'next/server';
import { handler, parseBody } from '@/src/shared/api';
import { resolveStudentFromSession } from '@/src/modules/auth';
import { listDocuments, createDocument, createDocumentSchema } from '@/src/modules/documents/service';

export const GET = handler(async (req) => {
  const { studentId } = await resolveStudentFromSession();
  const url = new URL(req.url);
  const applicationId = url.searchParams.get('applicationId') ?? undefined;
  const docs = await listDocuments(studentId, applicationId);
  return NextResponse.json({ data: docs });
});

export const POST = handler(async (req) => {
  const { studentId } = await resolveStudentFromSession();
  const input = await parseBody(req, createDocumentSchema);
  const doc = await createDocument(studentId, input);
  return NextResponse.json({ data: doc }, { status: 201 });
});
