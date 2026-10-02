import { NextResponse } from 'next/server';
import { handler } from '@/src/shared/api';
import { getOpportunityById } from '@/src/modules/catalog/service';

type Ctx = { params: { id: string } };

export const GET = handler(async (_req, ctx) => {
  const { id } = (ctx as Ctx).params;
  const opp = await getOpportunityById(id);
  return NextResponse.json({ data: opp });
});
