import { NextResponse } from 'next/server';
import { handler } from '@/src/shared/api';
import { listOpportunities } from '@/src/modules/catalog/service';
import { z } from 'zod';

const querySchema = z.object({
  page:     z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  type:     z.enum(['PROGRAM', 'SCHOLARSHIP', 'OTHER']).optional(),
});

export const GET = handler(async (req) => {
  const url = new URL(req.url);
  const parsed = querySchema.safeParse(Object.fromEntries(url.searchParams));
  if (!parsed.success) {
    return NextResponse.json({ code: 'VALIDATION_ERROR', message: 'Invalid query params.' }, { status: 422 });
  }
  const result = await listOpportunities(parsed.data);
  return NextResponse.json(result);
});
