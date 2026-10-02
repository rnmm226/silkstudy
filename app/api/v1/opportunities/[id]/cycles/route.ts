import { NextResponse } from 'next/server';
import { handler } from '@/src/shared/api';
import { getOpportunityCycles } from '@/src/modules/catalog/service';

type Ctx = { params: { id: string } };

export const GET = handler(async (_req, ctx) => {
  const { id } = (ctx as Ctx).params;
  const cycles = await getOpportunityCycles(id);
  return NextResponse.json({ data: cycles });
});
