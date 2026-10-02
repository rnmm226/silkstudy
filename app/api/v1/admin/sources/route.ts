import { NextResponse } from 'next/server';
import { handler, parseBody } from '@/src/shared/api';
import { requireAdmin } from '@/src/modules/auth';
import {
  adminListSources,
  adminCreateSource,
  createSourceSchema,
} from '@/src/modules/admin/catalog-service';
import { z } from 'zod';

const querySchema = z.object({
  page:     z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(50),
});

export const GET = handler(async (req) => {
  await requireAdmin();
  const url = new URL(req.url);
  const parsed = querySchema.safeParse(Object.fromEntries(url.searchParams));
  if (!parsed.success) {
    return NextResponse.json({ code: 'VALIDATION_ERROR', message: 'Invalid query params.' }, { status: 422 });
  }
  const result = await adminListSources(parsed.data);
  return NextResponse.json(result);
});

export const POST = handler(async (req) => {
  const session = await requireAdmin();
  const input = await parseBody(req, createSourceSchema);
  const source = await adminCreateSource(input, session.user.id);
  return NextResponse.json({ data: source }, { status: 201 });
});
