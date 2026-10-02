import { NextResponse } from 'next/server';
import { handler } from '@/src/shared/api';
import { searchOpportunities } from '@/src/modules/search/service';
import { z } from 'zod';

const searchQuerySchema = z.object({
  q:                    z.string().max(200).optional(),
  country:              z.string().max(100).optional(),
  degreeLevel:          z.string().max(100).optional(),
  field:                z.string().max(200).optional(),
  language:             z.string().max(100).optional(),
  studyMode:            z.string().max(50).optional(),
  type:                 z.enum(['PROGRAM', 'SCHOLARSHIP', 'OTHER']).optional(),
  tuitionCoverage:      z.enum(['FULL', 'PARTIAL', 'NONE', 'UNKNOWN']).optional(),
  livingCoverage:       z.enum(['FULL', 'PARTIAL', 'NONE', 'UNKNOWN']).optional(),
  hasUpcomingDeadline:  z.coerce.boolean().optional(),
  verifiedOnly:         z.coerce.boolean().optional(),
  page:                 z.coerce.number().int().min(1).default(1),
  pageSize:             z.coerce.number().int().min(1).max(100).default(20),
});

export const GET = handler(async (req) => {
  const url = new URL(req.url);
  const parsed = searchQuerySchema.safeParse(Object.fromEntries(url.searchParams));

  if (!parsed.success) {
    return NextResponse.json(
      { code: 'VALIDATION_ERROR', message: 'Invalid search params.', fieldErrors: parsed.error.flatten().fieldErrors },
      { status: 422 },
    );
  }

  const { q, ...rest } = parsed.data;
  const result = await searchOpportunities({ ...rest, query: q });
  return NextResponse.json(result);
});
